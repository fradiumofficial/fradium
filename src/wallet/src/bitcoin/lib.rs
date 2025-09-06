mod common;
mod ecdsa;
mod p2pkh;
pub mod service;

use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;
use std::cell::Cell;

/// Runtime configuration shared across all Bitcoin-related operations.
///
/// This struct carries network-specific context:
/// - `network`: The ICP Bitcoin API network enum.
/// - `bitcoin_network`: The corresponding network enum from the `bitcoin` crate, used
///   for address formatting and transaction construction.
/// - `key_name`: The global ECDSA key name used when requesting derived keys or making
///   signatures. Different key names are used locally and when deployed on the IC.
///
/// Note: Both `network` and `bitcoin_network` are needed because ICP and the
/// Bitcoin library use distinct network enum types.
#[derive(Clone, Copy)]
pub struct BitcoinContext {
    pub network: BitcoinNetwork,
    pub bitcoin_network: bitcoin::Network,
    pub key_name: &'static str,
}

// Global, thread-local instance of the Bitcoin context.
// This is initialized at smart contract init/upgrade time and reused across all API calls.
thread_local! {
    static BTC_CONTEXT: Cell<BitcoinContext> = const {
        Cell::new(BitcoinContext {
            network: BitcoinNetwork::Testnet,
            bitcoin_network: bitcoin::Network::Testnet,
            key_name: "key_1",
        })
    };
}

/// Internal shared init logic used both by init and post-upgrade hooks.
fn init_upgrade(network: BitcoinNetwork) {
    let key_name = match network {
        BitcoinNetwork::Regtest => "dfx_test_key",
        BitcoinNetwork::Mainnet | BitcoinNetwork::Testnet => "key_1",
    };

    let bitcoin_network = match network {
        BitcoinNetwork::Mainnet => bitcoin::Network::Bitcoin,
        BitcoinNetwork::Testnet => bitcoin::Network::Testnet,
        BitcoinNetwork::Regtest => bitcoin::Network::Regtest,
    };

    BTC_CONTEXT.with(|ctx| {
        ctx.set(BitcoinContext {
            network,
            bitcoin_network,
            key_name,
        })
    });
}

/// Initialize Bitcoin module context.
pub fn bitcoin_init(network: BitcoinNetwork) {
    init_upgrade(network);
}

/// Reinitialize Bitcoin module context after upgrade.
pub fn bitcoin_post_upgrade(network: BitcoinNetwork) {
    init_upgrade(network);
}

/// Input structure for sending Bitcoin.
/// Used across P2PKH, P2WPKH, and P2TR transfer endpoints.
#[derive(candid::CandidType, candid::Deserialize)]
pub struct SendRequest {
    pub destination_address: String,
    pub amount_in_satoshi: u64,
}

/// Return the current Bitcoin network as a friendly string based on init/post-upgrade settings.
pub fn current_network_name() -> &'static str {
    BTC_CONTEXT.with(|ctx| match ctx.get().network {
        BitcoinNetwork::Mainnet => "mainnet",
        BitcoinNetwork::Testnet => "testnet",
        BitcoinNetwork::Regtest => "regtest",
    })
}