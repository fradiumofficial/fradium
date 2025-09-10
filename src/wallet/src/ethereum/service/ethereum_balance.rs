use crate::ethereum::{get_rpc_service, create_derivation_path, get_ecdsa_key_name};
use alloy::signers::{icp::IcpSigner, Signer};
use crate::shared::validate_caller_not_anonymous;
use alloy::{
    providers::{Provider, ProviderBuilder},
    transports::icp::IcpConfig,
};

#[ic_cdk::update]
pub async fn ethereum_balance() -> String {
    // Hardcoded return for testing
    // return "3200000000000000".to_string(); // 0.0032 ETH in wei

    let owner = validate_caller_not_anonymous();
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&owner);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .expect("Failed to create ICP signer for Ethereum balance");

    let address = signer.address();

    // Setup provider
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new().on_icp(config);

    // Get balance for caller's address
    let balance = provider
        .get_balance(address)
        .await
        .expect("Failed to get Ethereum balance");

    balance.to_string()
}