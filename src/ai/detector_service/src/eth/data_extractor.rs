// src/data_extractor.rs

use super::config::{ETHERSCAN_API_KEY, ETHERSCAN_API_URL, MAX_TRANSACTIONS_PER_ADDRESS, ETHERSCAN_MAX_RECORDS, HTTP_OUTCALL_CYCLES}; // <-- Import constant
use super::models::{EtherscanTx, TxType, logs};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod,
};
use num_traits::ToPrimitive;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize, Debug)]
struct EtherscanResponse {
    status: String,
    message: String,
    result: Vec<EtherscanTx>,
}

pub async fn get_all_transactions(address: &str) -> Result<Vec<EtherscanTx>, String> {
    logs::add_log(format!("Fetching ETH transactions for {}...", address));
    let mut eth_txs = fetch_all_pages("txlist", address).await?;
    logs::add_log(format!("Found {} ETH transactions.", eth_txs.len()));

    logs::add_log(format!("Fetching ERC-20 transactions for {}...", address));
    let mut erc20_txs = fetch_all_pages("tokentx", address).await?;
    logs::add_log(format!("Found {} ERC-20 transactions.", erc20_txs.len()));

    let eth_tx_map: HashMap<String, EtherscanTx> = eth_txs
        .iter()
        .map(|tx| (tx.hash.clone(), tx.clone()))
        .collect();
    
    let mut all_txs: Vec<EtherscanTx> = Vec::new();
    let mut erc20_parent_hashes = std::collections::HashSet::new();

    for tx in erc20_txs.iter_mut() {
        tx.tx_type = TxType::ERC20;
        erc20_parent_hashes.insert(tx.hash.clone());
        if let Some(parent_tx) = eth_tx_map.get(&tx.hash) {
            tx.gas_used = parent_tx.gas_used.clone();
            tx.gas_price = parent_tx.gas_price.clone();
        }
        all_txs.push(tx.clone());
    }

    for tx in eth_txs.iter_mut() {
        if !erc20_parent_hashes.contains(&tx.hash) {
            tx.tx_type = TxType::ETH;
            all_txs.push(tx.clone());
        }
    }

    all_txs.sort_by_key(|tx| tx.time_stamp.parse::<u64>().unwrap_or(0));

    if all_txs.len() > MAX_TRANSACTIONS_PER_ADDRESS {
        logs::add_log(format!(
            "⚠️ Limiting to {} transactions (found {}).",
            MAX_TRANSACTIONS_PER_ADDRESS,
            all_txs.len()
        ));
        all_txs.truncate(MAX_TRANSACTIONS_PER_ADDRESS);
    }

    Ok(all_txs)
}

async fn fetch_all_pages(action: &str, address: &str) -> Result<Vec<EtherscanTx>, String> {
    let mut all_results: Vec<EtherscanTx> = Vec::new();
    let mut start_block = 0;

    loop {
        logs::add_log(format!("   Fetching {} page from block {}...", action, start_block));
        let page_results = fetch_page(address, action, start_block).await?;

        if page_results.is_empty() {
            break;
        }

        let page_len = page_results.len();
        all_results.extend(page_results);

        if all_results.len() >= MAX_TRANSACTIONS_PER_ADDRESS || page_len < ETHERSCAN_MAX_RECORDS {
            break;
        }

        if let Some(last_tx) = all_results.last() {
             start_block = last_tx.block_number.parse::<u64>().unwrap_or(0) + 1;
        } else {
            break;
        }
    }

    Ok(all_results)
}

async fn fetch_page(address: &str, action: &str, start_block: u64) -> Result<Vec<EtherscanTx>, String> {
    let url = format!(
        "{}?module=account&action={}&address={}&startblock={}&endblock=99999999&sort=asc&apikey={}",
        ETHERSCAN_API_URL, action, address, start_block, ETHERSCAN_API_KEY
    );

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2_000_000),
        transform: None,
        headers: vec![],
    };
    
    // ** THE FIX: Use the larger, centralized cycle constant **
    match http_request(request, HTTP_OUTCALL_CYCLES).await {
        Ok((response,)) => {
            let status_code = response.status.0.to_u64().unwrap_or(0);
            if status_code >= 200 && status_code < 300 {
                let body_str = String::from_utf8(response.body).map_err(|e| format!("Failed to decode response body: {}", e))?;
                let parsed: EtherscanResponse = serde_json::from_str(&body_str)
                    .map_err(|e| format!("Failed to parse Etherscan JSON: {} (body: {})", e, body_str))?;

                if parsed.status == "1" {
                    Ok(parsed.result)
                } else if parsed.message.contains("No transactions found") {
                    Ok(Vec::new())
                } else {
                    Err(format!("Etherscan API error: {}", parsed.message))
                }
            } else {
                Err(format!(
                    "HTTP request failed with status {}: {}",
                    status_code,
                    String::from_utf8_lossy(&response.body)
                ))
            }
        }
        Err((_, msg)) => Err(msg), // Return the reject message directly
    }
}