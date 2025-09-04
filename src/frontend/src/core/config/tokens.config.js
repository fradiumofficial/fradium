export const TOKENS_CONFIG = {
  Bitcoin: {
    id: "bitcoin",
    name: "BTC",
    symbol: "Bitcoin",
    displayName: "Bitcoin",
    description: "Bitcoin • Internet Computer",
    icon: "/assets/svg/tokens/bitcoin.svg",
    network: "Bitcoin",
    decimals: 8,
    addressFormats: ["bc1", "1", "3"],
    serviceClass: "BitcoinService",
    supportedOperations: ["balance", "send", "receive", "analyze", "history"],
    priceApiUrls: ["https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD"],
    // Deprecated - kept for backward compatibility
    priceApiUrl: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    explorerUrl: "https://blockstream.info",
    unitConversion: {
      base: "satoshi",
      display: "BTC",
      factor: 100000000,
    },
  },
  Ethereum: {
    id: "ethereum",
    name: "ETH",
    symbol: "Ethereum",
    displayName: "Ethereum",
    description: "Ethereum • Internet Computer",
    icon: "/assets/svg/tokens/eth.svg",
    network: "Ethereum",
    decimals: 18,
    addressFormats: ["0x"],
    serviceClass: "EthereumService",
    supportedOperations: ["balance", "send", "receive", "analyze", "history"],
    priceApiUrls: ["https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", "https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD"],
    // Deprecated - kept for backward compatibility
    priceApiUrl: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    explorerUrl: "https://etherscan.io",
    unitConversion: {
      base: "wei",
      display: "ETH",
      factor: 1000000000000000000,
    },
  },
  Solana: {
    id: "solana",
    name: "SOL",
    symbol: "Solana",
    displayName: "Solana",
    description: "Solana • Internet Computer",
    icon: "/assets/svg/tokens/solana.svg",
    network: "Solana",
    decimals: 9,
    addressFormats: [44], // Base58 length
    serviceClass: "SolanaService",
    supportedOperations: ["balance", "send", "receive", "analyze", "history"],
    priceApiUrls: ["https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL", "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", "https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD", "https://api.coinbase.com/v2/exchange-rates?currency=SOL", "https://api.kraken.com/0/public/Ticker?pair=SOLUSD", "https://api.bitfinex.com/v1/pubticker/solusd"],
    // Deprecated - kept for backward compatibility
    priceApiUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    explorerUrl: "https://explorer.solana.com",
    unitConversion: {
      base: "lamport",
      display: "SOL",
      factor: 1000000000,
    },
  },
  Fradium: {
    id: "fradium",
    name: "FUM",
    symbol: "Fradium",
    displayName: "Fradium",
    description: "Fradium • Internet Computer",
    icon: "/assets/svg/tokens/fum.svg",
    network: "Fradium",
    decimals: 8,
    addressFormats: ["fum"],
    serviceClass: "FradiumService",
    supportedOperations: ["balance", "send", "receive", "analyze", "history"],
    priceApiUrls: [], // Custom token, no external price API
    // Deprecated - kept for backward compatibility
    priceApiUrl: null, // Custom token, no external price API
    explorerUrl: "https://dashboard.internetcomputer.org",
    unitConversion: {
      base: "e8s",
      display: "FUM",
      factor: 100000000,
    },
  },
};

export const NETWORK_CONFIG = {
  Bitcoin: {
    name: "Bitcoin",
    icon: "/assets/icons/bitcoin-grey.svg",
    supportedTokens: ["Bitcoin"],
  },
  Ethereum: {
    name: "Ethereum",
    icon: "/assets/icons/eth-grey.svg",
    supportedTokens: ["Ethereum"],
  },
  Solana: {
    name: "Solana",
    icon: "/assets/icons/solana-grey.svg",
    supportedTokens: ["Solana"],
  },
  Fradium: {
    name: "Fradium",
    icon: "/assets/icons/fum-grey.svg",
    supportedTokens: ["Fradium"],
  },
};

// Helper functions
export const getTokenConfig = (tokenType) => {
  return TOKENS_CONFIG[tokenType];
};

export const getSupportedTokens = () => {
  return Object.keys(TOKENS_CONFIG);
};

export const getNetworkConfig = (network) => {
  return NETWORK_CONFIG[network];
};

export const getSupportedNetworks = () => {
  return Object.keys(NETWORK_CONFIG);
};

// Price API helper functions
export const getPriceApiUrls = (tokenType) => {
  const config = getTokenConfig(tokenType);
  return config?.priceApiUrls || [];
};

// Function to try multiple API endpoints with fallback
export const fetchPriceWithFallback = async (tokenType, timeout = 5000) => {
  const apiUrls = getPriceApiUrls(tokenType);

  if (!apiUrls || apiUrls.length === 0) {
    throw new Error(`No price APIs configured for ${tokenType}`);
  }

  let lastError = null;

  for (const apiUrl of apiUrls) {
    try {
      console.log(`Trying price API: ${apiUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const price = parsePriceResponse(data, apiUrl, tokenType);

      if (price && price > 0) {
        console.log(`Successfully fetched price from: ${apiUrl}`);
        return price;
      }

      throw new Error("Invalid price data received");
    } catch (error) {
      lastError = error;
      console.warn(`Failed to fetch price from ${apiUrl}:`, error.message);
      continue;
    }
  }

  throw new Error(`All price APIs failed for ${tokenType}. Last error: ${lastError?.message}`);
};

// Parse different API response formats
const parsePriceResponse = (data, apiUrl, tokenType) => {
  try {
    // CoinGecko format
    if (apiUrl.includes("coingecko.com")) {
      const tokenId = tokenType.toLowerCase();
      return data[tokenId]?.usd || data.bitcoin?.usd || data.ethereum?.usd || data.solana?.usd;
    }

    // Binance format
    if (apiUrl.includes("binance.com")) {
      return parseFloat(data.price);
    }

    // CryptoCompare format
    if (apiUrl.includes("cryptocompare.com")) {
      return data.USD;
    }

    // Coinbase format
    if (apiUrl.includes("coinbase.com")) {
      return parseFloat(data.data?.rates?.USD);
    }

    // Kraken format
    if (apiUrl.includes("kraken.com")) {
      const pairs = Object.keys(data.result || {});
      if (pairs.length > 0) {
        return parseFloat(data.result[pairs[0]]?.c?.[0]);
      }
    }

    // Bitfinex format
    if (apiUrl.includes("bitfinex.com")) {
      return parseFloat(data.last_price);
    }

    // CoinMarketCap format (requires API key)
    if (apiUrl.includes("coinmarketcap.com")) {
      const quotes = data.data?.[0]?.quote?.USD;
      return quotes?.price;
    }

    return null;
  } catch (error) {
    console.error("Error parsing price response:", error);
    return null;
  }
};

// Get primary price API (first in the list) - for backward compatibility
export const getPrimaryPriceApi = (tokenType) => {
  const urls = getPriceApiUrls(tokenType);
  return urls[0] || getTokenConfig(tokenType)?.priceApiUrl;
};

// Check if price APIs are available for a token
export const hasPriceApis = (tokenType) => {
  const urls = getPriceApiUrls(tokenType);
  return urls && urls.length > 0;
};

// Example usage function - dapat digunakan di komponen React
export const getTokenPriceWithFallback = async (tokenType) => {
  try {
    if (!hasPriceApis(tokenType)) {
      console.warn(`No price APIs available for ${tokenType}`);
      return null;
    }

    const price = await fetchPriceWithFallback(tokenType, 3000); // 3 second timeout
    return {
      success: true,
      price: price,
      currency: "USD",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to get price for ${tokenType}:`, error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Batch price fetching untuk multiple tokens
export const getBatchTokenPrices = async (tokenTypes, timeout = 5000) => {
  const results = {};

  const promises = tokenTypes.map(async (tokenType) => {
    try {
      const result = await fetchPriceWithFallback(tokenType, timeout);
      results[tokenType] = {
        success: true,
        price: result,
        currency: "USD",
      };
    } catch (error) {
      results[tokenType] = {
        success: false,
        error: error.message,
      };
    }
  });

  await Promise.allSettled(promises);
  return results;
};
