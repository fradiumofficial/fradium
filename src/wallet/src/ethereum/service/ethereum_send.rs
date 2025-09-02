use std::{cell::RefCell, collections::HashMap};

use crate::ethereum::{create_derivation_path, get_ecdsa_key_name, get_rpc_service};
use alloy::{
    network::{EthereumWallet, TransactionBuilder, TxSigner},
    primitives::{Address, U256},
    providers::{Provider, ProviderBuilder},
    rpc::types::request::TransactionRequest,
    signers::icp::IcpSigner,
    transports::icp::IcpConfig,
};
use candid::Nat;
use crate::shared::validate_caller_not_anonymous;
use candid::Principal;

// To minimize the number of nonce requests, we store the latest nonce for each wallet
// address in a thread-local HashMap.
thread_local! {
    static ADDRESS_NONCES: RefCell<HashMap<Address, u64>> = RefCell::new(HashMap::new());
}

#[ic_cdk::update]
pub async fn ethereum_send(to_address: String, amount: Nat) -> String {
    let caller: Principal = validate_caller_not_anonymous();

    // From address is the method caller
    let from_principal = caller;

    // Make sure we have a correct to address
    let to_address = Address::parse_checksummed(to_address, None).expect("Invalid destination address");

    // Setup signer
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&from_principal);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .expect("Failed to create ICP signer for Ethereum transaction");
    let from_address = signer.address();

    // Setup provider
    let wallet = EthereumWallet::from(signer);
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new()
        .with_gas_estimation()
        .wallet(wallet)
        .on_icp(config);

    // Attempt to get nonce from thread-local storage
    let maybe_nonce = ADDRESS_NONCES.with_borrow(|nonces| {
        // If a nonce exists, the next nonce to use is latest nonce + 1
        nonces.get(&from_address).map(|nonce| nonce + 1)
    });

    // If no nonce exists, get it from the provider
    let nonce = if let Some(nonce) = maybe_nonce {
        nonce
    } else {
        provider
            .get_transaction_count(from_address)
            .await
            .unwrap_or(0)
    };

    // Create transaction
    let transaction_request = TransactionRequest::default()
        .with_to(to_address)
        .with_value(U256::from_le_slice(amount.0.to_bytes_le().as_slice()))
        .with_nonce(nonce)
        .with_gas_limit(21_000)
        .with_chain_id(11155111);

    // Send transaction
    let pending_tx_builder = provider
        .send_transaction(transaction_request.clone())
        .await
        .expect("Failed to send Ethereum transaction");

    let tx_hash = *pending_tx_builder.tx_hash();
    let tx_response = provider
        .get_transaction_by_hash(tx_hash)
        .await
        .expect("Failed to fetch transaction by hash");

    if let Some(tx) = tx_response {
        ADDRESS_NONCES.with_borrow_mut(|nonces| {
            nonces.insert(from_address, tx.nonce);
        });
        format!("{:?}", tx)
    } else {
        panic!("Could not get transaction.");
    }
}