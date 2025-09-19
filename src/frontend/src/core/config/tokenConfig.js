/**
 * Token Configuration
 * Contains all token-related configurations and constants
 */

// --- Mainnet tokens ---
export const TOKENS_CONFIG = [
  {
    id: 1,
    name: "Bitcoin Testnet4",
    symbol: "BTC",
    chain: "Bitcoin",
    decimals: 8,
    imageUrl: "assets/images/coins/bitcoin.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 2,
    name: "Sepolia Ethereum",
    symbol: "ETH",
    chain: "Ethereum",
    decimals: 18,
    imageUrl: "assets/images/coins/ethereum.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 3,
    name: "Solana Devnet",
    symbol: "SOL",
    chain: "Solana",
    decimals: 9,
    imageUrl: "assets/images/coins/solana.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 4,
    name: "Internet Computer",
    symbol: "ICP",
    chain: "Internet Computer",
    decimals: null,
    imageUrl: "assets/images/coins/icp.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  },
  {
    id: 5,
    name: "Fradium",
    symbol: "FRADIUM",
    chain: "Internet Computer",
    decimals: null,
    imageUrl: "assets/images/coins/fradium.webp",
    mainnet: false,
    // Token type
    type: "icrc",
    canisterId: "sr4wk-4qaaa-aaaae-qfdta-cai",
  },
  {
    id: 6,
    name: "ckBTC Testnet4",
    symbol: "ckBTC",
    chain: "Internet Computer",
    decimals: null,
    imageUrl: "assets/images/coins/ckbtc.webp",
    mainnet: false,
    // Token type
    type: "icrc",
    canisterId: "mc6ru-gyaaa-aaaar-qaaaq-cai",
  },
];

// API Keys for different services
export const API_KEYS = {
  ETHERSCAN_API_KEY: process.env.VITE_ETHERSCAN_API_KEY,
  COINGECKO_API_KEY: process.env.VITE_COINGGECKO_API_KEY,
  COINMARKETCAP_API_KEY: process.env.VITE_COINMARKETCAP_API_KEY,
};

// Validate required API keys
if (!API_KEYS.ETHERSCAN_API_KEY) {
  throw new Error("VITE_ETHERSCAN_API_KEY environment variable is required but not set");
}

// CoinGecko API key is optional but recommended for higher rate limits
// Get your free API key at: https://www.coingecko.com/en/api
// Add it to your .env file as: VITE_COINGECKO_API_KEY=your_api_key_here
if (!API_KEYS.COINGECKO_API_KEY) {
  console.warn("VITE_COINGECKO_API_KEY not set. Using free tier with rate limits (10-50 calls/minute).");
  console.warn("Get your free API key at: https://www.coingecko.com/en/api");
}

// CoinMarketCap API key is optional but recommended for better rate limits
// Get your free API key at: https://coinmarketcap.com/api/
// Add it to your .env file as: VITE_COINMARKETCAP_API_KEY=your_api_key_here
if (!API_KEYS.COINMARKETCAP_API_KEY) {
  console.warn("VITE_COINMARKETCAP_API_KEY not set. Using free tier with rate limits (10,000 calls/month).");
  console.warn("Get your free API key at: https://coinmarketcap.com/api/");
}

export const API_URLS = {
  ethereum: {
    sepolia: `https://api-sepolia.etherscan.io/api?module=account&action=txlist&apikey=${API_KEYS.ETHERSCAN_API_KEY}`,
    mainnet: `https://api.etherscan.io/api?module=account&action=txlist&apikey=${API_KEYS.ETHERSCAN_API_KEY}`,
  },
  bitcoin: {
    testnet: "https://api.blockcypher.com/v1/btc/test3",
    mainnet: "https://api.blockcypher.com/v1/btc/main",
  },
  solana: {
    devnet: "https://api.devnet.solana.com",
    mainnet: "https://api.mainnet-beta.solana.com",
  },
};

// Network configuration for WalletLayout compatibility
export const NETWORK_CONFIG = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: "/assets/images/networks/bitcoin.webp",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/assets/images/networks/ethereum.webp",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "/assets/images/networks/solana.webp",
  },
  {
    id: "icp",
    name: "Internet Computer",
    icon: "/assets/images/networks/icp.webp",
  },
];

// Map token symbols to CoinGecko IDs
export const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ICP: "internet-computer",
  FADM: "fradium", // Note: Fradium might not be on CoinGecko, we'll handle this
  ckBTC: "bitcoin", // ckBTC uses BTC price
};

// CoinMarketCap IDs
export const COINMARKETCAP_IDS = {
  BTC: "1",
  ETH: "1027",
  SOL: "5426",
  ICP: "8916",
};

// CoinPaprika IDs
export const COINPAPRIKA_IDS = {
  BTC: "btc-bitcoin",
  ETH: "eth-ethereum",
  SOL: "sol-solana",
  ICP: "icp-internet-computer",
};

// Fallback prices for tokens not supported by major APIs
export const FALLBACK_PRICES = {
  BTC: 0,
  ETH: 0,
  SOL: 0,
  ICP: 0,
  FADM: 0, // Placeholder price for Fradium
  ckBTC: 0, // ckBTC uses BTC price, fallback to 0
};

// Token type mappings
export const TOKEN_TYPE_MAPPINGS = {
  Bitcoin: "Bitcoin",
  Ethereum: "Ethereum",
  Solana: "Solana",
  "Internet Computer": "Internet Computer",
};

// Default decimals for tokens
export const DEFAULT_DECIMALS = {
  BTC: 8,
  ETH: 18,
  SOL: 9,
  ICP: 8,
  FRADIUM: 8,
  ckBTC: 8,
};

// Cache configuration
export const CACHE_CONFIG = {
  BALANCE_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  BALANCE_CACHE_PREFIX: "balanceCache_",
};
