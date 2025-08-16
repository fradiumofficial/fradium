// src/sol/mod.rs

// --- 1. Declare all sub-modules to make them public to the crate ---
pub mod config;
pub mod data_extractor;
pub mod feature_calculator;
pub mod models;
pub mod prediction;
pub mod price_converter;

// --- 2. Bring key components into this module's scope for the main function ---
use crate::shared_models::RansomwareResult;
use prediction::SolanaPredictionService;

// --- 3. This is the single, public entry point for the Solana analyzer ---
pub async fn analyze_solana_address(address: &str) -> Result<RansomwareResult, String> {
    ic_cdk::println!("Initializing Solana Prediction Service for address: {}", address);

    // Create the service instance. This loads the model, scaler, etc.
    let mut service = match SolanaPredictionService::new() {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to initialize Solana service: {:?}", e)),
    };

    ic_cdk::println!("✅ Solana service initialized. Starting prediction...");
    
    // Call the main prediction method on the instance.
    match service.predict_fraud(address).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Solana analysis failed: {:?}", e)),
    }
}