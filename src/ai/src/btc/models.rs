// src/btc/models.rs
use candid::{CandidType, Deserialize};

// All structs are now `pub` to be visible to other modules.
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolTransaction {
    pub txid: String,
    pub version: u32,
    pub locktime: u32,
    pub size: u32,
    pub weight: u32,
    pub fee: u64,
    pub vin: Vec<MempoolVin>,
    pub vout: Vec<MempoolVout>,
    pub status: Option<MempoolStatus>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolVin {
    pub txid: Option<String>,
    pub vout: Option<u32>,
    pub prevout: Option<MempoolPrevout>,
    pub scriptsig: Option<String>,
    pub witness: Option<Vec<String>>,
    pub sequence: Option<u32>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolVout {
    pub scriptpubkey: Option<String>,
    pub scriptpubkey_asm: Option<String>,
    pub scriptpubkey_type: Option<String>,
    pub scriptpubkey_address: Option<String>,
    pub value: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolPrevout {
    pub scriptpubkey: Option<String>,
    pub scriptpubkey_asm: Option<String>,
    pub scriptpubkey_type: Option<String>,
    pub scriptpubkey_address: Option<String>,
    pub value: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MempoolStatus {
    pub confirmed: bool,
    pub block_height: Option<u64>,
    pub block_hash: Option<String>,
    pub block_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
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
#[derive(Deserialize, Clone)]
pub struct ScalerParams {
    pub mean: Vec<f64>,
    pub scale: Vec<f64>,
}

#[derive(Deserialize, CandidType, Clone)]
pub struct ModelMeta {
    pub deployment_threshold: f64,
    pub feature_names: Vec<String>,
}