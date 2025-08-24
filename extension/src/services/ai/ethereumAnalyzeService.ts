/**
 * Ethereum Analysis Service for Extension
 * Adapted from the frontend service to work in the extension environment
 */

// Configuration defaults
const WEI_TO_ETH_F64 = 1_000_000_000_000_000_000.0; // For float calculations
const MAX_TRANSACTIONS_PER_ADDRESS = 100;
const ETHERSCAN_MAX_RECORDS = 10000;

const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const CRYPTOCOMPARE_URL = "https://min-api.cryptocompare.com/data/pricehistorical";

// In-memory caches (mimicking STATE cache in canister)
const priceCache = new Map<string, number>(); // key: monthlyKey -> number

// JSON fetch utility
async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ----------------------
// 1) DATA EXTRACTOR (Etherscan)
// ----------------------
async function fetchPage(address: string, action: string, startBlock: number, etherscanApiKey: string): Promise<any[]> {
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

async function fetchAllPages(action: string, address: string, etherscanApiKey: string): Promise<any[]> {
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

async function getAllTransactions(address: string, options: { etherscanApiKey: string }): Promise<any[]> {
  const ethTxs = await fetchAllPages("txlist", address, options.etherscanApiKey);
  const erc20Txs = await fetchAllPages("tokentx", address, options.etherscanApiKey);

  // Map hash -> parent ETH tx to copy gas info
  const ethTxMap = new Map(ethTxs.map((tx) => [tx.hash, tx]));

  const all: any[] = [];
  const erc20ParentHashes = new Set<string>();

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
// 2) PRICE CONVERTER (CryptoCompare)
// ----------------------
function tsToMonthKey(timestamp: number): string {
  const d = new Date(Number(timestamp) * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

async function getEthBtcRatio(timestamp: number, options: { cryptocompareApiKey: string }): Promise<number> {
  const monthKey = `ETH_BTC_${tsToMonthKey(timestamp)}`;
  if (priceCache.has(monthKey)) return priceCache.get(monthKey)!;
  const monthTs = Date.UTC(new Date(Number(timestamp) * 1000).getUTCFullYear(), new Date(Number(timestamp) * 1000).getUTCMonth(), 1) / 1000;
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=ETH&tsyms=BTC&ts=${monthTs}&api_key=${options.cryptocompareApiKey}`;
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
function addStats(features: Record<string, number>, prefix: string, values: number[], includeTotal: boolean): void {
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

function addIntervalStats(features: Record<string, number>, prefix: string, blocks: number[]): void {
  if (!blocks || blocks.length <= 1) {
    addStats(features, prefix, [], true);
    return;
  }
  const uniqueSorted = [...new Set(blocks)].sort((a, b) => a - b);
  const intervals = uniqueSorted.slice(1).map((b, i) => Number(b - uniqueSorted[i]));
  addStats(features, prefix, intervals, true);
}

export async function extractFeatures(targetAddress: string, apis: {
  etherscanApiKey?: string;
  cryptocompareApiKey?: string;
} = {}): Promise<Record<string, number>> {
  // Use environment variables if not provided
  const etherscanApiKey = apis.etherscanApiKey || import.meta.env?.VITE_ETHERSCAN_API_KEY || "";
  const cryptocompareApiKey = apis.cryptocompareApiKey || import.meta.env?.VITE_CRYPTOCOMPARE_API_KEY || "";

  const address = String(targetAddress).toLowerCase();
  const txs = await getAllTransactions(address, { etherscanApiKey });

  const features: Record<string, number> = {};
  const sentTxs: Array<{ value_btc: number; fee_btc: number; block: number }> = [];
  const receivedTxs: Array<{ value_btc: number; block: number }> = [];
  const allValuesBtc: number[] = [];
  const allFeesBtc: number[] = [];
  const blocks: number[] = [];
  const counterparties = new Map<string, number>();

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
      // For ERC20 tokens, we'll use a simplified conversion
      const tokenAmount = Number(tx.value ?? "0") / Math.pow(10, 18); // Assume 18 decimals for simplicity
      valueEth = tokenAmount * 0.001; // Simple conversion ratio
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
        if (to) counterparties.set(to, (counterparties.get(to) || 0) + 1);
      }
    }
    if (to === address && valueBtc > 0) {
      receivedTxs.push({ value_btc: valueBtc, block: blockNum });
      allValuesBtc.push(valueBtc);
      if (from) counterparties.set(from, (counterparties.get(from) || 0) + 1);
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

  return features;
}

// Utility: get total transactions from features (for transaction_count canister parameter)
export function getTxCountFromFeatures(featureMap: Record<string, number>): number {
  return Math.trunc(Number(featureMap.total_txs || 0));
}
