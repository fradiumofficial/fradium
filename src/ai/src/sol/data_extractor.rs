// src/solana/data_extractor.rs

use crate::sol::models::{HeliusTransaction, ParsedSolanaTransaction, TransactionContext, TransactionType, normalize_token_amount, is_wrapped_sol, normalize_address}; 
use crate::sol::config::{HELIUS_API_KEY, MAX_RETRIES, MAX_TRANSACTIONS_PER_ADDRESS, HELIUS_MAX_RECORDS, DEX_PROGRAMS, LENDING_PROGRAMS, STAKING_PROGRAMS, COMPREHENSIVE_PROGRAM_ADDRESSES};
use crate::sol::price_converter::SolanaPriceConverter;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,TransformArgs,
};
use serde_json;
use std::collections::HashSet;

pub struct SolanaDataExtractor {
    pub price_converter: SolanaPriceConverter,
    classifier: TransactionClassifier,
}

impl SolanaDataExtractor {
    pub fn new() -> Self {
        Self {
            price_converter: SolanaPriceConverter::new(),
            classifier: TransactionClassifier::new(),
        }
    }

    // FIXED: Changed to return only raw transactions - Step 1 of Python process
    pub async fn get_all_transactions(&mut self, address: &str) -> Result<Vec<HeliusTransaction>, String> {
        ic_cdk::println!("Fetching Solana transactions for address: {}", address);
        
        let mut all_raw_transactions = Vec::new();
        let mut before_signature: Option<String> = None;
        let mut page_count = 0;

        loop {
            if all_raw_transactions.len() >= MAX_TRANSACTIONS_PER_ADDRESS {
                ic_cdk::println!("Limiting to {} transactions", MAX_TRANSACTIONS_PER_ADDRESS);
                all_raw_transactions.truncate(MAX_TRANSACTIONS_PER_ADDRESS);
                break;
            }

            page_count += 1;
            ic_cdk::println!("Fetching page {}", page_count);

            let page_transactions = self.fetch_transaction_page(address, before_signature.as_deref()).await?;
            
            if page_transactions.is_empty() {
                break;
            }
            
            // Just store the raw transactions - no parsing here
            all_raw_transactions.extend_from_slice(&page_transactions);

            if page_transactions.len() < HELIUS_MAX_RECORDS {
                break;
            }

            before_signature = Some(page_transactions.last().unwrap().signature.clone());
        }

        ic_cdk::println!("Total raw transactions fetched: {}", all_raw_transactions.len());
        Ok(all_raw_transactions)
    }

    // NEW: Separate method for parsing - Step 2 of Python process
    // This mirrors exactly what Python does: take raw list, return parsed list
    pub async fn parse_all_transactions(&mut self, raw_transactions: &[HeliusTransaction], target_address: &str) -> Vec<ParsedSolanaTransaction> {
        let mut all_parsed_transactions = Vec::new();
        
        for raw_tx in raw_transactions {
            let parsed_txs = self.parse_solana_transaction(raw_tx, target_address).await;
            all_parsed_transactions.extend(parsed_txs);
        }
        
        ic_cdk::println!("Total parsed transactions: {}", all_parsed_transactions.len());
        all_parsed_transactions
    }

    pub async fn fetch_transaction_page(&self, address: &str, before_signature: Option<&str>) -> Result<Vec<HeliusTransaction>, String> {
        let mut url = format!("https://api.helius.xyz/v0/addresses/{}/transactions?api-key={}", address, HELIUS_API_KEY);
        
        if let Some(before) = before_signature {
            url.push_str(&format!("&before={}", before));
        }

        let request = CanisterHttpRequestArgument {
            url: url.clone(),
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(2_000_000),
            transform: Some(ic_cdk::api::management_canister::http_request::TransformContext::from_name(
                "transform_helius_response".to_string(),
                vec![],
            )),
            headers: vec![
                HttpHeader {
                    name: "User-Agent".to_string(),
                    value: "Solana-Fraud-Detector/1.0".to_string(),
                },
                HttpHeader {
                    name: "Accept".to_string(),
                    value: "application/json".to_string(),
                },
            ],
        };

        for attempt in 0..MAX_RETRIES {
            match http_request(request.clone(), 25_000_000_000).await {
                Ok((response,)) => {
                    if response.status == candid::Nat::from(200u32) {
                        let response_body = String::from_utf8(response.body)
                            .map_err(|e| format!("Failed to decode response body: {}", e))?;
                        
                        let transactions: Vec<HeliusTransaction> = serde_json::from_str(&response_body)
                            .map_err(|e| format!("Failed to parse JSON response: {}. Body preview: {}", 
                                e, &response_body[..200.min(response_body.len())]))?;
                        
                        return Ok(transactions);
                    } else if response.status == candid::Nat::from(429u32) {
                        ic_cdk::println!("Rate limited, attempt {} of {}", attempt + 1, MAX_RETRIES);
                        continue;
                    } else {
                        let error_body = String::from_utf8_lossy(&response.body);
                        return Err(format!("API Error: HTTP {} - {}", response.status, error_body));
                    }
                }
                Err(e) => {
                    ic_cdk::println!("Request failed, attempt {} of {}: {:?}", attempt + 1, MAX_RETRIES, e);
                    if attempt == MAX_RETRIES - 1 {
                        return Err(format!("All retry attempts failed: {:?}", e));
                    }
                }
            }
        }

        Err("Maximum retry attempts exceeded".to_string())
    }

    async fn parse_solana_transaction(&mut self, raw_tx: &HeliusTransaction, target_address: &str) -> Vec<ParsedSolanaTransaction> {
        let mut parsed_transactions = Vec::new();
        
        // Basic transaction info
        let signature = &raw_tx.signature;
        let slot = raw_tx.slot;
        let timestamp = raw_tx.timestamp;
        let fee_lamports = raw_tx.fee;
        
        // Validate basic data (matches Python validation)
        if signature.is_empty() || slot == 0 || timestamp == 0 {
            ic_cdk::println!("Skipping invalid transaction: sig={}, slot={}, ts={}", 
                           &signature[..20.min(signature.len())], slot, timestamp);
            return parsed_transactions;
        }
        
        let succeeded = raw_tx.meta.err.is_none();
        
        // Get transaction context (enhanced classification)
        let tx_context = self.classifier.classify_transaction_context(raw_tx);
        let is_programmatic = self.classifier.is_programmatic_transaction(raw_tx);

        // Handle failed transactions (matches Python logic)
        if !succeeded {
            let parsed_tx = ParsedSolanaTransaction {
                signature: signature.clone(),
                slot,
                timestamp,
                tx_type: TransactionType::Failed,
                tx_context: tx_context.clone(),
                is_programmatic,
                from: target_address.to_string(),
                to: target_address.to_string(),
                value_normalized: 0.0,
                value_sol: 0.0,
                fee_lamports,
                success: false,
                mint_address: "So11111111111111111111111111111111111111112".to_string(),
                decimals: 9,
                price_fetch_success: true,
                token_symbol: "SOL".to_string(),
                sol_ratio: None,
            };
            parsed_transactions.push(parsed_tx);
            return parsed_transactions;
        }

        // Parse successful transactions (matches Python parsing)
        let sol_transfers = self.extract_sol_transfers(raw_tx, target_address);
        let token_transfers = self.extract_token_transfers(raw_tx, target_address).await;
        
        let sol_transfers_empty = sol_transfers.is_empty();
        
        // Process SOL transfers
        for mut transfer in sol_transfers {
            transfer.signature = signature.clone();
            transfer.slot = slot;
            transfer.timestamp = timestamp;
            transfer.tx_type = TransactionType::SolTransfer;
            transfer.tx_context = tx_context.clone();
            transfer.is_programmatic = is_programmatic;
            transfer.fee_lamports = fee_lamports;
            transfer.success = true;
            transfer.price_fetch_success = true;
            transfer.value_sol = transfer.value_normalized;
            
            parsed_transactions.push(transfer);
        }

        // Process token transfers with proper price conversion
        for mut transfer in token_transfers {
            let mint_address = &transfer.mint_address;
            let raw_value = transfer.value_normalized;
            let decimals = transfer.decimals;
            
            // Normalize token amount properly (matches Python)
            let normalized_value = if raw_value > 1000000.0 {
                normalize_token_amount(raw_value as u64, decimals)
            } else {
                raw_value
            };
            
            // Convert to SOL value with enhanced error handling
            let (sol_ratio, price_success) = self.price_converter
                .get_token_sol_ratio(mint_address, timestamp as u64).await;
            let value_sol = if price_success { normalized_value * sol_ratio } else { 0.0 };
            
            transfer.signature = signature.clone();
            transfer.slot = slot;
            transfer.timestamp = timestamp;
            transfer.tx_type = TransactionType::TokenTransfer;
            transfer.tx_context = tx_context.clone();
            transfer.is_programmatic = is_programmatic;
            transfer.fee_lamports = if sol_transfers_empty { fee_lamports } else { 0 };
            transfer.success = true;
            transfer.value_normalized = normalized_value;
            transfer.value_sol = value_sol;
            transfer.price_fetch_success = price_success;
            transfer.sol_ratio = Some(sol_ratio);
            
            parsed_transactions.push(transfer);
        }

        // If no transfers found but transaction succeeded, create fee-only entry
        if parsed_transactions.is_empty() && succeeded {
            let parsed_tx = ParsedSolanaTransaction {
                signature: signature.clone(),
                slot,
                timestamp,
                tx_type: TransactionType::FeeOnly,
                tx_context: tx_context.clone(),
                is_programmatic,
                from: target_address.to_string(),
                to: target_address.to_string(),
                value_normalized: 0.0,
                value_sol: 0.0,
                fee_lamports,
                success: true,
                mint_address: "So11111111111111111111111111111111111111112".to_string(),
                decimals: 9,
                price_fetch_success: true,
                token_symbol: "SOL".to_string(),
                sol_ratio: None,
            };
            parsed_transactions.push(parsed_tx);
        }

        parsed_transactions
    }

    fn extract_sol_transfers(&self, raw_tx: &HeliusTransaction, target_address: &str) -> Vec<ParsedSolanaTransaction> {
        let mut transfers = Vec::new();
        
        // Method 1: nativeTransfers (most reliable for SOL) - matches Python logic
        for transfer in &raw_tx.native_transfers {
            let from_addr = transfer.from_user_account.as_deref().unwrap_or("");
            let to_addr = transfer.to_user_account.as_deref().unwrap_or("");
            
            if (!from_addr.is_empty() && from_addr.to_lowercase() == target_address.to_lowercase()) || 
                (!to_addr.is_empty() && to_addr.to_lowercase() == target_address.to_lowercase()) {
                let sol_amount = transfer.amount as f64 / 1_000_000_000.0; // Convert lamports to SOL
                
                let parsed_tx = ParsedSolanaTransaction {
                    from: from_addr.to_string(),
                    to: to_addr.to_string(),
                    value_normalized: sol_amount,
                    mint_address: "So11111111111111111111111111111111111111112".to_string(),
                    decimals: 9,
                    token_symbol: "SOL".to_string(),
                    ..Default::default()
                };
                transfers.push(parsed_tx);
            }
        }

        // Method 2: tokenTransfers for WSOL (wrapped SOL) - matches Python logic
        for transfer in &raw_tx.token_transfers {
            if !is_wrapped_sol(&transfer.mint) {
                continue;
            }
            
            let from_addr = transfer.from_user_account.as_deref().unwrap_or("");
            let to_addr = transfer.to_user_account.as_deref().unwrap_or("");
            
            if from_addr.to_lowercase() == target_address.to_lowercase() || 
               to_addr.to_lowercase() == target_address.to_lowercase() {
                
                let amount = if let Some(raw_amount) = &transfer.raw_token_amount {
                    match raw_amount.parse::<u64>() {
                        Ok(parsed_amount) => normalize_token_amount(parsed_amount, 9), // WSOL has 9 decimals
                        Err(_) => transfer.token_amount.unwrap_or(0.0)
                    }
                } else {
                    transfer.token_amount.unwrap_or(0.0)
                };
                
                let parsed_tx = ParsedSolanaTransaction {
                    from: from_addr.to_string(),
                    to: to_addr.to_string(),
                    value_normalized: amount,
                    mint_address: "So11111111111111111111111111111111111111112".to_string(),
                    decimals: 9,
                    token_symbol: "WSOL".to_string(),
                    ..Default::default()
                };
                transfers.push(parsed_tx);
            }
        }

        transfers
    }

    async fn extract_token_transfers(&mut self, raw_tx: &HeliusTransaction, target_address: &str) -> Vec<ParsedSolanaTransaction> {
        let mut transfers = Vec::new();
        
        for transfer in &raw_tx.token_transfers {
            if is_wrapped_sol(&transfer.mint) {
                continue; // Skip WSOL (handled separately)
            }
            
            let mint = normalize_address(&transfer.mint);
            let from_addr = transfer.from_user_account.as_deref().unwrap_or("");
            let to_addr = transfer.to_user_account.as_deref().unwrap_or("");
            
            if (!from_addr.is_empty() && from_addr.to_lowercase() == target_address.to_lowercase()) || 
                (!to_addr.is_empty() && to_addr.to_lowercase() == target_address.to_lowercase()) {
                
                // Get token info with caching (matches Python caching)
                let token_info = self.price_converter.get_token_info(&mint).await;
                
                // Use raw amount when available for precision
                let raw_amount = if let Some(raw) = &transfer.raw_token_amount {
                    match raw.parse::<u64>() {
                        Ok(parsed_amount) => normalize_token_amount(parsed_amount, token_info.decimals as u8),
                        Err(_) => transfer.token_amount.unwrap_or(0.0)
                    }
                } else {
                    transfer.token_amount.unwrap_or(0.0)
                };
                
                let parsed_tx = ParsedSolanaTransaction {
                    from: from_addr.to_string(),
                    to: to_addr.to_string(),
                    value_normalized: raw_amount,
                    mint_address: mint,
                    decimals: token_info.decimals as u8,
                    token_symbol: token_info.symbol,
                    ..Default::default()
                };
                transfers.push(parsed_tx);
            }
        }
                
        transfers
    }
}

// Transaction Classifier (Enhanced to match Python logic exactly)
pub struct TransactionClassifier {
    dex_programs: HashSet<String>,
    lending_programs: HashSet<String>,
    staking_programs: HashSet<String>,
    comprehensive_programs: HashSet<String>,
}

impl TransactionClassifier {
    pub fn new() -> Self {
        let mut dex_programs = HashSet::new();
        for program in DEX_PROGRAMS {
            dex_programs.insert(program.to_string());
        }
        
        let mut lending_programs = HashSet::new();
        for program in LENDING_PROGRAMS {
            lending_programs.insert(program.to_string());
        }
        
        let mut staking_programs = HashSet::new();
        for program in STAKING_PROGRAMS {
            staking_programs.insert(program.to_string());
        }
        
        let mut comprehensive_programs = HashSet::new();
        for program in COMPREHENSIVE_PROGRAM_ADDRESSES {
            comprehensive_programs.insert(program.to_string());
        }

        Self {
            dex_programs,
            lending_programs,
            staking_programs,
            comprehensive_programs,
        }
    }

    pub fn classify_transaction_context(&self, raw_tx: &HeliusTransaction) -> TransactionContext {
        let program_ids: HashSet<String> = raw_tx.transaction.message.instructions
            .iter()
            .map(|instr| instr.program_id.clone())
            .collect();
        
        // Check for DEX activity (matches Python dex_programs check)
        if !program_ids.is_disjoint(&self.dex_programs) {
            return TransactionContext::DexSwap;
        }
        
        // Check for lending (matches Python lending_programs check)
        if !program_ids.is_disjoint(&self.lending_programs) {
            return TransactionContext::Lending;
        }
        
        // Check for staking (matches Python staking_programs check)
        if !program_ids.is_disjoint(&self.staking_programs) {
            return TransactionContext::Staking;
        }
        
        // Check for pure transfers (matches Python pure transfer logic)
        let has_transfers = !raw_tx.token_transfers.is_empty() || !raw_tx.native_transfers.is_empty();
        if has_transfers && program_ids.is_disjoint(&self.comprehensive_programs) {
            return TransactionContext::PureTransfer;
        }
        
        // Check for other known programs
        if !program_ids.is_disjoint(&self.comprehensive_programs) {
            return TransactionContext::OtherProgram;
        }
        
        TransactionContext::Unknown
    }

    pub fn is_programmatic_transaction(&self, raw_tx: &HeliusTransaction) -> bool {
        // High instruction count suggests programmatic (matches Python logic)
        let instruction_count = raw_tx.transaction.message.instructions.len();
        if instruction_count > 10 {
            return true;
        }
        
        // Multiple token transfers in single tx suggests programmatic (matches Python logic)
        if raw_tx.token_transfers.len() > 5 {
            return true;
        }
        
        // FIXED: Added the missing third condition from Python
        // Interaction with known program addresses (matches Python logic)
        let program_ids: HashSet<String> = raw_tx.transaction.message.instructions
            .iter()
            .map(|instr| instr.program_id.clone())
            .collect();
        !program_ids.is_disjoint(&self.comprehensive_programs)
    }
    
    // Helper method for feature calculator to use
    pub fn is_known_program(&self, address: &str) -> bool {
        self.comprehensive_programs.contains(address)
    }
}

// Helper Functions
#[ic_cdk_macros::query(name = "transform_helius_response")]
fn transform_helius_response(raw: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: raw.response.status,
        headers: vec![],
        body: raw.response.body,
    }
}

fn is_valid_solana_address(address: &str) -> bool {
    if address.is_empty() || address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    address.chars().all(|c| "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".contains(c))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_classifier() {
        let classifier = TransactionClassifier::new();
        assert!(!classifier.dex_programs.is_empty());
        assert!(!classifier.lending_programs.is_empty());
        assert!(!classifier.staking_programs.is_empty());
        assert!(!classifier.comprehensive_programs.is_empty());
    }

    #[test]
    fn test_address_validation() {
        assert!(is_valid_solana_address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"));
        assert!(!is_valid_solana_address("invalid_address"));
        assert!(!is_valid_solana_address(""));
    }
    
    #[test]
    fn test_wsol_detection() {
        assert!(is_wrapped_sol("So11111111111111111111111111111111111111112"));
        assert!(!is_wrapped_sol("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"));
    }
}