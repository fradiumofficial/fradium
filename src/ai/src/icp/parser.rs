use ic_cdk::prelude::*;
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct ICRCTransaction {
    pub kind: String,
    pub timestamp: u64,
    pub burn: Option<BurnOperation>,
    pub mint: Option<MintOperation>,
    pub transfer: Option<TransferOperation>,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct BurnOperation {
    pub amount: u64,
    pub from: ICRCAccount,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct MintOperation {
    pub amount: u64,
    pub to: ICRCAccount,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct TransferOperation {
    pub amount: u64,
    pub from: ICRCAccount,
    pub to: ICRCAccount,
    pub fee: Option<u64>,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct ICRCAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct GetTransactionsRequest {
    pub start: u64,
    pub length: u64,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct GetTransactionsResponse {
    pub log_length: u64,
    pub transactions: Vec<TransactionWithId>,
    pub archived_transactions: Vec<ArchivedTransaction>,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct TransactionWithId {
    pub id: u64,
    pub transaction: ICRCTransaction,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct ArchivedTransaction {
    pub start: u64,
    pub length: u64,
    pub callback: QueryCallback,
}

#[derive(Debug, Clone, CandidType, Serialize, Deserialize)]
pub struct QueryCallback {
    pub canister_id: Principal,
    pub method: String,
}

use crate::{TransactionData, TokenConfig};

pub struct ICRCTransactionParser;

impl ICRCTransactionParser {
    pub async fn get_user_transactions(
        principal: Principal,
        token_config: &TokenConfig,
    ) -> Result<Vec<TransactionData>, String> {
        let mut all_transactions = Vec::new();
        let mut start_index = 0;
        let batch_size = 200;
        let max_batches = 5; // Limit batches to prevent timeout

        for batch in 0..max_batches {
            let request = GetTransactionsRequest {
                start: start_index,
                length: batch_size,
            };

            let response: Result<(GetTransactionsResponse,), _> = ic_cdk::call(
                token_config.ledger_canister,
                "get_transactions",
                (request,),
            ).await;

            match response {
                Ok((txs_response,)) => {
                    let relevant_txs = Self::filter_user_transactions(
                        principal,
                        &txs_response.transactions,
                        &token_config.symbol,
                    );

                    if relevant_txs.is_empty() && all_transactions.len() > 0 {
                        // No more relevant transactions
                        break;
                    }

                    all_transactions.extend(relevant_txs);
                    start_index += batch_size;

                    // Handle archived transactions if present
                    for archived in &txs_response.archived_transactions {
                        if let Ok(archived_txs) = Self::get_archived_transactions(
                            principal,
                            archived,
                            &token_config.symbol,
                        ).await {
                            all_transactions.extend(archived_txs);
                        }
                    }
                }
                Err(e) => {
                    ic_cdk::println!("Failed to get transactions batch {}: {:?}", batch, e);
                    break;
                }
            }
        }

        Ok(all_transactions)
    }

    fn filter_user_transactions(
        target_principal: Principal,
        transactions: &[TransactionWithId],
        token_symbol: &str,
    ) -> Vec<TransactionData> {
        let mut filtered_txs = Vec::new();

        for tx_with_id in transactions {
            let tx = &tx_with_id.transaction;

            // Check transfer operations
            if let Some(transfer) = &tx.transfer {
                if transfer.from.owner == target_principal || transfer.to.owner == target_principal {
                    let is_outgoing = transfer.from.owner == target_principal;
                    let is_incoming = transfer.to.owner == target_principal;

                    let counterparty = if is_outgoing {
                        transfer.to.owner.to_text()
                    } else {
                        transfer.from.owner.to_text()
                    };

                    filtered_txs.push(TransactionData {
                        tx_type: "transfer".to_string(),
                        timestamp: tx.timestamp,
                        from_address: transfer.from.owner.to_text(),
                        to_address: transfer.to.owner.to_text(),
                        amount: transfer.amount,
                        fee: transfer.fee.unwrap_or(0),
                        is_outgoing,
                        is_incoming,
                        token_symbol: token_symbol.to_string(),
                    });
                }
            }

            // Check mint operations
            if let Some(mint) = &tx.mint {
                if mint.to.owner == target_principal {
                    filtered_txs.push(TransactionData {
                        tx_type: "mint".to_string(),
                        timestamp: tx.timestamp,
                        from_address: "system".to_string(),
                        to_address: mint.to.owner.to_text(),
                        amount: mint.amount,
                        fee: 0,
                        is_outgoing: false,
                        is_incoming: true,
                        token_symbol: token_symbol.to_string(),
                    });
                }
            }

            // Check burn operations
            if let Some(burn) = &tx.burn {
                if burn.from.owner == target_principal {
                    filtered_txs.push(TransactionData {
                        tx_type: "burn".to_string(),
                        timestamp: tx.timestamp,
                        from_address: burn.from.owner.to_text(),
                        to_address: "system".to_string(),
                        amount: burn.amount,
                        fee: 0,
                        is_outgoing: true,
                        is_incoming: false,
                        token_symbol: token_symbol.to_string(),
                    });
                }
            }
        }

        filtered_txs
    }

    async fn get_archived_transactions(
        target_principal: Principal,
        archived: &ArchivedTransaction,
        token_symbol: &str,
    ) -> Result<Vec<TransactionData>, String> {
        let request = GetTransactionsRequest {
            start: archived.start,
            length: archived.length.min(100), // Limit archived batch size
        };

        let response: Result<(GetTransactionsResponse,), _> = ic_cdk::call(
            archived.callback.canister_id,
            &archived.callback.method,
            (request,),
        ).await;

        match response {
            Ok((txs_response,)) => {
                Ok(Self::filter_user_transactions(
                    target_principal,
                    &txs_response.transactions,
                    token_symbol,
                ))
            }
            Err(e) => {
                ic_cdk::println!("Failed to get archived transactions: {:?}", e);
                Ok(Vec::new())
            }
        }
    }

    pub async fn discover_active_users(
        ledger_canister: Principal,
        max_users: usize,
    ) -> Result<Vec<Principal>, String> {
        let mut discovered_principals = std::collections::HashSet::new();
        let mut start_index = 0;
        let batch_size = 500;
        let max_batches = 20; // Limit to prevent timeout

        for batch in 0..max_batches {
            if discovered_principals.len() >= max_users {
                break;
            }

            let request = GetTransactionsRequest {
                start: start_index,
                length: batch_size,
            };

            let response: Result<(GetTransactionsResponse,), _> = ic_cdk::call(
                ledger_canister,
                "get_transactions",
                (request,),
            ).await;

            match response {
                Ok((txs_response,)) => {
                    if txs_response.transactions.is_empty() {
                        break; // No more transactions
                    }

                    for tx_with_id in &txs_response.transactions {
                        let tx = &tx_with_id.transaction;

                        // Extract principals from transfers
                        if let Some(transfer) = &tx.transfer {
                            if Self::is_valid_user_principal(transfer.from.owner) {
                                discovered_principals.insert(transfer.from.owner);
                            }
                            if Self::is_valid_user_principal(transfer.to.owner) {
                                discovered_principals.insert(transfer.to.owner);
                            }
                        }

                        // Extract principals from mints
                        if let Some(mint) = &tx.mint {
                            if Self::is_valid_user_principal(mint.to.owner) {
                                discovered_principals.insert(mint.to.owner);
                            }
                        }

                        // Extract principals from burns
                        if let Some(burn) = &tx.burn {
                            if Self::is_valid_user_principal(burn.from.owner) {
                                discovered_principals.insert(burn.from.owner);
                            }
                        }

                        if discovered_principals.len() >= max_users {
                            break;
                        }
                    }

                    start_index += batch_size;
                }
                Err(e) => {
                    ic_cdk::println!("Failed to discover users batch {}: {:?}", batch, e);
                    break;
                }
            }
        }

        Ok(discovered_principals.into_iter().take(max_users).collect())
    }

    fn is_valid_user_principal(principal: Principal) -> bool {
        let text = principal.to_text();
        
        // Filter out system accounts and anonymous
        let system_accounts = [
            "rrkah-fqaaa-aaaaa-aaaaq-cai",
            "ryjl3-tyaaa-aaaaa-aaaba-cai",
            "mxzaz-hqaaa-aaaar-qaada-cai",
            "ss2fx-dyaaa-aaaar-qacoq-cai",
            "xevnm-gaaaa-aaaar-qafnq-cai",
            "uf6dk-hyaaa-aaaaq-qaaaq-cai",
        ];

        !system_accounts.contains(&text.as_str()) 
            && principal != Principal::anonymous()
            && text.len() > 20
            && text.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    }
}