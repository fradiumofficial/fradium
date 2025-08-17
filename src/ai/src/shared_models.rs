// src/shared_models.rs
use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct RansomwareResult {
    pub address: String,
    pub chain_type: String,
    pub ransomware_probability: f64,
    pub is_ransomware: bool,
    pub confidence_level: String,
    pub threshold_used: f64,
    pub transactions_analyzed: u32,
    pub confidence: f64,
    pub data_source: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum PredictionError {
    ModelInitialization(String),
    DataExtraction(String),
    FeatureCalculation(String),
    ModelInference(String),
}