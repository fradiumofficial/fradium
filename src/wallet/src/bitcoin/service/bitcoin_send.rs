use crate::bitcoin::{
    common::{get_fee_per_byte, DerivationPath, PrimaryOutput},
    ecdsa::{get_ecdsa_public_key, sign_with_ecdsa},
    p2pkh::{self},
    SendRequest, BTC_CONTEXT,
};
use bitcoin::{consensus::serialize, Address, PublicKey};
use ic_cdk::{
    api::management_canister::bitcoin::{
        bitcoin_get_utxos, bitcoin_send_transaction, GetUtxosRequest, SendTransactionRequest,
    },
    trap, update,
};
use candid::Principal;
use crate::shared::validate_caller_not_anonymous;
use std::str::FromStr;
use crate::Delegation;
use crate::{list_delegations};

/// Sends the given amount of bitcoin from this smart contract's P2PKH address to the given address.
/// Returns the transaction ID.
#[update]
pub async fn bitcoin_send(request: SendRequest) -> String {
    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());

    if request.amount_in_satoshi == 0 {
        trap("Amount must be greater than 0");
    }
    let caller: Principal = validate_caller_not_anonymous();

    let dst_address = Address::from_str(&request.destination_address)
        .unwrap()
        .require_network(ctx.bitcoin_network)
        .unwrap();

    // Derive address index deterministically from the caller principal string
    let sender_index = fnv1a_u32(&caller.to_text());
    let derivation_path = DerivationPath::p2pkh(0, sender_index);

    let own_public_key = get_ecdsa_public_key(&ctx, derivation_path.to_vec_u8_path()).await;

    let own_public_key = PublicKey::from_slice(&own_public_key).unwrap();

    let own_address = Address::p2pkh(own_public_key, ctx.bitcoin_network);

    let (utxos_resp,) = bitcoin_get_utxos(GetUtxosRequest {
        address: own_address.to_string(),
        network: ctx.network,
        filter: None,
    })
    .await
    .unwrap();
    let own_utxos = utxos_resp.utxos;

    let fee_per_byte = get_fee_per_byte(&ctx).await;
    let transaction = p2pkh::build_transaction(
        &ctx,
        &own_public_key,
        &own_address,
        &own_utxos,
        &PrimaryOutput::Address(dst_address, request.amount_in_satoshi),
        fee_per_byte,
    )
    .await;

    let signed_transaction = p2pkh::sign_transaction(
        &ctx,
        &own_public_key,
        &own_address,
        transaction,
        derivation_path.to_vec_u8_path(),
        sign_with_ecdsa,
    )
    .await;

    bitcoin_send_transaction(SendTransactionRequest {
        network: ctx.network,
        transaction: serialize(&signed_transaction),
    })
    .await
    .unwrap();

    signed_transaction.compute_txid().to_string()
}
/// Delegated send: backend (delegate) can send on behalf of `user` if user granted delegation
#[update]
pub async fn bitcoin_send_delegated(user: Principal, request: SendRequest) -> String {
    if ic_cdk::caller() == Principal::anonymous() { trap("Anonymous not allowed"); }
    // verify delegation scope
    let delegations = list_delegations(Some(user));
    let scope_ok = delegations.iter().any(|d| d.delegate == ic_cdk::caller() && d.scopes.iter().any(|s| s == "btc:send") && d.expires_at_nanos > ic_cdk::api::time() as u64);
    if !scope_ok { trap("Delegation not found or expired for scope btc:send"); }

    // Re-use same flow as bitcoin_send but derive from user's address space via principal user
    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());
    if request.amount_in_satoshi == 0 { trap("Amount must be greater than 0"); }

    let dst_address = Address::from_str(&request.destination_address)
        .unwrap()
        .require_network(ctx.bitcoin_network)
        .unwrap();

    // Derive address index from the user principal (not caller)
    let sender_index = fnv1a_u32(&user.to_text());
    let derivation_path = DerivationPath::p2pkh(0, sender_index);

    let own_public_key = get_ecdsa_public_key(&ctx, derivation_path.to_vec_u8_path()).await;
    let own_public_key = PublicKey::from_slice(&own_public_key).unwrap();
    let own_address = Address::p2pkh(own_public_key, ctx.bitcoin_network);

    let (utxos_resp,) = bitcoin_get_utxos(GetUtxosRequest {
        address: own_address.to_string(),
        network: ctx.network,
        filter: None,
    })
    .await
    .unwrap();
    let own_utxos = utxos_resp.utxos;

    let fee_per_byte = get_fee_per_byte(&ctx).await;
    let transaction = p2pkh::build_transaction(
        &ctx,
        &own_public_key,
        &own_address,
        &own_utxos,
        &PrimaryOutput::Address(dst_address, request.amount_in_satoshi),
        fee_per_byte,
    )
    .await;

    let signed_transaction = p2pkh::sign_transaction(
        &ctx,
        &own_public_key,
        &own_address,
        transaction,
        derivation_path.to_vec_u8_path(),
        sign_with_ecdsa,
    )
    .await;

    bitcoin_send_transaction(SendTransactionRequest {
        network: ctx.network,
        transaction: serialize(&signed_transaction),
    })
    .await
    .unwrap();

    signed_transaction.compute_txid().to_string()
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
