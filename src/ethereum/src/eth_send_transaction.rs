//! This module provides functions for sending raw transactions to the Ethereum Virtual Machine (EVM).
//! It includes functions for transferring ETH from one account to another and interacting with smart contracts.
//! The transactions are signed using t-ECDSA and sent via the EVM RPC canister.
use candid::CandidType;
use serde::Serialize;
use ethers_core::abi::{Address, Contract, Function, FunctionExt, Token};
use ethers_core::types::{Eip1559TransactionRequest, NameOrAddress, U256, U64};
use evm_rpc_canister_types::{EvmRpcCanister, RpcServices};
use ic_cdk::api::call::CallResult;
use ic_cdk::api::management_canister::ecdsa::{EcdsaKeyId, EcdsaCurve};
use ic_cdk::{update, caller};

use std::str::FromStr;

use crate::evm_signer::SignedTransaction;
use crate::{
    evm_signer::sign_eip1559_transaction,
    fees::{estimate_transaction_fees, FeeEstimates},
};

/// Represents the internal transfer arguments for the transfer function.
pub struct InternalTransferArgs {
    pub value: U256,
    pub to: Option<NameOrAddress>,
    pub gas: Option<U256>,
}

/// Transfer arguments for easy use
#[derive(CandidType, Serialize, serde::Deserialize, Debug)]
pub struct TransferArgs {
    pub to_address: String,
    pub amount_wei: String,
}

pub type TransactionHash = String;

/// Transfers ETH from one account to another on Sepolia testnet.
///
/// # Arguments
///
/// * `args` - Transfer arguments containing target address and amount in wei
///
/// # Returns
///
/// Transaction hash of the transfer
#[update]
async fn transfer_eth(args: TransferArgs) -> Result<TransactionHash, String> {
    let caller_id = caller();
    
    // Convert caller ID to bytes for derivation path (same as eth_get_address)
    let caller_bytes = caller_id.as_slice();
    let derivation_path = vec![caller_bytes.to_vec()];
    
    // Setup for Sepolia testnet
    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: "dfx_test_key".to_string(),
    };
    
    // Parse amount from string to U256
    let amount = U256::from_str(&args.amount_wei)
        .map_err(|e| format!("Invalid amount format: {}", e))?;
    
    // Parse target address
    let to_address = Address::from_str(&args.to_address)
        .map_err(|e| format!("Invalid address format: {}", e))?;
    
    // Setup RPC services for Sepolia (chain_id = 11155111)
    let rpc_services = RpcServices::EthSepolia(None);
    
    // Get EVM RPC canister
    let evm_rpc = EvmRpcCanister(candid::Principal::from_text("u6s2n-gx777-77774-qaaba-cai").unwrap());
    
    // Create transfer args
    let transfer_args = InternalTransferArgs {
        value: amount,
        to: Some(NameOrAddress::Address(to_address)),
        gas: None, // Use default gas limit
    };
    
    // Get nonce (you might want to implement proper nonce management)
    let nonce = U256::from(0); // This should be fetched from the network
    
    // use the user provided gas_limit or fallback to default 210000
    let gas = transfer_args.gas.unwrap_or(U256::from(21000));
    // estimate the transaction fees by calling eth_feeHistory
    let FeeEstimates {
        max_fee_per_gas,
        max_priority_fee_per_gas,
    } = estimate_transaction_fees(9, rpc_services.clone(), evm_rpc.clone()).await;
    // assemble the EIP 1559 transaction to be signed with t-ECDSA
    let tx = Eip1559TransactionRequest {
        from: None,
        to: transfer_args.to,
        value: Some(transfer_args.value),
        max_fee_per_gas: Some(max_fee_per_gas),
        max_priority_fee_per_gas: Some(max_priority_fee_per_gas),
        gas: Some(gas),
        nonce: Some(nonce),
        chain_id: Some(rpc_services.chain_id()),
        data: Default::default(),
        access_list: Default::default(),
    };

    let tx = sign_eip1559_transaction(tx, key_id, derivation_path).await;

    send_raw_transaction(tx.clone(), rpc_services, evm_rpc)
        .await
        .map_err(|e| format!("Transfer failed: {:?}", e))
}

/// Represents the details of a contract including the contract address, ABI, function name, and arguments.
pub struct ContractDetails<'a> {
    pub contract_address: String,
    pub abi: &'a Contract,
    pub function_name: &'a str,
    pub args: &'a [Token],
}

/// Gets the function from the contract details.
///
/// # Arguments
///
/// * `contract_details` - The contract details including the contract address, ABI, function name, and arguments.
///
/// # Returns
///
/// The function from the contract details.
///
/// # Panics
///
/// If there are multiple functions with the same name.
/// If the function is not found.
pub fn get_function<'a>(contract_details: &'a ContractDetails<'a>) -> &'a Function {
    match contract_details
        .abi
        .functions_by_name(contract_details.function_name)
        .map(|v| &v[..])
    {
        Ok([f]) => f,
        Ok(fs) => panic!(
            "Found {} function overloads. Please pass one of the following: {}",
            fs.len(),
            fs.iter()
                .map(|f| format!("{:?}", f.abi_signature()))
                .collect::<Vec<_>>()
                .join(", ")
        ),
        Err(_) => contract_details
            .abi
            .functions()
            .find(|f| contract_details.function_name == f.abi_signature())
            .expect("Function not found"),
    }
}

/// Gets the data from the function and contract details.
///
/// # Arguments
///
/// * `function` - The function from the contract details.
/// * `contract_details` - The contract details including the contract address, ABI, function name, and arguments.
///
/// # Returns
///
/// The data from the function and contract details.
///
/// # Panics
///
/// If there is an error while encoding the input arguments.
/// If the contract address is invalid.
pub fn get_data<'a>(function: &Function, contract_details: &'a ContractDetails<'a>) -> Vec<u8> {
    function
        .encode_input(contract_details.args)
        .expect("Error while encoding input args")
}

/// Interacts with a contract.
///
/// # Arguments
///
/// * `contract_details` - The contract details including the contract address, ABI, function name, and arguments.
/// * `gas` - The gas limit for the transaction.
/// * `rpc_services` - The RPC services used to interact with the EVM.
/// * `nonce` - The nonce of the sender's account.
/// * `key_id` - The ID of the ECDSA key used for signing the transaction.
/// * `derivation_path` - The derivation path of the ECDSA key.
/// * `evm_rpc` - The EVM RPC canister used to send the transaction.
///
/// # Returns
///
/// The transaction hash CallResult.
pub async fn contract_interaction(
    contract_details: ContractDetails<'_>,
    gas: Option<U256>,
    rpc_services: RpcServices,
    nonce: U256,
    key_id: EcdsaKeyId,
    derivation_path: Vec<Vec<u8>>,
    evm_rpc: EvmRpcCanister,
) -> CallResult<TransactionHash> {
    let function = get_function(&contract_details);
    let data = get_data(function, &contract_details);

    let FeeEstimates {
        max_fee_per_gas,
        max_priority_fee_per_gas,
    } = estimate_transaction_fees(9, rpc_services.clone(), evm_rpc.clone()).await;

    // assemble the transaction
    let tx = Eip1559TransactionRequest {
        to: Some(
            Address::from_str(&contract_details.contract_address)
                .expect("should be a valid address")
                .into(),
        ),
        gas,
        data: Some(data.into()),
        nonce: Some(nonce),
        max_priority_fee_per_gas: Some(max_priority_fee_per_gas),
        max_fee_per_gas: Some(max_fee_per_gas),
        chain_id: Some(rpc_services.chain_id()),
        from: Default::default(),
        value: Default::default(),
        access_list: Default::default(),
    };

    // sign the transaction using chain key signatures
    let tx = sign_eip1559_transaction(tx, key_id, derivation_path).await;

    // send the transaction via the EVM RPC canister
    send_raw_transaction(tx, rpc_services, evm_rpc).await
}

/// Sends a raw transaction to the EVM.
///
/// # Arguments
///
/// * `tx` - The raw transaction to send.
/// * `rpc_services` - The RPC services used to interact with the EVM.
/// * `evm_rpc` - The EVM RPC canister used to send the transaction.
///
/// # Returns
///
/// CallResult containing the transaction hash.
pub async fn send_raw_transaction(
    tx: SignedTransaction,
    rpc_services: RpcServices,
    evm_rpc: EvmRpcCanister,
) -> CallResult<TransactionHash> {
    let cycles = 10_000_000_000;

    match evm_rpc
        .eth_send_raw_transaction(rpc_services, None, tx.tx_hex, cycles)
        .await
    {
        Ok((_res,)) => {
            ic_cdk::println!("Transaction hash: {}", tx.tx_hash);
            Ok(tx.tx_hash)
        }
        Err(e) => Err(e),
    }
}

/// Trait for converting RPC services to chain ID.
pub trait IntoChainId {
    fn chain_id(&self) -> U64;
}

/// Implements the conversion of RPC services to chain ID.
impl IntoChainId for RpcServices {
    fn chain_id(&self) -> U64 {
        match self {
            RpcServices::EthSepolia(_) => U64::from(11155111),
            RpcServices::Custom {
                chainId,
                services: _,
            } => U64::from(*chainId),
            RpcServices::EthMainnet(_) => U64::from(1),
            RpcServices::ArbitrumOne(_) => U64::from(42161),
            RpcServices::OptimismMainnet(_) => U64::from(10),
            RpcServices::BaseMainnet(_) => U64::from(8453),
        }
    }
}