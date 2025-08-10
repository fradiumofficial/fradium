pub mod service;

use alloy::transports::icp::{RpcApi, RpcService};
use candid::{Nat, Principal};
use ic_cdk::export_candid;
use crate::service::eth_get_transaction::TxRecordDto;
use serde_bytes::ByteBuf;

// ICP uses different ECDSA key names for mainnet and local
// development.
pub(crate) fn get_ecdsa_key_name() -> String {
    #[allow(clippy::option_env_unwrap)]
    let dfx_network = option_env!("DFX_NETWORK").unwrap();
    match dfx_network {
        "local" => "dfx_test_key".to_string(),
        // "ic" => "key_1".to_string(),

        // Currently using sepolia for local and ic
        "ic" => "dfx_test_key".to_string(),

        _ => panic!("Unsupported network."),
    }
}

// Modify this function to determine which EVM network canister connects to
pub(crate) fn get_rpc_service() -> RpcService {
    // RpcService::EthSepolia(EthSepoliaService::Alchemy)
    // RpcService::EthMainnet(EthMainnetService::Alchemy)
    // RpcService::BaseMainnet(L2MainnetService::Alchemy)
    // RpcService::OptimismMainnet(L2MainnetService::Alchemy)
    // RpcService::ArbitrumOne(L2MainnetService::Alchemy)
    RpcService::Custom(RpcApi {
        url: "https://ic-alloy-evm-rpc-proxy.kristofer-977.workers.dev/eth-sepolia".to_string(),
        headers: None,
    })
}

// The derivation path determines the Ethereum address generated
// by the signer.
pub(crate) fn create_derivation_path(principal: &Principal) -> Vec<Vec<u8>> {
    const SCHEMA_V1: u8 = 1;
    [
        ByteBuf::from(vec![SCHEMA_V1]),
        ByteBuf::from(principal.as_slice().to_vec()),
    ]
    .iter()
    .map(|x| x.to_vec())
    .collect()
}

pub(crate) fn auth_guard() -> Result<(), String> {
    match ic_cdk::caller() {
        caller if caller == Principal::anonymous() => {
            Err("Calls with the anonymous principal are not allowed.".to_string())
        }
        _ => Ok(()),
    }
}

export_candid!();