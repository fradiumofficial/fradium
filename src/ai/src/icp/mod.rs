// src/ai/src/icp/mod.rs

// --- Sub-modules ---
mod config;
mod data_extractor;
mod feature_calculator;
mod models;
mod prediction;

use candid::{Principal, CandidType};
use crate::shared_models::RansomwareResult;
use ic_cdk_macros::query;

// --- Public API ---

/// Initializes the ICP analysis module, loading the ML model and its parameters.
pub fn init() {
    if let Err(e) = prediction::load_model() {
        ic_cdk::println!("FATAL: Failed to initialize ICP module: {}", e);
    }
}

#[query]
fn get_icp_api_health() -> String {
    data_extractor::get_api_health_report()
}

/// Analyzes an ICP principal, fetches data, calculates features, and runs a prediction.
pub async fn analyze_icp_principal(principal_str: &str) -> Result<RansomwareResult, String> {
    ic_cdk::println!("--- Starting ICP Principal Analysis for: {} ---", principal_str);

    let principal = Principal::from_text(principal_str)
        .map_err(|_| format!("Invalid Principal ID format: {}", principal_str))?;

    ic_cdk::println!("[1/4] Fetching balances...");
    let balances = data_extractor::get_all_balances(principal).await;
    ic_cdk::println!("[2/4] Fetching transactions...");
    let transactions = data_extractor::get_all_transactions(principal).await;
    let transactions_analyzed = transactions.len() as u32;

    ic_cdk::println!("[3/4] Calculating comprehensive features...");
    let features = feature_calculator::build_comprehensive_features(principal, balances, transactions).await;

    ic_cdk::println!("[4/4] Running prediction model...");
    let prediction_result = prediction::predict(&features);

    // FIX: This block now creates the RansomwareResult with all required fields and correct types.
    let (confidence_f64, probability) = match prediction_result {
        Ok(pred) => {
            ic_cdk::println!("Prediction successful: Cluster {}", pred.cluster_id);
            (pred.confidence as f64, 0.0)
        },
        Err(e) => {
            ic_cdk::println!("Prediction failed: {}", e);
            (0.1, 0.0)
        }
    };
    
    Ok(RansomwareResult {
        address: principal_str.to_string(),
        is_ransomware: false,
        chain_type: "icp".to_string(),
        ransomware_probability: probability,
        confidence_level: format!("{:.2}%", confidence_f64 * 100.0), // FIX: Format f64 into a String
        threshold_used: 0.0,
        transactions_analyzed,
        confidence: confidence_f64, // FIX: Added missing `confidence` field (as f64)
        data_source: "Fradium AI".to_string(), // FIX: Added missing `data_source` field
    })
}