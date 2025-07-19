// src/lib.rs

use ic_cdk_macros::{init, update};
use shared_models::RansomwareResult;
use std::cell::RefCell;
use getrandom::{register_custom_getrandom, Error};


// --- Main Modules ---
mod address_detector;
mod btc;
mod eth;
mod shared_models;


// --- Global State & Setup ---
thread_local! {
    static RANDOM_BYTES: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

fn custom_getrandom(dest: &mut [u8]) -> Result<(), Error> {
    RANDOM_BYTES.with(|bytes_ref| {
        let mut bytes = bytes_ref.borrow_mut();
        if bytes.len() < dest.len() {
            let needed = dest.len() - bytes.len() + 32;
            let mut new_bytes = Vec::with_capacity(needed);
            for i in 0..needed {
                new_bytes.push(((i * 17 + 42) % 256) as u8);
            }
            bytes.extend_from_slice(&new_bytes);
        }
        dest.copy_from_slice(&bytes[..dest.len()]);
        bytes.drain(..dest.len());
        Ok(())
    })
}

register_custom_getrandom!(custom_getrandom);

// --- Canister Lifecycle ---
#[init]
fn init() {
    ic_cdk::println!("--- Initializing Multi-Chain Analyzer ---");
    btc::init();
    eth::init();
    ic_cdk::println!("--- Canister Initialized Successfully ---");
}

// NOTE: A combined pre/post_upgrade hook would be needed for production.

// --- Unified Public Endpoint ---
#[update]
async fn analyze_address(address: String) -> Result<RansomwareResult, String> {
    match address_detector::detect_address_type(&address) {
        address_detector::AddressType::Bitcoin => {
            ic_cdk::println!("Address detected as Bitcoin. Routing to BTC analyzer...");
            btc::analyze_btc_address(&address).await
        }
        address_detector::AddressType::Ethereum => {
            ic_cdk::println!("Address detected as Ethereum. Routing to ETH analyzer...");
            eth::analyze_eth_address(&address).await
        }
        address_detector::AddressType::Unknown => {
            Err("Address format is unknown. Not a valid BTC or ETH address.".to_string())
        }
    }
}