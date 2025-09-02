
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
use candid::{CandidType, Deserialize};


#[ic_cdk::init]
pub fn init(bitcoin_network: BitcoinNetwork, solana_init: Option<solana::InitArg>) {
	bitcoin::bitcoin_init(bitcoin_network);
	if let Some(arg) = solana_init {
		solana::solana_init(arg);
	}
}

#[ic_cdk::post_upgrade]
fn post_upgrade(bitcoin_network: BitcoinNetwork, solana_init: Option<solana::InitArg>) {
	bitcoin::bitcoin_post_upgrade(bitcoin_network);
	if let Some(arg) = solana_init {
		solana::solana_post_upgrade(Some(arg));
	}
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