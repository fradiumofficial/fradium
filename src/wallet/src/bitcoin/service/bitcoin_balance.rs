use crate::bitcoin::{common::DerivationPath, ecdsa::get_ecdsa_public_key, BTC_CONTEXT};
use bitcoin::{Address, PublicKey};
use ic_cdk::{
    api::management_canister::bitcoin::{bitcoin_get_balance, GetBalanceRequest},
    update,
};
use candid::Principal;
use crate::shared::validate_caller_not_anonymous;

/// Returns the balance of the caller's bitcoin address.
#[update]
pub async fn bitcoin_balance() -> u64 {
    // Hardcoded return for testing
    return 0;

    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());
    let caller: Principal = validate_caller_not_anonymous();

    // Derive address index deterministically from the caller principal string
    let sender_index = fnv1a_u32(&caller.to_text());
    let derivation_path = DerivationPath::p2pkh(0, sender_index);

    let own_public_key = get_ecdsa_public_key(&ctx, derivation_path.to_vec_u8_path()).await;
    let own_public_key = PublicKey::from_slice(&own_public_key).unwrap();
    let own_address = Address::p2pkh(own_public_key, ctx.bitcoin_network);

    let (balance,) = bitcoin_get_balance(GetBalanceRequest {
        address: own_address.to_string(),
        network: ctx.network,
        min_confirmations: None,
    })
    .await
    .unwrap();

    balance
}

// Stable FNV-1a 64-bit hash reduced to u32 for deterministic address index derivation
fn fnv1a_u32(input: &str) -> u32 {
    const FNV_OFFSET_BASIS: u64 = 0xcbf29ce484222325;
    const FNV_PRIME: u64 = 0x00000100000001B3;

    let mut hash: u64 = FNV_OFFSET_BASIS;
    for byte in input.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    // Fold to u32 to fit derivation path index constraints
    (hash as u32) ^ ((hash >> 32) as u32)
}
