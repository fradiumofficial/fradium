// src/models.rs

use candid::CandidType;
use serde::Deserialize;
use std::collections::HashMap;
use std::cell::RefCell;

pub mod logs {
    use super::*;
    thread_local! {
        static LOGS: RefCell<Vec<String>> = RefCell::new(Vec::new());
    }
    pub fn add_log(message: String) {
        ic_cdk::println!("{}", &message);
        LOGS.with(|logs| logs.borrow_mut().push(message));
    }
    pub fn drain_logs() -> Vec<String> {
        LOGS.with(|logs| logs.borrow_mut().drain(..).collect())
    }
}

#[allow(dead_code)]
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EtherscanTx {
    pub block_number: String,
    pub time_stamp: String,
    pub hash: String,
    #[serde(default)]
    pub from: String,
    #[serde(default)]
    pub to: String,
    #[serde(default)]
    pub value: String,
    #[serde(default)]
    pub contract_address: String,
    #[serde(default)]
    pub gas_used: String,
    #[serde(default)]
    pub gas_price: String,
    #[serde(default, rename = "tokenSymbol")]
    pub token_symbol: String,
    #[serde(default, rename = "tokenDecimal")]
    pub token_decimal: String,
    #[serde(skip)]
    pub tx_type: TxType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TxType {
    ETH,
    ERC20,
}

impl Default for TxType {
    fn default() -> Self {
        TxType::ETH
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct MoralisTokenMetadata {
    pub symbol: String,
    pub decimals: String,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MoralisPrice {
    pub usd_price: f64,
}

#[derive(Deserialize, Debug, Clone)]
pub struct DefiLlamaResponse {
    pub coins: HashMap<String, DefiLlamaCoin>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct DefiLlamaCoin {
    pub price: f64,
}

#[derive(CandidType, Deserialize, Debug, Clone, PartialEq)]
pub struct TokenInfo {
    pub symbol: String,
    pub decimals: u32,
}

#[derive(Debug, Clone)]
pub struct SentTxInfo {
    pub value_btc: f64,
    pub fee_btc: f64,
    pub block: u64,
}

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