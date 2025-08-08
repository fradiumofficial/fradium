//! This module provides functions for getting ETH balance by address.
//! It uses available EVM RPC methods to query balance information.

use candid::CandidType;
use ic_cdk::query;
use serde::Serialize;
use ethers_core::abi::ethereum_types::Address;
use ethers_core::types::U256;
use evm_rpc_canister_types::{EvmRpcCanister, RpcServices};
use std::str::FromStr;

/// Represents the balance information for an Ethereum address
#[derive(CandidType, Serialize, Debug)]
pub struct BalanceReply {
    pub address: String,
    pub balance_wei: String,
    pub balance_eth: String,
}

/// Gets the ETH balance for a given address using eth_get_balance method.
/// This implementation uses the supported EVM RPC methods.
///
/// # Arguments
///
/// * `address` - The Ethereum address to check balance for
///
/// # Returns
///
/// Balance information including address, balance in wei and ETH
#[query]
pub async fn get_balance_by_address(address: String) -> Result<BalanceReply, String> {
    // Validate address format
    let eth_address = Address::from_str(&address)
        .map_err(|e| format!("Invalid address format: {}", e))?;
    
    // Setup RPC services for Sepolia testnet
    let rpc_services = RpcServices::EthSepolia(None);
    
    // Get EVM RPC canister
    let evm_rpc = EvmRpcCanister(candid::Principal::from_text("u6s2n-gx777-77774-qaaba-cai").unwrap());
    
    let cycles = 10_000_000_000;
    
    match evm_rpc
        .eth_get_balance(rpc_services, None, address.clone(), cycles)
        .await
    {
        Ok((result,)) => {
            // Parse the result - result is a hex string representing balance in wei
            let balance_wei = U256::from_str(&result)
                .unwrap_or_else(|_| U256::from(0));
            
            // Convert wei to ETH (1 ETH = 10^18 wei)
            let balance_eth = balance_wei.as_u128() as f64 / 1e18;
            
            Ok(BalanceReply {
                address,
                balance_wei: balance_wei.to_string(),
                balance_eth: format!("{:.18}", balance_eth),
            })
        }
        Err(e) => Err(format!("Failed to get balance via eth_get_balance: {:?}", e)),
    }
}