
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
	pub icp: String,
}

#[derive(CandidType, Deserialize)]
pub struct NetworksInfo {
    pub bitcoin: String,
    pub ethereum: String,
    pub solana: String,
    pub icp: String,
}

#[ic_cdk::update]
pub async fn coin_network() -> NetworksInfo {
    // Bitcoin network comes from bitcoin::BitcoinContext set at init/post-upgrade
    let btc = crate::bitcoin::current_network_name().to_string();

    // Ethereum network inferred from configured RPC service
    let eth = crate::ethereum::current_network_name();

    // Solana network read from state initialized via InitArg
    let sol = crate::solana::current_network_name();

    // ICP network: infer from build environment; default to "ic" vs "local"
    let icp = match option_env!("DFX_NETWORK") {
        Some("local") => "local".to_string(),
        Some(_) => "ic".to_string(),
        None => "ic".to_string(),
    };

    NetworksInfo { bitcoin: btc, ethereum: eth, solana: sol, icp }
}

// Export Candid so candid-extractor can generate the .did
ic_cdk::export_candid!();