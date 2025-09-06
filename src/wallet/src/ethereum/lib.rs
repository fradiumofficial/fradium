pub mod service;

use alloy::transports::icp::{RpcApi, RpcService};
use candid::Principal;
use serde_bytes::ByteBuf;

// ICP uses different ECDSA key names for mainnet and local
// development.
pub(crate) fn get_ecdsa_key_name() -> String {
    #[allow(clippy::option_env_unwrap)]
    let dfx_network = option_env!("DFX_NETWORK").unwrap();
    match dfx_network {
        "local" => "dfx_test_key".to_string(),
        "ic" => "test_key_1".to_string(),
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

/// Return the current Ethereum network as a friendly string inferred from RPC service.
pub fn current_network_name() -> String {
    let service = get_rpc_service();
    match service {
        RpcService::Custom(api) => {
            let url = api.url.to_lowercase();
            if url.contains("sepolia") {
                "sepolia".to_string()
            } else if url.contains("goerli") {
                "goerli".to_string()
            } else if url.contains("mainnet") || url.contains("eth-mainnet") {
                "mainnet".to_string()
            } else {
                "custom".to_string()
            }
        }
        _ => "mainnet".to_string(),
    }
}
