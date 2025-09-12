// Ethereum Analyze Service for Extension
// Adapted from frontend implementation for extension environment

import type { EthereumFeatures } from './types';

// Configuration constants
const WEI_TO_ETH = 1_000_000_000_000_000_000n; // BigInt for precise parsing
const WEI_TO_ETH_F64 = 1_000_000_000_000_000_000.0; // For float calculations
const MAX_TRANSACTIONS_PER_ADDRESS = 100;
const ETHERSCAN_MAX_RECORDS = 10000;

// API endpoints
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const MORALIS_METADATA_URL = "https://deep-index.moralis.io/api/v2.2/erc20/metadata";
const MORALIS_PRICE_URL = "https://deep-index.moralis.io/api/v2.2/erc20";
const CRYPTOCOMPARE_URL = "https://min-api.cryptocompare.com/data/pricehistorical";
const DEFILLAMA_URL = "https://coins.llama.fi/prices/historical";

// Caches for API responses
const priceCache = new Map();
const tokenPriceCache = new Map();
const tokenInfoCache = new Map();

/**
 * Fetch JSON from API with error handling
 */
async function fetchJson(url: string, headers: Record<string, string> = {}) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        throw new Error("API authentication failed. Please check your API key.");
      } else if (res.status === 403) {
        throw new Error("API access forbidden. Your API key may not have the required permissions.");
      } else if (res.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    }
    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      // If it's already our custom error, rethrow it
      if (error.message.includes("API authentication") ||
          error.message.includes("API access forbidden") ||
          error.message.includes("rate limit")) {
        throw error;
      }
      // If it's a network error, provide a more user-friendly message
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error("Network error: Please check your internet connection and try again.");
      }
    }
    throw error;
  }
}

/**
 * Fetch transaction pages from Etherscan API
 */
async function fetchPage(address: string, action: string, startBlock: number, etherscanApiKey: string) {
  const url = `${ETHERSCAN_API_URL}?module=account&action=${action}&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`;
  const data = await fetchJson(url);
  if (data.status === "1") {
    return Array.isArray(data.result) ? data.result : [];
  }
  if (typeof data.message === "string" && data.message.includes("No transactions found")) {
    return [];
  }

  // Handle specific Etherscan error messages
  const message = data.message || "unknown";
  if (message.includes("NOTOK")) {
    throw new Error("Etherscan API request failed. Please check your API key and try again.");
  } else if (message.includes("Invalid API Key")) {
    throw new Error("Invalid Etherscan API key. Please check your API key configuration.");
  } else if (message.includes("API Key not found")) {
    throw new Error("Etherscan API key not found. Please set PLASMO_PUBLIC_ETHERSCAN_API_KEY environment variable.");
  } else if (message.includes("Max rate limit reached")) {
    throw new Error("Etherscan API rate limit exceeded. Please try again later.");
  } else {
    throw new Error(`Etherscan API error: ${message}`);
  }
}

/**
 * Fetch all transaction pages from Etherscan
 */
async function fetchAllPages(action: string, address: string, etherscanApiKey: string) {
  const all: any[] = [];
  let startBlock = 0;

  while (true) {
    const page = await fetchPage(address, action, startBlock, etherscanApiKey);
    if (page.length === 0) break;
    all.push(...page);
    if (all.length >= MAX_TRANSACTIONS_PER_ADDRESS || page.length < ETHERSCAN_MAX_RECORDS) break;

    const last = all[all.length - 1];
    const lastBlock = Number.parseInt(last.blockNumber ?? last.block_number ?? "0", 10);
    if (!Number.isFinite(lastBlock) || lastBlock === 0) break;
    startBlock = lastBlock + 1;
  }
  return all;
}

/**
 * Get all transactions for an Ethereum address
 */
async function getAllTransactions(address: string, apis: any = {}) {
  const env = process.env;
  const etherscanApiKey = apis.etherscanApiKey || env.PLASMO_PUBLIC_ETHERSCAN_API_KEY || "";

  // Check if API key is available
  if (!etherscanApiKey || etherscanApiKey === "your_etherscan_api_key_here") {
    throw new Error("Etherscan API key is required but not configured. Please set PLASMO_PUBLIC_ETHERSCAN_API_KEY environment variable.");
  }

  const ethTxs = await fetchAllPages("txlist", address, etherscanApiKey);
  const erc20Txs = await fetchAllPages("tokentx", address, etherscanApiKey);

  // Map hash -> parent ETH tx for gas info
  const ethTxMap = new Map(ethTxs.map((tx: any) => [tx.hash, tx]));

  const all: any[] = [];
  const erc20ParentHashes = new Set();

  for (const tx of erc20Txs) {
    tx.tx_type = "ERC20";
    erc20ParentHashes.add(tx.hash);
    const parent = ethTxMap.get(tx.hash);
    if (parent) {
      tx.gasUsed = parent.gasUsed ?? parent.gas_used ?? "0";
      tx.gasPrice = parent.gasPrice ?? parent.gas_price ?? "0";
    }
    all.push(tx);
  }

  for (const tx of ethTxs) {
    if (!erc20ParentHashes.has(tx.hash)) {
      tx.tx_type = "ETH";
      all.push(tx);
    }
  }

  // Sort by timestamp ascending
  all.sort((a: any, b: any) =>
    Number.parseInt(a.timeStamp ?? a.time_stamp ?? "0", 10) -
    Number.parseInt(b.timeStamp ?? b.time_stamp ?? "0", 10)
  );

  if (all.length > MAX_TRANSACTIONS_PER_ADDRESS) {
    console.warn(`⚠️ Limiting to ${MAX_TRANSACTIONS_PER_ADDRESS} transactions (found ${all.length}).`);
    all.length = MAX_TRANSACTIONS_PER_ADDRESS;
  }

  return all;
}

/**
 * Get token information from Moralis API
 */
async function getTokenInfo(tokenAddress: string, apis: any = {}) {
  const lower = tokenAddress.toLowerCase();
  if (tokenInfoCache.has(lower)) return tokenInfoCache.get(lower);

  const env = process.env;
  const moralisApiKey = apis.moralisApiKey || env.VITE_MORALIS_API_KEY || "";

  // Known tokens for faster lookup
  const known = new Map([
    ["0xdac17f958d2ee523a2206206994597c13d831ec7", { symbol: "USDT", decimals: 6 }],
    ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", { symbol: "USDC", decimals: 6 }],
    ["0x6b175474e89094c44da98b954eedeac495271d0f", { symbol: "DAI", decimals: 18 }],
    ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", { symbol: "WETH", decimals: 18 }],
    ["0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", { symbol: "WBTC", decimals: 8 }],
  ]);

  if (known.has(lower)) {
    const info = known.get(lower);
    tokenInfoCache.set(lower, info);
    return info;
  }

  try {
    const url = `${MORALIS_METADATA_URL}?chain=eth&addresses=${lower}`;
    const data = await fetchJson(url, { accept: "application/json", "X-API-Key": moralisApiKey });
    const meta = Array.isArray(data) && data.length > 0 ? data[0] : null;
    const decimals = meta ? Number.parseInt(meta.decimals || "18", 10) : 18;
    const symbol = meta && meta.symbol ? String(meta.symbol).toUpperCase() : "UNKNOWN";
    const info = { symbol, decimals };
    tokenInfoCache.set(lower, info);
    return info;
  } catch (e) {
    console.warn(`   -> ❌ Moralis metadata failed: ${e}`);
    const info = { symbol: "UNKNOWN", decimals: 18 };
    tokenInfoCache.set(lower, info);
    return info;
  }
}

/**
 * Convert timestamp to monthly key
 */
function tsToMonthKey(timestamp: number) {
  const d = new Date(Number(timestamp) * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

/**
 * Get ETH/USD ratio from CryptoCompare
 */
async function getStablecoinEthRatio(timestamp: number, apis: any = {}) {
  const env = process.env;
  const cryptocompareApiKey = apis.cryptocompareApiKey || env.VITE_CRYPTOCOMPARE_API_KEY || "";

  const monthKey = `ETH_USD_${tsToMonthKey(timestamp)}`;
  if (priceCache.has(monthKey)) {
    const usd = priceCache.get(monthKey);
    return usd > 0 ? 1.0 / usd : 0.0;
  }

  const monthTs = Date.UTC(
    new Date(Number(timestamp) * 1000).getUTCFullYear(),
    new Date(Number(timestamp) * 1000).getUTCMonth(),
    1
  ) / 1000;

  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=ETH&tsyms=USD&ts=${monthTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const usd = data?.ETH?.USD ?? 0.0;
    priceCache.set(monthKey, usd);
    return usd > 0 ? 1.0 / usd : 0.0;
  } catch (_) {
    console.warn("   -> Warning: Could not fetch ETH/USD price. Conversion will fail.");
    return 0.0;
  }
}

/**
 * Get token to ETH ratio from various APIs
 */
async function getTokenEthRatio(tokenAddress: string, timestamp: number, apis: any = {}) {
  const info = await getTokenInfo(tokenAddress, apis);
  const symbol = info.symbol;

  if (symbol === "WETH") return 1.0;

  const env = process.env;
  const cryptocompareApiKey = apis.cryptocompareApiKey || env.VITE_CRYPTOCOMPARE_API_KEY || "";
  const moralisApiKey = apis.moralisApiKey || env.VITE_MORALIS_API_KEY || "";

  const monthlyKeyPart = tsToMonthKey(timestamp);
  const cacheKey = `${symbol}_${monthlyKeyPart}_${tokenAddress.toLowerCase()}`;
  if (tokenPriceCache.has(cacheKey)) return tokenPriceCache.get(cacheKey);

  // For stablecoins, use ETH ratio
  if (["USDT", "USDC", "DAI"].includes(symbol)) {
    const ratio = await getStablecoinEthRatio(timestamp, { cryptocompareApiKey });
    if (ratio > 0) {
      tokenPriceCache.set(cacheKey, ratio);
      return ratio;
    }
  }

  // Try multiple APIs in order
  const monthTs = Date.UTC(
    new Date(Number(timestamp) * 1000).getUTCFullYear(),
    new Date(Number(timestamp) * 1000).getUTCMonth(),
    1
  ) / 1000;

  // 1. Try CryptoCompare
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=${encodeURIComponent(symbol)}&tsyms=ETH&ts=${monthTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const price = data?.[symbol]?.ETH ?? 0.0;
    if (price > 0) {
      tokenPriceCache.set(cacheKey, price);
      return price;
    }
  } catch (_) {}

  // 2. Try DeFiLlama
  try {
    const llama = `ethereum:${tokenAddress}`;
    const url = `${DEFILLAMA_URL}/${timestamp}/${llama}`;
    const data = await fetchJson(url);
    const coin = data?.coins?.[llama];
    if (!coin) throw new Error("Coin not found");
    const tokenUsd = coin.price;
    const ethPerUsd = await getStablecoinEthRatio(timestamp, { cryptocompareApiKey });
    const ratio = ethPerUsd > 0 ? tokenUsd * ethPerUsd : 0.0;
    if (ratio > 0) {
      tokenPriceCache.set(cacheKey, ratio);
      return ratio;
    }
  } catch (_) {}

  // 3. Try Moralis
  try {
    const toDate = new Date(Number(timestamp) * 1000).toISOString();
    const url = `${MORALIS_PRICE_URL}/${tokenAddress}/price?chain=eth&to_date=${encodeURIComponent(toDate)}`;
    const data = await fetchJson(url, { accept: "application/json", "X-API-Key": moralisApiKey });
    const usd = data?.usd_price ?? 0.0;
    const ethPerUsd = await getStablecoinEthRatio(timestamp, { cryptocompareApiKey });
    const ratio = ethPerUsd > 0 ? usd * ethPerUsd : 0.0;
    if (ratio > 0) {
      tokenPriceCache.set(cacheKey, ratio);
      return ratio;
    }
  } catch (_) {}

  console.warn(`❌ ALL APIs FAILED for ${symbol}`);
  return 0.0;
}

/**
 * Main function to extract Ethereum features
 */
export async function extractEthereumFeatures(address: string, options: any = {}): Promise<EthereumFeatures> {
  try {
    console.log(`Extracting Ethereum features for address: ${address}`);

    const env = process.env;
    const apis = {
      etherscanApiKey: options.etherscanApiKey || env.PLASMO_PUBLIC_ETHERSCAN_API_KEY || "",
      cryptocompareApiKey: options.cryptocompareApiKey || env.VITE_CRYPTOCOMPARE_API_KEY || "",
      moralisApiKey: options.moralisApiKey || env.VITE_MORALIS_API_KEY || "",
    };

    const targetAddress = String(address).toLowerCase();
    const txs = await getAllTransactions(targetAddress, apis);

    const features: { [key: string]: any } = {};
    const sentTxs: any[] = [];
    const receivedTxs: any[] = [];
    const allValuesBtc: number[] = [];
    const allFeesBtc: number[] = [];
    const blocks: number[] = [];
    const counterparties = new Map();

    for (const tx of txs) {
      const timestamp = Number.parseInt(tx.timeStamp ?? tx.time_stamp ?? "0", 10);
      if (!Number.isFinite(timestamp) || timestamp === 0) continue;

      const blockNum = Number.parseInt(tx.blockNumber ?? tx.block_number ?? "0", 10) || 0;
      const from = String(tx.from || "").toLowerCase();
      const to = String(tx.to || "").toLowerCase();

      let valueEth = 0.0;
      if (tx.tx_type === "ETH") {
        const raw = tx.value ?? "0";
        const asF64 = Number(raw) / WEI_TO_ETH_F64;
        valueEth = Number.isFinite(asF64) ? asF64 : 0.0;
      } else {
        const tokenInfo = await getTokenInfo(String(tx.contractAddress ?? tx.contract_address ?? ""), apis);
        const decimals = tokenInfo.decimals;
        const tokenAmount = Number(tx.value ?? "0") / Math.pow(10, decimals);
        if (tokenAmount > 0) {
          const ratio = await getTokenEthRatio(String(tx.contractAddress ?? tx.contract_address ?? ""), timestamp, apis);
          valueEth = tokenAmount * ratio;
          if (valueEth > 0) {
            console.log(`Conversion: ${tokenAmount.toFixed(4)} ${tokenInfo.symbol} * ${ratio.toFixed(8)} = ${valueEth.toFixed(8)} ETH`);
          }
        }
      }

      const gasUsed = Number(tx.gasUsed ?? tx.gas_used ?? "0") || 0;
      const gasPrice = Number(tx.gasPrice ?? tx.gas_price ?? "0") || 0;
      const gasFeeEth = (gasUsed * gasPrice) / WEI_TO_ETH_F64;

      // Convert to BTC for feature consistency with Bitcoin model
      const ethBtc = 0.067; // Approximate ETH/BTC ratio
      const valueBtc = valueEth * ethBtc;
      const feeBtc = gasFeeEth * ethBtc;

      if (blockNum > 0) blocks.push(blockNum);

      if (from === targetAddress) {
        allFeesBtc.push(feeBtc);
        if (valueBtc > 0) {
          sentTxs.push({ value_btc: valueBtc, fee_btc: feeBtc, block: blockNum });
          allValuesBtc.push(valueBtc);
          pushCounterparty(counterparties, to);
        }
      }

      if (to === targetAddress && valueBtc > 0) {
        receivedTxs.push({ value_btc: valueBtc, block: blockNum });
        allValuesBtc.push(valueBtc);
        pushCounterparty(counterparties, from);
      }
    }

    // Calculate basic statistics
    features["num_txs_as_sender"] = sentTxs.length;
    features["num_txs_as_receiver"] = receivedTxs.length;
    features["total_txs"] = sentTxs.length + receivedTxs.length;

    if (blocks.length > 0) {
      const first = Math.min(...blocks);
      const last = Math.max(...blocks);
      features["first_block_appeared_in"] = first;
      features["last_block_appeared_in"] = last;
      features["lifetime_in_blocks"] = last - first;
      features["num_timesteps_appeared_in"] = new Set(blocks).size;
    } else {
      features["first_block_appeared_in"] = 0.0;
      features["last_block_appeared_in"] = 0.0;
      features["lifetime_in_blocks"] = 0.0;
      features["num_timesteps_appeared_in"] = 0.0;
    }

    const sentBlocks = sentTxs.filter((t) => t.block > 0).map((t) => t.block);
    const receivedBlocks = receivedTxs.filter((t) => t.block > 0).map((t) => t.block);
    features["first_sent_block"] = sentBlocks.length ? Math.min(...sentBlocks) : 0.0;
    features["first_received_block"] = receivedBlocks.length ? Math.min(...receivedBlocks) : 0.0;

    // Add statistical features
    addStats(features, "btc_transacted", allValuesBtc, true);
    addStats(features, "btc_sent", sentTxs.map((t) => t.value_btc), true);
    addStats(features, "btc_received", receivedTxs.map((t) => t.value_btc), true);
    addStats(features, "fees", allFeesBtc, true);

    const feeShares = sentTxs.filter((t) => t.value_btc > 0).map((t) => (t.fee_btc / t.value_btc) * 100.0);
    addStats(features, "fees_as_share", feeShares, true);

    addIntervalStats(features, "blocks_btwn_txs", blocks);
    addIntervalStats(features, "blocks_btwn_input_txs", sentBlocks);
    addIntervalStats(features, "blocks_btwn_output_txs", receivedBlocks);

    features["transacted_w_address_total"] = counterparties.size;
    features["num_addr_transacted_multiple"] = [...counterparties.values()].filter((c) => c > 1).length;
    addStats(features, "transacted_w_address", [...counterparties.values()].map((v) => Number(v)), false);

    // Convert to EthereumFeatures format
    const ethFeatures: EthereumFeatures = {
      total_txs: features["total_txs"] || 0,
      total_ether_sent: features["btc_sent_total"] || 0, // Convert back to ETH
      total_ether_received: features["btc_received_total"] || 0,
      unique_incoming_addresses: features["num_txs_as_receiver"] || 0,
      unique_outgoing_addresses: features["num_txs_as_sender"] || 0,
      first_transaction: blocks.length > 0 ? new Date(Math.min(...blocks) * 1000).toISOString() : new Date().toISOString(),
      last_transaction: blocks.length > 0 ? new Date(Math.max(...blocks) * 1000).toISOString() : new Date().toISOString(),
      current_balance: 0, // Would need separate API call
    };

    console.log(`Extracted Ethereum features:`, ethFeatures);
    return ethFeatures;

  } catch (error) {
    console.error('Error extracting Ethereum features:', error);
    throw new Error(`Ethereum feature extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions
function pushCounterparty(counterMap: Map<string, number>, key: string) {
  if (!key) return;
  counterMap.set(key, (counterMap.get(key) || 0) + 1);
}

function addStats(features: { [key: string]: any }, prefix: string, values: number[], includeTotal: boolean) {
  const defaults = [`${prefix}_min`, `${prefix}_max`, `${prefix}_mean`, `${prefix}_median`];
  if (includeTotal) features[`${prefix}_total`] = 0.0;
  for (const k of defaults) features[k] = 0.0;
  if (!values || values.length === 0) return;

  const sum = values.reduce((a, b) => a + b, 0);
  if (includeTotal) features[`${prefix}_total`] = sum;
  features[`${prefix}_mean`] = sum / values.length;
  features[`${prefix}_min`] = values.reduce((a, b) => Math.min(a, b), Infinity);
  features[`${prefix}_max`] = values.reduce((a, b) => Math.max(a, b), -Infinity);

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2.0 : sorted[mid];
  features[`${prefix}_median`] = median;
}

function addIntervalStats(features: { [key: string]: any }, prefix: string, blocks: number[]) {
  if (!blocks || blocks.length <= 1) {
    addStats(features, prefix, [], true);
    return;
  }
  const uniqueSorted = [...new Set(blocks)].sort((a, b) => a - b);
  const intervals = uniqueSorted.slice(1).map((b, i) => Number(b - uniqueSorted[i]));
  addStats(features, prefix, intervals, true);
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressPattern.test(address);
}
