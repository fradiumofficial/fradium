use std::cell::RefCell;
use std::collections::{HashSet, VecDeque};
use std::time::Duration;

use alloy::{
    primitives::{Address, B256, U256},
    providers::{Provider, ProviderBuilder},
    rpc::types::eth::BlockNumberOrTag,
    transports::icp::{IcpConfig, IcpTransport},
};
use candid::CandidType;
use ic_cdk::api::management_canister::main::raw_rand;
use ic_cdk::spawn;
use ic_cdk_timers::{set_timer, set_timer_interval};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::str::FromStr;

use crate::get_rpc_service;

// Keep a minimal DTO so the import in `lib.rs` remains valid for Candid export.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct TxRecordDto {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub value: String,
    pub block_number: u64,
    pub is_receive: bool,
}

thread_local! {
    static LAST_PROCESSED_BLOCK: RefCell<u64> = RefCell::new(0);
    static WATCHED_ADDRESSES: RefCell<HashSet<String>> = RefCell::new(HashSet::new());
    static TX_HISTORY: RefCell<VecDeque<TxRecordDto>> = RefCell::new(VecDeque::with_capacity(512));
}

#[ic_cdk::init]
fn init() {
    // Start the periodic polling timer (every ~10 seconds)
    start_block_polling_timer();
}

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let last = LAST_PROCESSED_BLOCK.with(|v| *v.borrow());
    let watched: Vec<String> = WATCHED_ADDRESSES.with(|w| w.borrow().iter().cloned().collect());
    let history: Vec<TxRecordDto> = TX_HISTORY.with(|h| h.borrow().iter().cloned().collect());
    ic_cdk::storage::stable_save((last, watched, history)).expect("failed to stable_save state");
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    if let Ok((last, watched, history)) =
        ic_cdk::storage::stable_restore::<(u64, Vec<String>, Vec<TxRecordDto>)>()
    {
        LAST_PROCESSED_BLOCK.with(|v| *v.borrow_mut() = last);
        WATCHED_ADDRESSES.with(|w| {
            let mut set = w.borrow_mut();
            set.clear();
            for a in watched {
                set.insert(a);
            }
        });
        TX_HISTORY.with(|h| {
            let mut dq = h.borrow_mut();
            dq.clear();
            for item in history {
                dq.push_back(item);
            }
        });
    }
    // Restart timer after upgrade
    start_block_polling_timer();
}

fn start_block_polling_timer() {
    // Penting: jangan melakukan panggilan async (inter-canister) langsung di init/post_upgrade.
    // Jadwalkan timer satu kali singkat, kemudian lakukan raw_rand() di konteks non-init.
    set_timer(Duration::from_millis(100), || {
        // Di dalam timer callback (bukan init mode), kita boleh melakukan panggilan async.
        spawn(async move {
            let jitter_ms: u64 = match raw_rand().await {
                Ok((bytes,)) if !bytes.is_empty() => (bytes[0] as u64) % 3000,
                _ => 0,
            };

            // Tambahkan jitter sebelum mulai interval periodik
            set_timer(Duration::from_millis(jitter_ms), || {
                set_timer_interval(Duration::from_secs(10), || {
                    spawn(async move {
                        if let Err(e) = fetch_and_log_latest_block().await {
                            ic_cdk::println!("[eth] timer fetch error: {}", e);
                        }
                    });
                });
            });
        });
    });
}

async fn fetch_and_log_latest_block() -> Result<(), String> {
    // Setup provider
    let rpc_service = get_rpc_service();
    // Increase max response size to avoid 5KB default limit on EVM RPC responses
    let config = IcpConfig::new(rpc_service).set_max_response_size(100_000);
    let provider = ProviderBuilder::new().on_icp(config);

    // 1) Get latest block number
    let latest_block_number = provider
        .get_block_number()
        .await
        .map_err(|e| format!("get_block_number error: {}", e))?;

    ic_cdk::println!("[eth] latest block number: {}", latest_block_number);

    // 2) Compare with last processed
    let should_fetch = LAST_PROCESSED_BLOCK.with(|last| latest_block_number > *last.borrow());
    if !should_fetch {
        return Ok(());
    }

    // 3) Fetch the latest block with transactions included
    // Note: Depending on alloy version, this call may vary slightly; the IC fork supports this.
    // Use includeTransactions = false to avoid large HTTP response bodies
    let maybe_block = provider
        .get_block_by_number(BlockNumberOrTag::Number(latest_block_number), false)
        .await
        .map_err(|e| format!("get_block_by_number error: {}", e))?;

    match maybe_block {
        Some(block) => {
            // 4) Process this block for watched addresses (fetch tx details per-hash)
            process_block_for_watched(&provider, latest_block_number).await;

            // Save progress
            LAST_PROCESSED_BLOCK.with(|last| *last.borrow_mut() = latest_block_number);
        }
        None => {
            ic_cdk::println!(
                "[eth] latest block {} not found (node may be syncing)",
                latest_block_number
            );
        }
    }

    Ok(())
}

async fn process_block_for_watched(provider: &alloy::providers::RootProvider<IcpTransport>, block_number: u64) {
    if let Ok(Some(block)) = provider
        .get_block_by_number(BlockNumberOrTag::Number(block_number), false)
        .await
    {
        if let Ok(Value::Object(map)) = serde_json::to_value(&block) {
            if let Some(Value::Array(txs)) = map.get("transactions") {
                for v in txs {
                    if let Some(s) = v.as_str() {
                        if let Ok(h) = B256::from_str(s) {
                            if let Ok(Some(tx)) = provider.get_transaction_by_hash(h).await {
                                let from_addr: Address = tx.from;
                                let to_addr: Option<Address> = tx.to;
                                let from_s = from_addr.to_string().to_lowercase();
                                let to_s_opt = to_addr.map(|a| a.to_string().to_lowercase());

                                let is_watch_from = WATCHED_ADDRESSES
                                    .with(|w| w.borrow().contains(&from_s));
                                let is_watch_to = to_s_opt
                                    .as_ref()
                                    .map(|s| WATCHED_ADDRESSES.with(|w| w.borrow().contains(s)))
                                    .unwrap_or(false);

                                if is_watch_from || is_watch_to {
                                    let val_str: String = tx.value.to_string();
                                    let rec = TxRecordDto {
                                        hash: h.to_string(),
                                        from: from_s.clone(),
                                        to: to_s_opt.clone(),
                                        value: val_str,
                                        block_number,
                                        is_receive: is_watch_to && !is_watch_from,
                                    };
                                    TX_HISTORY.with(|hist| {
                                        let mut dq = hist.borrow_mut();
                                        dq.push_back(rec);
                                        while dq.len() > 500 {
                                            dq.pop_front();
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Entry point: get receive-only history for a specific address (case-insensitive)
#[ic_cdk::update]
pub async fn get_transaction_history(address: String) -> Result<Vec<TxRecordDto>, String> {
    let target = address.to_lowercase();
    let list = TX_HISTORY.with(|h| {
        h.borrow()
            .iter()
            .filter(|r| r.is_receive && r.to.as_deref() == Some(&target))
            .cloned()
            .collect::<Vec<_>>()
    });
    Ok(list)
}

// Watch an address for incoming/outgoing txs
#[ic_cdk::update]
pub fn watch_address(address: String) -> Result<(), String> {
    let addr = Address::parse_checksummed(address, None).map_err(|e| e.to_string())?;
    let key = addr.to_string().to_lowercase();
    WATCHED_ADDRESSES.with(|w| {
        w.borrow_mut().insert(key);
    });
    Ok(())
}


