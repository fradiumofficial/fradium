// src/solana/models.rs

use serde::{Deserialize, Serialize};


// ============================================================================
// HELIUS API RESPONSE STRUCTURES
// ============================================================================

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HeliusTransaction {
    pub signature: String,
    pub slot: u64,
    pub timestamp: u64,
    pub fee: u64,
    #[serde(default)]
    pub token_transfers: Vec<TokenTransfer>,
    #[serde(default)]
    pub native_transfers: Vec<NativeTransfer>,
    #[serde(default)] // <--- 1. ADD THIS ATTRIBUTE
    pub meta: TransactionMeta,
    #[serde(default)] // <--- 2. ADD THIS ATTRIBUTE (for safety)
    pub transaction: TransactionDetails,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TokenTransfer {
    pub from_user_account: Option<String>,
    pub to_user_account: Option<String>,
    pub mint: String,
    // CRITICAL FIX: Changed raw_token_amount from Option<u64> to Option<String>
    // Helius API sends this as a string, not an integer, so this is required for successful parsing.
    pub raw_token_amount: Option<String>,
    #[serde(alias = "tokenAmount")]
    pub token_amount: Option<f64>, // Normalized amount (used as fallback)
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NativeTransfer {
    pub from_user_account: Option<String>,
    pub to_user_account: Option<String>,
    pub amount: u64, // Always in lamports
}

#[derive(Deserialize, Debug, Clone, Default)] // <--- 3. ADD 'Default' TRAIT
pub struct TransactionMeta {
    pub err: Option<serde_json::Value>, // null if successful
}

#[derive(Deserialize, Debug, Clone, Default)] // <--- 4. ADD 'Default' TRAIT
#[serde(rename_all = "camelCase")]
pub struct TransactionDetails {
    pub message: Message,
}

#[derive(Deserialize, Debug, Clone, Default)] // <--- 5. ADD 'Default' TRAIT
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub instructions: Vec<Instruction>,
}

#[derive(Deserialize, Debug, Clone, Default)] // <--- 6. ADD 'Default' TRAIT
#[serde(rename_all = "camelCase")]
pub struct Instruction {
    pub program_id: String,
}


// ============================================================================
// TOKEN METADATA API STRUCTURES
// ============================================================================

#[derive(Serialize, Debug)]
pub struct HeliusTokenMetadataRequest {
    #[serde(rename = "mintAccounts")]
    pub mint_accounts: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct HeliusTokenMetadata {
}

#[derive(Deserialize, Debug)]
pub struct MoralisTokenMetadata {
}

// ============================================================================
// PRICE API STRUCTURES
// ============================================================================



#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JupiterTokenPrice {
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoSearchResponse {
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoCoin {
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoHistoryResponse {
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoMarketData {
}

#[derive(Deserialize, Debug)]
pub struct CryptoCompareResponse {
}

// ============================================================================
// INTERNAL DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenInfo {
    pub symbol: String,
    pub decimals: u8,
    pub name: String,
}

#[derive(Debug, Clone, Default)]
pub struct ParsedSolanaTransaction {
    pub signature: String,
    pub slot: u64,
    pub timestamp: u64,
    pub tx_type: TransactionType,
    pub tx_context: TransactionContext,
    pub is_programmatic: bool,
    pub from: String,
    pub to: String,
    pub value_normalized: f64,
    pub value_sol: f64,
    pub fee_lamports: u64,
    pub success: bool,
    pub mint_address: String,
    pub decimals: u8,
    pub price_fetch_success: bool,
    pub sol_ratio: Option<f64>,
}

// ============================================================================
// ENUMS FOR TRANSACTION CLASSIFICATION (matches Python classifier logic)
// ============================================================================

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub enum TransactionContext {
    DexSwap,
    Lending,
    Staking,
    PureTransfer,
    OtherProgram,
    #[default] // <-- Add this line
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub enum TransactionType {
    SolTransfer,
    TokenTransfer,
    #[default]
    Failed,
    FeeOnly,
}





// ============================================================================
// FEATURE CALCULATION STRUCTURES
// ============================================================================



// Data quality assessment (matches Python quality checks)
#[derive(Debug, Clone, Serialize)]
pub struct DataQualityAssessment {
    pub data_quality_warning: String,
    pub price_quality: String,
    pub behavior_pattern: String,
}

// Price cache entry for caching (matches Python caching logic)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceCacheEntry {
    pub price: f64,
    pub timestamp: u64,
    pub success: bool,
}

// ============================================================================
// HELPER IMPLEMENTATIONS
// ============================================================================







// ============================================================================
// VALIDATION FUNCTIONS (matches Python validation logic)
// ============================================================================

pub fn is_valid_solana_address(address: &str) -> bool {
    if address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    // Base58 character validation (matches Python validation)
    let valid_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    address.chars().all(|c| valid_chars.contains(c))
}

pub fn normalize_address(address: &str) -> String {
    address.trim().to_string()
}

pub fn normalize_token_amount(raw_amount: u64, decimals: u8) -> f64 {
    // Matches Python normalize_token_amount function
    if decimals > 18 {
        // Invalid decimals, use default
        return raw_amount as f64 / 1_000_000_000.0;
    }
    raw_amount as f64 / (10_u64.pow(decimals as u32) as f64)
}



pub fn is_wrapped_sol(mint_address: &str) -> bool {
    // Matches Python WSOL detection
    mint_address == "So11111111111111111111111111111111111111112"
}

// ============================================================================
// CONSTANTS (matches Python constants)
// ============================================================================



// ============================================================================
// ERROR TYPES FOR BETTER ERROR HANDLING
// ============================================================================

#[derive(Debug, thiserror::Error)]
pub enum SolanaModelError {
}

