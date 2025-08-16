// src/solana/models.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
    pub symbol: Option<String>,
    pub decimals: Option<u8>,
    pub name: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct MoralisTokenMetadata {
    pub symbol: Option<String>,
    pub decimals: Option<u8>,
    pub name: Option<String>,
}

// ============================================================================
// PRICE API STRUCTURES
// ============================================================================

#[derive(Deserialize, Debug)]
pub struct JupiterPriceResponse {
    #[serde(flatten)]
    pub data: HashMap<String, JupiterTokenPrice>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JupiterTokenPrice {
    pub usd_price: Option<f64>,
    pub id: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoSearchResponse {
    pub coins: Vec<CoinGeckoCoin>,
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoCoin {
    pub id: String,
    pub symbol: String,
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoHistoryResponse {
    pub market_data: Option<CoinGeckoMarketData>,
}

#[derive(Deserialize, Debug)]
pub struct CoinGeckoMarketData {
    pub current_price: Option<HashMap<String, f64>>,
}

#[derive(Deserialize, Debug)]
pub struct CryptoCompareResponse {
    #[serde(flatten)]
    pub data: HashMap<String, HashMap<String, f64>>,
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
    pub token_symbol: String,
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

impl TransactionContext {
    pub fn as_str(&self) -> &'static str {
        match self {
            TransactionContext::DexSwap => "DEX_SWAP",
            TransactionContext::Lending => "LENDING",
            TransactionContext::Staking => "STAKING",
            TransactionContext::PureTransfer => "PURE_TRANSFER",
            TransactionContext::OtherProgram => "OTHER_PROGRAM",
            TransactionContext::Unknown => "UNKNOWN",
        }
    }
    
    pub fn from_str(s: &str) -> Self {
        match s {
            "DEX_SWAP" => TransactionContext::DexSwap,
            "LENDING" => TransactionContext::Lending,
            "STAKING" => TransactionContext::Staking,
            "PURE_TRANSFER" => TransactionContext::PureTransfer,
            "OTHER_PROGRAM" => TransactionContext::OtherProgram,
            _ => TransactionContext::Unknown,
        }
    }
}

impl TransactionType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TransactionType::SolTransfer => "SOL_TRANSFER",
            TransactionType::TokenTransfer => "TOKEN_TRANSFER",
            TransactionType::Failed => "FAILED",
            TransactionType::FeeOnly => "FEE_ONLY",
        }
    }
}

// ============================================================================
// FEATURE CALCULATION STRUCTURES
// ============================================================================

// Transaction summary for feature calculation (matches Python aggregation)
#[derive(Debug, Clone)]
pub struct TransactionSummary {
    pub value_btc: f64,
    pub value_sol: f64,
    pub fee_btc: f64,
    pub slot: u64,
    pub tx_type: String,
    pub tx_context: String,
    pub is_programmatic: bool,
}

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

// Helper methods for HeliusTransaction (matches Python transaction parsing)
impl HeliusTransaction {
    pub fn is_successful(&self) -> bool {
        self.meta.err.is_none()
    }
    pub fn get_program_ids(&self) -> Vec<String> {
        self.transaction.message.instructions
            .iter()
            .map(|instr| instr.program_id.clone())
            .collect()
    }
}

// Helper methods for TokenTransfer (matches Python token transfer handling)
impl TokenTransfer {
    pub fn get_from_address(&self) -> String {
        self.from_user_account.as_deref().unwrap_or("").trim().to_string()
    }
    pub fn get_to_address(&self) -> String {
        self.to_user_account.as_deref().unwrap_or("").trim().to_string()
    }
    
    // NEW HELPER: Safely parse the raw string amount into a u64
    pub fn get_raw_amount(&self) -> Option<u64> {
        self.raw_token_amount.as_ref().and_then(|s| s.parse::<u64>().ok())
    }
    
    pub fn get_normalized_amount(&self) -> f64 {
        self.token_amount.unwrap_or(0.0)
    }

    pub fn is_valid(&self) -> bool {
        !self.get_from_address().is_empty() && 
        !self.get_to_address().is_empty() && 
        !self.mint.is_empty() &&
        (self.token_amount.is_some() || self.raw_token_amount.is_some())
    }
}

// Helper methods for NativeTransfer (matches Python SOL transfer handling)
impl NativeTransfer {
    pub fn get_from_address(&self) -> String {
        self.from_user_account.as_deref().unwrap_or("").trim().to_string()
    }
    pub fn get_to_address(&self) -> String {
        self.to_user_account.as_deref().unwrap_or("").trim().to_string()
    }
    pub fn get_sol_amount(&self) -> f64 {
        self.amount as f64 / 1_000_000_000.0
    }
    pub fn is_valid(&self) -> bool {
        !self.get_from_address().is_empty() && 
        !self.get_to_address().is_empty() && 
        self.amount > 0
    }
}

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

pub fn validate_token_info(token_info: &TokenInfo) -> bool {
    // Matches Python _validate_token_info function
    if token_info.decimals > 18 {
        return false;
    }
    
    if token_info.symbol.is_empty() || token_info.symbol.len() > 20 || token_info.symbol == "UNKNOWN" {
        return false;
    }
    
    true
}

pub fn is_stablecoin(symbol: &str) -> bool {
    // Matches Python STABLECOIN_ADDRESSES logic
    matches!(symbol.to_uppercase().as_str(), "USDC" | "USDT" | "BUSD" | "DAI")
}

pub fn is_wrapped_sol(mint_address: &str) -> bool {
    // Matches Python WSOL detection
    mint_address == "So11111111111111111111111111111111111111112"
}

// ============================================================================
// CONSTANTS (matches Python constants)
// ============================================================================

pub const LAMPORTS_TO_SOL: f64 = 1_000_000_000.0;
pub const MAX_TRANSACTIONS_PER_ADDRESS: usize = 50000;
pub const API_DELAY_MS: u64 = 500;
pub const MAX_RETRIES: usize = 3;
pub const JUPITER_API_DELAY_MS: u64 = 1000;

// ============================================================================
// ERROR TYPES FOR BETTER ERROR HANDLING
// ============================================================================

#[derive(Debug, thiserror::Error)]
pub enum SolanaModelError {
    #[error("Invalid address format: {0}")]
    InvalidAddress(String),
    
    #[error("Invalid token info: {0}")]
    InvalidTokenInfo(String),
    
    #[error("Price fetch failed: {0}")]
    PriceFetchFailed(String),
    
    #[error("Transaction parsing failed: {0}")]
    TransactionParsingFailed(String),
    
    #[error("API response parsing failed: {0}")]
    ApiResponseParsingFailed(String),
}

pub type Result<T> = std::result::Result<T, SolanaModelError>;