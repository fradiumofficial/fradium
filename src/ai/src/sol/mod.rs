// src/sol/mod.rs

// --- 1. Declare all sub-modules to make them public to the crate ---
pub mod config;
pub mod models;
pub mod prediction;

// --- 2. Bring key components into this module's scope for the main function ---
use crate::shared_models::RansomwareResult;
use prediction::SolanaPredictionService;
use std::collections::HashMap;


// New entrypoint: receive precomputed features from frontend and only run prediction
pub async fn analyze_solana_features(
    features: HashMap<String, f64>,
    address: &str,
    tx_count: u32,
) -> Result<RansomwareResult, String> {
    ic_cdk::println!("Initializing Solana Prediction Service (predict_from_features) for {}", address);

    let service = match SolanaPredictionService::new() {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to initialize Solana service: {:?}", e)),
    };

    match service.predict_from_feature_map(&features, address, tx_count).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Solana predict_from_features failed: {:?}", e)),
    }
}