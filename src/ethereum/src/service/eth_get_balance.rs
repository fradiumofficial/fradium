use crate::get_rpc_service;
use alloy::{
    primitives::Address,
    providers::{Provider, ProviderBuilder},
    transports::icp::IcpConfig,
};

#[ic_cdk::update]
pub async fn get_balance(address: String) -> Result<String, String> {
    // Setup provider
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new().on_icp(config);

    // Get balance for address
    let address = Address::parse_checksummed(address, None).map_err(|e| e.to_string())?;
    let result = provider.get_balance(address).await;

    match result {
        Ok(balance) => Ok(balance.to_string()),
        Err(e) => Err(e.to_string()),
    }
}