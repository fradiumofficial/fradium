// src/eth/mod.rs
use crate::shared_models::RansomwareResult;
use crate::STATE;

// --- Modules internal to ETH ---
pub mod config;
pub mod models;
pub mod prediction;

pub fn init() -> models::ModelMetadata {
    ic_cdk::println!("[init_eth] Initializing Ethereum analyzer state...");
    let scaler_data: models::ScalerParams = serde_json::from_str(config::ETH_SCALER_PARAMS_JSON)
        .expect("FATAL: Could not parse ETH_SCALER_PARAMS_JSON");
    let model_meta: models::ModelMeta = serde_json::from_str(config::ETH_MODEL_METADATA_JSON)
        .expect("FATAL: Could not parse ETH_MODEL_METADATA_JSON");

    let metadata = models::ModelMetadata {
        threshold: model_meta.deployment_threshold,
        feature_names: model_meta.feature_names,
        scaler_mean: scaler_data.mean,
        scaler_scale: scaler_data.scale,
    };

    if let Err(e) = prediction::load_model(config::ETH_MODEL_BYTES) {
        ic_cdk::trap(&format!("[init_eth] FATAL: Could not load ONNX model: {}", e));
    }
    ic_cdk::println!("[init_eth] ✅ ETH state initialized.");
    
    metadata
}

pub fn analyze_eth_features(features: std::collections::HashMap<String, f64>, address: &str, tx_count: u32) -> Result<RansomwareResult, String> {
    STATE.with(|s| {
        let state = s.borrow();
        let metadata = &state.eth_metadata;
        prediction::predict_from_features(&features, metadata, address, tx_count)
    })
}