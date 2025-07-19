// src/price_converter.rs

use super::config::{CRYPTOCOMPARE_API_KEY, CRYPTOCOMPARE_URL, MORALIS_API_KEY, MORALIS_METADATA_URL, MORALIS_PRICE_URL, DEFILLAMA_URL, HTTP_OUTCALL_CYCLES}; // <-- Import constant
use super::models::{TokenInfo, MoralisTokenMetadata, MoralisPrice, DefiLlamaResponse, logs};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use num_traits::ToPrimitive;
use serde_json::Value;
use std::collections::HashMap;
use std::cell::RefCell;
use chrono::{Datelike, TimeZone, Utc};

thread_local! {
    static PRICE_CACHE: RefCell<HashMap<String, f64>> = RefCell::new(HashMap::new());
    static TOKEN_PRICE_CACHE: RefCell<HashMap<String, f64>> = RefCell::new(HashMap::new());
    static TOKEN_INFO_CACHE: RefCell<HashMap<String, TokenInfo>> = RefCell::new(HashMap::new());
}

pub fn get_cache_info() -> (usize, usize, usize) {
    let eth_price_len = PRICE_CACHE.with(|cache| cache.borrow().len());
    let token_price_len = TOKEN_PRICE_CACHE.with(|cache| cache.borrow().len());
    let token_info_len = TOKEN_INFO_CACHE.with(|cache| cache.borrow().len());
    (eth_price_len, token_price_len, token_info_len)
}

pub async fn get_token_info(token_address: &str) -> Result<TokenInfo, String> {
    let lower_address = token_address.to_lowercase();

    if let Some(info) = TOKEN_INFO_CACHE.with(|c| c.borrow().get(&lower_address).cloned()) {
        return Ok(info);
    }
    
    let mut token_map = HashMap::new();
    token_map.insert("0xdac17f958d2ee523a2206206994597c13d831ec7", TokenInfo { symbol: "USDT".to_string(), decimals: 6 });
    token_map.insert("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", TokenInfo { symbol: "USDC".to_string(), decimals: 6 });
    token_map.insert("0x6b175474e89094c44da98b954eedeac495271d0f", TokenInfo { symbol: "DAI".to_string(), decimals: 18 });
    token_map.insert("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", TokenInfo { symbol: "WETH".to_string(), decimals: 18 });
    token_map.insert("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", TokenInfo { symbol: "WBTC".to_string(), decimals: 8 });

    if let Some(info) = token_map.get(lower_address.as_str()) {
        TOKEN_INFO_CACHE.with(|c| c.borrow_mut().insert(lower_address.clone(), info.clone()));
        return Ok(info.clone());
    }

    logs::add_log(format!("   -> Discovering token info for {}...", &lower_address));
    let url = format!("{}?chain=eth&addresses={}", MORALIS_METADATA_URL, &lower_address);

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(1024 * 1024),
        transform: None,
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "X-API-Key".to_string(), value: MORALIS_API_KEY.to_string() },
        ],
    };
    
    // ** THE FIX: Use the larger, centralized cycle constant **
    let info = match http_request(request, HTTP_OUTCALL_CYCLES).await {
        Ok((response,)) => {
            let status_code = response.status.0.to_u64().unwrap_or(0);
            if status_code == 200 {
                let data: Result<Vec<MoralisTokenMetadata>, _> = serde_json::from_slice(&response.body);
                if let Ok(metadata_vec) = data {
                    if let Some(metadata) = metadata_vec.get(0) {
                        let decimals = metadata.decimals.parse::<u32>().unwrap_or(18);
                        let symbol = metadata.symbol.to_uppercase();
                        logs::add_log(format!("   -> ✅ Discovered Symbol: {}, Decimals: {}", &symbol, decimals));
                        TokenInfo { symbol, decimals }
                    } else {
                        TokenInfo { symbol: "UNKNOWN".to_string(), decimals: 18 }
                    }
                } else {
                    logs::add_log(format!("   -> ❌ Moralis metadata parsing failed."));
                    TokenInfo { symbol: "UNKNOWN".to_string(), decimals: 18 }
                }
            } else {
                 logs::add_log(format!("   -> ❌ Moralis metadata discovery failed with status {}.", status_code));
                 TokenInfo { symbol: "UNKNOWN".to_string(), decimals: 18 }
            }
        }
        Err((_, msg)) => {
            logs::add_log(format!("   -> ❌ Moralis metadata EXCEPTION: {}", msg));
            TokenInfo { symbol: "UNKNOWN".to_string(), decimals: 18 }
        }
    };
    
    TOKEN_INFO_CACHE.with(|c| c.borrow_mut().insert(lower_address, info.clone()));
    Ok(info)
}

pub async fn get_token_eth_ratio(token_address: &str, timestamp: u64) -> Result<f64, String> {
    let token_info = get_token_info(token_address).await?;
    let token_symbol = &token_info.symbol;

    if token_symbol == "WETH" { return Ok(1.0); }
    
    let dt = Utc.timestamp_opt(timestamp as i64, 0).single().unwrap();
    let monthly_key_part = dt.format("%Y-%m-01").to_string();
    let cache_key = format!("{}_{}_{}", token_symbol, monthly_key_part, token_address);

    if let Some(ratio) = TOKEN_PRICE_CACHE.with(|c| c.borrow().get(&cache_key).cloned()) {
        return Ok(ratio);
    }

    let ratio = if ["USDT", "USDC", "DAI"].contains(&token_symbol.as_str()) {
        get_stablecoin_eth_ratio(timestamp).await?
    } else {
        logs::add_log(format!("   -> API FETCH: Price for {} ({})", token_symbol, token_address));
        fetch_token_price_from_api(token_symbol, token_address, timestamp).await?
    };

    if ratio > 0.0 {
        TOKEN_PRICE_CACHE.with(|c| c.borrow_mut().insert(cache_key, ratio));
    }
    
    Ok(ratio)
}

pub async fn get_eth_btc_ratio(timestamp: u64) -> Result<f64, String> {
    let dt = Utc.timestamp_opt(timestamp as i64, 0).single().unwrap();
    let monthly_key = format!("ETH_BTC_{}", dt.format("%Y-%m-01"));

    if let Some(price) = PRICE_CACHE.with(|c| c.borrow().get(&monthly_key).cloned()) {
        return Ok(price);
    }

    logs::add_log(format!("-> Fetching ETH/BTC price for {} from API...", &monthly_key));
    let monthly_dt = dt.with_day(1).unwrap();
    let monthly_ts = monthly_dt.timestamp();

    let url = format!("{}?fsym=ETH&tsyms=BTC&ts={}&api_key={}", CRYPTOCOMPARE_URL, monthly_ts, CRYPTOCOMPARE_API_KEY);
    let request = CanisterHttpRequestArgument { url, method: HttpMethod::GET, body: None, max_response_bytes: None, transform: None, headers: vec![] };

    let price = match http_request(request, HTTP_OUTCALL_CYCLES).await {
        Ok((response,)) => {
             let status_code = response.status.0.to_u64().unwrap_or(0);
             if status_code == 200 {
                let data: Value = serde_json::from_slice(&response.body).unwrap_or_default();
                data.get("ETH").and_then(|v| v.get("BTC")).and_then(|p| p.as_f64()).unwrap_or(0.0)
             } else { 0.0 }
        }
        _ => 0.0,
    };
    
    if price > 0.0 {
        PRICE_CACHE.with(|c| c.borrow_mut().insert(monthly_key, price));
        Ok(price)
    } else {
        let year = dt.year();
        let fallback = if year <= 2016 { 0.02 } else if year <= 2017 { 0.05 } else if year <= 2018 { 0.08 } else if year <= 2020 { 0.04 } else { 0.067 };
        logs::add_log(format!("   -> Warning: Could not fetch ETH/BTC price, using fallback ratio: {}", fallback));
        Ok(fallback)
    }
}

async fn fetch_token_price_from_api(token_symbol: &str, token_address: &str, timestamp: u64) -> Result<f64, String> {
    if token_symbol != "UNKNOWN" {
        logs::add_log("      -> [Layer 1] Trying CryptoCompare...".to_string());
        let monthly_ts = Utc.timestamp_opt(timestamp as i64, 0).single().unwrap().with_day(1).unwrap().timestamp();
        let url = format!("{}?fsym={}&tsyms=ETH&ts={}&api_key={}", CRYPTOCOMPARE_URL, token_symbol, monthly_ts, CRYPTOCOMPARE_API_KEY);
        let request = CanisterHttpRequestArgument { url, method: HttpMethod::GET, body: None, max_response_bytes: None, transform: None, headers: vec![] };
        if let Ok((response,)) = http_request(request, HTTP_OUTCALL_CYCLES).await {
            let status_code = response.status.0.to_u64().unwrap_or(0);
            if status_code == 200 {
                let data: Value = serde_json::from_slice(&response.body).unwrap_or_default();
                if let Some(price) = data.get(token_symbol).and_then(|v| v.get("ETH")).and_then(|p| p.as_f64()) {
                    if price > 0.0 {
                        logs::add_log(format!("      -> ✅ CryptoCompare SUCCESS: {} ETH", price));
                        return Ok(price);
                    }
                }
            }
        }
    }

    logs::add_log("      -> [Layer 2] Trying DeFiLlama...".to_string());
    if let Ok(price) = fetch_from_defillama(token_address, timestamp).await {
        if price > 0.0 {
            logs::add_log(format!("      -> ✅ DeFiLlama SUCCESS: {} ETH", price));
            return Ok(price);
        }
    }

    logs::add_log("      -> [Layer 3] Trying Moralis...".to_string());
    if let Ok(price) = fetch_from_moralis_price(token_address, timestamp).await {
        if price > 0.0 {
            logs::add_log(format!("      -> ✅ Moralis PRICE SUCCESS: {} ETH", price));
            return Ok(price);
        }
    }

    logs::add_log(format!("      -> ❌ ALL APIs FAILED for {}. Ignoring value.", token_symbol));
    Ok(0.0)
}

async fn fetch_from_defillama(token_address: &str, timestamp: u64) -> Result<f64, String> {
    let llama_address = format!("ethereum:{}", token_address);
    let url = format!("{}/{}/{}", DEFILLAMA_URL, timestamp, llama_address);
    let request = CanisterHttpRequestArgument { url, method: HttpMethod::GET, body: None, max_response_bytes: None, transform: None, headers: vec![] };

    if let Ok((response,)) = http_request(request, HTTP_OUTCALL_CYCLES).await {
        let status_code = response.status.0.to_u64().unwrap_or(0);
        if status_code == 200 {
            let data: Result<DefiLlamaResponse, _> = serde_json::from_slice(&response.body);
            if let Ok(llama_data) = data {
                if let Some(coin_data) = llama_data.coins.get(&llama_address) {
                    let token_usd_price = coin_data.price;
                    let eth_per_usd = get_stablecoin_eth_ratio(timestamp).await?;
                    if eth_per_usd > 0.0 {
                        return Ok(token_usd_price * eth_per_usd);
                    }
                }
            }
        }
    }
    Ok(0.0)
}

async fn fetch_from_moralis_price(token_address: &str, timestamp: u64) -> Result<f64, String> {
    let to_date = Utc.timestamp_opt(timestamp as i64, 0).single().unwrap().to_rfc3339();
    let url = format!("{}/{}/price?chain=eth&to_date={}", MORALIS_PRICE_URL, token_address, to_date);
    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET, body: None, max_response_bytes: Some(1024*1024), transform: None,
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "X-API-Key".to_string(), value: MORALIS_API_KEY.to_string() },
        ],
    };
    if let Ok((response,)) = http_request(request, HTTP_OUTCALL_CYCLES).await {
        let status_code = response.status.0.to_u64().unwrap_or(0);
        if status_code == 200 {
            let data: Result<MoralisPrice, _> = serde_json::from_slice(&response.body);
            if let Ok(price_data) = data {
                let token_usd_price = price_data.usd_price;
                let eth_per_usd = get_stablecoin_eth_ratio(timestamp).await?;
                if eth_per_usd > 0.0 {
                    return Ok(token_usd_price * eth_per_usd);
                }
            }
        }
    }
    Ok(0.0)
}

async fn get_stablecoin_eth_ratio(timestamp: u64) -> Result<f64, String> {
    let dt = Utc.timestamp_opt(timestamp as i64, 0).single().unwrap();
    let monthly_key = format!("ETH_USD_{}", dt.format("%Y-%m-01"));

    if let Some(price) = PRICE_CACHE.with(|c| c.borrow().get(&monthly_key).cloned()) {
        return Ok(if price > 0.0 { 1.0 / price } else { 0.0 });
    }

    let monthly_ts = dt.with_day(1).unwrap().timestamp();
    let url = format!("{}?fsym=ETH&tsyms=USD&ts={}&api_key={}", CRYPTOCOMPARE_URL, monthly_ts, CRYPTOCOMPARE_API_KEY);
    let request = CanisterHttpRequestArgument { url, method: HttpMethod::GET, body: None, max_response_bytes: None, transform: None, headers: vec![] };
    
    let price = match http_request(request, HTTP_OUTCALL_CYCLES).await {
        Ok((response,)) => {
             let status_code = response.status.0.to_u64().unwrap_or(0);
             if status_code == 200 {
                let data: Value = serde_json::from_slice(&response.body).unwrap_or_default();
                data.get("ETH").and_then(|v| v.get("USD")).and_then(|p| p.as_f64()).unwrap_or(0.0)
             } else { 0.0 }
        }
        _ => 0.0,
    };

    if price > 0.0 {
        PRICE_CACHE.with(|c| c.borrow_mut().insert(monthly_key, price));
        Ok(1.0 / price)
    } else {
        logs::add_log("   -> Warning: Could not fetch ETH/USD price. Conversion will fail.".to_string());
        Ok(0.0)
    }
}