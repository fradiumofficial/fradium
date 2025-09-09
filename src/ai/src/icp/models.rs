// src/ai/src/icp/models.rs

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct TokenConfig { // <-- Was missing pub
    pub symbol: String,
    pub ledger_canister: Principal,
    pub decimals: u8,
    pub active: bool,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct PriceData { // <-- Was missing pub
    pub price_icp: f64,
    pub price_usd: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct TransactionData { // <-- Was missing pub
    pub tx_type: String,
    pub timestamp: u64,
    pub from_address: String,
    pub to_address: String,
    pub amount: u64,
    pub fee: u64,
    pub is_outgoing: bool,
    pub is_incoming: bool,
    pub token_symbol: String,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct UserFeatures {
    pub principal: Principal,
    pub icp_balance: f64,
    pub ckbtc_balance: f64,
    pub cketh_balance: f64,
    pub ckusdc_balance: f64,
    pub num_tokens_held: u32,
    pub total_portfolio_value_usd: f64,
    pub portfolio_diversity_score: u32,
    pub icp_value_usd: f64,
    pub ckbtc_value_usd: f64,
    pub cketh_value_usd: f64,
    pub ckusdc_value_usd: f64,
    pub total_transactions: u32,
    pub sent_transactions: u32,
    pub received_transactions: u32,
    pub unique_counterparties: u32,
    pub tokens_used: u32,
    pub cross_token_user: bool,
    pub has_activity: bool,
    pub has_mint_activity: bool,
    pub has_burn_activity: bool,
    pub total_value_sent_usd: f64,
    pub total_value_received_usd: f64,
    pub net_flow_usd: f64,
    pub avg_transaction_value_usd: f64,
    pub sent_amount_mean_usd: f64,
    pub received_amount_mean_usd: f64,
    pub transaction_value_std_usd: f64,
    pub total_value_sent_icp: f64,
    pub total_value_received_icp: f64,
    pub net_flow_icp: f64,
    pub avg_transaction_value_icp: f64,
    pub tokens_actively_used: u32,
    pub primary_token_dominance: f64,
    pub transaction_span_days: f64,
    pub avg_time_between_txs_hours: f64,
    pub transaction_frequency_score: f64,
    pub send_receive_ratio: f64,
    pub value_sent_received_ratio_usd: f64,
    pub mint_to_transfer_ratio: f64,
    pub defi_activity_score: f64,
    pub round_number_transactions: u32,
    pub high_value_transaction_ratio: f64,
    pub microtransaction_ratio: f64,
    pub icp_transfer: u32,
    pub icp_mint: u32,
    pub icp_burn: u32,
    pub ckbtc_transfer: u32,
    pub ckbtc_mint: u32,
    pub ckbtc_burn: u32,
    pub cketh_transfer: u32,
    pub cketh_mint: u32,
    pub cketh_burn: u32,
    pub ckusdc_transfer: u32,
    pub ckusdc_mint: u32,
    pub ckusdc_burn: u32,
    pub user_type: String,
}

impl Default for UserFeatures {
    fn default() -> Self {
        Self {
            principal: Principal::anonymous(), // Use anonymous principal as the default
            icp_balance: 0.0,
            ckbtc_balance: 0.0,
            cketh_balance: 0.0,
            ckusdc_balance: 0.0,
            num_tokens_held: 0,
            total_portfolio_value_usd: 0.0,
            portfolio_diversity_score: 0,
            icp_value_usd: 0.0,
            ckbtc_value_usd: 0.0,
            cketh_value_usd: 0.0,
            ckusdc_value_usd: 0.0,
            total_transactions: 0,
            sent_transactions: 0,
            received_transactions: 0,
            unique_counterparties: 0,
            tokens_used: 0,
            cross_token_user: false,
            has_activity: false,
            has_mint_activity: false,
            has_burn_activity: false,
            total_value_sent_usd: 0.0,
            total_value_received_usd: 0.0,
            net_flow_usd: 0.0,
            avg_transaction_value_usd: 0.0,
            sent_amount_mean_usd: 0.0,
            received_amount_mean_usd: 0.0,
            transaction_value_std_usd: 0.0,
            total_value_sent_icp: 0.0,
            total_value_received_icp: 0.0,
            net_flow_icp: 0.0,
            avg_transaction_value_icp: 0.0,
            tokens_actively_used: 0,
            primary_token_dominance: 0.0,
            transaction_span_days: 0.0,
            avg_time_between_txs_hours: 0.0,
            transaction_frequency_score: 0.0,
            send_receive_ratio: 0.0,
            value_sent_received_ratio_usd: 0.0,
            mint_to_transfer_ratio: 0.0,
            defi_activity_score: 0.0,
            round_number_transactions: 0,
            high_value_transaction_ratio: 0.0,
            microtransaction_ratio: 0.0,
            icp_transfer: 0,
            icp_mint: 0,
            icp_burn: 0,
            ckbtc_transfer: 0,
            ckbtc_mint: 0,
            ckbtc_burn: 0,
            cketh_transfer: 0,
            cketh_mint: 0,
            cketh_burn: 0,
            ckusdc_transfer: 0,
            ckusdc_mint: 0,
            ckusdc_burn: 0,
            user_type: String::new(),
        }
    }
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct AnalysisResult { // <-- Was missing pub
    pub features: UserFeatures,
    pub prediction: Option<PredictionResult>,
    pub analysis_timestamp: u64,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct PredictionResult { // <-- Was missing pub
    pub cluster_id: i32,
    pub probabilities: Vec<f32>,
    pub confidence: f32,
    pub interpretation: String,
}