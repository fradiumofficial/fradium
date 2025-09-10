// Bitcoin Analysis Service for Extension
// Adapted from frontend implementation for extension environment

import type { BitcoinFeatures } from './types';

// Mempool Space API configuration
const MEMPOOL_API_URL = "https://mempool.space/api";
const MAX_TRANSACTIONS = 100;
const SATOSHI_TO_BTC = 100_000_000.0;

/**
 * Fetch transactions from Mempool Space API
 * @param address - Bitcoin address
 * @returns Array of transaction objects
 */
async function fetchTransactions(address: string) {
  console.log(`Fetching transactions for address: ${address}`);

  try {
    const url = `${MEMPOOL_API_URL}/address/${address}/txs`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const mempoolTransactions = (await response.json()) || [];

    let limitedTransactions = mempoolTransactions;
    if (mempoolTransactions.length > MAX_TRANSACTIONS) {
      console.log(`Limiting to ${MAX_TRANSACTIONS} transactions from mempool ${mempoolTransactions.length}`);
      limitedTransactions = mempoolTransactions.slice(0, MAX_TRANSACTIONS);
    }

    console.log(`Total transactions fetched: ${limitedTransactions.length}`);
    return limitedTransactions;

  } catch (error) {
    console.error(`An unexpected error occured: ${error}`);
    throw new Error("An unexpected error occurred while fetching transactions. Please try again later.");
  }
}

/**
 * Adapt Mempool transaction format to standardized format
 * @param tx - Transaction from Mempool Space
 * @returns Adapted transaction object
 */
function adaptMempoolTransaction(tx: any) {
  return {
    hash: tx.txid,
    block_height: tx.status.block_height || 0,
    fee: tx.fee,
    inputs: tx.vin.map((input: any) => ({
      prev_out: {
        addr: input.prevout.scriptpubkey_address,
        value: input.prevout.value,
      },
    })),
    outputs: tx.vout.map((output: any) => ({
      addr: output.scriptpubkey_address,
      value: output.value,
    })),
  };
}

/**
 * Extract features from Bitcoin address using real transaction data
 * @param address - Bitcoin address to analyze
 * @returns Array of feature values for AI analysis
 */
export async function extractBitcoinFeatures(address: string): Promise<number[]> {
  try {
    console.log(`Extracting Bitcoin features for address: ${address}`);

    const transactions = await fetchTransactions(address);
    const adaptedTransactions = transactions.map(adaptMempoolTransaction);

    const features: { [key: string]: number } = {};
    const SATOSHI_TO_BTC = 100_000_000.0;

    // Initialize variables for data collection
    const blockHeights: number[] = [];
    const sentBlocks: number[] = [];
    const receivedBlocks: number[] = [];

    const sentValuesBtc: number[] = [];
    const receivedValuesBtc: number[] = [];
    const allTransactionValuesBtc: number[] = [];
    const allFeesBtc: number[] = [];
    const addressInteractionCounts = new Map<string, number>();

    // 1. Loop through each transaction to collect raw data
    for (const tx of adaptedTransactions) {
      if (tx.block_height) {
        blockHeights.push(tx.block_height);
      }
      allFeesBtc.push(tx.fee / SATOSHI_TO_BTC);

      let isSender = false;
      let totalSentSatoshi = 0;
      for (const input of tx.inputs) {
        if (input.prev_out?.addr === address) {
          isSender = true;
          totalSentSatoshi += input.prev_out.value;
        }
        // Count interactions with other addresses
        if (input.prev_out?.addr && input.prev_out.addr !== address) {
          addressInteractionCounts.set(
            input.prev_out.addr,
            (addressInteractionCounts.get(input.prev_out.addr) || 0) + 1
          );
        }
      }

      let totalReceivedSatoshi = 0;
      for (const output of tx.outputs) {
        if (output.addr === address) {
          totalReceivedSatoshi += output.value;
        }
        // Count interactions with other addresses
        if (output.addr && output.addr !== address) {
          addressInteractionCounts.set(
            output.addr,
            (addressInteractionCounts.get(output.addr) || 0) + 1
          );
        }
      }

      if (isSender) {
        const sentBtc = totalSentSatoshi / SATOSHI_TO_BTC;
        sentValuesBtc.push(sentBtc);
        allTransactionValuesBtc.push(sentBtc);
        if (tx.block_height) sentBlocks.push(tx.block_height);
      }

      if (totalReceivedSatoshi > 0) {
        const receivedBtc = totalReceivedSatoshi / SATOSHI_TO_BTC;
        receivedValuesBtc.push(receivedBtc);
        allTransactionValuesBtc.push(receivedBtc);
        if (tx.block_height) receivedBlocks.push(tx.block_height);
      }
    }

    // 2. Calculate basic features
    features["num_txs_as_sender"] = sentValuesBtc.length;
    features["num_txs_as_receiver"] = receivedValuesBtc.length;
    features["total_txs"] = transactions.length;

    if (blockHeights.length > 0) {
      const minBlock = Math.min(...blockHeights);
      const maxBlock = Math.max(...blockHeights);
      features["first_block_appeared_in"] = minBlock;
      features["last_block_appeared_in"] = maxBlock;
      features["lifetime_in_blocks"] = maxBlock - minBlock;
      features["num_timesteps_appeared_in"] = new Set(blockHeights).size;
    }

    if (sentBlocks.length > 0) features["first_sent_block"] = Math.min(...sentBlocks);
    if (receivedBlocks.length > 0) features["first_received_block"] = Math.min(...receivedBlocks);

    // Calculate statistics using helper functions
    const btcTransactedStats = calculateStats(allTransactionValuesBtc);
    for (const key in btcTransactedStats) features[`btc_transacted_${key}`] = btcTransactedStats[key];

    const btcSentStats = calculateStats(sentValuesBtc);
    for (const key in btcSentStats) features[`btc_sent_${key}`] = btcSentStats[key];

    const btcReceivedStats = calculateStats(receivedValuesBtc);
    for (const key in btcReceivedStats) features[`btc_received_${key}`] = btcReceivedStats[key];

    const feesStats = calculateStats(allFeesBtc);
    for (const key in feesStats) features[`fees_${key}`] = feesStats[key];

    const feeShares = allFeesBtc.map((fee, i) => (allTransactionValuesBtc[i] > 0 ? (fee / allTransactionValuesBtc[i]) * 100 : 0));
    const feeSharesStats = calculateStats(feeShares);
    for (const key in feeSharesStats) features[`fees_as_share_${key}`] = feeSharesStats[key];

    const blockIntervals = calculateIntervals(blockHeights);
    const blockIntervalsStats = calculateStats(blockIntervals);
    for (const key in blockIntervalsStats) features[`blocks_btwn_txs_${key}`] = blockIntervalsStats[key];

    const sentBlockIntervals = calculateIntervals(sentBlocks);
    const sentBlockIntervalsStats = calculateStats(sentBlockIntervals);
    for (const key in sentBlockIntervalsStats) features[`blocks_btwn_input_txs_${key}`] = sentBlockIntervalsStats[key];

    const receivedBlockIntervals = calculateIntervals(receivedBlocks);
    const receivedBlockIntervalsStats = calculateStats(receivedBlockIntervals);
    for (const key in receivedBlockIntervalsStats) features[`blocks_btwn_output_txs_${key}`] = receivedBlockIntervalsStats[key];

    const interactionCounts = Array.from(addressInteractionCounts.values());
    const interactionStats = calculateStats(interactionCounts);
    for (const key in interactionStats) features[`transacted_w_address_${key}`] = interactionStats[key];
    features["num_addr_transacted_multiple"] = interactionCounts.filter((count) => count > 1).length;

    features["Time step"] = new Set(blockHeights).size;

    // 3. Calculate complex pattern features
    const get = (k: string) => features[k] || 0.0;
    const getDiv = (k: string) => {
      const v = get(k);
      return v === 0.0 ? 1.0 : v;
    };

    features["partner_transaction_ratio"] = get("transacted_w_address_total") / (get("total_txs") + 1e-8);
    features["activity_density"] = get("total_txs") / (getDiv("lifetime_in_blocks") + 1e-8);
    features["transaction_size_variance"] = (get("btc_transacted_max") - get("btc_transacted_min")) / (getDiv("btc_transacted_mean") + 1e-8);
    features["flow_imbalance"] = (get("btc_sent_total") - get("btc_received_total")) / (getDiv("btc_transacted_total") + 1e-8);
    features["temporal_spread"] = (get("last_block_appeared_in") - get("first_block_appeared_in")) / (getDiv("num_timesteps_appeared_in") + 1e-8);
    features["fee_percentile"] = get("fees_total") / (getDiv("btc_transacted_total") + 1e-8);
    features["interaction_intensity"] = get("num_addr_transacted_multiple") / (getDiv("transacted_w_address_total") + 1e-8);
    features["value_per_transaction"] = get("btc_transacted_total") / (getDiv("total_txs") + 1e-8);
    features["burst_activity"] = get("total_txs") * features["activity_density"];
    features["mixing_intensity"] = features["partner_transaction_ratio"] * features["interaction_intensity"];

    // 4. Arrange features in the correct order
    // This order MUST match exactly with the Rust model
    const featureNames = [
      "Time step",
      "num_txs_as_sender",
      "num_txs_as_receiver",
      "first_block_appeared_in",
      "last_block_appeared_in",
      "lifetime_in_blocks",
      "total_txs",
      "first_sent_block",
      "first_received_block",
      "num_timesteps_appeared_in",
      "btc_transacted_total",
      "btc_transacted_min",
      "btc_transacted_max",
      "btc_transacted_mean",
      "btc_transacted_median",
      "btc_sent_total",
      "btc_sent_min",
      "btc_sent_max",
      "btc_sent_mean",
      "btc_sent_median",
      "btc_received_total",
      "btc_received_min",
      "btc_received_max",
      "btc_received_mean",
      "btc_received_median",
      "fees_total",
      "fees_min",
      "fees_max",
      "fees_mean",
      "fees_median",
      "fees_as_share_total",
      "fees_as_share_min",
      "fees_as_share_max",
      "fees_as_share_mean",
      "fees_as_share_median",
      "blocks_btwn_txs_total",
      "blocks_btwn_txs_min",
      "blocks_btwn_txs_max",
      "blocks_btwn_txs_mean",
      "blocks_btwn_txs_median",
      "blocks_btwn_input_txs_total",
      "blocks_btwn_input_txs_min",
      "blocks_btwn_input_txs_max",
      "blocks_btwn_input_txs_mean",
      "blocks_btwn_input_txs_median",
      "blocks_btwn_output_txs_total",
      "blocks_btwn_output_txs_min",
      "blocks_btwn_output_txs_max",
      "blocks_btwn_output_txs_mean",
      "blocks_btwn_output_txs_median",
      "num_addr_transacted_multiple",
      "transacted_w_address_total",
      "transacted_w_address_min",
      "transacted_w_address_max",
      "transacted_w_address_mean",
      "transacted_w_address_median",
      "partner_transaction_ratio",
      "activity_density",
      "transaction_size_variance",
      "flow_imbalance",
      "temporal_spread",
      "fee_percentile",
      "interaction_intensity",
      "value_per_transaction",
      "burst_activity",
      "mixing_intensity",
    ];

    const featureVector = featureNames.map((name) => features[name] || 0.0);

    console.log(`Extracted ${featureVector.length} Bitcoin features`);
    return featureVector;

  } catch (error) {
    console.error('Error extracting Bitcoin features:', error);
    throw new Error(`Bitcoin feature extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions for statistics calculation
function calculateStats(values: number[]) {
  if (values.length === 0) {
    return {
      total: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { total: sum, min, max, mean, median };
}

function calculateIntervals(blocks: number[]) {
  if (blocks.length < 2) return [];
  const sorted = [...blocks].sort((a, b) => a - b);
  return sorted.slice(1).map((block, index) => block - sorted[index]);
}

/**
 * Validate Bitcoin address format
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation - in production, use a proper Bitcoin address validator
  const legacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Pattern = /^bc1[a-z0-9]{39,59}$/;

  return legacyPattern.test(address) || bech32Pattern.test(address);
}
