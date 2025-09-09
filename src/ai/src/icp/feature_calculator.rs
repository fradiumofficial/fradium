// src/ai/src/icp/feature_calculator.rs

use super::data_extractor;
use super::models::{TransactionData, UserFeatures};
use candid::Principal;
use std::collections::{BTreeMap, HashSet};

// --- Helper Functions ---
fn calculate_statistics(values: &[f64]) -> (f64, f64, f64) {
    if values.is_empty() { return (0.0, 0.0, 0.0); }
    let sum: f64 = values.iter().sum();
    let mean = sum / values.len() as f64;
    if values.len() == 1 { return (mean, 0.0, sum); }
    let variance: f64 = values.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (values.len() - 1) as f64;
    (mean, variance.sqrt(), sum)
}

fn count_round_amounts(amounts: &[f64]) -> u32 {
    amounts.iter().filter(|&&amount| {
        (amount - amount.round()).abs() < 0.01 || 
        [1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 500.0, 1000.0].contains(&amount)
    }).count() as u32
}

fn classify_user(features: &UserFeatures) -> String {
    if features.total_portfolio_value_usd > 50000.0 {
        if features.cross_token_user && features.defi_activity_score > 0.1 { 
            "defi_whale".to_string() 
        } else { 
            "whale".to_string() 
        }
    } else if features.total_portfolio_value_usd > 10000.0 {
        if features.num_tokens_held >= 3 { 
            "diversified_investor".to_string() 
        } else if features.defi_activity_score > 0.2 { 
            "defi_power_user".to_string() 
        } else { 
            "serious_investor".to_string() 
        }
    } else if features.total_portfolio_value_usd > 1000.0 {
        if features.cross_token_user && features.total_transactions > 20 { 
            "active_multi_token_user".to_string() 
        } else if features.total_transactions > 50 { 
            "high_frequency_trader".to_string() 
        } else { 
            "regular_investor".to_string() 
        }
    } else if features.cross_token_user {
        if features.has_mint_activity || features.has_burn_activity { 
            "defi_explorer".to_string() 
        } else { 
            "multi_token_user".to_string() 
        }
    } else if features.total_transactions > 20 { 
        "active_user".to_string() 
    } else if features.total_transactions > 5 { 
        "regular_user".to_string() 
    } else if features.num_tokens_held > 1 { 
        "portfolio_holder".to_string() 
    } else if features.total_transactions > 0 { 
        "light_user".to_string() 
    } else { 
        "inactive".to_string() 
    }
}

// --- Main Feature Building Logic ---
pub async fn build_comprehensive_features(
    principal: Principal,
    balances: BTreeMap<String, f64>,
    transactions: Vec<TransactionData>,
) -> UserFeatures {
    let mut features = UserFeatures::default();
    features.principal = principal;

    // Balance features
    features.icp_balance = *balances.get("ICP").unwrap_or(&0.0);
    features.ckbtc_balance = *balances.get("ckBTC").unwrap_or(&0.0);
    features.cketh_balance = *balances.get("ckETH").unwrap_or(&0.0);
    features.ckusdc_balance = *balances.get("ckUSDC").unwrap_or(&0.0);

    features.num_tokens_held = balances.values().filter(|&&b| b > 1e-6).count() as u32;
    features.portfolio_diversity_score = balances.values().filter(|&&b| b > 1e-3).count() as u32;

    // Calculate portfolio values with prices
    let mut total_portfolio_usd = 0.0;
    let mut _total_portfolio_icp = 0.0; 
    
    for (symbol, balance) in &balances {
        if *balance > 1e-6 {
            let price = data_extractor::get_token_price_data(symbol).await;
            let usd_value = balance * price.price_usd;
            let icp_value = balance * price.price_icp;
            
            total_portfolio_usd += usd_value;
            _total_portfolio_icp += icp_value;
            
            // Set individual token USD values (these are in your struct but not in dataset)
            match symbol.as_str() {
                "ICP" => features.icp_value_usd = usd_value,
                "ckBTC" => features.ckbtc_value_usd = usd_value,
                "ckETH" => features.cketh_value_usd = usd_value,
                "ckUSDC" => features.ckusdc_value_usd = usd_value,
                _ => {}
            }
        }
    }
    features.total_portfolio_value_usd = total_portfolio_usd;
    // Note: total_portfolio_value_icp is in your struct but not in dataset columns

    // Transaction features
    features.total_transactions = transactions.len() as u32;
    features.has_activity = !transactions.is_empty();
    
    if transactions.is_empty() {
        features.user_type = classify_user(&features);
        return features;
    }

    // Basic transaction counts
    features.sent_transactions = transactions.iter().filter(|tx| tx.is_outgoing).count() as u32;
    features.received_transactions = transactions.iter().filter(|tx| tx.is_incoming).count() as u32;
    features.has_mint_activity = transactions.iter().any(|tx| tx.tx_type == "mint");
    features.has_burn_activity = transactions.iter().any(|tx| tx.tx_type == "burn");

    // Calculate counterparties
    let unique_counterparties: HashSet<String> = transactions.iter()
        .filter_map(|tx| {
            let counterparty = if tx.is_outgoing { &tx.to_address } else { &tx.from_address };
            if counterparty != "system" && counterparty.len() > 20 {
                Some(counterparty.clone())
            } else {
                None
            }
        })
        .collect();
    features.unique_counterparties = unique_counterparties.len() as u32;

    // Token usage analysis
    let mut token_counts: BTreeMap<String, u32> = BTreeMap::new();
    for tx in &transactions {
        *token_counts.entry(tx.token_symbol.clone()).or_insert(0) += 1;
    }
    
    features.tokens_used = token_counts.len() as u32;
    features.tokens_actively_used = token_counts.len() as u32;
    features.cross_token_user = token_counts.len() > 1;

    if let Some(max_count) = token_counts.values().max() {
        features.primary_token_dominance = *max_count as f64 / transactions.len() as f64;
    }

    // Calculate USD values for transactions
    let mut all_usd = Vec::new();
    let mut outgoing_usd = Vec::new();
    let mut incoming_usd = Vec::new();
    let mut all_icp = Vec::new();
    let mut outgoing_icp = Vec::new();
    let mut incoming_icp = Vec::new();
    
    for tx in &transactions {
        let decimals = match tx.token_symbol.as_str() {
            "ckETH" => 18,
            "ckUSDC" => 6,
            _ => 8,
        };
        let amount_norm = tx.amount as f64 / 10_u64.pow(decimals) as f64;
        let price = data_extractor::get_token_price_data(&tx.token_symbol).await;
        let usd_value = amount_norm * price.price_usd;
        let icp_value = amount_norm * price.price_icp;
        
        all_usd.push(usd_value);
        all_icp.push(icp_value);
        
        if tx.is_outgoing { 
            outgoing_usd.push(usd_value);
            outgoing_icp.push(icp_value);
        }
        if tx.is_incoming { 
            incoming_usd.push(usd_value);
            incoming_icp.push(icp_value);
        }
    }

    // USD statistics
    let (sent_mean, _, sent_total) = calculate_statistics(&outgoing_usd);
    let (received_mean, _, received_total) = calculate_statistics(&incoming_usd);
    let (avg_val, std_val, _) = calculate_statistics(&all_usd);

    features.total_value_sent_usd = sent_total;
    features.total_value_received_usd = received_total;
    features.net_flow_usd = received_total - sent_total;
    features.avg_transaction_value_usd = avg_val;
    features.sent_amount_mean_usd = sent_mean;
    features.received_amount_mean_usd = received_mean;
    features.transaction_value_std_usd = std_val;

    // ICP statistics (these are in your struct but not in dataset)
    let (_, _, sent_total_icp) = calculate_statistics(&outgoing_icp);
    let (_, _, received_total_icp) = calculate_statistics(&incoming_icp);
    let (avg_val_icp, _, _) = calculate_statistics(&all_icp);
    
    features.total_value_sent_icp = sent_total_icp;
    features.total_value_received_icp = received_total_icp;
    features.net_flow_icp = received_total_icp - sent_total_icp;
    features.avg_transaction_value_icp = avg_val_icp;

    // Temporal analysis
    if transactions.len() > 1 {
        let mut timestamps: Vec<u64> = transactions.iter().map(|tx| tx.timestamp).collect();
        timestamps.sort_unstable();
        let span_ns = timestamps.last().unwrap() - timestamps.first().unwrap();
        features.transaction_span_days = span_ns as f64 / (1_000_000_000.0 * 86400.0);
        
        let intervals: Vec<f64> = timestamps.windows(2)
            .map(|w| (w[1] - w[0]) as f64 / 3_600_000_000_000.0) // Convert to hours
            .collect();
        
        if !intervals.is_empty() {
            features.avg_time_between_txs_hours = intervals.iter().sum::<f64>() / intervals.len() as f64;
        }
        
        if features.transaction_span_days > 0.0 {
            features.transaction_frequency_score = transactions.len() as f64 / features.transaction_span_days;
        }
    }
    
    // Ratio calculations
    features.send_receive_ratio = if features.received_transactions > 0 {
        features.sent_transactions as f64 / features.received_transactions as f64
    } else {
        features.sent_transactions as f64
    };
    
    features.value_sent_received_ratio_usd = if features.total_value_received_usd > 1e-6 {
        features.total_value_sent_usd / features.total_value_received_usd
    } else if features.total_value_sent_usd > 0.0 { 
        999.0 
    } else { 
        0.0 
    };

    // Transaction breakdown - CORRECTED to match dataset columns
    // Based on your dataset columns, you only have these specific breakdowns:
    let mut icp_transfer = 0u32;
    let mut ckbtc_transfer = 0u32;
    let mut cketh_mint = 0u32;
    let mut cketh_burn = 0u32;
    let mut ckusdc_mint = 0u32;
    let mut ckusdc_transfer = 0u32;
    let mut cketh_transfer = 0u32;
    let mut ckusdc_burn = 0u32;
    let mut ckbtc_mint = 0u32;

    for tx in &transactions {
        match (tx.token_symbol.as_str(), tx.tx_type.as_str()) {
            ("ICP", "transfer") => icp_transfer += 1,
            ("ckBTC", "transfer") => ckbtc_transfer += 1,
            ("ckETH", "mint") => cketh_mint += 1,
            ("ckETH", "burn") => cketh_burn += 1,
            ("ckUSDC", "mint") => ckusdc_mint += 1,
            ("ckUSDC", "transfer") => ckusdc_transfer += 1,
            ("ckETH", "transfer") => cketh_transfer += 1,
            ("ckUSDC", "burn") => ckusdc_burn += 1,
            ("ckBTC", "mint") => ckbtc_mint += 1,
            _ => {} // Ignore other combinations not in dataset
        }
    }

    // Set the breakdown values (these match your dataset columns exactly)
    features.icp_transfer = icp_transfer;
    features.ckbtc_transfer = ckbtc_transfer;
    features.cketh_mint = cketh_mint;
    features.cketh_burn = cketh_burn;
    features.ckusdc_mint = ckusdc_mint;
    features.ckusdc_transfer = ckusdc_transfer;
    features.cketh_transfer = cketh_transfer;
    features.ckusdc_burn = ckusdc_burn;
    features.ckbtc_mint = ckbtc_mint;

    // DeFi activity calculations
    let mint_count = cketh_mint + ckusdc_mint + ckbtc_mint;
    let burn_count = cketh_burn + ckusdc_burn;
    let transfer_count = icp_transfer + ckbtc_transfer + cketh_transfer + ckusdc_transfer;

    if transfer_count > 0 {
        features.mint_to_transfer_ratio = mint_count as f64 / transfer_count as f64;
    }
    features.defi_activity_score = (mint_count + burn_count) as f64 / transactions.len() as f64;

    // Behavioral analysis
    features.round_number_transactions = count_round_amounts(&all_usd);
    
    if !all_usd.is_empty() {
        features.high_value_transaction_ratio = all_usd.iter()
            .filter(|&&v| v > avg_val * 3.0)
            .count() as f64 / all_usd.len() as f64;
        features.microtransaction_ratio = all_usd.iter()
            .filter(|&&v| v < 1.0)
            .count() as f64 / all_usd.len() as f64;
    }

    // User classification
    features.user_type = classify_user(&features);
    
    // Clean up any invalid values
    preprocess_features_for_inference(&mut features);

    features
}

fn preprocess_features_for_inference(features: &mut UserFeatures) {
    // Handle infinite and NaN values
    if features.send_receive_ratio.is_infinite() {
        features.send_receive_ratio = features.sent_transactions as f64;
    }
    if features.value_sent_received_ratio_usd.is_infinite() {
        features.value_sent_received_ratio_usd = 999.0;
    }
    
    // Replace NaN with 0.0
    if features.avg_transaction_value_usd.is_nan() { features.avg_transaction_value_usd = 0.0; }
    if features.sent_amount_mean_usd.is_nan() { features.sent_amount_mean_usd = 0.0; }
    if features.received_amount_mean_usd.is_nan() { features.received_amount_mean_usd = 0.0; }
    if features.transaction_value_std_usd.is_nan() { features.transaction_value_std_usd = 0.0; }
    if features.avg_time_between_txs_hours.is_nan() { features.avg_time_between_txs_hours = 0.0; }
    if features.transaction_frequency_score.is_nan() { features.transaction_frequency_score = 0.0; }
    if features.high_value_transaction_ratio.is_nan() { features.high_value_transaction_ratio = 0.0; }
    if features.microtransaction_ratio.is_nan() { features.microtransaction_ratio = 0.0; }
    if features.primary_token_dominance.is_nan() { features.primary_token_dominance = 0.0; }
    if features.mint_to_transfer_ratio.is_nan() { features.mint_to_transfer_ratio = 0.0; }
    if features.defi_activity_score.is_nan() { features.defi_activity_score = 0.0; }
}