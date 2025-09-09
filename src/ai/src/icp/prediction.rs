// src/ai/src/icp/prediction.rs

use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use serde::{Deserialize as SerdeDeserialize, Serialize};
use sha2::{Digest, Sha224};
use std::cell::RefCell;
use std::collections::{BTreeMap, HashMap};
use super::models::{PriceData, TokenConfig, TransactionData};
use tract_onnx::prelude::*;
use tract_core::ndarray;
use super::config;
use super::models::{UserFeatures, PredictionResult};

#[derive(Debug, Clone, Deserialize)]
pub struct ScalerParams {
    #[serde(rename = "mean")]
    pub means: Vec<f32>,
    #[serde(rename = "scale")]
    pub stds: Vec<f32>,
}

type Model = SimplePlan<TypedFact, Box<dyn TypedOp>, tract_onnx::prelude::Graph<TypedFact, Box<dyn TypedOp>>>;

thread_local! {
    static MODEL: RefCell<Option<Model>> = RefCell::new(None);
    static SCALER: RefCell<Option<ScalerParams>> = RefCell::new(None);
    static FEATURE_NAMES: RefCell<Vec<String>> = RefCell::new(Vec::new());
}

pub fn load_model() -> Result<(), String> {
    let metadata: config::IcpModelMetadata = serde_json::from_str(config::MODEL_METADATA_JSON)
        .map_err(|e| format!("Failed to parse model metadata: {}", e))?;

    FEATURE_NAMES.with(|f| *f.borrow_mut() = metadata.feature_names);

    // FIX: Update println! to use all metadata fields, silencing the warning.
    ic_cdk::println!(
        "ICP Model Metadata Loaded: v={}, type={}, features={}, classes={:?}, auc={:.4}",
        metadata.model_version,
        metadata.model_type,
        metadata.num_features,
        metadata.class_names,
        metadata.auc_score
    );

    let scaler_params: ScalerParams = serde_json::from_str(config::SCALER_PARAMS_JSON)
        .map_err(|e| format!("Failed to parse scaler params: {}", e))?;
    SCALER.with(|s| *s.borrow_mut() = Some(scaler_params));

    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(config::MODEL_BYTES))
        .map_err(|e| format!("Failed to load ONNX model: {}", e))?
        .into_optimized()
        .map_err(|e| format!("Failed to optimize model: {}", e))?
        .into_runnable()
        .map_err(|e| format!("Failed to create runnable model: {}", e))?;
    MODEL.with(|m| *m.borrow_mut() = Some(model));
    
    ic_cdk::println!("ICP model and scaler loaded successfully.");
    Ok(())
}

fn apply_scaling(input: &[f32], scaler: &ScalerParams) -> Result<Vec<f32>, String> {
    if input.len() != scaler.means.len() || input.len() != scaler.stds.len() {
        return Err(format!("Input size {} doesn't match scaler size {}", input.len(), scaler.means.len()));
    }
    let scaled: Vec<f32> = input.iter().zip(&scaler.means).zip(&scaler.stds)
        .map(|((x, mean), std)| if *std != 0.0 { (x - mean) / std } else { *x - mean })
        .collect();
    Ok(scaled)
}

fn features_to_vector(features: &UserFeatures) -> Result<Vec<f32>, String> {
    Ok(vec![
        features.icp_balance as f32, features.ckbtc_balance as f32, features.cketh_balance as f32,
        features.ckusdc_balance as f32, features.num_tokens_held as f32, features.total_portfolio_value_usd as f32,
        features.portfolio_diversity_score as f32, features.total_transactions as f32, features.sent_transactions as f32,
        features.received_transactions as f32, features.unique_counterparties as f32, features.tokens_used as f32,
        if features.cross_token_user { 1.0 } else { 0.0 },
        features.total_value_sent_usd as f32, features.total_value_received_usd as f32, features.net_flow_usd as f32,
        features.avg_transaction_value_usd as f32, features.sent_amount_mean_usd as f32, features.received_amount_mean_usd as f32,
        features.transaction_value_std_usd as f32, features.tokens_actively_used as f32, features.primary_token_dominance as f32,
        features.transaction_span_days as f32, features.avg_time_between_txs_hours as f32, features.transaction_frequency_score as f32,
        features.send_receive_ratio as f32, features.value_sent_received_ratio_usd as f32, features.mint_to_transfer_ratio as f32,
        features.defi_activity_score as f32, features.round_number_transactions as f32, features.high_value_transaction_ratio as f32,
        features.microtransaction_ratio as f32, features.icp_transfer as f32,
        features.ckbtc_transfer as f32, features.ckbtc_mint as f32,
        features.cketh_transfer as f32, features.cketh_mint as f32,
        features.cketh_burn as f32, features.ckusdc_transfer as f32, features.ckusdc_mint as f32,
        features.ckusdc_burn as f32,
    ])
}

fn get_cluster_interpretation(cluster_id: i32) -> String {
    match cluster_id {
        0 => "Inactive/Low Activity User".to_string(),
        1 => "Regular User".to_string(),
        2 => "Active Multi-Token User".to_string(),
        3 => "High-Value Investor".to_string(),
        4 => "DeFi Power User".to_string(),
        _ => "Unknown Cluster".to_string(),
    }
}

// --- Prediction Logic ---
pub fn predict(features: &UserFeatures) -> Result<PredictionResult, String> {
    MODEL.with(|model_ref| {
        let model = model_ref.borrow();
        let model = model.as_ref().ok_or_else(|| "Model not loaded".to_string())?;

        let input_vector = features_to_vector(features)?;
        
        let scaled_input = SCALER.with(|scaler_ref| {
            let scaler = scaler_ref.borrow();
            let scaler = scaler.as_ref().ok_or_else(|| "Scaler not loaded".to_string())?;
            apply_scaling(&input_vector, scaler)
        })?;

        let input_array = ndarray::Array2::from_shape_vec((1, scaled_input.len()), scaled_input)
            .map_err(|e| format!("Failed to create input tensor: {}", e))?;
            
        let input_tensor: Tensor = input_array.into();

        let result = model.run(tvec!(input_tensor.into()))
            .map_err(|e| format!("Inference failed: {}", e))?;

        // The scikit-learn converter outputs probabilities in the second tensor (index 1).
        let probabilities_tensor = result[1].to_array_view::<f32>()
             .map_err(|e| format!("Failed to extract probabilities tensor: {}", e))?;
        let probabilities: Vec<f32> = probabilities_tensor.iter().cloned().collect();
        
        // --- FINAL FIX ---
        // Instead of reading the label from result[0] which has a tricky data type,
        // we derive the predicted cluster by finding the index of the highest probability.
        // This is more robust and bypasses the type error completely.
        let cluster_id = probabilities
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(index, _)| index as i32)
            .unwrap_or(-1); // Default to -1 if something goes wrong
        
        let confidence = probabilities.iter().cloned().fold(0.0, f32::max);
        
        // Your Python script maps 'illicit' to 0 and 'licit' to 1.
        let interpretation = if cluster_id == 0 { "illicit".to_string() } else { "licit".to_string() };

        Ok(PredictionResult {
            cluster_id,
            probabilities,
            confidence,
            interpretation,
        })
    })
}