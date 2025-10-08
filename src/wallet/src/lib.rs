
#[path = "bitcoin/lib.rs"]
pub mod bitcoin;
#[path = "ethereum/lib.rs"]
pub mod ethereum;
#[path = "solana/lib.rs"]
pub mod solana;
pub mod shared;

use ic_cdk::api::management_canister::bitcoin::{BitcoinNetwork, GetUtxosResponse, MillisatoshiPerByte};
use crate::bitcoin::SendRequest;
use candid::Nat;
use candid::{CandidType, Deserialize, Principal};
use sol_rpc_types::RpcEndpoint;
use std::cell::RefCell;
use std::collections::HashMap;
use ic_cdk::api::time as ic_time;

#[derive(CandidType, Deserialize, Debug)]
pub enum NetworkChoice {
    Local,
    Mainnet,
}

#[ic_cdk::init]
pub fn init(network_choice: NetworkChoice) {
    // Set Bitcoin network and Solana init args based on network choice
    let (bitcoin_network, solana_init) = match network_choice {
        NetworkChoice::Local => {
            let bitcoin_network = BitcoinNetwork::Regtest;
            let solana_init = solana::InitArg {
                solana_network: Some(solana::SolanaNetwork::Custom(RpcEndpoint {
                    url: "https://api.devnet.solana.com".to_string(),
                    headers: None,
                })),
                ed25519_key_name: Some(solana::Ed25519KeyName::LocalDevelopment),
                sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
                solana_commitment_level: None,
            };
            (bitcoin_network, solana_init)
        },
        NetworkChoice::Mainnet => {
            let bitcoin_network = BitcoinNetwork::Testnet;
            let solana_init = solana::InitArg {
                solana_network: Some(solana::SolanaNetwork::Devnet),
                ed25519_key_name: Some(solana::Ed25519KeyName::MainnetTestKey1),
                sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
                solana_commitment_level: None,
            };
            (bitcoin_network, solana_init)
        },
    };

    bitcoin::bitcoin_init(bitcoin_network);
    solana::solana_init(solana_init);
}

#[ic_cdk::post_upgrade]
fn post_upgrade(network_choice: NetworkChoice) {
    // Set Bitcoin network and Solana init args based on network choice
    let (bitcoin_network, solana_init) = match network_choice {
        NetworkChoice::Local => {
            let bitcoin_network = BitcoinNetwork::Regtest;
            let solana_init = solana::InitArg {
                solana_network: Some(solana::SolanaNetwork::Custom(RpcEndpoint {
                    url: "https://api.devnet.solana.com".to_string(),
                    headers: None,
                })),
                ed25519_key_name: Some(solana::Ed25519KeyName::LocalDevelopment),
                sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
                solana_commitment_level: None,
            };
            (bitcoin_network, solana_init)
        },
        NetworkChoice::Mainnet => {
            let bitcoin_network = BitcoinNetwork::Testnet;
            let solana_init = solana::InitArg {
                solana_network: Some(solana::SolanaNetwork::Devnet),
                ed25519_key_name: Some(solana::Ed25519KeyName::MainnetTestKey1),
                sol_rpc_canister_id: Some(Principal::from_text("tghme-zyaaa-aaaar-qarca-cai").unwrap()),
                solana_commitment_level: None,
            };
            (bitcoin_network, solana_init)
        },
    };

    bitcoin::bitcoin_post_upgrade(bitcoin_network);
    solana::solana_post_upgrade(Some(solana_init));
}

#[derive(CandidType, Deserialize)]
pub struct Addresses {
	pub bitcoin: String,
	pub ethereum: String,
	pub solana: String,
	pub icp_principal: String,
	pub icp_account: String,
}

// Convert principal to account identifier (for exchanges)
fn principal_to_account_id(principal: &Principal) -> String {
    use sha2::{Digest, Sha224};
    use crc32fast::Hasher as Crc32;

    // Create the account identifier according to the ICP standard
    let mut hasher = Sha224::new();
    hasher.update(b"\x0Aaccount-id");
    hasher.update(principal.as_slice());
    hasher.update(&[0u8; 32]); // subaccount (32 bytes of zeros)
    let hash = hasher.finalize();

    // Calculate CRC32 of the hash
    let mut crc32 = Crc32::new();
    crc32.update(&hash);
    let crc = crc32.finalize();

    // Combine CRC32 + hash and encode as hex
    let mut result = Vec::with_capacity(32);
    result.extend_from_slice(&crc.to_be_bytes());
    result.extend_from_slice(&hash);

    // Convert to hex string
    hex::encode(result).to_uppercase()
}

#[ic_cdk::update]
pub async fn wallet_addresses() -> Addresses {
    // Get Bitcoin address
    let btc = crate::bitcoin::service::bitcoin_address::bitcoin_address().await;

    // Get Ethereum address
    let eth = crate::ethereum::service::ethereum_address::ethereum_address().await;

    // Get Solana address
    let sol = {
        use crate::solana::solana_wallet::SolanaWallet;
        let owner_principal = ic_cdk::caller();
        let wallet = SolanaWallet::new(owner_principal).await;
        wallet.solana_account().to_string()
    };

    // Get ICP Principal for ICRC transfers
    let icp_principal = ic_cdk::caller();
    let icp_account = principal_to_account_id(&icp_principal);

    Addresses {
        bitcoin: btc,
        ethereum: eth,
        solana: sol,
        icp_principal: icp_principal.to_string(),
        icp_account,
    }
}

// Export Candid so candid-extractor can generate the .did
ic_cdk::export_candid!();

// ===================== DELEGATION (CONSENT) =====================

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Delegation {
    pub delegate: Principal,
    pub scopes: Vec<String>,
    pub expires_at_nanos: u64,
}

thread_local! {
    static DELEGATIONS: RefCell<HashMap<Principal, Vec<Delegation>>> = RefCell::new(HashMap::new());
}

fn now_nanos() -> u64 { ic_time() as u64 }

fn has_valid_delegation(user: &Principal, delegate: &Principal, scope: &str) -> bool {
    DELEGATIONS.with(|store| {
        let map = store.borrow();
        if let Some(list) = map.get(user) {
            let now = now_nanos();
            for d in list.iter() {
                if &d.delegate == delegate && d.expires_at_nanos > now && d.scopes.iter().any(|s| s == scope) {
                    return true;
                }
            }
        }
        false
    })
}

#[ic_cdk::update]
pub fn grant_delegation(delegate: Principal, scopes: Vec<String>, expires_at_nanos: u64) {
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() { ic_cdk::trap("Anonymous not allowed"); }
    if scopes.is_empty() { ic_cdk::trap("Scopes cannot be empty"); }
    if expires_at_nanos <= now_nanos() { ic_cdk::trap("Expiration must be in the future"); }
    DELEGATIONS.with(|store| {
        let mut map = store.borrow_mut();
        let entry = map.entry(caller).or_insert_with(|| Vec::new());
        // Replace existing for same delegate
        entry.retain(|d| d.delegate != delegate);
        entry.push(Delegation { delegate, scopes, expires_at_nanos });
    });
}

#[ic_cdk::update]
pub fn revoke_delegation(delegate: Principal) -> bool {
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() { ic_cdk::trap("Anonymous not allowed"); }
    DELEGATIONS.with(|store| {
        let mut map = store.borrow_mut();
        if let Some(list) = map.get_mut(&caller) {
            let before = list.len();
            list.retain(|d| d.delegate != delegate);
            return list.len() != before;
        }
        false
    })
}

#[ic_cdk::query]
pub fn list_delegations(user: Option<Principal>) -> Vec<Delegation> {
    let caller = ic_cdk::caller();
    let target = user.unwrap_or(caller);
    DELEGATIONS.with(|store| store.borrow().get(&target).cloned().unwrap_or_default())
}