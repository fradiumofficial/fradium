// src/lib.rs

use candid::{CandidType, Deserialize};
use ic_cdk::storage;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, update};
use std::cell::RefCell;
use std::collections::HashMap;
use getrandom::{register_custom_getrandom, Error};

// --- Main Modules ---
mod address_detector;
mod btc;
mod eth;
mod shared_models;
use shared_models::RansomwareResult;

// --- A single, unified state for the entire canister ---
// FIX: Add Clone trait
#[derive(CandidType, Deserialize, Clone)]
struct CanisterState {
    btc_metadata: btc::models::ModelMetadata,
    eth_metadata: eth::models::ModelMetadata,
    price_cache: HashMap<String, f64>,
    token_price_cache: HashMap<String, f64>,
    token_info_cache: HashMap<String, eth::models::TokenInfo>,
}

impl Default for CanisterState {
    fn default() -> Self {
        Self {
            btc_metadata: btc::models::ModelMetadata::default(),
            eth_metadata: eth::models::ModelMetadata::default(),
            price_cache: HashMap::new(),
            token_price_cache: HashMap::new(),
            token_info_cache: HashMap::new(),
        }
    }
}

// Global state is defined here
thread_local! {
    pub static STATE: RefCell<CanisterState> = RefCell::new(CanisterState::default());
    static RANDOM_BYTES: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

fn custom_getrandom(dest: &mut [u8]) -> Result<(), Error> {
    RANDOM_BYTES.with(|bytes_ref| {
        let mut bytes = bytes_ref.borrow_mut();
        if bytes.len() < dest.len() {
            let needed = dest.len() - bytes.len() + 32;
            let mut new_bytes = Vec::with_capacity(needed);
            for i in 0..needed { new_bytes.push(((i * 17 + 42) % 256) as u8); }
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
    let btc_metadata = btc::init();
    let eth_metadata = eth::init();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.btc_metadata = btc_metadata;
        state.eth_metadata = eth_metadata;
    });
    ic_cdk::println!("--- Canister Initialized Successfully ---");
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("[pre_upgrade] Saving state to stable memory...");
    STATE.with(|s| match storage::stable_save((s.borrow().clone(),)) {
        Ok(_) => ic_cdk::println!("[pre_upgrade] ✅ State saved successfully."),
        Err(e) => ic_cdk::trap(&format!("[pre_upgrade] FATAL: Failed to save state: {:?}", e)),
    });
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("[post_upgrade] Restoring state from stable memory...");
    match storage::stable_restore::<(CanisterState,)>() {
        Ok((restored_state,)) => {
            STATE.with(|s| *s.borrow_mut() = restored_state);
            ic_cdk::println!("[post_upgrade] ✅ State restored successfully.");
            btc::load_model_from_config();
            eth::prediction::load_model(eth::config::ETH_MODEL_BYTES).expect("Failed to reload ETH model");
            ic_cdk::println!("[post_upgrade] ✅ ONNX Models reloaded successfully.");
        }
        Err(e) => ic_cdk::trap(&format!("[post_upgrade] FATAL: Failed to restore state: {:?}", e)),
    }
}

// --- Unified Public Endpoint ---
#[update]
async fn analyze_address(address: String) -> Result<RansomwareResult, String> {
    match address_detector::detect_address_type(&address) {
        address_detector::AddressType::Bitcoin => {
            ic_cdk::println!("Address detected as Bitcoin. Routing to BTC analyzer...");
            btc::analyze_btc_address(&address).await
        }
        address_detector::AddressType::Ethereum => {
            eth::analyze_eth_address(&address).await
        }
        address_detector::AddressType::Solana => {
            // COMING SOON NEXT QUALIFICATION
            Err("Currently, we do not support Solana addresses.".to_string())
        }
        address_detector::AddressType::Unknown => {
            Err("Address format is unknown. Not a valid BTC or ETH address.".to_string())
        }
    }
}

#[update]
async fn analyze_address_v2(
    features: Vec<f32>,
    address: String,
    transaction_count: u32
) -> Result<RansomwareResult, String> {
    match address_detector::detect_address_type(&address) {
        address_detector::AddressType::Bitcoin => {
            ic_cdk::println!("Address detected as Bitcoin. Routing to BTC analyzer...");
            btc::analyze_btc_address_v2(features, &address, transaction_count).await
        }
        address_detector::AddressType::Ethereum => {

            ic_cdk::println!("Address detected as Ethereum. Routing to ETH analyzer...");
            eth::analyze_eth_address(&address).await
        }
        address_detector::AddressType::Solana => {
            // COMING SOON NEXT QUALIFICATION
            Err("Currently, we do not support Solana addresses.".to_string())
        }
        address_detector::AddressType::Unknown => {
            Err("Address format is unknown. Not a valid BTC or ETH address.".to_string())
        }
    }
}

// Enable Candid export
ic_cdk::export_candid!();