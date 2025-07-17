use candid::{CandidType, Deserialize};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod,
};
use ic_cdk_macros::{init, query, update, pre_upgrade, post_upgrade};
use num_traits::ToPrimitive;
use serde_json::Value;
use std::collections::{HashMap, HashSet, BTreeMap};
use tract_onnx::prelude::*;
use getrandom::{register_custom_getrandom, Error};

thread_local! {
    static RANDOM_BYTES: std::cell::RefCell<Vec<u8>> = std::cell::RefCell::new(Vec::new());
}

fn custom_getrandom(dest: &mut [u8]) -> Result<(), Error> {
    RANDOM_BYTES.with(|bytes_ref| {
        let mut bytes = bytes_ref.borrow_mut();
        
        // If we don't have enough bytes, fetch more from IC
        if bytes.len() < dest.len() {
            // Fetch random bytes from IC (this is async, so we'll use a simple fallback)
            // For now, use a deterministic pattern - in production you'd want proper randomness
            let needed = dest.len() - bytes.len() + 32; // Get a bit extra
            let mut new_bytes = Vec::with_capacity(needed);
            
            // Simple deterministic pattern (you could improve this)
            for i in 0..needed {
                new_bytes.push(((i * 17 + 42) % 256) as u8);
            }
            
            bytes.extend_from_slice(&new_bytes);
        }
        
        // Copy the requested bytes
        dest.copy_from_slice(&bytes[..dest.len()]);
        bytes.drain(..dest.len());
        
        Ok(())
    })
}

register_custom_getrandom!(custom_getrandom);

// ✅ FIX 1: Corrected the relative path to the model file.
// The path should be relative to the crate root (the directory containing Cargo.toml), not the src/lib.rs file.
const MODEL_BYTES: &[u8] = include_bytes!("../../models/ransomware_model_mlp.onnx");


// PASTE THE CONTENT of your 'scaler_params.json' file here.
const SCALER_PARAMS_JSON: &str = r#"
{
  "mean": [
    23.866917022130608, 20.51713030049459, 13.056986482165575, 433987.8127062201,
    441605.4641134491, 7617.651407229014, 33.57411338109136, 246357.38694205767,
    322002.8539230293, 2.4967685096366443, 312.698154640546, 1.0048266167090838,
    38.10509427099042, 1.6786967664793395, 1.1881958665335985, 163.85450787753476,
    0.47761468968796783, 31.659370051608338, 1.0626535811634406, 0.7377056091659107,
    148.84364069685168, 0.31213415941379896, 24.81793387729793, 0.847331210219555,
    0.5700385369677051, 0.03846521576452082, 0.007925614565216083, 0.013648772727890106,
    0.010056621808632153, 0.009884921087530517, 2.717585814163103, 0.0001609080218186035,
    0.7097966554188141, 0.028367805266165693, 0.0006814742303560228, 7617.843214890708,
    814.8335918525624, 3302.641699151649, 1500.5642753577592, 1331.5515405705112,
    4372.212962018083, 412.0355872128226, 1546.431036594077, 575.2099877262602,
    510.6350218720874, 6768.029420168582, 1028.3402011007477, 3143.808420243416,
    1629.5789505507926, 1503.8944085012008, 5.435067453109374, 115.66633671449273,
    1.0765931247491343, 3.9376390391248446, 1.134810719912597, 1.0884101747726052,
    7.504992133604399, 65125756.44383864, 4.372327530817705, -0.19146707169803553,
    1357.31912292806, 16.15149900280813, 0.023995259948031453, 1.678583815311658,
    103857393.34728226, 0.08755515380629432
  ],
  "scale": [
    15.58922265204132, 120.95612512222478, 71.12101839917952, 32383.610531278337,
    32010.859709310833, 21086.02580065099, 169.04934214037047, 217970.65798999922,
    190085.65055866787, 5.901797083583269, 2041.063866405601, 19.340392048829298,
    373.16003786741715, 21.990812779775627, 20.551126313508103, 1095.7616558437514,
    128.2821855141343, 353.98937845610436, 128.48294092142265, 128.3313222823885,
    973.734371534469, 14.346053394960391, 284.9961260178103, 15.760245414472633,
    15.971822802157046, 0.21507815444592981, 0.021959458307430575, 0.0270444167839668,
    0.022870903706365475, 0.02292854948416408, 1430.4113568040618, 0.0013467117141041413,
    375.45485212069116, 14.899893487721414, 0.2292436054644116, 21086.621190928643,
    4212.033871412445, 8599.46497870955, 5106.357037872643, 5033.141024160028,
    17742.809839744496, 3598.2019335032996, 6498.6777011709755, 3893.5666441298326,
    3832.499498174684, 19789.925203534207, 4587.773047030696, 8515.295803493897,
    5510.870167544202, 5483.407276382322, 67.6686830297047, 791.2716754125461,
    0.4692094793687217, 16.43903704863582, 0.5271557900091806, 0.48818670810814985,
    35.13153049202667, 78386055.83863987, 28.985155161130727, 0.8234487518647802,
    3749.143841122248, 1384.6054616998626, 0.08073756379273574, 21.99731777703975,
    1213821479.3158133, 3.7841207060077893
  ]
}
"#;

// PASTE THE CONTENT of your 'model_metadata.json' file here.
const MODEL_METADATA_JSON: &str = r#"
{
    "feature_names": [
        "Time step", "num_txs_as_sender", "num_txs_as receiver", "first_block_appeared_in",
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
    ],
    "num_features": 66,
    "deployment_threshold": 0.6010423898696899,
    "class_names": [ "licit", "illicit" ],
    "model_version": "5.0_MLP_Bulletproof",
    "model_type": "MLPClassifier",
    "auc_score": 0.9904840431084402,
    "best_f1_score": 0.8740224203579359
}
"#;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct RansomwareResult {
    pub address: String,
    pub ransomware_probability: f64,
    pub is_ransomware: bool,
    pub confidence_level: String,
    pub threshold_used: f64,
    pub transactions_analyzed: u32,
    pub confidence: f64,
    pub data_source: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolTransaction {
    pub txid: String,
    pub version: u32,
    pub locktime: u32,
    pub size: u32,
    pub weight: u32,
    pub fee: u64,
    pub vin: Vec<MempoolVin>,
    pub vout: Vec<MempoolVout>,
    pub status: Option<MempoolStatus>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolVin {
    pub txid: Option<String>,
    pub vout: Option<u32>,
    pub prevout: Option<MempoolPrevout>,
    pub scriptsig: Option<String>,
    pub witness: Option<Vec<String>>,
    pub sequence: Option<u32>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolVout {
    pub scriptpubkey: Option<String>,
    pub scriptpubkey_asm: Option<String>,
    pub scriptpubkey_type: Option<String>,
    pub scriptpubkey_address: Option<String>,
    pub value: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolPrevout {
    pub scriptpubkey: Option<String>,
    pub scriptpubkey_asm: Option<String>,
    pub scriptpubkey_type: Option<String>,
    pub scriptpubkey_address: Option<String>,
    pub value: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolStatus {
    pub confirmed: bool,
    pub block_height: Option<u64>,
    pub block_hash: Option<String>,
    pub block_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ModelMetadata {
    pub threshold: f64,
    pub feature_names: Vec<String>,
    pub scaler_mean: Vec<f64>,
    pub scaler_scale: Vec<f64>,
}

// Structs for deserializing the JSON constants
#[derive(Deserialize)]
struct ScalerParams {
    mean: Vec<f64>,
    scale: Vec<f64>,
}

#[derive(Deserialize, CandidType)]
struct ModelMeta {
    deployment_threshold: f64,
    feature_names: Vec<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ModelChunk {
    pub chunk_id: u32,
    pub total_chunks: u32,
    pub data: Vec<u8>,
}

thread_local! {
    static MODEL: std::cell::RefCell<Option<SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>>> = std::cell::RefCell::new(None);
    static METADATA: std::cell::RefCell<Option<ModelMetadata>> = std::cell::RefCell::new(None);
    static MODEL_CHUNKS: std::cell::RefCell<BTreeMap<u32, Vec<u8>>> = std::cell::RefCell::new(BTreeMap::new());
    static EXPECTED_TOTAL_CHUNKS: std::cell::RefCell<Option<u32>> = std::cell::RefCell::new(None);
    static RAW_MODEL_BYTES: std::cell::RefCell<Vec<u8>> = std::cell::RefCell::new(Vec::new());
}

#[init]
fn init() {
    ic_cdk::println!("[init] Initializing canister state...");
    
    // Load metadata from constants
    let scaler_data: ScalerParams = serde_json::from_str(SCALER_PARAMS_JSON).expect("FATAL: Could not parse SCALER_PARAMS_JSON");
    let model_meta: ModelMeta = serde_json::from_str(MODEL_METADATA_JSON).expect("FATAL: Could not parse MODEL_METADATA_JSON");
    
    METADATA.with(|m| {
        *m.borrow_mut() = Some(ModelMetadata {
            threshold: model_meta.deployment_threshold,
            feature_names: model_meta.feature_names,
            scaler_mean: scaler_data.mean,
            scaler_scale: scaler_data.scale,
        });
    });
    ic_cdk::println!("[init] ✅ Metadata loaded successfully.");

    // Load model from embedded bytes
    ic_cdk::println!("[init] Loading embedded ONNX model...");
    let model_vec = MODEL_BYTES.to_vec();

    match load_model_from_bytes(model_vec.clone()) {
        Ok(msg) => {
            RAW_MODEL_BYTES.with(|b| *b.borrow_mut() = model_vec);
            ic_cdk::println!("[init] ✅ Embedded model loaded and raw bytes stored: {}", msg);
        }
        Err(e) => ic_cdk::trap(&format!("[init] FATAL: Could not load embedded ONNX model: {}", e)),
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("[pre_upgrade] Saving state to stable memory...");
    let metadata = METADATA.with(|m| m.borrow().clone());
    let model_bytes = RAW_MODEL_BYTES.with(|b| b.borrow().clone());
    
    match ic_cdk::storage::stable_save((metadata, model_bytes)) {
        Ok(_) => ic_cdk::println!("[pre_upgrade] ✅ State saved successfully."),
        Err(e) => ic_cdk::trap(&format!("[pre_upgrade] FATAL: Failed to save state: {:?}", e)),
    }
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("[post_upgrade] Restoring state from stable memory...");
    match ic_cdk::storage::stable_restore::<(Option<ModelMetadata>, Vec<u8>)>() {
        Ok((metadata_opt, model_bytes)) => {
            let model_bytes_len = model_bytes.len();
            
            match load_model_from_bytes(model_bytes.clone()) {
                Ok(_) => {
                    METADATA.with(|m| *m.borrow_mut() = metadata_opt);
                    RAW_MODEL_BYTES.with(|b| *b.borrow_mut() = model_bytes);
                    ic_cdk::println!("[post_upgrade] ✅ State restored successfully ({} model bytes).", model_bytes_len);
                }
                Err(e) => {
                    ic_cdk::trap(&format!("[post_upgrade] FATAL: Failed to reload model from restored bytes: {}", e));
                }
            }
        }
        Err(e) => {
            ic_cdk::trap(&format!("[post_upgrade] FATAL: Failed to restore state: {:?}", e));
        }
    }
}

#[update]
pub async fn upload_model_chunk(chunk: ModelChunk) -> Result<String, String> {
    MODEL_CHUNKS.with(|chunks_ref| {
        let mut chunks = chunks_ref.borrow_mut();
        
        if chunk.chunk_id >= chunk.total_chunks {
            return Err(format!("Invalid chunk_id: {} >= total_chunks: {}", 
                                chunk.chunk_id, chunk.total_chunks));
        }
        
        EXPECTED_TOTAL_CHUNKS.with(|total_ref| {
            let mut total = total_ref.borrow_mut();
            match *total {
                None => {
                    *total = Some(chunk.total_chunks);
                    ic_cdk::println!("Expecting {} total chunks", chunk.total_chunks);
                }
                Some(expected) => {
                    if expected != chunk.total_chunks {
                        return Err(format!(
                            "Inconsistent total_chunks: expected {}, got {}", 
                            expected, chunk.total_chunks
                        ));
                    }
                }
            }
            Ok(())
        })?;
        
        if chunks.contains_key(&chunk.chunk_id) {
            return Err(format!("Chunk {} already received", chunk.chunk_id));
        }
        
        let original_size = chunk.data.len();
        let binary_data = if chunk.data.len() > 0 && chunk.data.iter().all(|&b| 
            (b >= b'0' && b <= b'9') || (b >= b'a' && b <= b'f') || (b >= b'A' && b <= b'F')
        ) {
            ic_cdk::println!("Detected hex string, decoding...");
            let hex_string = String::from_utf8(chunk.data)
                .map_err(|e| format!("Invalid hex string: {}", e))?;
            hex::decode(hex_string)
                .map_err(|e| format!("Hex decode failed: {}", e))?
        } else {
            ic_cdk::println!("Data appears to be binary already");
            chunk.data
        };
        
        let chunk_size = binary_data.len();
        ic_cdk::println!("Storing chunk {}/{} ({} bytes, original: {} bytes)", 
                         chunk.chunk_id + 1, chunk.total_chunks, chunk_size, original_size);
        
        chunks.insert(chunk.chunk_id, binary_data);
        
        let current_count = chunks.len() as u32;
        
        if current_count == chunk.total_chunks {
            ic_cdk::println!("All {} chunks received, reconstructing model...", current_count);
            
            let mut model_bytes = Vec::new();
            let mut total_size = 0;
            
            for i in 0..chunk.total_chunks {
                if let Some(chunk_data) = chunks.get(&i) {
                    model_bytes.extend_from_slice(chunk_data);
                    total_size += chunk_data.len();
                } else {
                    return Err(format!("Missing chunk {} during reconstruction", i));
                }
            }
            
            ic_cdk::println!("Reconstructed model: {} bytes total", total_size);
            
            match load_complete_model(model_bytes) {
                Ok(msg) => {
                    chunks.clear();
                    EXPECTED_TOTAL_CHUNKS.with(|total_ref| {
                        *total_ref.borrow_mut() = None;
                    });
                    ic_cdk::println!("Model loaded successfully");
                    Ok(format!("All chunks received and model loaded successfully: {}", msg))
                }
                Err(e) => {
                    chunks.clear();
                    EXPECTED_TOTAL_CHUNKS.with(|total_ref| {
                        *total_ref.borrow_mut() = None;
                    });
                    ic_cdk::println!("Model loading failed: {}", e);
                    Err(e)
                }
            }
        } else {
            Ok(format!("Chunk {}/{} uploaded successfully ({})", 
                      current_count, chunk.total_chunks, chunk.chunk_id + 1))
        }
    })
}

fn load_complete_model(model_bytes: Vec<u8>) -> Result<String, String> {
    ic_cdk::println!("Loading ONNX model from {} bytes...", model_bytes.len());
    
    if model_bytes.len() >= 32 {
        let first_32: Vec<u8> = model_bytes.iter().take(32).cloned().collect();
        ic_cdk::println!("First 32 bytes: {:?}", first_32);
        
        let first_32_string = String::from_utf8_lossy(&first_32);
        ic_cdk::println!("First 32 bytes as string: {:?}", first_32_string);
        
        if first_32[0] == 0x08 {
            ic_cdk::println!("✅ Looks like valid protobuf start (0x08)");
        } else {
            ic_cdk::println!("⚠️  Doesn't start with expected protobuf marker (0x08), got: 0x{:02x}", first_32[0]);
        }
    }
    
    if model_bytes.len() >= 32 {
        let last_32: Vec<u8> = model_bytes.iter().rev().take(32).rev().cloned().collect();
        ic_cdk::println!("Last 32 bytes: {:?}", last_32);
    }
    
    ic_cdk::println!("Attempting to parse ONNX model with tract-onnx...");
    
    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(model_bytes))
        .map_err(|e| {
            ic_cdk::println!("❌ Failed to load ONNX model: {}", e);
            format!("Failed to load ONNX model: {}", e)
        })?
        .into_optimized()
        .map_err(|e| {
            ic_cdk::println!("❌ Failed to optimize model: {}", e);
            format!("Failed to optimize model: {}", e)
        })?
        .into_runnable()
        .map_err(|e| {
            ic_cdk::println!("❌ Failed to make model runnable: {}", e);
            format!("Failed to make model runnable: {}", e)
        })?;

    let input_facts = model.model().input_outlets().unwrap();
    if let Some(input_fact) = input_facts.get(0) {
        let input_info = model.model().outlet_fact(*input_fact).unwrap();
        ic_cdk::println!("✅ Model input shape: {:?}", input_info.shape);
    }

    MODEL.with(|m| {
        *m.borrow_mut() = Some(model);
    });
    
    ic_cdk::println!("✅ Model loaded and validated successfully!");
    Ok("Model loaded and validated successfully".to_string())
}

#[query]
pub fn get_upload_status() -> String {
    MODEL_CHUNKS.with(|chunks_ref| {
        let chunks = chunks_ref.borrow();
        EXPECTED_TOTAL_CHUNKS.with(|total_ref| {
            let total = total_ref.borrow();
            match *total {
                Some(expected) => {
                    let _received_chunks: Vec<u32> = chunks.keys().cloned().collect();
                    let missing_chunks: Vec<u32> = (0..expected)
                        .filter(|i| !chunks.contains_key(i))
                        .collect();
                    
                    if missing_chunks.is_empty() {
                        format!("✅ All chunks received: {}/{}", chunks.len(), expected)
                    } else {
                        format!("📦 Chunks received: {}/{} | Missing: {:?}", 
                                chunks.len(), expected, missing_chunks)
                    }
                }
                None => "No upload in progress".to_string()
            }
        })
    })
}

#[update]
pub async fn clear_upload_state() -> String {
    let chunks_cleared = MODEL_CHUNKS.with(|chunks_ref| {
        let mut chunks = chunks_ref.borrow_mut();
        let count = chunks.len();
        chunks.clear();
        count
    });
    
    EXPECTED_TOTAL_CHUNKS.with(|total_ref| {
        *total_ref.borrow_mut() = None;
    });
    
    format!("Upload state cleared ({} chunks removed)", chunks_cleared)
}

#[query]
pub fn get_memory_usage() -> String {
    let chunks_memory = MODEL_CHUNKS.with(|chunks_ref| {
        let chunks = chunks_ref.borrow();
        chunks.values().map(|chunk| chunk.len()).sum::<usize>()
    });
    
    let model_loaded = MODEL.with(|model_ref| {
        model_ref.borrow().is_some()
    });
    
    format!("Chunks in memory: {} bytes | Model loaded: {}", 
            chunks_memory, model_loaded)
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
#[update]
pub async fn analyze_address(address: String) -> Result<RansomwareResult, String> {
    let transactions = fetch_transactions_mempool(&address).await?;
    let converted_transactions = convert_mempool_to_blockchain_format(&transactions, &address)?;
    let feature_vector = extract_features(&converted_transactions, &address)?;
    let mut result = predict_ransomware(feature_vector, &address, transactions.len() as u32)?;
    // Now that we have the result, we can set the data source.
    result.data_source = "mempool.space".to_string();
    Ok(result)
}

async fn fetch_transactions_mempool(address: &str) -> Result<Vec<MempoolTransaction>, String> {
    let mut all_transactions = Vec::new();
    let mut last_seen_txid: Option<String> = None;
    let mut page = 1;
    const PAGE_SIZE: usize = 25;
    const MAX_PAGES: usize = 50;

    ic_cdk::println!("Fetching transactions from mempool.space for address: {}", address);

    loop {
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

        let cycles = 40_000_000_000u128;

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

// ✅ FIX 4: Silenced unused variable warning by prefixing with an underscore.
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
    METADATA.with(|metadata_ref| {
        let metadata = metadata_ref.borrow();
        let metadata = metadata.as_ref().ok_or("Model metadata not loaded")?;

        // Apply scaling
        for (i, feature) in features.iter_mut().enumerate() {
            if let (Some(mean), Some(scale)) = (metadata.scaler_mean.get(i), metadata.scaler_scale.get(i)) {
                if *scale > 1e-9 {
                    *feature = ((*feature as f64 - mean) / scale) as f32;
                }
            }
        }
        
        MODEL.with(|model_ref| {
            let model_cell = model_ref.borrow();
            let model = model_cell.as_ref().ok_or("Model not loaded")?;
            
            let input_tensor: Tensor = tract_ndarray::Array2::from_shape_vec((1, features.len()), features)
                .map_err(|e| format!("Failed to create input array: {}", e))?
                .into();

            let result = model.run(tvec!(input_tensor.into()))
                .map_err(|e| format!("Inference failed: {}", e))?;
            
            if result.len() < 2 {
                return Err(format!("Model returned {} outputs, but expected 2 (label, probabilities).", result.len()));
            }

            let probabilities_view = result[1].to_array_view::<f32>()
                 .map_err(|e| format!("Failed to extract probabilities from output[1]: {}", e))?;
            
            let ransomware_probability = probabilities_view[[0, 1]] as f64;
            
            let is_ransomware = ransomware_probability >= metadata.threshold;
            
            let confidence = if is_ransomware {
                (ransomware_probability - metadata.threshold) / (1.0 - metadata.threshold).max(1e-9)
            } else {
                (metadata.threshold - ransomware_probability) / metadata.threshold.max(1e-9)
            };
            
            let confidence_level = if confidence > 0.66 { "HIGH" } else if confidence > 0.33 { "MEDIUM" } else { "LOW" };
            
            // ✅ FIX 3: Added the missing `data_source` field to the initializer.
            // We use an empty string as a placeholder, which the calling function will overwrite.
            Ok(RansomwareResult {
                address: address.to_string(),
                ransomware_probability,
                is_ransomware,
                confidence_level: confidence_level.to_string(),
                threshold_used: metadata.threshold,
                transactions_analyzed: transaction_count,
                confidence,
                data_source: String::new(), // Placeholder value
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

#[query]
fn get_model_info() -> Result<String, String> {
    let metadata_status = METADATA.with(|metadata_ref| {
        metadata_ref.borrow().as_ref()
            .map(|meta| format!("Metadata: LOADED (Threshold: {:.4})", meta.threshold))
            .unwrap_or_else(|| "Metadata: NOT LOADED".to_string())
    });

    let model_status = MODEL.with(|model_ref| {
        model_ref.borrow().as_ref()
            .map(|_| "Model: LOADED".to_string())
            .unwrap_or_else(|| "Model: NOT LOADED".to_string())
    });

    Ok(format!("Status - {} | {}", metadata_status, model_status))
}

ic_cdk::export_candid!();