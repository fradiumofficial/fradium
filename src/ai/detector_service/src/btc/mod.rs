use crate::shared_models::RansomwareResult;
use crate::STATE;
use std::cell::RefCell;
use tract_onnx::prelude::*;
use serde_json;

mod config;
pub mod models;

use self::config::*;
use self::models::{ModelMetadata, ScalerParams, ModelMeta};

// --- BTC Module State (for the non-serializable ONNX model) ---
thread_local! {
    static MODEL: RefCell<Option<SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>>> = RefCell::new(None);
}

pub fn init() -> ModelMetadata {
    ic_cdk::println!("[init_btc] Initializing Bitcoin analyzer state...");
    let scaler_data: ScalerParams = serde_json::from_str(SCALER_PARAMS_JSON)
        .expect("FATAL: Could not parse BTC SCALER_PARAMS_JSON");
    let model_meta: ModelMeta = serde_json::from_str(MODEL_METADATA_JSON)
        .expect("FATAL: Could not parse BTC MODEL_METADATA_JSON");

    let metadata = ModelMetadata {
        threshold: model_meta.deployment_threshold,
        feature_names: model_meta.feature_names,
        scaler_mean: scaler_data.mean,
        scaler_scale: scaler_data.scale,
    };

    load_model_from_config();
    ic_cdk::println!("[init_btc] ✅ BTC state initialized.");
    metadata
}

pub fn load_model_from_config() {
    let model_vec = MODEL_BYTES.to_vec();
    if let Err(e) = load_model_from_bytes(model_vec) {
        ic_cdk::trap(&format!("[btc] FATAL: Could not load ONNX model: {}", e));
    }
}

fn load_model_from_bytes(model_bytes: Vec<u8>) -> Result<String, String> {
    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(&model_bytes))
        .map_err(|e| format!("Failed to read ONNX model: {}", e))?
        .into_optimized()
        .map_err(|e| format!("Failed to optimize ONNX model: {}", e))?
        .into_runnable()
        .map_err(|e| format!("Failed to make ONNX model runnable: {}", e))?;

    MODEL.with(|m| *m.borrow_mut() = Some(model));
    Ok(format!("Loaded model with {} bytes", model_bytes.len()))
}

pub fn predict_ransomware(
    mut features: Vec<f32>,
    address: &str,
    transaction_count: u32,
) -> Result<RansomwareResult, String> {
    STATE.with(|s| {
        let state = s.borrow();
        let metadata = &state.btc_metadata;

        for (i, feature) in features.iter_mut().enumerate() {
            if let (Some(mean), Some(scale)) = (metadata.scaler_mean.get(i), metadata.scaler_scale.get(i)) {
                if *scale > 1e-9 { *feature = ((*feature as f64 - mean) / scale) as f32; }
            }
        }
        
        MODEL.with(|model_ref| {
            let model_cell = model_ref.borrow();
            let model = model_cell.as_ref().ok_or("BTC Model not loaded")?;
            
            let input_tensor: Tensor = tract_ndarray::Array2::from_shape_vec((1, features.len()), features)
                .map_err(|e| format!("Failed to create input array: {}", e))?.into();

            let result = model.run(tvec!(input_tensor.into())).map_err(|e| format!("Inference failed: {}", e))?;
            
            if result.len() < 2 { return Err(format!("Model returned {} outputs, but expected 2", result.len())); }

            let probabilities_view = result[1].to_array_view::<f32>().map_err(|e| format!("Failed to extract probabilities: {}", e))?;
            
            let ransomware_probability = probabilities_view[[0, 1]] as f64;
            let is_ransomware = ransomware_probability >= metadata.threshold;
            
            let confidence = if is_ransomware {
                (ransomware_probability - metadata.threshold) / (1.0f64 - metadata.threshold).max(1e-9f64)
            } else {
                (metadata.threshold - ransomware_probability) / metadata.threshold.max(1e-9f64)
            };
            
            let confidence_level = if confidence > 0.66 { "HIGH" } else if confidence > 0.33 { "MEDIUM" } else { "LOW" };
            
            Ok(RansomwareResult {
                address: address.to_string(),
                chain_type: "Bitcoin".to_string(),
                ransomware_probability,
                is_ransomware,
                confidence_level: confidence_level.to_string(),
                threshold_used: metadata.threshold,
                transactions_analyzed: transaction_count,
                confidence,
                data_source: "mempool.space".to_string(),
            })
        })
    })
}
