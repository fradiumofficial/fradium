// src/solana/price_converter.rs

use std::collections::HashMap;
use serde_json::{Value, json};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod, HttpHeader, HttpResponse, TransformArgs,
    TransformContext
};
use candid::{CandidType, Deserialize};



// Simple token info struct
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct TokenInfo {
    pub symbol: String,
    pub decimals: u32,
    pub name: String,
}

// Known tokens map - same as Python
pub fn get_known_token_info(mint_address: &str) -> Option<TokenInfo> {
    let token_map: HashMap<&str, TokenInfo> = [
        ("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", TokenInfo {
            symbol: "USDC".to_string(),
            decimals: 6,
            name: "USD Coin".to_string(),
        }),
        ("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", TokenInfo {
            symbol: "USDT".to_string(),
            decimals: 6,
            name: "Tether".to_string(),
        }),
        ("So11111111111111111111111111111111111111112", TokenInfo {
            symbol: "WSOL".to_string(),
            decimals: 9,
            name: "Wrapped SOL".to_string(),
        }),
        ("9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", TokenInfo {
            symbol: "BTC".to_string(),
            decimals: 6,
            name: "Bitcoin (Sollet)".to_string(),
        }),
        ("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", TokenInfo {
            symbol: "mSOL".to_string(),
            decimals: 9,
            name: "Marinade staked SOL".to_string(),
        }),
        ("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", TokenInfo {
            symbol: "jitoSOL".to_string(),
            decimals: 9,
            name: "Jito Staked SOL".to_string(),
        }),
        ("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", TokenInfo {
            symbol: "bSOL".to_string(),
            decimals: 9,
            name: "BlazeStake Staked SOL".to_string(),
        }),
    ].iter().cloned().collect();

    token_map.get(mint_address).cloned()
}

pub struct SolanaPriceConverter {
    price_cache: HashMap<String, f64>,
    token_price_cache: HashMap<String, f64>,
    token_info_cache: HashMap<String, TokenInfo>,
}

impl SolanaPriceConverter {
    pub fn new() -> Self {
        Self {
            price_cache: HashMap::new(),
            token_price_cache: HashMap::new(),
            token_info_cache: HashMap::new(),
        }
    }



    pub async fn get_token_info(&mut self, mint_address: &str) -> TokenInfo {
        let mint_address = mint_address.trim();
        
        // Check cache first
        if let Some(cached_info) = self.token_info_cache.get(mint_address) {
            return cached_info.clone();
        }

        // Check known tokens
        if let Some(known_info) = get_known_token_info(mint_address) {
            self.token_info_cache.insert(mint_address.to_string(), known_info.clone());
            return known_info;
        }

        // Try to fetch from API - simplified version
        if let Ok(fetched_info) = self.fetch_token_info_simple(mint_address).await {
            self.token_info_cache.insert(mint_address.to_string(), fetched_info.clone());
            return fetched_info;
        }

        // Fallback
        let unknown_info = TokenInfo {
            symbol: "UNKNOWN".to_string(),
            decimals: 9,
            name: "Unknown Token".to_string(),
        };
        self.token_info_cache.insert(mint_address.to_string(), unknown_info.clone());
        unknown_info
    }

    async fn fetch_token_info_simple(&self, mint_address: &str) -> Result<TokenInfo, String> {
        // Use the same Helius API as Python
        let url = "https://api.helius.xyz/v0/token-metadata".to_string();
        let payload = json!({
            "mintAccounts": [mint_address]
        });

        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::POST,
            body: Some(payload.to_string().into_bytes()),
            max_response_bytes: Some(5_000),
            transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
            headers: vec![
                HttpHeader {
                    name: "Content-Type".to_string(),
                    value: "application/json".to_string(),
                },
            ],
        };

        match http_request(request, 10_000_000_000).await {
            Ok((response,)) => {
                if response.status != 200u16 && response.status != candid::Nat::from(200u64) {
                    return Err("HTTP error".to_string());
                }

                let response_body = String::from_utf8(response.body)
                    .map_err(|_| "Failed to decode response")?;

                if let Ok(data) = serde_json::from_str::<Vec<Value>>(&response_body) {
                    if let Some(token_data) = data.first() {
                        return Ok(TokenInfo {
                            symbol: token_data.get("symbol")
                                .and_then(|s| s.as_str())
                                .unwrap_or("UNKNOWN")
                                .to_uppercase(),
                            decimals: token_data.get("decimals")
                                .and_then(|d| d.as_u64())
                                .unwrap_or(9) as u32,
                            name: token_data.get("name")
                                .and_then(|n| n.as_str())
                                .unwrap_or("Unknown")
                                .to_string(),
                        });
                    }
                }
                Err("No token data found".to_string())
            },
            Err(_) => Err("API error".to_string())
        }
    }

    pub async fn get_token_sol_ratio(&mut self, mint_address: &str, timestamp: u64) -> (f64, bool) {
        let token_info = self.get_token_info(mint_address).await;
        let token_symbol = &token_info.symbol;

        // WSOL is 1:1 with SOL
        if token_symbol == "WSOL" || mint_address == "So11111111111111111111111111111111111111112" {
            return (1.0, true);
        }

        // Create cache key using daily precision like Python
        let daily_key = self.timestamp_to_daily_key(timestamp);
        let cache_key = format!("{}_{}", token_symbol, daily_key);

        if let Some(&cached_value) = self.token_price_cache.get(&cache_key) {
            return (cached_value, cached_value > 0.0);
        }

        // Handle stablecoins first
        if ["USDC", "USDT", "BUSD", "DAI"].contains(&token_symbol.as_str()) {
            if let (ratio, true) = self.get_stablecoin_sol_ratio(timestamp).await {
                self.token_price_cache.insert(cache_key, ratio);
                return (ratio, true);
            }
        }

        // Try Jupiter API (using the correct v3 endpoint like Python)
        if let (price, true) = self.fetch_token_price_jupiter(mint_address, timestamp).await {
            self.token_price_cache.insert(cache_key, price);
            return (price, true);
        }

        // Try CryptoCompare (most reliable fallback)
        if let (price, true) = self.fetch_token_price_cryptocompare(token_symbol, timestamp).await {
            self.token_price_cache.insert(cache_key, price);
            return (price, true);
        }

        // Failed to get price
        self.token_price_cache.insert(cache_key, 0.0);
        (0.0, false)
    }

    async fn fetch_token_price_jupiter(&self, mint_address: &str, timestamp: u64) -> (f64, bool) {
        // Check if transaction is too old (Jupiter only has recent data)
        let current_time_ns = ic_cdk::api::time();
        let current_time_s = current_time_ns / 1_000_000_000;
        let days_old = if current_time_s > timestamp { 
            (current_time_s - timestamp) as f64 / (24.0 * 3600.0) 
        } else { 0.0 };
        
        if days_old > 7.0 {
            return (0.0, false);
        }

        // Use the same Jupiter API v3 endpoint as Python
        let url = format!("https://lite-api.jup.ag/price/v3?ids={}", mint_address);
        
        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(5_000),
            transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
            headers: vec![],
        };

        match http_request(request, 10_000_000_000).await {
            Ok((response,)) => {
                if response.status != 200u16 && response.status != candid::Nat::from(200u64) {
                    return (0.0, false);
                }

                let response_body = String::from_utf8_lossy(&response.body);
                if let Ok(data) = serde_json::from_str::<Value>(&response_body) {
                    if let Some(token_info) = data.get(mint_address) {
                        if let Some(usd_price) = token_info.get("usdPrice").and_then(|p| p.as_f64()) {
                            if usd_price > 0.0 {
                                if let (sol_usd, true) = self.get_sol_price_usd(timestamp).await {
                                    if sol_usd > 0.0 {
                                        return (usd_price / sol_usd, true);
                                    }
                                }
                            }
                        }
                    }
                }
                (0.0, false)
            },
            Err(_) => (0.0, false)
        }
    }

    async fn fetch_token_price_cryptocompare(&self, token_symbol: &str, timestamp: u64) -> (f64, bool) {
        let daily_timestamp = self.get_daily_timestamp(timestamp);
        
        let url = format!(
            "https://min-api.cryptocompare.com/data/pricehistorical?fsym={}&tsyms=SOL&ts={}&api_key={}",
            token_symbol, daily_timestamp, "05c9ed12474c1681807b9948d95d4b3a55e0842ae70bb6091d65c15ad3393296"
        );

        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(5_000),
            transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
            headers: vec![],
        };

        match http_request(request, 10_000_000_000).await {
            Ok((response,)) => {
                if response.status != 200u16 && response.status != candid::Nat::from(200u64) {
                    return (0.0, false);
                }

                let response_body = String::from_utf8_lossy(&response.body);
                if let Ok(data) = serde_json::from_str::<Value>(&response_body) {
                    if let Some(token_price) = data.get(token_symbol)
                        .and_then(|t| t.get("SOL"))
                        .and_then(|p| p.as_f64()) 
                    {
                        if token_price > 0.0 {
                            return (token_price, true);
                        }
                    }
                }
                (0.0, false)
            },
            Err(_) => (0.0, false)
        }
    }

    async fn get_stablecoin_sol_ratio(&self, timestamp: u64) -> (f64, bool) {
        if let (sol_usd, true) = self.get_sol_price_usd(timestamp).await {
            if sol_usd > 0.0 {
                return (1.0 / sol_usd, true);
            }
        }
        (0.0, false)
    }

    pub async fn get_sol_price_usd(&self, timestamp: u64) -> (f64, bool) {
        let daily_key = self.timestamp_to_daily_key(timestamp);
        let cache_key = format!("SOL_USD_{}", daily_key);
        
        if let Some(&sol_usd_price) = self.price_cache.get(&cache_key) {
            return (sol_usd_price, sol_usd_price > 0.0);
        }

        let daily_timestamp = self.get_daily_timestamp(timestamp);
        
        let url = format!(
            "https://min-api.cryptocompare.com/data/pricehistorical?fsym=SOL&tsyms=USD&ts={}&api_key={}",
            daily_timestamp, "05c9ed12474c1681807b9948d95d4b3a55e0842ae70bb6091d65c15ad3393296"
        );

        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(5_000),
            transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
            headers: vec![],
        };

        match http_request(request, 10_000_000_000).await {
            Ok((response,)) => {
                if response.status != 200u16 && response.status != candid::Nat::from(200u64) {
                    return (0.0, false);
                }

                let response_body = String::from_utf8_lossy(&response.body);
                if let Ok(data) = serde_json::from_str::<Value>(&response_body) {
                    if let Some(sol_usd_price) = data.get("SOL")
                        .and_then(|s| s.get("USD"))
                        .and_then(|p| p.as_f64()) 
                    {
                        if (1.0..=1000.0).contains(&sol_usd_price) {
                            return (sol_usd_price, true);
                        }
                    }
                }
                (0.0, false)
            },
            Err(_) => (0.0, false)
        }
    }

    pub async fn get_sol_btc_ratio(&mut self, timestamp: u64) -> f64 {
        let daily_key = self.timestamp_to_daily_key(timestamp);
        let cache_key = format!("SOL_BTC_{}", daily_key);
        
        if let Some(&cached_ratio) = self.price_cache.get(&cache_key) {
            return cached_ratio;
        }

        let daily_timestamp = self.get_daily_timestamp(timestamp);
        
        let url = format!(
            "https://min-api.cryptocompare.com/data/pricehistorical?fsym=SOL&tsyms=BTC&ts={}&api_key={}",
            daily_timestamp, "05c9ed12474c1681807b9948d95d4b3a55e0842ae70bb6091d65c15ad3393296"
        );

        let request = CanisterHttpRequestArgument {
            url,
            method: HttpMethod::GET,
            body: None,
            max_response_bytes: Some(5_000),
            transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
            headers: vec![],
        };

        match http_request(request, 10_000_000_000).await {
            Ok((response,)) => {
                if response.status == 200u16 || response.status == candid::Nat::from(200u64) {
                    let response_body = String::from_utf8_lossy(&response.body);
                    if let Ok(data) = serde_json::from_str::<Value>(&response_body) {
                        if let Some(sol_price) = data.get("SOL")
                            .and_then(|s| s.get("BTC"))
                            .and_then(|p| p.as_f64()) 
                        {
                            if (0.0001..=0.1).contains(&sol_price) {
                                self.price_cache.insert(cache_key, sol_price);
                                return sol_price;
                            }
                        }
                    }
                }
                self.get_fallback_sol_btc_ratio(timestamp)
            },
            Err(_) => self.get_fallback_sol_btc_ratio(timestamp)
        }
    }

    fn get_fallback_sol_btc_ratio(&mut self, timestamp: u64) -> f64 {
        // This logic now perfectly mirrors the Python script's fallback behavior.
        
        // NOTE: This is an approximation but sufficient for this logic.
        // A full date-time library is not available in the canister environment.
        let days_since_epoch = timestamp / (24 * 3600);
        let year = 1970 + days_since_epoch / 365; // Approximate year

        // Approximate month (1-12)
        let day_of_year = days_since_epoch % 365;
        let month = (day_of_year / 30) + 1;

        let ratio = match year {
            0..=2021 => {
                if month <= 6 { 0.0005 } else { 0.002 }
            }
            2022 => {
                if month <= 6 { 0.003 } else { 0.001 }
            }
            2023 => 0.0008,
            _ => 0.002, // For 2024 and onwards
        };

        // Also cache this result so we don't recalculate it
        let daily_key = self.timestamp_to_daily_key(timestamp);
        let cache_key = format!("SOL_BTC_{}", daily_key);
        self.price_cache.insert(cache_key, ratio);

        ratio
    }

    // Helper functions - simplified
    fn timestamp_to_daily_key(&self, timestamp: u64) -> String {
        let days_since_epoch = timestamp / (24 * 3600);
        let year = 1970 + days_since_epoch / 365;
        let day_of_year = days_since_epoch % 365;
        let month = (day_of_year / 30) + 1;
        let day = (day_of_year % 30) + 1;
        
        format!("{:04}-{:02}-{:02}", year, month, day)
    }

    fn get_daily_timestamp(&self, timestamp: u64) -> u64 {
        (timestamp / (24 * 3600)) * (24 * 3600)
    }
}

// Transform function for HTTP outcalls
#[ic_cdk::query]
fn transform(raw: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers: vec![],
    }
}