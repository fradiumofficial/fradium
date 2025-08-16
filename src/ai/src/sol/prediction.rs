// src/solana/prediction.rs

use crate::shared_models::{RansomwareResult, PredictionError};
use super::config::{MODEL_BYTES, SCALER_PARAMS_JSON, MODEL_METADATA_JSON};
use super::data_extractor::SolanaDataExtractor;
use super::feature_calculator::SolanaFeatureCalculator;
use super::models::{is_valid_solana_address, HeliusTransaction}; // Import HeliusTransaction
use tract_onnx::prelude::*;
use serde::{Deserialize, Serialize};

pub struct SolanaPredictionService {
    session: SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
    scaler_params: ScalerParams,
    model_metadata: ModelMetadata,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct ScalerParams {
    mean: Vec<f32>,
    scale: Vec<f32>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct ModelMetadata {
    feature_names: Vec<String>,
    num_features: usize,
    deployment_threshold: f32,
    class_names: Vec<String>,
    model_version: String,
    model_type: String,
    auc_score: f32,
    best_f1_score: f32,
    blockchain: String,
}


impl SolanaPredictionService {
    pub fn new() -> Result<Self, PredictionError> {
        ic_cdk::println!("Initializing Solana Prediction Service with tract-onnx...");

        let model = tract_onnx::onnx()
            .model_for_read(&mut std::io::Cursor::new(MODEL_BYTES))
            .map_err(|e| PredictionError::ModelInitialization(format!("Failed to parse ONNX model: {}", e)))?
            .into_optimized()
            .map_err(|e| PredictionError::ModelInitialization(format!("Failed to optimize model: {}", e)))?
            .into_runnable()
            .map_err(|e| PredictionError::ModelInitialization(format!("Failed to make model runnable: {}", e)))?;

        let scaler_params: ScalerParams = serde_json::from_str(SCALER_PARAMS_JSON)
            .map_err(|e| PredictionError::ModelInitialization(format!("Failed to parse scaler params: {}", e)))?;

        let model_metadata: ModelMetadata = serde_json::from_str(MODEL_METADATA_JSON)
            .map_err(|e| PredictionError::ModelInitialization(format!("Failed to parse model metadata: {}", e)))?;
        
        // Validations
        if model_metadata.feature_names.len() != scaler_params.mean.len() {
             return Err(PredictionError::ModelInitialization("Feature count and scaler length mismatch".to_string()));
        }

        Ok(Self {
            session: model,
            scaler_params,
            model_metadata,
        })
    }

    pub async fn predict_fraud(&mut self, address: &str) -> Result<RansomwareResult, PredictionError> {
        if !is_valid_solana_address(address) {
            return Err(PredictionError::DataExtraction(format!("Invalid Solana address format: {}", address)));
        }

        let (features, transactions_count) = self.extract_and_calculate_features(address).await?;

        if features.is_empty() {
            return Ok(RansomwareResult {
                address: address.to_string(),
                chain_type: "Solana".to_string(),
                is_ransomware: false,
                ransomware_probability: 0.0, // Clean, explicit zero
                confidence_level: "INCONCLUSIVE".to_string(), // Clear signal for frontend
                confidence: 0.0,
                threshold_used: self.model_metadata.deployment_threshold as f64,
                transactions_analyzed: transactions_count,
                data_source: "Helius".to_string(),
            });
        }

        self.predict_from_features(address, features, transactions_count).await
    }

    async fn extract_and_calculate_features(&mut self, address: &str) -> Result<(Vec<f32>, u32), PredictionError> {
        let mut data_extractor = SolanaDataExtractor::new();
        
        // Step 1: Get raw transactions
        let raw_transactions = data_extractor.get_all_transactions(address).await
            .map_err(|e| PredictionError::DataExtraction(e))?;
        
        // Step 2: Parse into flat list
        let parsed_transfers = data_extractor.parse_all_transactions(&raw_transactions, address).await;
        
        // Get the count of parsed transfers *before* checking if it's empty
        let transactions_count = parsed_transfers.len() as u32;

        if parsed_transfers.is_empty() {
            // This handles cases with no relevant transfers found
            ic_cdk::println!("[INFO] No relevant user transfers found. Returning inconclusive result.");
            return Ok((vec![], transactions_count)); // Return empty vec as signal
        }

        // Step 3: Calculate features
        let mut feature_calculator = SolanaFeatureCalculator::new(data_extractor.price_converter);
        let feature_map = feature_calculator.calculate_features(address, &parsed_transfers, &raw_transactions).await
            .ok_or_else(|| PredictionError::FeatureCalculation("Feature calculation returned None".to_string()))?;
        
        // Check for Infinity or NaN values before creating the final vector
        for (name, value) in &feature_map {
            if !value.is_finite() {
                ic_cdk::println!("[INFO] Inconclusive feature detected: {} = {}. Returning zero-confidence result.", name, value);
                // Return an empty vec as a signal to the calling function
                return Ok((vec![], transactions_count));
            }
        }
        
        // Step 4: Convert feature map to ordered vector
        let mut features = Vec::with_capacity(self.model_metadata.feature_names.len());
        for name in &self.model_metadata.feature_names {
            features.push(*feature_map.get(name).unwrap_or(&0.0) as f32);
        }
        
        Ok((features, transactions_count))
    }

    async fn predict_from_features(&self, address: &str, features: Vec<f32>, transactions_count: u32) -> Result<RansomwareResult, PredictionError> {
        let scaled_features = self.apply_scaling(&features)?;

        let input_tensor: Tensor = tract_ndarray::Array2::from_shape_vec((1, scaled_features.len()), scaled_features)
            .map_err(|e| PredictionError::ModelInference(format!("Failed to create input tensor: {}", e)))?
            .into();

        let result = self.session.run(tvec!(input_tensor.into()))
            .map_err(|e| PredictionError::ModelInference(format!("Model inference failed: {}", e)))?;
        
        let output_array = result[1].to_array_view::<f32>()
            .map_err(|e| PredictionError::ModelInference(format!("Failed to extract probabilities: {}", e)))?;
            
        let fraud_probability = output_array[[0, 1]];
        let clamped_probability = fraud_probability.clamp(0.0, 1.0);
        let is_fraud = clamped_probability >= self.model_metadata.deployment_threshold;
        let confidence_level = self.calculate_confidence(clamped_probability);

        // FIXED: Use correct field names from RansomwareResult struct
        Ok(RansomwareResult {
            address: address.to_string(),
            chain_type: "Solana".to_string(), // FIXED: blockchain -> chain_type
            is_ransomware: is_fraud,
            ransomware_probability: clamped_probability as f64, // FIXED: Add this field
            confidence_level,
            confidence: clamped_probability as f64, // FIXED: confidence_score -> confidence
            threshold_used: self.model_metadata.deployment_threshold as f64, // FIXED: f32 -> f64
            transactions_analyzed: transactions_count, // FIXED: Add this field
            data_source: "Helius".to_string(), // FIXED: Add this field
            // FIXED: Removed non-existent fields: model_version, features_used, additional_info
        })
    }

    fn apply_scaling(&self, features: &[f32]) -> Result<Vec<f32>, PredictionError> {
        if features.len() != self.scaler_params.mean.len() {
            return Err(PredictionError::FeatureCalculation("Feature length mismatch for scaling".to_string()));
        }
        let scaled = features.iter().zip(&self.scaler_params.mean).zip(&self.scaler_params.scale)
            .map(|((f, m), s)| if s.abs() < f32::EPSILON { 0.0 } else { (f - m) / s })
            .collect();
        Ok(scaled)
    }

    fn calculate_confidence(&self, probability: f32) -> String {
        match (probability * 100.0) as u8 {
            90..=100 => "VERY_HIGH".to_string(),
            70..=89 => "HIGH".to_string(),
            50..=69 => "MEDIUM".to_string(),
            30..=49 => "LOW".to_string(),
            _ => "VERY_LOW".to_string(),
        }
    }
}