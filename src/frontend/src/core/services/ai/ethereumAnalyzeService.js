// Ethereum Analyze Service
// Memindahkan seluruh logika ekstraksi fitur ETH dari canister Rust ke frontend
// Meniru persis alur: fetch transaksi (Etherscan), konversi harga (CryptoCompare/DeFiLlama/Moralis),
// kalkulasi fitur seperti di Rust (feature_calculator.rs, data_extractor.rs, price_converter.rs)

// Konfigurasi default (bisa dioverride via options atau env)
const WEI_TO_ETH = 1_000_000_000_000_000_000n; // BigInt untuk akurasi parsing awal
const WEI_TO_ETH_F64 = 1_000_000_000_000_000_000.0; // Untuk perhitungan float
const MAX_TRANSACTIONS_PER_ADDRESS = 100;
const ETHERSCAN_MAX_RECORDS = 10000;

const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const MORALIS_METADATA_URL = "https://deep-index.moralis.io/api/v2.2/erc20/metadata";
const MORALIS_PRICE_URL = "https://deep-index.moralis.io/api/v2.2/erc20";
const CRYPTOCOMPARE_URL = "https://min-api.cryptocompare.com/data/pricehistorical";
const DEFILLAMA_URL = "https://coins.llama.fi/prices/historical";

// In-memory caches (meniru STATE cache di canister)
const priceCache = new Map(); // key: monthlyKey -> number
const tokenPriceCache = new Map(); // key: symbol_YYYY-MM-01_address -> number
const tokenInfoCache = new Map(); // key: address(lowercase) -> { symbol, decimals }

// Utilitas fetch JSON
async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ----------------------
// 1) DATA EXTRACTOR (Etherscan)
// ----------------------
async function fetchPage(address, action, startBlock, etherscanApiKey) {
  const url = `${ETHERSCAN_API_URL}?module=account&action=${action}&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`;
  const data = await fetchJson(url);
  if (data.status === "1") {
    return Array.isArray(data.result) ? data.result : [];
  }
  if (typeof data.message === "string" && data.message.includes("No transactions found")) {
    return [];
  }
  throw new Error(`Etherscan API error: ${data.message || "unknown"}`);
}

async function fetchAllPages(action, address, etherscanApiKey) {
  const all = [];
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

async function getAllTransactions(address, { etherscanApiKey }) {
  const ethTxs = await fetchAllPages("txlist", address, etherscanApiKey);

  const erc20Txs = await fetchAllPages("tokentx", address, etherscanApiKey);

  // Map hash -> parent ETH tx untuk copy gas info
  const ethTxMap = new Map(ethTxs.map((tx) => [tx.hash, tx]));

  const all = [];
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

  // Sort by timestamp asc
  all.sort((a, b) => Number.parseInt(a.timeStamp ?? a.time_stamp ?? "0", 10) - Number.parseInt(b.timeStamp ?? b.time_stamp ?? "0", 10));

  if (all.length > MAX_TRANSACTIONS_PER_ADDRESS) {
    console.warn(`⚠️ Limiting to ${MAX_TRANSACTIONS_PER_ADDRESS} transactions (found ${all.length}).`);
    all.length = MAX_TRANSACTIONS_PER_ADDRESS;
  }
  return all;
}

// ----------------------
// 2) PRICE CONVERTER (CryptoCompare / DeFiLlama / Moralis)
// ----------------------
async function getTokenInfo(tokenAddress, { moralisApiKey }) {
  const lower = tokenAddress.toLowerCase();
  if (tokenInfoCache.has(lower)) return tokenInfoCache.get(lower);

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

function tsToMonthKey(timestamp) {
  const d = new Date(Number(timestamp) * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

async function getStablecoinEthRatio(timestamp, { cryptocompareApiKey }) {
  const monthKey = `ETH_USD_${tsToMonthKey(timestamp)}`;
  if (priceCache.has(monthKey)) {
    const usd = priceCache.get(monthKey);
    return usd > 0 ? 1.0 / usd : 0.0;
  }
  const monthTs = Date.UTC(new Date(Number(timestamp) * 1000).getUTCFullYear(), new Date(Number(timestamp) * 1000).getUTCMonth(), 1) / 1000;
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

async function fetchFromDefiLlama(tokenAddress, timestamp, { cryptocompareApiKey }) {
  const llama = `ethereum:${tokenAddress}`;
  const url = `${DEFILLAMA_URL}/${timestamp}/${llama}`;
  try {
    const data = await fetchJson(url);
    const coin = data?.coins?.[llama];
    if (!coin) return 0.0;
    const tokenUsd = coin.price;
    const ethPerUsd = await getStablecoinEthRatio(timestamp, { cryptocompareApiKey });
    return ethPerUsd > 0 ? tokenUsd * ethPerUsd : 0.0;
  } catch {
    return 0.0;
  }
}

async function fetchFromMoralisPrice(tokenAddress, timestamp, { moralisApiKey, cryptocompareApiKey }) {
  try {
    const toDate = new Date(Number(timestamp) * 1000).toISOString();
    const url = `${MORALIS_PRICE_URL}/${tokenAddress}/price?chain=eth&to_date=${encodeURIComponent(toDate)}`;
    const data = await fetchJson(url, { accept: "application/json", "X-API-Key": moralisApiKey });
    const usd = data?.usd_price ?? 0.0;
    const ethPerUsd = await getStablecoinEthRatio(timestamp, { cryptocompareApiKey });
    return ethPerUsd > 0 ? usd * ethPerUsd : 0.0;
  } catch {
    return 0.0;
  }
}

async function fetchTokenPriceFromApis(tokenSymbol, tokenAddress, timestamp, { cryptocompareApiKey, moralisApiKey }) {
  if (tokenSymbol && tokenSymbol !== "UNKNOWN") {
    try {
      // Layer 1: CryptoCompare (SYMBOL -> ETH)
      const monthTs = Date.UTC(new Date(Number(timestamp) * 1000).getUTCFullYear(), new Date(Number(timestamp) * 1000).getUTCMonth(), 1) / 1000;
      const url = `${CRYPTOCOMPARE_URL}?fsym=${encodeURIComponent(tokenSymbol)}&tsyms=ETH&ts=${monthTs}&api_key=${cryptocompareApiKey}`;
      const data = await fetchJson(url);
      const price = data?.[tokenSymbol]?.ETH ?? 0.0;
      if (price > 0) {
        return price;
      }
    } catch (_) {}
  }
  // Layer 2: DeFiLlama
  const llamaPrice = await fetchFromDefiLlama(tokenAddress, timestamp, { cryptocompareApiKey });
  if (llamaPrice > 0) {
    return llamaPrice;
  }
  // Layer 3: Moralis price endpoint
  const moralisPrice = await fetchFromMoralisPrice(tokenAddress, timestamp, { moralisApiKey, cryptocompareApiKey });
  if (moralisPrice > 0) {
    return moralisPrice;
  }
  console.warn(`      -> ❌ ALL APIs FAILED for ${tokenSymbol}`);
  return 0.0;
}

async function getTokenEthRatio(tokenAddress, timestamp, apis) {
  const info = await getTokenInfo(tokenAddress, apis);
  const symbol = info.symbol;
  if (symbol === "WETH") return 1.0;

  const monthlyKeyPart = tsToMonthKey(timestamp);
  const cacheKey = `${symbol}_${monthlyKeyPart}_${tokenAddress.toLowerCase()}`;
  if (tokenPriceCache.has(cacheKey)) return tokenPriceCache.get(cacheKey);

  const ratio = ["USDT", "USDC", "DAI"].includes(symbol) ? await getStablecoinEthRatio(timestamp, apis) : await fetchTokenPriceFromApis(symbol, tokenAddress, timestamp, apis);

  if (ratio > 0) tokenPriceCache.set(cacheKey, ratio);
  return ratio;
}

async function getEthBtcRatio(timestamp, { cryptocompareApiKey }) {
  const monthKey = `ETH_BTC_${tsToMonthKey(timestamp)}`;
  if (priceCache.has(monthKey)) return priceCache.get(monthKey);
  const monthTs = Date.UTC(new Date(Number(timestamp) * 1000).getUTCFullYear(), new Date(Number(timestamp) * 1000).getUTCMonth(), 1) / 1000;
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=ETH&tsyms=BTC&ts=${monthTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const price = data?.ETH?.BTC ?? 0.0;
    if (price > 0) {
      priceCache.set(monthKey, price);
      return price;
    }
  } catch (_) {}
  const year = new Date(Number(timestamp) * 1000).getUTCFullYear();
  const fallback = year <= 2016 ? 0.02 : year <= 2017 ? 0.05 : year <= 2018 ? 0.08 : year <= 2020 ? 0.04 : 0.067;
  console.warn(`   -> Warning: Could not fetch ETH/BTC price, using fallback ratio: ${fallback}`);
  return fallback;
}

// ----------------------
// 3) FEATURE CALCULATOR
// ----------------------
function pushCounterparty(counterMap, key) {
  if (!key) return;
  counterMap.set(key, (counterMap.get(key) || 0) + 1);
}

function addStats(features, prefix, values, includeTotal) {
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

function addIntervalStats(features, prefix, blocks) {
  if (!blocks || blocks.length <= 1) {
    addStats(features, prefix, [], true);
    return;
  }
  const uniqueSorted = [...new Set(blocks)].sort((a, b) => a - b);
  const intervals = uniqueSorted.slice(1).map((b, i) => Number(b - uniqueSorted[i]));
  addStats(features, prefix, intervals, true);
}

export async function extractFeatures(targetAddress, apis = {}) {
  const env = import.meta.env;
  const { etherscanApiKey = env.VITE_ETHERSCAN_API_KEY ?? "", cryptocompareApiKey = env.VITE_CRYPTOCOMPARE_API_KEY ?? "", moralisApiKey = env.VITE_MORALIS_API_KEY ?? "" } = apis;

  const address = String(targetAddress).toLowerCase();
  const txs = await getAllTransactions(address, { etherscanApiKey });

  const features = {};
  const sentTxs = [];
  const receivedTxs = [];
  const allValuesBtc = [];
  const allFeesBtc = [];
  const blocks = [];
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
      const tokenInfo = await getTokenInfo(String(tx.contractAddress ?? tx.contract_address ?? ""), { moralisApiKey });
      const decimals = tokenInfo.decimals;
      const tokenAmount = Number(tx.value ?? "0") / Math.pow(10, decimals);
      if (tokenAmount > 0) {
        const ratio = await getTokenEthRatio(String(tx.contractAddress ?? tx.contract_address ?? ""), timestamp, { cryptocompareApiKey, moralisApiKey });
        valueEth = tokenAmount * ratio;
        if (valueEth > 0) {
          console.log(`      -> Conversion: ${tokenAmount.toFixed(4)} ${tokenInfo.symbol} * ${ratio.toFixed(8)} = ${valueEth.toFixed(8)} ETH`);
        }
      }
    }

    const gasUsed = Number(tx.gasUsed ?? tx.gas_used ?? "0") || 0;
    const gasPrice = Number(tx.gasPrice ?? tx.gas_price ?? "0") || 0;
    const gasFeeEth = (gasUsed * gasPrice) / WEI_TO_ETH_F64;

    const ethBtc = await getEthBtcRatio(timestamp, { cryptocompareApiKey });
    const valueBtc = valueEth * ethBtc;
    const feeBtc = gasFeeEth * ethBtc;

    if (blockNum > 0) blocks.push(blockNum);

    if (from === address) {
      allFeesBtc.push(feeBtc);
      if (valueBtc > 0) {
        sentTxs.push({ value_btc: valueBtc, fee_btc: feeBtc, block: blockNum });
        allValuesBtc.push(valueBtc);
        pushCounterparty(counterparties, to);
      }
    }
    if (to === address && valueBtc > 0) {
      receivedTxs.push({ value_btc: valueBtc, block: blockNum });
      allValuesBtc.push(valueBtc);
      pushCounterparty(counterparties, from);
    }
  }

  // Base counts
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

  addStats(features, "btc_transacted", allValuesBtc, true);
  addStats(
    features,
    "btc_sent",
    sentTxs.map((t) => t.value_btc),
    true
  );
  addStats(
    features,
    "btc_received",
    receivedTxs.map((t) => t.value_btc),
    true
  );
  addStats(features, "fees", allFeesBtc, true);

  const feeShares = sentTxs.filter((t) => t.value_btc > 0).map((t) => (t.fee_btc / t.value_btc) * 100.0);
  addStats(features, "fees_as_share", feeShares, true);

  addIntervalStats(features, "blocks_btwn_txs", blocks);
  addIntervalStats(features, "blocks_btwn_input_txs", sentBlocks);
  addIntervalStats(features, "blocks_btwn_output_txs", receivedBlocks);

  features["transacted_w_address_total"] = counterparties.size;
  features["num_addr_transacted_multiple"] = [...counterparties.values()].filter((c) => c > 1).length;
  addStats(
    features,
    "transacted_w_address",
    [...counterparties.values()].map((v) => Number(v)),
    false
  );

  return features;
}

// Utility: Susun vektor fitur sesuai urutan metadata (ETH_MODEL_METADATA_JSON)
export function buildFeatureVector(featureNames, featureMap) {
  return featureNames.map((name) => Number(featureMap[name] ?? 0.0));
}

// Utility: ambil total transaksi dari fitur (untuk parameter transaction_count canister)
export function getTxCountFromFeatures(featureMap) {
  return Math.trunc(Number(featureMap.total_txs || 0));
}

// Convenience API set
export const EthereumAnalyzeService = {
  getAllTransactions,
  extractFeatures,
  buildFeatureVector,
  getTxCountFromFeatures,
};
