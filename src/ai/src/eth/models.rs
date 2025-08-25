// src/models.rs

use candid::CandidType;
use serde::Deserialize;
use std::cell::RefCell;

pub mod logs {
    use super::*;
    thread_local! {
        static LOGS: RefCell<Vec<String>> = RefCell::new(Vec::new());
    }
    #[allow(dead_code)]
    pub fn add_log(message: String) {
        ic_cdk::println!("{}", &message);
        LOGS.with(|logs| logs.borrow_mut().push(message));
    }
    #[allow(dead_code)]
    pub fn drain_logs() -> Vec<String> {
        LOGS.with(|logs| logs.borrow_mut().drain(..).collect())
    }
}

// Remove external fetch-related structs; handled on frontend

#[derive(CandidType, Deserialize, Debug, Clone, PartialEq)]
pub struct TokenInfo {
    pub symbol: String,
    pub decimals: u32,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct SentTxInfo {
    pub value_btc: f64,
    pub fee_btc: f64,
    pub block: u64,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct ReceivedTxInfo {
    pub value_btc: f64,
    pub block: u64,
}

#[derive(Deserialize, Clone)]
pub struct ScalerParams {
    pub mean: Vec<f64>,
    pub scale: Vec<f64>,
}

#[derive(Deserialize, Clone)]
pub struct ModelMeta {
    pub feature_names: Vec<String>,
    pub deployment_threshold: f64,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ModelMetadata {
    pub threshold: f64,
    pub feature_names: Vec<String>,
    pub scaler_mean: Vec<f64>,
    pub scaler_scale: Vec<f64>,
}
impl Default for ModelMetadata {
    fn default() -> Self {
        Self {
            threshold: 0.0,
            feature_names: Vec::new(),
            scaler_mean: Vec::new(),
            scaler_scale: Vec::new(),
        }
    }
}