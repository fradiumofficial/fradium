use crate::bitcoin::{common::DerivationPath, ecdsa::get_ecdsa_public_key, BTC_CONTEXT};
use bitcoin::{Address, PublicKey};
use ic_cdk::update;
use candid::Principal;
use crate::shared::validate_caller_not_anonymous;

/// Returns a legacy P2PKH (Pay-to-PubKey-Hash) address for this smart contract.
///
/// This address uses an ECDSA public key and encodes it in the legacy Base58 format.
/// It is supported by all bitcoin wallets and full nodes.
#[update]
pub async fn bitcoin_address() -> String {
    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());
    let caller: Principal = validate_caller_not_anonymous();

    // Unique derivation paths are used for every address type generated, to ensure
    // each address has its own unique key pair.
    // Derive address index deterministically dari principal pemanggil
    let sender_index = fnv1a_u32(&caller.to_text());
    let derivation_path = DerivationPath::p2pkh(0, sender_index);

    // Get the ECDSA public key of this smart contract at the given derivation path
    let public_key = get_ecdsa_public_key(&ctx, derivation_path.to_vec_u8_path()).await;

    // Convert the public key to the format used by the Bitcoin library
    let public_key = PublicKey::from_slice(&public_key).unwrap();

    // Generate a legacy P2PKH address from the public key.
    // The address encoding (Base58) depends on the network type.
    Address::p2pkh(public_key, ctx.bitcoin_network).to_string()
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
