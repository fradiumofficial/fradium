// src/ai/src/icp/data_extractor.rs

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use serde::{Deserialize as SerdeDeserialize, Serialize};
use sha2::{Digest, Sha224};
use std::cell::RefCell;
use std::collections::{BTreeMap, HashMap};

use super::models::{PriceData, TokenConfig, TransactionData};

include!(concat!(env!("OUT_DIR"), "/local_canister_ids.rs"));

thread_local! {
    static TOKENS: RefCell<BTreeMap<String, TokenConfig>> = RefCell::new({
        let mut tokens = BTreeMap::new();
        let ledger_id = Principal::from_text(LOCAL_LEDGER_ID).unwrap();
        let ckbtc_id = Principal::from_text(LOCAL_CKBTC_ID).unwrap();
        let cketh_id = Principal::from_text(LOCAL_CKETH_ID).unwrap();
        let ckusdc_id = Principal::from_text(LOCAL_CKUSDC_ID).unwrap();
        tokens.insert("ICP".to_string(), TokenConfig { symbol: "ICP".to_string(), ledger_canister: ledger_id, decimals: 8, active: true });
        tokens.insert("ckBTC".to_string(), TokenConfig { symbol: "ckBTC".to_string(), ledger_canister: ckbtc_id, decimals: 8, active: true });
        tokens.insert("ckETH".to_string(), TokenConfig { symbol: "ckETH".to_string(), ledger_canister: cketh_id, decimals: 18, active: true });
        tokens.insert("ckUSDC".to_string(), TokenConfig { symbol: "ckUSDC".to_string(), ledger_canister: ckusdc_id, decimals: 6, active: true });
        tokens
    });
    static PRICE_CACHE: RefCell<BTreeMap<String, PriceData>> = RefCell::new(BTreeMap::new());
    static API_HEALTH: RefCell<BTreeMap<String, bool>> = RefCell::new({
        let mut health = BTreeMap::new();
        health.insert("coingecko".to_string(), true);
        health.insert("defillama".to_string(), true);
        health.insert("cryptocompare".to_string(), true);
        health
    });
    static API_FAILURE_COUNTS: RefCell<BTreeMap<String, u32>> = RefCell::new({
        let mut failures = BTreeMap::new();
        failures.insert("coingecko".to_string(), 0);
        failures.insert("defillama".to_string(), 0);
        failures.insert("cryptocompare".to_string(), 0);
        failures
    });
}

const MAX_API_FAILURES: u32 = 3;
const CACHE_DURATION_NS: u64 = 300_000_000_000;
const ACCOUNT_DOMAIN_SEPARATOR: &[u8] = b"\x0Aaccount-id";

// --- API Health Management ---
fn record_api_failure(api_name: &str) {
    API_FAILURE_COUNTS.with(|counts_refcell| {
        let mut counts = counts_refcell.borrow_mut();
        let count = counts.entry(api_name.to_string()).or_insert(0);
        *count += 1;
        if *count >= MAX_API_FAILURES {
            API_HEALTH.with(|health| {
                health.borrow_mut().insert(api_name.to_string(), false);
            });
        }
    });
}

fn record_api_success(api_name: &str) {
    API_FAILURE_COUNTS.with(|counts_refcell| {
        let mut counts = counts_refcell.borrow_mut();
        let count = counts.entry(api_name.to_string()).or_insert(0);
        if *count > 0 {
            *count -= 1;
        }
        if *count == 0 {
            API_HEALTH.with(|health| {
                health.borrow_mut().insert(api_name.to_string(), true);
            });
        }
    });
}

fn is_api_healthy(api_name: &str) -> bool {
    API_HEALTH.with(|health| *health.borrow().get(api_name).unwrap_or(&true))
}

fn get_healthy_apis() -> Vec<String> {
    API_HEALTH.with(|health| {
        health.borrow().iter()
            .filter(|(_, &is_healthy)| is_healthy)
            .map(|(api, _)| api.clone())
            .collect()
    })
}

// --- Account ID Conversion ---
fn principal_to_account_id(principal: Principal, subaccount: Option<[u8; 32]>) -> Vec<u8> {
    let mut hasher = Sha224::new();
    hasher.update(ACCOUNT_DOMAIN_SEPARATOR);
    hasher.update(principal.as_slice());

    let subaccount = subaccount.unwrap_or([0u8; 32]);
    hasher.update(&subaccount);

    let hash = hasher.finalize();

    // Prepend the 4-byte CRC32 checksum
    let mut result = [0u8; 32];
    let crc = crc32fast::hash(&hash);
    result[0..4].copy_from_slice(&crc.to_be_bytes());
    result[4..].copy_from_slice(&hash[..28]);

    result.to_vec()
}

fn get_account_id_for_principal(principal: Principal) -> Vec<u8> {
    principal_to_account_id(principal, None)
}

// --- HTTP Request Helper ---
async fn make_http_request(url: String, headers: Vec<HttpHeader>) -> Result<String, String> {
    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2000),
        transform: None,
        headers,
    };

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            String::from_utf8(response.body)
                .map_err(|_| "Invalid UTF-8 response".to_string())
        }
        Err((_, err)) => Err(format!("HTTP request failed: {:?}", err)),
    }
}

// --- CoinGecko API ---
#[derive(SerdeDeserialize)]
struct CoinGeckoResponse {
    #[serde(flatten)]
    prices: HashMap<String, CoinGeckoPrice>,
}

#[derive(SerdeDeserialize)]
struct CoinGeckoPrice {
    usd: f64,
}

async fn fetch_coingecko_price(token_symbol: &str) -> Result<f64, String> {
    if !is_api_healthy("coingecko") {
        return Err("CoinGecko API is unhealthy".to_string());
    }

    let token_id = match token_symbol {
        "ICP" => "internet-computer",
        "ckBTC" => "bitcoin",
        "ckETH" => "ethereum",
        "ckUSDC" => "usd-coin",
        _ => return Err("Unsupported token".to_string()),
    };

    let url = format!(
        "https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd",
        token_id
    );

    let headers = vec![HttpHeader {
        name: "User-Agent".to_string(),
        value: "FradiumICPAnalyzer/1.0".to_string(),
    }];

    match make_http_request(url, headers).await {
        Ok(body) => {
            match serde_json::from_str::<CoinGeckoResponse>(&body) {
                Ok(parsed) => {
                    if let Some(price_data) = parsed.prices.get(token_id) {
                        record_api_success("coingecko");
                        Ok(price_data.usd)
                    } else {
                        record_api_failure("coingecko");
                        Err("Price not found in CoinGecko response".to_string())
                    }
                }
                Err(_) => {
                    record_api_failure("coingecko");
                    Err("Failed to parse CoinGecko response".to_string())
                }
            }
        }
        Err(e) => {
            record_api_failure("coingecko");
            Err(e)
        }
    }
}

// --- DefiLlama API ---
#[derive(SerdeDeserialize)]
struct DefiLlamaResponse {
    coins: HashMap<String, DefiLlamaPrice>,
}

#[derive(SerdeDeserialize)]
struct DefiLlamaPrice {
    price: f64,
}

async fn fetch_defillama_price(token_symbol: &str) -> Result<f64, String> {
    if !is_api_healthy("defillama") {
        return Err("DefiLlama API is unhealthy".to_string());
    }

    let token_id = match token_symbol {
        "ICP" => "coingecko:internet-computer",
        "ckBTC" => "coingecko:bitcoin",
        "ckETH" => "coingecko:ethereum",
        "ckUSDC" => "coingecko:usd-coin",
        _ => return Err("Unsupported token".to_string()),
    };

    // Get current timestamp in seconds
    let now_ns = ic_cdk::api::time();
    let timestamp = now_ns / 1_000_000_000;

    let url = format!(
        "https://coins.llama.fi/prices/historical/{}/{}",
        timestamp, token_id
    );

    let headers = vec![HttpHeader {
        name: "User-Agent".to_string(),
        value: "FradiumICPAnalyzer/1.0".to_string(),
    }];

    match make_http_request(url, headers).await {
        Ok(body) => {
            match serde_json::from_str::<DefiLlamaResponse>(&body) {
                Ok(parsed) => {
                    if let Some(price_data) = parsed.coins.get(token_id) {
                        record_api_success("defillama");
                        Ok(price_data.price)
                    } else {
                        record_api_failure("defillama");
                        Err("Price not found in DefiLlama response".to_string())
                    }
                }
                Err(_) => {
                    record_api_failure("defillama");
                    Err("Failed to parse DefiLlama response".to_string())
                }
            }
        }
        Err(e) => {
            record_api_failure("defillama");
            Err(e)
        }
    }
}

// --- CryptoCompare API ---
#[derive(SerdeDeserialize)]
struct CryptoCompareResponse {
    #[serde(rename = "Response")]
    response: String,
    #[serde(rename = "Data")]
    data: Option<CryptoCompareData>,
}

#[derive(SerdeDeserialize)]
struct CryptoCompareData {
    #[serde(rename = "Data")]
    data: Vec<CryptoComparePrice>,
}

#[derive(SerdeDeserialize)]
struct CryptoComparePrice {
    close: f64,
}

async fn fetch_cryptocompare_price(token_symbol: &str) -> Result<f64, String> {
    if !is_api_healthy("cryptocompare") {
        return Err("CryptoCompare API is unhealthy".to_string());
    }

    let symbol = match token_symbol {
        "ICP" => "ICP",
        "ckBTC" => "BTC",
        "ckETH" => "ETH",
        "ckUSDC" => "USDC",
        _ => return Err("Unsupported token".to_string()),
    };

    // Get current timestamp in seconds
    let now_ns = ic_cdk::api::time();
    let timestamp = now_ns / 1_000_000_000;

    let url = format!(
        "https://min-api.cryptocompare.com/data/v2/histoday?fsym={}&tsym=USD&limit=1&toTs={}",
        symbol, timestamp
    );

    let headers = vec![HttpHeader {
        name: "User-Agent".to_string(),
        value: "FradiumICPAnalyzer/1.0".to_string(),
    }];

    match make_http_request(url, headers).await {
        Ok(body) => {
            match serde_json::from_str::<CryptoCompareResponse>(&body) {
                Ok(parsed) => {
                    if parsed.response == "Success" {
                        if let Some(data) = parsed.data {
                            if let Some(price_data) = data.data.last() {
                                record_api_success("cryptocompare");
                                return Ok(price_data.close);
                            }
                        }
                    }
                    record_api_failure("cryptocompare");
                    Err("No price data found in CryptoCompare response".to_string())
                }
                Err(_) => {
                    record_api_failure("cryptocompare");
                    Err("Failed to parse CryptoCompare response".to_string())
                }
            }
        }
        Err(e) => {
            record_api_failure("cryptocompare");
            Err(e)
        }
    }
}

// --- Multi-API Price Fetching with Fallback ---
async fn get_multi_api_usd_price(token_symbol: &str) -> Result<f64, String> {
    let healthy_apis = get_healthy_apis();
    
    if healthy_apis.is_empty() {
        return Err("All price APIs are unhealthy".to_string());
    }

    let mut prices = Vec::new();
    let mut errors = Vec::new();

    // Try each healthy API
    for api in healthy_apis {
        let result = match api.as_str() {
            "coingecko" => fetch_coingecko_price(token_symbol).await,
            "defillama" => fetch_defillama_price(token_symbol).await,
            "cryptocompare" => fetch_cryptocompare_price(token_symbol).await,
            _ => continue,
        };

        match result {
            Ok(price) if price > 0.0 => {
                ic_cdk::println!("  {} API: ${:.6} USD", api, price);
                prices.push(price);
            }
            Ok(_) => {
                errors.push(format!("{}: Invalid price (zero or negative)", api));
            }
            Err(e) => {
                errors.push(format!("{}: {}", api, e));
            }
        }
    }

    if prices.is_empty() {
        ic_cdk::println!("  All APIs failed: {:?}", errors);
        return Err("No valid prices from any API".to_string());
    }

    // Use median if multiple prices, otherwise use single price
    let final_price = if prices.len() == 1 {
        prices[0]
    } else {
        prices.sort_by(|a, b| a.partial_cmp(b).unwrap());
        prices[prices.len() / 2] // Median
    };

    ic_cdk::println!(
        "  Final price from {} sources: ${:.6} USD", 
        prices.len(), 
        final_price
    );
    
    Ok(final_price)
}

// --- Main Price Data Function ---
pub async fn get_token_price_data(token_symbol: &str) -> PriceData {
    let now = ic_cdk::api::time();
    
    // Check cache first
    let cached = PRICE_CACHE.with(|cache| {
        cache.borrow().get(token_symbol)
            .filter(|cached| now.saturating_sub(cached.timestamp) < CACHE_DURATION_NS)
            .cloned()
    });

    if let Some(cached) = cached {
        return cached;
    }

    ic_cdk::println!("Fetching price for {}...", token_symbol);

    // Get USD price using multi-API approach
    let usd_price = get_multi_api_usd_price(token_symbol).await.unwrap_or_else(|e| {
        ic_cdk::println!("  Failed to get {} USD price: {}", token_symbol, e);
        0.0
    });

    // Calculate ICP price
    let (icp_price, price_usd) = if token_symbol == "ICP" {
        (1.0, usd_price)
    } else {
        let icp_usd = if usd_price > 0.0 {
            get_multi_api_usd_price("ICP").await.unwrap_or(1.0)
        } else {
            1.0
        };
        
        let icp_price_val = if icp_usd > 0.0 { usd_price / icp_usd } else { 0.0 };
        (icp_price_val, usd_price)
    };

    let new_price_data = PriceData {
        price_icp: icp_price,
        price_usd,
        timestamp: now,
    };

    // Cache the result
    PRICE_CACHE.with(|cache| {
        cache.borrow_mut().insert(token_symbol.to_string(), new_price_data.clone());
    });

    ic_cdk::println!(
        "  {} price: {:.6} ICP, ${:.6} USD", 
        token_symbol, 
        icp_price, 
        price_usd
    );

    new_price_data
}

// --- Balance Fetching (unchanged from your original) ---
#[derive(CandidType, Serialize, Clone)]
struct ICPAccountBalanceArgs {
    account: Vec<u8>,
}

async fn get_icp_balance(principal: Principal) -> Result<f64, String> {
    let ledger = TOKENS.with(|t| t.borrow().get("ICP").unwrap().ledger_canister);
    let account_id = get_account_id_for_principal(principal);
    let args = ICPAccountBalanceArgs { account: account_id };
    let result: Result<(ICPTokens,), _> = ic_cdk::call(ledger, "account_balance", (args,)).await;
    match result { 
        Ok((balance,)) => Ok(balance.e8s as f64 / 100_000_000.0), 
        Err(e) => Err(format!("ICP balance method failed: {:?}", e)) 
    }
}

async fn get_icrc_balance(principal: Principal, ledger: Principal, decimals: u8) -> Result<f64, String> {
    #[derive(CandidType, Serialize)] 
    struct AccountArg { 
        owner: Principal, 
        subaccount: Option<Vec<u8>> 
    }
    let account = AccountArg { owner: principal, subaccount: None };
    let (balance,): (Nat,) = ic_cdk::call(ledger, "icrc1_balance_of", (account,))
        .await
        .map_err(|e| format!("ICRC balance call failed: {:?}", e))?;
    let balance_u64: u64 = balance.0.try_into().map_err(|_| "Balance too large")?;
    Ok(balance_u64 as f64 / 10_u64.pow(decimals as u32) as f64)
}

pub async fn get_all_balances(principal: Principal) -> BTreeMap<String, f64> {
    let mut balances = BTreeMap::new();
    let tokens = TOKENS.with(|t| t.borrow().clone());

    for (symbol, config) in tokens.iter().filter(|(_, c)| c.active) {
        ic_cdk::println!("Fetching {} balance...", symbol);
        let balance = if symbol == "ICP" {
            get_icp_balance(principal).await.unwrap_or_else(|e| {
                ic_cdk::println!("ICP balance error: {}", e);
                0.0
            })
        } else {
            get_icrc_balance(principal, config.ledger_canister, config.decimals)
                .await
                .unwrap_or_else(|e| {
                    ic_cdk::println!("{} balance error: {}", symbol, e);
                    0.0
                })
        };
        ic_cdk::println!("{} balance: {}", symbol, balance);
        balances.insert(symbol.clone(), balance);
    }
    balances
}

// --- Rest of your transaction code (unchanged) ---
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPGetBlocksArgs {
    pub start: u64,
    pub length: u64,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPGetBlocksResult {
    pub blocks: Vec<ICPBlock>,
    pub chain_length: u64,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPBlock {
    pub transaction: ICPTransaction,
    pub timestamp: ICPTimeStamp,
    pub parent_hash: Option<Vec<u8>>,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPTransaction {
    pub transfer: Option<ICPTransfer>,
    pub memo: u64,
    pub created_at_time: Option<ICPTimeStamp>,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPTransfer {
    pub amount: ICPTokens,
    pub fee: ICPTokens,
    pub from: Vec<u8>,
    pub to: Vec<u8>,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPTokens {
    pub e8s: u64,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICPTimeStamp {
    pub timestamp_nanos: u64,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCGetTransactionsRequest {
    pub start: Nat,
    pub length: Nat,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCGetTransactionsResponse {
    pub transactions: Vec<ICRCTransactionWithId>,
    pub log_length: Nat,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCTransactionWithId {
    pub id: Nat,
    pub transaction: ICRCTransaction,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCTransaction {
    pub burn: Option<ICRCBurnOperation>,
    pub mint: Option<ICRCMintOperation>,
    pub transfer: Option<ICRCTransferOperation>,
    pub timestamp: u64,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCBurnOperation {
    pub amount: Nat,
    pub from: ICRCAccount,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCMintOperation {
    pub amount: Nat,
    pub to: ICRCAccount,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCTransferOperation {
    pub amount: Nat,
    pub from: ICRCAccount,
    pub to: ICRCAccount,
    pub fee: Option<Nat>,
}
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ICRCAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

// [Rest of your transaction fetching code remains the same...]
async fn fetch_icp_transactions(principal: Principal) -> Result<Vec<TransactionData>, String> {
    let mut transactions = Vec::new();
    let ledger = TOKENS.with(|t| t.borrow().get("ICP").unwrap().ledger_canister);
    let target_account_id = get_account_id_for_principal(principal);
    let args = ICPGetBlocksArgs { start: 0, length: 2000 };
    let result: Result<(ICPGetBlocksResult,), _> = ic_cdk::call(ledger, "query_blocks", (args,)).await;
    match result {
        Ok((blocks_result,)) => {
            for block in blocks_result.blocks {
                if let Some(transfer) = block.transaction.transfer {
                    if transfer.from == target_account_id || transfer.to == target_account_id {
                        transactions.push(TransactionData { 
                            tx_type: "transfer".to_string(), 
                            timestamp: block.timestamp.timestamp_nanos, 
                            from_address: hex::encode(&transfer.from), 
                            to_address: hex::encode(&transfer.to), 
                            amount: transfer.amount.e8s, 
                            fee: transfer.fee.e8s, 
                            is_outgoing: transfer.from == target_account_id, 
                            is_incoming: transfer.to == target_account_id, 
                            token_symbol: "ICP".to_string() 
                        });
                    }
                }
            }
            Ok(transactions)
        }
        Err(e) => Err(format!("ICP query_blocks failed: {:?}", e)),
    }
}

async fn fetch_icrc_transactions(principal: Principal, config: &TokenConfig) -> Result<Vec<TransactionData>, String> {
    #[derive(CandidType, Deserialize)] 
    struct GetTransactionsRequest { 
        start: Nat, 
        length: Nat 
    }
    let mut transactions = Vec::new();
    let request = GetTransactionsRequest { 
        start: Nat::from(0u64), 
        length: Nat::from(2000u64) 
    };
    let result: Result<(GetTransactionsResponse,), _> = ic_cdk::call(
        config.ledger_canister, 
        "get_transactions", 
        (request,)
    ).await;
    
    match result {
        Ok((response,)) => {
            for tx in response.transactions {
                if let Some(transfer) = tx.transfer {
                    if transfer.from.owner == principal || transfer.to.owner == principal {
                        let amount_u64: u64 = transfer.amount.0.try_into().unwrap_or(0);
                        let fee_u64: u64 = transfer.fee.map(|f| f.0.try_into().unwrap_or(0)).unwrap_or(0);
                        transactions.push(TransactionData { 
                            tx_type: "transfer".to_string(), 
                            timestamp: tx.timestamp, 
                            from_address: transfer.from.owner.to_text(), 
                            to_address: transfer.to.owner.to_text(), 
                            amount: amount_u64, 
                            fee: fee_u64, 
                            is_outgoing: transfer.from.owner == principal, 
                            is_incoming: transfer.to.owner == principal, 
                            token_symbol: config.symbol.clone() 
                        });
                    }
                } else if let Some(mint) = tx.mint {
                    if mint.to.owner == principal {
                        let amount_u64: u64 = mint.amount.0.try_into().unwrap_or(0);
                        transactions.push(TransactionData { 
                            tx_type: "mint".to_string(), 
                            timestamp: tx.timestamp, 
                            from_address: "system".to_string(), 
                            to_address: mint.to.owner.to_text(), 
                            amount: amount_u64, 
                            fee: 0, 
                            is_outgoing: false, 
                            is_incoming: true, 
                            token_symbol: config.symbol.clone() 
                        });
                    }
                } else if let Some(burn) = tx.burn {
                    if burn.from.owner == principal {
                        let amount_u64: u64 = burn.amount.0.try_into().unwrap_or(0);
                        transactions.push(TransactionData { 
                            tx_type: "burn".to_string(), 
                            timestamp: tx.timestamp, 
                            from_address: burn.from.owner.to_text(), 
                            to_address: "system".to_string(), 
                            amount: amount_u64, 
                            fee: 0, 
                            is_outgoing: true, 
                            is_incoming: false, 
                            token_symbol: config.symbol.clone() 
                        });
                    }
                }
            }
            Ok(transactions)
        }
        Err(e) => Err(format!("Failed to get transactions for {}: {:?}", config.symbol, e)),
    }
}

#[derive(CandidType, Deserialize)]
struct GetTransactionsResponse {
    transactions: Vec<Transaction>,
    log_length: Nat,
}

#[derive(CandidType, Deserialize)]
struct Transaction {
    transfer: Option<Transfer>,
    mint: Option<Mint>,
    burn: Option<Burn>,
    timestamp: u64,
}

#[derive(CandidType, Deserialize)]
struct Transfer {
    from: Account,
    to: Account,
    amount: Nat,
    fee: Option<Nat>,
}

#[derive(CandidType, Deserialize)]
struct Mint {
    to: Account,
    amount: Nat,
}

#[derive(CandidType, Deserialize)]
struct Burn {
    from: Account,
    amount: Nat,
}

#[derive(CandidType, Deserialize)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

pub async fn get_all_transactions(principal: Principal) -> Vec<TransactionData> {
    let mut all_transactions = Vec::new();
    let tokens = TOKENS.with(|t| t.borrow().clone());

    ic_cdk::println!(
        "=== Starting transaction fetch for {} ===",
        principal.to_text()
    );

    // First, fetch ICP transactions
    match fetch_icp_transactions(principal).await {
        Ok(txs) => {
            ic_cdk::println!("Successfully found {} ICP transactions", txs.len());
            all_transactions.extend(txs);
        }
        Err(e) => ic_cdk::println!("Failed to fetch ICP txs: {}", e),
    }

    // Then fetch ICRC token transactions
    for (symbol, config) in tokens.iter().filter(|(s, c)| c.active && *s != "ICP") {
        match fetch_icrc_transactions(principal, config).await {
            Ok(txs) => {
                ic_cdk::println!("Successfully found {} {} transactions", txs.len(), symbol);
                all_transactions.extend(txs);
            }
            Err(e) => ic_cdk::println!("Failed to fetch {} txs: {}", symbol, e),
        }
    }

    ic_cdk::println!(
        "=== Total transactions found: {} ===",
        all_transactions.len()
    );
    all_transactions
}

// --- API Health Status Functions ---
pub fn get_api_health_report() -> String {
    let healthy_apis = get_healthy_apis();
    let mut report = Vec::new();
    
    API_HEALTH.with(|health| {
        API_FAILURE_COUNTS.with(|failures| {
            let health = health.borrow();
            let failures = failures.borrow();
            
            for api in ["coingecko", "defillama", "cryptocompare"] {
                let is_healthy = health.get(api).unwrap_or(&true);
                let failure_count = failures.get(api).unwrap_or(&0);
                let status = if *is_healthy { "HEALTHY" } else { "FAILED" };
                report.push(format!("  {}: {} ({} failures)", api, status, failure_count));
            }
        });
    });
    
    format!("API Health Status:\n{}", report.join("\n"))
}

pub fn all_apis_failed() -> bool {
    get_healthy_apis().is_empty()
}