use crate::ethereum::get_rpc_service;
use alloy::{
    primitives::Address,
    providers::{Provider, ProviderBuilder},
    transports::icp::IcpConfig,
};

use crate::shared::validate_caller_not_anonymous;

#[ic_cdk::update]
pub async fn ethereum_balance(address: String) -> String {
    validate_caller_not_anonymous();

    // Setup provider
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new().on_icp(config);

    // Get balance for address
    let address = Address::parse_checksummed(address, None)
        .expect("Invalid Ethereum address");
    let balance = provider
        .get_balance(address)
        .await
        .expect("Failed to get Ethereum balance");

    balance.to_string()
}