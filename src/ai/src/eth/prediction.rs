// src/prediction.rs

use crate::eth::models::ModelMetadata;
use crate::shared_models::RansomwareResult;
use std::collections::HashMap;
use tract_onnx::prelude::*;
use std::cell::RefCell; 

thread_local! {
    static MODEL: RefCell<Option<SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>>> = RefCell::new(None);
}

pub fn load_model(model_bytes: &'static [u8]) -> Result<(), String> {
    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(model_bytes))
        .map_err(|e| format!("Failed to read ONNX model: {}", e))?
        .into_optimized()
        .map_err(|e| format!("Failed to optimize ONNX model: {}", e))?
        .into_runnable()
        .map_err(|e| format!("Failed to make ONNX model runnable: {}", e))?;

    MODEL.with(|m| *m.borrow_mut() = Some(model));
    Ok(())
}

pub fn predict_from_features(
    features_map: &HashMap<String, f64>,
    metadata: &ModelMetadata,
    address: &str,
    transaction_count: u32,
) -> Result<RansomwareResult, String> {
    
    let mut ordered_features: Vec<f32> = metadata
        .feature_names
        .iter()
        .map(|name| *features_map.get(name).unwrap_or(&0.0) as f32)
        .collect();

    for (i, feature) in ordered_features.iter_mut().enumerate() {
        if let (Some(mean), Some(scale)) = (metadata.scaler_mean.get(i), metadata.scaler_scale.get(i)) {
            if *scale > 1e-9 {
                *feature = ((*feature as f64 - mean) / scale) as f32;
            }
        }
    }

    MODEL.with(|model_ref| {
        let model_cell = model_ref.borrow();
        let model = model_cell.as_ref().ok_or("Model is not loaded")?;

        let input_tensor: Tensor = tract_ndarray::Array2::from_shape_vec((1, ordered_features.len()), ordered_features)
            .map_err(|e| format!("Failed to create input tensor: {}", e))?
            .into();

        let result = model
            .run(tvec!(input_tensor.into()))
            .map_err(|e| format!("Inference failed: {}", e))?;

        if result.len() < 2 {
            return Err("Model output is not in the expected format.".to_string());
        }

        let probabilities_view = result[1]
            .to_array_view::<f32>()
            .map_err(|e| format!("Failed to extract probabilities: {}", e))?;
        
        let ransomware_probability = probabilities_view[[0, 1]] as f64;
        let is_ransomware = ransomware_probability >= metadata.threshold;

        let confidence = if is_ransomware {
            (ransomware_probability - metadata.threshold) / (1.0 - metadata.threshold).max(1e-9)
        } else {
            (metadata.threshold - ransomware_probability) / metadata.threshold.max(1e-9)
        };
        
        let confidence_level = if confidence > 0.66 { "HIGH" } else if confidence > 0.33 { "MEDIUM" } else { "LOW" };
        
        Ok(RansomwareResult {
            address: address.to_string(),
            chain_type: "Ethereum".to_string(), // Add chain type
            ransomware_probability,
            is_ransomware,
            confidence_level: confidence_level.to_string(),
            threshold_used: metadata.threshold,
            transactions_analyzed: transaction_count,
            confidence,
            data_source: "Etherscan.io".to_string(),
        })
    })
}