use crate::shared_models::RansomwareResult;
use crate::STATE;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod,
};
use num_traits::ToPrimitive;
use serde_json::Value;
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use tract_onnx::prelude::*;

mod config;
pub mod models;

use self::config::*;
use self::models::*;

// --- BTC Module State (for the non-serializable ONNX model) ---
thread_local! {
    static MODEL: RefCell<Option<SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>>> = RefCell::new(None);
}

pub fn init() -> self::models::ModelMetadata {
    ic_cdk::println!("[init_btc] Initializing Bitcoin analyzer state...");
    let scaler_data: ScalerParams = serde_json::from_str(SCALER_PARAMS_JSON)
        .expect("FATAL: Could not parse BTC SCALER_PARAMS_JSON");
    let model_meta: ModelMeta = serde_json::from_str(MODEL_METADATA_JSON)
        .expect("FATAL: Could not parse BTC MODEL_METADATA_JSON");

    let metadata = self::models::ModelMetadata {
        threshold: model_meta.deployment_threshold,
        feature_names: model_meta.feature_names,
        scaler_mean: scaler_data.mean,
        scaler_scale: scaler_data.scale,
    };

    load_model_from_config();
    ic_cdk::println!("[init_btc] ✅ BTC state initialized.");
    
    metadata // Return the metadata to be stored in the global state
}

pub fn load_model_from_config() {
    let model_vec = MODEL_BYTES.to_vec();
    if let Err(e) = load_model_from_bytes(model_vec) {
        ic_cdk::trap(&format!("[btc] FATAL: Could not load ONNX model: {}", e));
    }
}


fn load_model_from_bytes(model_bytes: Vec<u8>) -> Result<String, String> {
    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(&model_bytes))
        .map_err(|e| format!("Failed to read ONNX model: {}", e))?
        .into_optimized()
        .map_err(|e| format!("Failed to optimize ONNX model: {}", e))?
        .into_runnable()
        .map_err(|e| format!("Failed to make ONNX model runnable: {}", e))?;

    MODEL.with(|m| *m.borrow_mut() = Some(model));
    Ok(format!("Loaded model with {} bytes", model_bytes.len()))
}

// --- CORE LOGIC ---
pub async fn analyze_btc_address(address: &str) -> Result<RansomwareResult, String> {
    let transactions = fetch_transactions_mempool(address).await?;
    let converted_transactions =
        convert_mempool_to_blockchain_format(&transactions, address)?;
    let feature_vector = extract_features(&converted_transactions, address)?;
    predict_ransomware(feature_vector, address, transactions.len() as u32)
}

async fn fetch_transactions_mempool(address: &str) -> Result<Vec<MempoolTransaction>, String> {
    let mut all_transactions = Vec::new();
    let mut last_seen_txid: Option<String> = None;
    let mut page = 1;
    const PAGE_SIZE: usize = 25;
    const MAX_PAGES: usize = 50;

    ic_cdk::println!("Fetching transactions from mempool.space for address: {}", address);

    loop {

        if all_transactions.len() >= BTC_MAX_TRANSACTIONS {
            ic_cdk::println!(
                "⚠️  Transaction limit reached for BTC address. Processing first {} transactions.",
                BTC_MAX_TRANSACTIONS
            );
            all_transactions.truncate(BTC_MAX_TRANSACTIONS);
            break;
        }

        let url = if let Some(ref txid) = last_seen_txid {
            format!("https://mempool.space/api/address/{}/txs?after_txid={}", address, txid)
        } else {
            format!("https://mempool.space/api/address/{}/txs", address)
        };

        ic_cdk::println!("Fetching page {}: {}", page, url);

        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(2_000_000),
            transform: None,
            headers: vec![],
        };

        let cycles = 55_000_000_000u128;

        match http_request(request, cycles).await {
            Ok((response,)) => {
                let status_code: u64 = response.status.0.to_u64().unwrap_or(0);
                
                if status_code == 404 {
                    if let Some(ref txid) = last_seen_txid {
                        let alt_url = format!("https://mempool.space/api/address/{}/txs/chain/{}", address, txid);
                        ic_cdk::println!("Trying alternative pagination: {}", alt_url);
                        
                        let alt_request = CanisterHttpRequestArgument {
                            url: alt_url,
                            method: HttpMethod::GET,
                            body: None,
                            max_response_bytes: Some(2_000_000),
                            transform: None,
                            headers: vec![],
                        };

                        match http_request(alt_request, cycles).await {
                            Ok((alt_response,)) => {
                                let alt_status: u64 = alt_response.status.0.to_u64().unwrap_or(0);
                                if alt_status == 404 {
                                    ic_cdk::println!("Reached end of pagination");
                                    break;
                                }
                                let json: Value = serde_json::from_slice(&alt_response.body)
                                    .map_err(|e| format!("Failed to parse alternative API response: {}", e))?;
                                
                                let txs_batch = parse_mempool_transactions(&json)?;
                                if txs_batch.is_empty() {
                                    break;
                                }
                                
                                let new_txids: HashSet<String> = txs_batch.iter().map(|tx: &MempoolTransaction| tx.txid.clone()).collect();
                                let existing_txids: HashSet<String> = all_transactions.iter().map(|tx: &MempoolTransaction| tx.txid.clone()).collect();
                                
                                if new_txids.is_subset(&existing_txids) {
                                    ic_cdk::println!("All transactions in batch are duplicates");
                                    break;
                                }
                                
                                let new_transactions: Vec<MempoolTransaction> = txs_batch
                                    .into_iter()
                                    .filter(|tx| !existing_txids.contains(&tx.txid))
                                    .collect();
                                
                                ic_cdk::println!("Page {}: Found {} new transactions", page, new_transactions.len());
                                
                                if !new_transactions.is_empty() {
                                    last_seen_txid = Some(new_transactions.last().unwrap().txid.clone());
                                    all_transactions.extend(new_transactions);
                                }
                            }
                            Err((code, msg)) => {
                                ic_cdk::println!("Alternative pagination failed: {:?} - {}", code, msg);
                                break;
                            }
                        }
                    } else {
                        ic_cdk::println!("404 error on first request - invalid address or no transactions");
                        break;
                    }
                } else if status_code >= 400 {
                    let error_message = String::from_utf8_lossy(&response.body);
                    return Err(format!("Mempool API Error ({}): {}", status_code, error_message));
                } else {
                    let json: Value = serde_json::from_slice(&response.body)
                        .map_err(|e| format!("Failed to parse mempool API response: {}", e))?;
                    
                    let txs_batch = parse_mempool_transactions(&json)?;
                    if txs_batch.is_empty() {
                        ic_cdk::println!("No more transactions found");
                        break;
                    }
                    
                    let new_txids: HashSet<String> = txs_batch.iter().map(|tx: &MempoolTransaction| tx.txid.clone()).collect();
                    let existing_txids: HashSet<String> = all_transactions.iter().map(|tx: &MempoolTransaction| tx.txid.clone()).collect();
                    
                    if new_txids.is_subset(&existing_txids) {
                        ic_cdk::println!("All transactions in batch are duplicates");
                        break;
                    }

                    // ✅ FIX: Check the length *before* consuming txs_batch
                    let batch_len = txs_batch.len();
                    
                    let new_transactions: Vec<MempoolTransaction> = txs_batch
                        .into_iter() // txs_batch is moved here
                        .filter(|tx| !existing_txids.contains(&tx.txid))
                        .collect();
                    
                    ic_cdk::println!("Page {}: Found {} new transactions", page, new_transactions.len());
                    
                    if !new_transactions.is_empty() {
                        last_seen_txid = Some(new_transactions.last().unwrap().txid.clone());
                        all_transactions.extend(new_transactions);
                    }
                    
                    // Now, use the saved length for the check
                    if batch_len < PAGE_SIZE {
                        ic_cdk::println!("Received partial page, might be at end");
                    }
                }
            }
            Err((code, msg)) => {
                if msg.contains("Http body exceeds size limit") {
                    ic_cdk::println!("Address history too large. Processed {} transactions", all_transactions.len());
                    break;
                }
                return Err(format!("Outbound call failed: {:?} - {}", code, msg));
            }
        }
        
        page += 1;
        if page > MAX_PAGES {
            ic_cdk::println!("Safety limit reached at page {}", page);
            break;
        }
    }

    ic_cdk::println!("Total transactions fetched: {}", all_transactions.len());
    Ok(all_transactions)
}

fn parse_mempool_transactions(json: &Value) -> Result<Vec<MempoolTransaction>, String> {
    let transactions_array = json.as_array()
        .ok_or("Expected array of transactions")?;
    
    let mut transactions = Vec::new();
    
    for tx_value in transactions_array {
        let tx = parse_single_mempool_transaction(tx_value)?;
        transactions.push(tx);
    }
    
    Ok(transactions)
}

fn parse_single_mempool_transaction(tx_value: &Value) -> Result<MempoolTransaction, String> {
    let txid = tx_value["txid"].as_str()
        .ok_or("Missing txid")?
        .to_string();
    
    let version = tx_value["version"].as_u64().unwrap_or(1) as u32;
    let locktime = tx_value["locktime"].as_u64().unwrap_or(0) as u32;
    let size = tx_value["size"].as_u64().unwrap_or(0) as u32;
    let weight = tx_value["weight"].as_u64().unwrap_or(0) as u32;
    let fee = tx_value["fee"].as_u64().unwrap_or(0);
    
    let mut vin = Vec::new();
    if let Some(inputs_array) = tx_value["vin"].as_array() {
        for input_value in inputs_array {
            let input = parse_mempool_vin(input_value)?;
            vin.push(input);
        }
    }
    
    let mut vout = Vec::new();
    if let Some(outputs_array) = tx_value["vout"].as_array() {
        for output_value in outputs_array {
            let output = parse_mempool_vout(output_value)?;
            vout.push(output);
        }
    }
    
    let status = if let Some(status_value) = tx_value.get("status") {
        Some(parse_mempool_status(status_value)?)
    } else {
        None
    };
    
    Ok(MempoolTransaction {
        txid, version, locktime, size, weight, fee, vin, vout, status,
    })
}

fn parse_mempool_vin(input_value: &Value) -> Result<MempoolVin, String> {
    let txid = input_value["txid"].as_str().map(|s| s.to_string());
    let vout = input_value["vout"].as_u64().map(|v| v as u32);
    let scriptsig = input_value["scriptsig"].as_str().map(|s| s.to_string());
    let sequence = input_value["sequence"].as_u64().map(|s| s as u32);
    
    let witness = if let Some(witness_array) = input_value["witness"].as_array() {
        Some(witness_array.iter()
            .filter_map(|w| w.as_str().map(|s| s.to_string()))
            .collect())
    } else {
        None
    };
    
    let prevout = if let Some(prevout_value) = input_value.get("prevout") {
        Some(parse_mempool_prevout(prevout_value)?)
    } else {
        None
    };
    
    Ok(MempoolVin { txid, vout, prevout, scriptsig, witness, sequence })
}

fn parse_mempool_vout(output_value: &Value) -> Result<MempoolVout, String> {
    let scriptpubkey = output_value["scriptpubkey"].as_str().map(|s| s.to_string());
    let scriptpubkey_asm = output_value["scriptpubkey_asm"].as_str().map(|s| s.to_string());
    let scriptpubkey_type = output_value["scriptpubkey_type"].as_str().map(|s| s.to_string());
    let scriptpubkey_address = output_value["scriptpubkey_address"].as_str().map(|s| s.to_string());
    let value = output_value["value"].as_u64().unwrap_or(0);
    
    Ok(MempoolVout {
        scriptpubkey, scriptpubkey_asm, scriptpubkey_type, scriptpubkey_address, value,
    })
}

fn parse_mempool_prevout(prevout_value: &Value) -> Result<MempoolPrevout, String> {
    let scriptpubkey = prevout_value["scriptpubkey"].as_str().map(|s| s.to_string());
    let scriptpubkey_asm = prevout_value["scriptpubkey_asm"].as_str().map(|s| s.to_string());
    let scriptpubkey_type = prevout_value["scriptpubkey_type"].as_str().map(|s| s.to_string());
    let scriptpubkey_address = prevout_value["scriptpubkey_address"].as_str().map(|s| s.to_string());
    let value = prevout_value["value"].as_u64().unwrap_or(0);
    
    Ok(MempoolPrevout {
        scriptpubkey, scriptpubkey_asm, scriptpubkey_type, scriptpubkey_address, value,
    })
}

fn parse_mempool_status(status_value: &Value) -> Result<MempoolStatus, String> {
    let confirmed = status_value["confirmed"].as_bool().unwrap_or(false);
    let block_height = status_value["block_height"].as_u64();
    let block_hash = status_value["block_hash"].as_str().map(|s| s.to_string());
    let block_time = status_value["block_time"].as_u64();
    
    Ok(MempoolStatus { confirmed, block_height, block_hash, block_time })
}

fn convert_mempool_to_blockchain_format(mempool_txs: &[MempoolTransaction], _target_address: &str) -> Result<Vec<Value>, String> {
    let mut blockchain_txs = Vec::new();
    
    for mempool_tx in mempool_txs {
        let mut blockchain_tx = serde_json::json!({
            "hash": mempool_tx.txid,
            "ver": mempool_tx.version,
            "vin_sz": mempool_tx.vin.len(),
            "vout_sz": mempool_tx.vout.len(),
            "size": mempool_tx.size,
            "weight": mempool_tx.weight,
            "fee": mempool_tx.fee,
            "lock_time": mempool_tx.locktime,
            "double_spend": false,
            "inputs": [],
            "out": []
        });
        
        if let Some(ref status) = mempool_tx.status {
            if status.confirmed {
                blockchain_tx["time"] = serde_json::Value::Number(
                    status.block_time.unwrap_or(0).into()
                );
                blockchain_tx["block_height"] = serde_json::Value::Number(
                    status.block_height.unwrap_or(0).into()
                );
                blockchain_tx["block_index"] = serde_json::Value::Number(
                    status.block_height.unwrap_or(0).into()
                );
            } else {
                blockchain_tx["time"] = serde_json::Value::Number(0.into());
                blockchain_tx["block_height"] = serde_json::Value::Number(0.into());
                blockchain_tx["block_index"] = serde_json::Value::Number(0.into());
            }
        }
        
        let mut inputs = Vec::new();
        for vin in &mempool_tx.vin {
            if let Some(ref prevout) = vin.prevout {
                let input = serde_json::json!({
                    "sequence": vin.sequence.unwrap_or(0),
                    "witness": vin.witness.as_ref().unwrap_or(&vec![]),
                    "script": vin.scriptsig.as_ref().unwrap_or(&String::new()),
                    "prev_out": {
                        "type": 0,
                        "spent": true,
                        "value": prevout.value,
                        "script": prevout.scriptpubkey.as_ref().unwrap_or(&String::new()),
                        "addr": prevout.scriptpubkey_address.as_ref().unwrap_or(&String::new())
                    }
                });
                inputs.push(input);
            }
        }
        blockchain_tx["inputs"] = serde_json::Value::Array(inputs);
        
        let mut outputs = Vec::new();
        for (i, vout) in mempool_tx.vout.iter().enumerate() {
            let output = serde_json::json!({
                "type": 0,
                "spent": false,
                "value": vout.value,
                "n": i,
                "script": vout.scriptpubkey.as_ref().unwrap_or(&String::new()),
                "addr": vout.scriptpubkey_address.as_ref().unwrap_or(&String::new())
            });
            outputs.push(output);
        }
        blockchain_tx["out"] = serde_json::Value::Array(outputs);
        
        blockchain_txs.push(blockchain_tx);
    }
    
    Ok(blockchain_txs)
}

fn filter_confirmed_transactions(transactions: &[Value]) -> Vec<Value> {
    transactions.iter()
        .filter(|tx| tx["block_height"].as_u64().unwrap_or(0) > 0)
        .cloned()
        .collect()
}

fn extract_features(transactions: &[Value], target_address: &str) -> Result<Vec<f32>, String> {
    let confirmed_transactions = filter_confirmed_transactions(transactions);
    
    let mut features = HashMap::new();
    
    let mut block_heights_u64 = Vec::new();
    let mut sent_blocks_u64 = Vec::new();
    let mut received_blocks_u64 = Vec::new();

    let mut sent_values_btc = Vec::new();
    let mut received_values_btc = Vec::new();
    let mut all_transaction_values_btc = Vec::new();
    let mut all_fees_btc = Vec::new();
    let mut address_interaction_counts: HashMap<String, u32> = HashMap::new();
    
    const SATOSHI_TO_BTC: f64 = 100_000_000.0;

    for tx in &confirmed_transactions {
        let tx_block = tx["block_height"].as_u64().unwrap_or(0);
        let tx_fee_satoshi = tx["fee"].as_u64().unwrap_or(0) as f64;
        
        if tx_block > 0 {
            block_heights_u64.push(tx_block);
        }
        all_fees_btc.push(tx_fee_satoshi / SATOSHI_TO_BTC);
        
        let mut is_sender = false;
        let mut total_sent_satoshi = 0.0;
        if let Some(inputs) = tx["inputs"].as_array() {
            for input in inputs {
                if let Some(prev_out) = input.get("prev_out") {
                    if prev_out["addr"].as_str() == Some(target_address) {
                        is_sender = true;
                        total_sent_satoshi += prev_out["value"].as_u64().unwrap_or(0) as f64;
                    }
                }
            }
        }
        
        let mut total_received_satoshi = 0.0;
        if let Some(outputs) = tx["out"].as_array() {
            for output in outputs {
                if output["addr"].as_str() == Some(target_address) {
                    total_received_satoshi += output["value"].as_u64().unwrap_or(0) as f64;
                }
            }
        }

        if is_sender {
            let sent_btc = total_sent_satoshi / SATOSHI_TO_BTC;
            sent_values_btc.push(sent_btc);
            all_transaction_values_btc.push(sent_btc);
            if tx_block > 0 {
                sent_blocks_u64.push(tx_block);
            }
        }

        if total_received_satoshi > 0.0 {
            let received_btc = total_received_satoshi / SATOSHI_TO_BTC;
            received_values_btc.push(received_btc);
            all_transaction_values_btc.push(received_btc);
            if tx_block > 0 {
                received_blocks_u64.push(tx_block);
            }
        }
        
        extract_counterparties(tx, target_address, &mut address_interaction_counts);
    }
    
    populate_base_features(
        &mut features,
        confirmed_transactions.len(),
        &sent_values_btc,
        &received_values_btc,
        &all_transaction_values_btc,
        &all_fees_btc,
        &block_heights_u64,
        &sent_blocks_u64,
        &received_blocks_u64,
        &address_interaction_counts,
    );
    
    create_enhanced_pattern_features(&mut features);
    
    let feature_vector: Vec<f32> = get_feature_names()
        .into_iter()
        .map(|name| *features.get(&name).unwrap_or(&0.0) as f32)
        .collect();
    
    Ok(feature_vector)
}

fn populate_base_features(
    features: &mut HashMap<String, f64>,
    total_tx_count: usize,
    sent_values_btc: &[f64],
    received_values_btc: &[f64],
    all_values_btc: &[f64],
    all_fees_btc: &[f64],
    block_heights_u64: &[u64], 
    sent_blocks_u64: &[u64],
    received_blocks_u64: &[u64],
    address_interaction_counts: &HashMap<String, u32>,
) {
    features.insert("num_txs_as_sender".to_string(), sent_values_btc.len() as f64);
    features.insert("num_txs_as_receiver".to_string(), received_values_btc.len() as f64);
    features.insert("total_txs".to_string(), total_tx_count as f64);
    
    if !block_heights_u64.is_empty() {
        let min_block = *block_heights_u64.iter().min().unwrap_or(&0) as f64;
        let max_block = *block_heights_u64.iter().max().unwrap_or(&0) as f64;
        features.insert("first_block_appeared_in".to_string(), min_block);
        features.insert("last_block_appeared_in".to_string(), max_block);
        features.insert("lifetime_in_blocks".to_string(), max_block - min_block);
        
        let unique_blocks: HashSet<_> = block_heights_u64.iter().collect();
        features.insert("num_timesteps_appeared_in".to_string(), unique_blocks.len() as f64);
    }

    if !sent_blocks_u64.is_empty() {
        features.insert("first_sent_block".to_string(), *sent_blocks_u64.iter().min().unwrap() as f64);
    }
   if !received_blocks_u64.is_empty() {
        features.insert("first_received_block".to_string(), *received_blocks_u64.iter().min().unwrap() as f64);
    }

    insert_stats(features, "btc_transacted", all_values_btc);
    insert_stats(features, "btc_sent", sent_values_btc);
    insert_stats(features, "btc_received", received_values_btc);
    insert_stats(features, "fees", all_fees_btc);
    
    let fee_shares: Vec<f64> = all_fees_btc.iter().zip(all_values_btc.iter())
        .filter_map(|(fee, value)| if *value > 0.0 { Some((fee / value) * 100.0) } else { None })
        .collect();
    insert_stats(features, "fees_as_share", &fee_shares);
    
    let block_heights_f64: Vec<f64> = block_heights_u64.iter().map(|&x| x as f64).collect();
    let sent_blocks_f64: Vec<f64> = sent_blocks_u64.iter().map(|&x| x as f64).collect();
    let received_blocks_f64: Vec<f64> = received_blocks_u64.iter().map(|&x| x as f64).collect();

    insert_stats(features, "blocks_btwn_txs", &calculate_block_intervals(&block_heights_f64));
    insert_stats(features, "blocks_btwn_input_txs", &calculate_block_intervals(&sent_blocks_f64));
    insert_stats(features, "blocks_btwn_output_txs", &calculate_block_intervals(&received_blocks_f64));

    let interaction_counts_vec: Vec<f64> = address_interaction_counts.values().map(|&v| v as f64).collect();
    insert_stats(features, "transacted_w_address", &interaction_counts_vec);
    let multiple_interactions = interaction_counts_vec.iter().filter(|&&count| count > 1.0).count() as f64;
    features.insert("num_addr_transacted_multiple".to_string(), multiple_interactions);

    let unique_blocks: HashSet<_> = block_heights_u64.iter().collect();
    features.insert("Time step".to_string(), unique_blocks.len() as f64);
}


fn create_enhanced_pattern_features(features: &mut HashMap<String, f64>) {
    let get = |k: &str| features.get(k).copied().unwrap_or(0.0);
    let get_div = |k: &str| { let v = get(k); if v == 0.0 { 1.0 } else { v } };

    let transacted_w_address_total = get("transacted_w_address_total");
    let total_txs = get("total_txs");
    let lifetime_in_blocks = get_div("lifetime_in_blocks");
    let btc_transacted_max = get("btc_transacted_max");
    let btc_transacted_min = get("btc_transacted_min");
    let btc_transacted_mean = get_div("btc_transacted_mean");
    let btc_sent_total = get("btc_sent_total");
    let btc_received_total = get("btc_received_total");
    let btc_transacted_total = get_div("btc_transacted_total");
    let last_block_appeared_in = get("last_block_appeared_in");
    let first_block_appeared_in = get("first_block_appeared_in");
    let num_timesteps_appeared_in = get_div("num_timesteps_appeared_in");
    let fees_total = get("fees_total");
    let num_addr_transacted_multiple = get("num_addr_transacted_multiple");

    let partner_ratio = transacted_w_address_total / (total_txs + 1e-8);
    let activity_density = total_txs / (lifetime_in_blocks + 1e-8);
    let tx_variance = (btc_transacted_max - btc_transacted_min) / (btc_transacted_mean + 1e-8);
    let flow_imbalance = (btc_sent_total - btc_received_total) / (btc_transacted_total + 1e-8);
    let temporal_spread = (last_block_appeared_in - first_block_appeared_in) / (num_timesteps_appeared_in + 1e-8);
    let fee_percentile = fees_total / (btc_transacted_total + 1e-8);
    let interaction_intensity = num_addr_transacted_multiple / (transacted_w_address_total + 1e-8);
    let value_per_tx = get("btc_transacted_total") / (total_txs + 1e-8);
    let burst_activity = total_txs * activity_density;
    let mixing_intensity = partner_ratio * interaction_intensity;
    
    features.insert("partner_transaction_ratio".to_string(), partner_ratio);
    features.insert("activity_density".to_string(), activity_density);
    features.insert("transaction_size_variance".to_string(), tx_variance);
    features.insert("flow_imbalance".to_string(), flow_imbalance);
    features.insert("temporal_spread".to_string(), temporal_spread);
    features.insert("fee_percentile".to_string(), fee_percentile);
    features.insert("interaction_intensity".to_string(), interaction_intensity);
    features.insert("value_per_transaction".to_string(), value_per_tx);
    features.insert("burst_activity".to_string(), burst_activity);
    features.insert("mixing_intensity".to_string(), mixing_intensity);
}

fn predict_ransomware(
    mut features: Vec<f32>,
    address: &str,
    transaction_count: u32,
) -> Result<RansomwareResult, String> {
    // Read metadata from the global state
    STATE.with(|s| {
        let state = s.borrow();
        let metadata = &state.btc_metadata;

        for (i, feature) in features.iter_mut().enumerate() {
            if let (Some(mean), Some(scale)) = (metadata.scaler_mean.get(i), metadata.scaler_scale.get(i)) {
                if *scale > 1e-9 { *feature = ((*feature as f64 - mean) / scale) as f32; }
            }
        }
        
        MODEL.with(|model_ref| {
            let model_cell = model_ref.borrow();
            let model = model_cell.as_ref().ok_or("BTC Model not loaded")?;
            
            let input_tensor: Tensor = tract_ndarray::Array2::from_shape_vec((1, features.len()), features)
                .map_err(|e| format!("Failed to create input array: {}", e))?.into();

            let result = model.run(tvec!(input_tensor.into())).map_err(|e| format!("Inference failed: {}", e))?;
            
            if result.len() < 2 { return Err(format!("Model returned {} outputs, but expected 2", result.len())); }

            let probabilities_view = result[1].to_array_view::<f32>().map_err(|e| format!("Failed to extract probabilities: {}", e))?;
            
            let ransomware_probability = probabilities_view[[0, 1]] as f64;
            let is_ransomware = ransomware_probability >= metadata.threshold;
            
            let confidence = if is_ransomware {
                (ransomware_probability - metadata.threshold) / (1.0f64 - metadata.threshold).max(1e-9f64)
            } else {
                (metadata.threshold - ransomware_probability) / metadata.threshold.max(1e-9f64)
            };
            
            let confidence_level = if confidence > 0.66 { "HIGH" } else if confidence > 0.33 { "MEDIUM" } else { "LOW" };
            
            Ok(RansomwareResult {
                address: address.to_string(),
                chain_type: "Bitcoin".to_string(),
                ransomware_probability,
                is_ransomware,
                confidence_level: confidence_level.to_string(),
                threshold_used: metadata.threshold,
                transactions_analyzed: transaction_count,
                confidence,
                data_source: "mempool.space".to_string(),
            })
        })
    })
}

// --- HELPER FUNCTIONS ---

fn extract_counterparties(tx: &Value, target_address: &str, interaction_counts: &mut HashMap<String, u32>) {
    if let Some(inputs) = tx["inputs"].as_array() {
        for input in inputs {
            if let Some(addr) = input.get("prev_out").and_then(|po| po["addr"].as_str()) {
                if addr != target_address {
                    *interaction_counts.entry(addr.to_string()).or_insert(0) += 1;
                }
            }
        }
    }
    if let Some(outputs) = tx["out"].as_array() {
        for output in outputs {
            if let Some(addr) = output["addr"].as_str() {
                if addr != target_address {
                    *interaction_counts.entry(addr.to_string()).or_insert(0) += 1;
                }
            }
        }
    }
}

fn calculate_block_intervals(block_heights: &[f64]) -> Vec<f64> {
    if block_heights.len() < 2 { return vec![]; }
    let mut sorted_blocks = block_heights.to_vec();
    sorted_blocks.sort_by(|a, b| a.partial_cmp(b).unwrap());
    sorted_blocks.windows(2).map(|w| w[1] - w[0]).collect()
}

fn insert_stats(features: &mut HashMap<String, f64>, prefix: &str, values: &[f64]) {
    if values.is_empty() { return; }
    
    let sum: f64 = values.iter().sum();
    features.insert(format!("{}_total", prefix), sum);
    features.insert(format!("{}_mean", prefix), sum / values.len() as f64);
    
    features.insert(format!("{}_min", prefix), values.iter().fold(f64::INFINITY, |a, &b| a.min(b)));
    features.insert(format!("{}_max", prefix), values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)));

    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = sorted_values.len() / 2;
    let median = if values.len() % 2 == 0 {
        (sorted_values[mid - 1] + sorted_values[mid]) / 2.0
    } else {
        sorted_values[mid]
    };
    features.insert(format!("{}_median", prefix), median);
}

fn get_feature_names() -> Vec<String> {
    vec![
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
        "value_per_transaction", "burst_activity", "mixing_intensity",
    ].into_iter().map(String::from).collect()
}

ic_cdk::export_candid!();