import { getFromLocalStorage, isCacheFresh, saveToLocalStorage } from "@/lib/localStorage";
import type { AddressInteractionCounts, AnalyzeResult, Features, MempoolAddressTransaction, Transaction } from "../model/AnalyzeAddressModel";
import axios from "axios";
import { createRansomwareDetectorActor } from "@/canister/canister_handler";

const SATOSHI_TO_BTC = 100_000_000;

/**
 * Mengadaptasi transaksi dari Mempool Space ke format yang sesuai dengan model AnalyzeAddress.
 * @param tx Transaksi dari Mempool Space.
 * @returns Transaksi yang telah diadaptasi.
 */
function adaptMempoolTransaction(tx: MempoolAddressTransaction): Transaction {
    return {
        hash: tx.txid,
        block_height: tx.status.block_height || 0,
        fee: tx.fee,
        inputs: tx.vin.map(input => ({
            prev_out: {
                addr: input.prevout.scriptpubkey_address,
                value: input.prevout.value
            }
        })),
        outputs: tx.vout.map(output => ({
            addr: output.scriptpubkey_address,
            value: output.value
        }))
    };
}

/**
 * Mengambil transaksi untuk alamat Bitcoin tertentu.
 * Data akan diambil dari cache lokal jika tersedia dan masih valid.
 * Jika tidak, data akan diambil dari API Mempool Space.
 * @param address Alamat Bitcoin yang akan dianalisis.
 * @returns Daftar transaksi yang terkait dengan alamat tersebut.
 */
export async function fetchTransactions(address: string): Promise<Transaction[]> {
    const MAX_TRANSACTIONS = 500;
    const cacheKey = `analyze_address_${address}`;
    const cacheTimeKey = `${cacheKey}-timestamp`;

    console.log(`Fetching transactions for address: ${address}`);

    try {
        const cachedTransactions = getFromLocalStorage(cacheKey);

        if (cachedTransactions && isCacheFresh(cacheKey)) {
            console.log(`Using cached transactions for address: ${address}, found ${cachedTransactions.length} transactions.`);
            return cachedTransactions;
        }

        console.log(`No fresh cache found for address: ${address}. Fetching from API...`);

        const url = `https://mempool.space/api/address/${address}/txs`;

        const response = await axios.get<MempoolAddressTransaction[]>(url);
        let mempoolTransactions = response.data || [];

        if (mempoolTransactions.length > MAX_TRANSACTIONS) {
            console.log(`Limiting to ${MAX_TRANSACTIONS} transactions from mempool ${mempoolTransactions.length}`);
            mempoolTransactions = mempoolTransactions.slice(0, MAX_TRANSACTIONS);
        }

        const transaction: Transaction[] = mempoolTransactions.map(adaptMempoolTransaction);

        console.log(`Total transactions fetched: ${transaction.length}`);

        saveToLocalStorage(cacheKey, transaction);
        localStorage.setItem(cacheTimeKey, Date.now().toString());

        return transaction;
    } catch (error) {
         // Jika ada error, coba gunakan cache yang sudah ada meskipun tidak fresh
        if (axios.isAxiosError(error)) {
            console.error(`API Error: ${error.message}`);
            
            const cachedTransactions = getFromLocalStorage(cacheKey);
            if (cachedTransactions) {
                console.log(`Using existing cache due to API error`);
                return cachedTransactions;
            }
        }

        console.error(`An unexpected error occured: ${error}`);
        throw new Error("An unexpected error occurred while fetching transactions. Please try again later.");
    }
} 

export function extractFeatures(
  transactions: Transaction[], 
  targetAddress: string
): number[] {
  console.log(`Extracting features from ${transactions.length} transactions for address: ${targetAddress}`);
  
  const features: Features = {};
  
  // Separate arrays for different data types
  const blockHeights: number[] = [];
  const sentBlocks: number[] = [];
  const receivedBlocks: number[] = [];
  const sentValuesBtc: number[] = [];
  const receivedValuesBtc: number[] = [];
  const allTransactionValuesBtc: number[] = [];
  const allFeesBtc: number[] = [];
  const addressInteractionCounts: AddressInteractionCounts = {};

  // Process each transaction
  for (const tx of transactions) {
    const blockHeight = tx.block_height || 0;
    const feeInBtc = (tx.fee || 0) / SATOSHI_TO_BTC;

    if (blockHeight > 0) {
      blockHeights.push(blockHeight);
    }
    allFeesBtc.push(feeInBtc);

    const { isSender, totalSentSatoshi } = checkIfSender(tx, targetAddress);
    const totalReceivedSatoshi = calculateReceivedAmount(tx, targetAddress);

    const sentBtc = totalSentSatoshi / SATOSHI_TO_BTC;
    const receivedBtc = totalReceivedSatoshi / SATOSHI_TO_BTC;

    // Tentukan nilai utama transaksi untuk alamat ini.
    // Biasanya adalah nilai terbesar yang keluar (jika mengirim) atau masuk.
    const primaryTxValue = Math.max(sentBtc, receivedBtc);
    
    // Pastikan hanya satu nilai utama per transaksi yang ditambahkan.
    if (primaryTxValue > 0) {
      allTransactionValuesBtc.push(primaryTxValue);
    }

    // Tetap kumpulkan statistik terpisah untuk mengirim dan menerima.
    if (isSender) {
      sentValuesBtc.push(sentBtc);
      if (blockHeight > 0) {
        sentBlocks.push(blockHeight);
      }
    }

    if (totalReceivedSatoshi > 0) {
      receivedValuesBtc.push(receivedBtc);
      if (blockHeight > 0) {
        receivedBlocks.push(blockHeight);
      }
    }

    extractCounterparties(tx, targetAddress, addressInteractionCounts);
  }
  
  // Populate base features
  populateBaseFeatures(
    features,
    transactions.length,
    sentValuesBtc,
    receivedValuesBtc,
    allTransactionValuesBtc,
    allFeesBtc,
    blockHeights,
    sentBlocks,
    receivedBlocks,
    addressInteractionCounts
  );
  
  // Create enhanced pattern features
  createEnhancedPatternFeatures(features);
  
  // Convert to ordered feature vector
  const featureVector = getFeatureNames().map(name => features[name] || 0);
  
  console.log(`Extracted ${featureVector.length} features`);
  return featureVector;
}

function populateBaseFeatures(
  features: Features,
  totalTxCount: number,
  sentValuesBtc: number[],
  receivedValuesBtc: number[],
  allValuesBtc: number[],
  allFeesBtc: number[],
  blockHeights: number[],
  sentBlocks: number[],
  receivedBlocks: number[],
  addressInteractionCounts: AddressInteractionCounts
): void {
  // Basic transaction counts
  features["num_txs_as_sender"] = sentValuesBtc.length;
  features["num_txs_as_receiver"] = receivedValuesBtc.length;
  features["total_txs"] = totalTxCount;
  
  // Block-related features
  if (blockHeights.length > 0) {
    const minBlock = Math.min(...blockHeights);
    const maxBlock = Math.max(...blockHeights);
    
    features["first_block_appeared_in"] = minBlock;
    features["last_block_appeared_in"] = maxBlock;
    features["lifetime_in_blocks"] = maxBlock - minBlock;
    
    const uniqueBlocks = new Set(blockHeights);
    features["num_timesteps_appeared_in"] = uniqueBlocks.size;
  }

  // First transaction blocks
  if (sentBlocks.length > 0) {
    features["first_sent_block"] = Math.min(...sentBlocks);
  }
  if (receivedBlocks.length > 0) {
    features["first_received_block"] = Math.min(...receivedBlocks);
  }

  // Statistical features for different value types
  insertStats(features, "btc_transacted", allValuesBtc);
  insertStats(features, "btc_sent", sentValuesBtc);
  insertStats(features, "btc_received", receivedValuesBtc);
  insertStats(features, "fees", allFeesBtc);
  
  // =======================================================================
  // 🔥 PERBAIKAN LOGIKA feeShares DI SINI
  // =======================================================================
  const feeShares: number[] = [];
  // Gunakan panjang array terpendek untuk iterasi yang aman (meniru fungsi .zip di Rust)
  const shortestLength = Math.min(allFeesBtc.length, allValuesBtc.length);
  for (let i = 0; i < shortestLength; i++) {
    const fee = allFeesBtc[i];
    const value = allValuesBtc[i];
    if (value > 0) {
      const share = (fee / value) * 100;
      if (share > 0) {
        feeShares.push(share);
      }
    }
  }
  insertStats(features, "fees_as_share", feeShares);
  
  // Block interval statistics
  insertStats(features, "blocks_btwn_txs", calculateBlockIntervals(blockHeights));
  insertStats(features, "blocks_btwn_input_txs", calculateBlockIntervals(sentBlocks));
  insertStats(features, "blocks_btwn_output_txs", calculateBlockIntervals(receivedBlocks));

  // Address interaction features
  const interactionCounts = Object.values(addressInteractionCounts);
  insertStats(features, "transacted_w_address", interactionCounts);
  
  const multipleInteractions = interactionCounts.filter(count => count > 1).length;
  features["num_addr_transacted_multiple"] = multipleInteractions;

  // Time step feature
  const uniqueBlocks = new Set(blockHeights);
  features["Time step"] = uniqueBlocks.size;
}

export async function analyzeAddressWithCanister(address: string, features: number[]): Promise<AnalyzeResult> {
  try {
    console.log(`Sending analysis request to canister for address: ${address}`);
    console.log(`Feature vector length: ${features.length}`);

    // Create the canister actor
    const actor = await createRansomwareDetectorActor();

    // Convert number array to Float32Array for the canister
    const featureVector = new Float32Array(features);
    
    // Call the canister method
    const response = await actor.predict_from_features(address, Array.from(featureVector));

    console.log(`Canister response:`, response);

    if ('Err' in response) {
      throw new Error(`Canister error: ${response.Err}`);
    }

    if (!response.Ok) {
      throw new Error('No result returned from canister');
    }

    const result = response.Ok;
    
    console.log(`✅ Analysis completed successfully:`, result);

    return {
      address: result.address,
      is_ransomware: result.is_ransomware,
      ransomware_probability: result.ransomware_probability,
      confidence_level: result.confidence_level,
      threshold_used: result.threshold_used,
      transactions_analyzed: result.transactions_analyzed,
      confidence: result.confidence ?? 0,
      features: features
    };

  } catch (error) {
    console.error(`Failed to analyze address with canister:`, error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete analysis pipeline: fetch transactions, extract features, and analyze with canister
 * @param address Bitcoin address to analyze
 * @returns Complete analysis result
 */
export async function performCompleteAnalysis(address: string): Promise<AnalyzeResult> {
  try {
    // Step 1: Fetch transactions
    const transactions = await fetchTransactions(address);
    
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions found for this address');
    }

    // Step 2: Extract features
    const features = extractFeatures(transactions, address);
    
    if (!features || features.length === 0) {
      throw new Error('Failed to extract features from transactions');
    }

    // Step 3: Analyze with canister
    const result = await analyzeAddressWithCanister(address, features);
    
    return result;

  } catch (error) {
    console.error(`Complete analysis failed:`, error);
    throw error;
  }
}

function checkIfSender(tx: Transaction, targetAddress: string): { isSender: boolean; totalSentSatoshi: number } {
  let isSender = false;
  let totalSentSatoshi = 0;
  
  if (tx.inputs) {
    for (const input of tx.inputs) {
      if (input.prev_out?.addr === targetAddress) {
        isSender = true;
        totalSentSatoshi += input.prev_out?.value || 0;
      }
    }
  }
  
  return { isSender, totalSentSatoshi };
}

function calculateReceivedAmount(tx: Transaction, targetAddress: string): number {
  let totalReceivedSatoshi = 0;
  
  if (tx.outputs) {
    for (const output of tx.outputs) {
      if (output.addr === targetAddress) {
        totalReceivedSatoshi += output.value || 0;
      }
    }
  }
  
  return totalReceivedSatoshi;
}

function getFeatureNames(): string[] {
  return [
    "Time step", "num_txs_as_sender", "num_txs_as_receiver", "first_block_appeared_in", 
    "last_block_appeared_in", "lifetime_in_blocks", "total_txs", "first_sent_block", 
    "first_received_block", "num_timesteps_appeared_in", "btc_transacted_total", 
    "btc_transacted_min", "btc_transacted_max", "btc_transacted_mean", "btc_transacted_median",
    "btc_sent_total", "btc_sent_min", "btc_sent_max", "btc_sent_mean", "btc_sent_median",
    "btc_received_total", "btc_received_min", "btc_received_max", "btc_received_mean", 
    "btc_received_median", "fees_total", "fees_min", "fees_max", "fees_mean", "fees_median",
    "fees_as_share_total", "fees_as_share_min", "fees_as_share_max", "fees_as_share_mean", 
    "fees_as_share_median", "blocks_btwn_txs_total", "blocks_btwn_txs_min", "blocks_btwn_txs_max",
    "blocks_btwn_txs_mean", "blocks_btwn_txs_median", "blocks_btwn_input_txs_total", 
    "blocks_btwn_input_txs_min", "blocks_btwn_input_txs_max", "blocks_btwn_input_txs_mean",
    "blocks_btwn_input_txs_median", "blocks_btwn_output_txs_total", "blocks_btwn_output_txs_min",
    "blocks_btwn_output_txs_max", "blocks_btwn_output_txs_mean", "blocks_btwn_output_txs_median",
    "num_addr_transacted_multiple", "transacted_w_address_total", "transacted_w_address_min",
    "transacted_w_address_max", "transacted_w_address_mean", "transacted_w_address_median",
    "partner_transaction_ratio", "activity_density", "transaction_size_variance", 
    "flow_imbalance", "temporal_spread", "fee_percentile", "interaction_intensity",
    "value_per_transaction", "burst_activity", "mixing_intensity"
  ];
}

function insertStats(features: Features, prefix: string, values: number[]): void {
  if (values.length === 0) {
    return;
  }
  
  // Calculate basic statistics
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate median
  const sortedValues = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
    : sortedValues[mid];
  
  // Store statistics
  features[`${prefix}_total`] = sum;
  features[`${prefix}_mean`] = mean;
  features[`${prefix}_min`] = min;
  features[`${prefix}_max`] = max;
  features[`${prefix}_median`] = median;
}

function extractCounterparties(
  tx: Transaction, 
  targetAddress: string, 
  interactionCounts: AddressInteractionCounts
): void {
  // Gunakan Set untuk memastikan setiap alamat lawan hanya dihitung sekali per transaksi.
  const uniqueCounterpartiesInTx = new Set<string>();

  // Kumpulkan semua alamat lawan yang unik dari semua input.
  if (tx.inputs) {
    for (const input of tx.inputs) {
      const addr = input.prev_out?.addr;
      if (addr && addr !== targetAddress) {
        uniqueCounterpartiesInTx.add(addr);
      }
    }
  }
  
  // Kumpulkan semua alamat lawan yang unik dari semua output.
  if (tx.outputs) {
    for (const output of tx.outputs) {
      const addr = output.addr;
      if (addr && addr !== targetAddress) {
        uniqueCounterpartiesInTx.add(addr);
      }
    }
  }

  // Sekarang, perbarui hitungan global untuk setiap alamat unik yang ditemukan dalam transaksi ini.
  for (const uniqueAddr of uniqueCounterpartiesInTx) {
    interactionCounts[uniqueAddr] = (interactionCounts[uniqueAddr] || 0) + 1;
  }
}

/**
 * Calculates intervals between consecutive block heights
 */
function calculateBlockIntervals(blockHeights: number[]): number[] {
  if (blockHeights.length < 2) {
    return [];
  }
  
  const sortedBlocks = [...blockHeights].sort((a, b) => a - b);
  const intervals: number[] = [];
  
  for (let i = 1; i < sortedBlocks.length; i++) {
    intervals.push(sortedBlocks[i] - sortedBlocks[i - 1]);
  }
  
  return intervals;
}

function createEnhancedPatternFeatures(features: Features): void {
  const get = (key: string): number => features[key] || 0;
  const getDiv = (key: string): number => {
    const v = features[key] || 0;
    return v === 0 ? 1 : v;
  };

  const transactedWithAddressTotal = get("transacted_w_address_total");
  const totalTxs                = get("total_txs");
  const lifetimeInBlocks        = getDiv("lifetime_in_blocks");
  const btcTransactedMax        = get("btc_transacted_max");
  const btcTransactedMin        = get("btc_transacted_min");
  const btcTransactedMean       = getDiv("btc_transacted_mean");
  const btcSentTotal            = get("btc_sent_total");
  const btcReceivedTotal        = get("btc_received_total");
  const btcTransactedTotalDiv   = getDiv("btc_transacted_total");
  const lastBlockAppearedIn     = get("last_block_appeared_in");
  const firstBlockAppearedIn    = get("first_block_appeared_in");
  const numTimestepsAppearedIn  = getDiv("num_timesteps_appeared_in");
  const feesTotal               = get("fees_total");
  const numAddrTransMultiple    = get("num_addr_transacted_multiple");

  const partnerRatio       = transactedWithAddressTotal / (totalTxs + 1e-8);
  const activityDensity    = totalTxs / (lifetimeInBlocks + 1e-8);
  const txVariance         = (btcTransactedMax - btcTransactedMin) / (btcTransactedMean + 1e-8);
  const flowImbalance      = (btcSentTotal - btcReceivedTotal) / (btcTransactedTotalDiv + 1e-8);
  const temporalSpread     = (lastBlockAppearedIn - firstBlockAppearedIn) / (numTimestepsAppearedIn + 1e-8);
  const feePercentile      = feesTotal / (btcTransactedTotalDiv + 1e-8);
  const interactionIntensity = numAddrTransMultiple / (transactedWithAddressTotal + 1e-8);
  const valuePerTransaction   = get("btc_transacted_total") / (totalTxs + 1e-8);
  const burstActivity         = totalTxs * activityDensity;
  const mixingIntensity       = partnerRatio * interactionIntensity;

  features["partner_transaction_ratio"]   = partnerRatio;
  features["activity_density"]            = activityDensity;
  features["transaction_size_variance"]   = txVariance;
  features["flow_imbalance"]              = flowImbalance;
  features["temporal_spread"]             = temporalSpread;
  features["fee_percentile"]              = feePercentile;
  features["interaction_intensity"]       = interactionIntensity;
  features["value_per_transaction"]       = valuePerTransaction;
  features["burst_activity"]              = burstActivity;
  features["mixing_intensity"]            = mixingIntensity;
}