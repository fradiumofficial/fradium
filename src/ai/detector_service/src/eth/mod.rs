// src/eth/mod.rs
use crate::shared_models::RansomwareResult;
use std::cell::RefCell;

// --- Modules internal to ETH ---
pub mod config;
pub mod data_extractor;
pub mod feature_calculator;
pub mod models;
pub mod prediction;
pub mod price_converter;

// State specific to the ETH analyzer
thread_local! {
    static METADATA: RefCell<Option<models::ModelMetadata>> = RefCell::new(None);
}

pub fn init() {
    ic_cdk::println!("[init_eth] Initializing Ethereum analyzer state...");
    let scaler_data: models::ScalerParams = serde_json::from_str(config::ETH_SCALER_PARAMS_JSON)
        .expect("FATAL: Could not parse ETH_SCALER_PARAMS_JSON");
    let model_meta: models::ModelMeta = serde_json::from_str(config::ETH_MODEL_METADATA_JSON)
        .expect("FATAL: Could not parse ETH_MODEL_METADATA_JSON");

    METADATA.with(|m| {
        *m.borrow_mut() = Some(models::ModelMetadata {
            threshold: model_meta.deployment_threshold,
            feature_names: model_meta.feature_names,
            scaler_mean: scaler_data.mean,
            scaler_scale: scaler_data.scale,
        });
    });

    if let Err(e) = prediction::load_model(config::ETH_MODEL_BYTES) {
        ic_cdk::trap(&format!("[init_eth] FATAL: Could not load ONNX model: {}", e));
    }
    ic_cdk::println!("[init_eth] ✅ ETH state initialized.");
}

pub async fn analyze_eth_address(address: &str) -> Result<RansomwareResult, String> {
    models::logs::drain_logs();
    ic_cdk::println!("--- Processing ETH Address: {} ---", address);
    let address_lowercase = address.to_lowercase();

    let transactions = data_extractor::get_all_transactions(&address_lowercase).await?;
    let tx_count = transactions.len() as u32;

    if transactions.is_empty() {
        return Err("No transactions found for this address.".to_string());
    }
    ic_cdk::println!("✅ Found {} combined transactions.", tx_count);

    let features = feature_calculator::calculate_features(&address_lowercase, transactions).await?;
    ic_cdk::println!("✅ Features calculated successfully.");

    METADATA.with(|metadata_ref| {
        let metadata_cell = metadata_ref.borrow();
        let metadata = metadata_cell.as_ref().ok_or("ETH Metadata not initialized")?;

        prediction::predict_from_features(&features, metadata, address, tx_count)
    })
}