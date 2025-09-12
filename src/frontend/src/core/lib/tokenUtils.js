import { wallet } from "declarations/wallet";
import { icp_ledger } from "declarations/icp_ledger";
import { fradium_ledger } from "declarations/fradium_ledger";
import { Principal } from "@dfinity/principal";

// Helper function to safely stringify objects that may contain BigInt
function safeStringify(obj) {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}

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
];

// API Keys for different services
const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY;
const COINGECKO_API_KEY = process.env.VITE_COINGECKO_API_KEY;
const COINMARKETCAP_API_KEY = process.env.VITE_COINMARKETCAP_API_KEY;

if (!ETHERSCAN_API_KEY) {
  throw new Error("VITE_ETHERSCAN_API_KEY environment variable is required but not set");
}

// CoinGecko API key is optional but recommended for higher rate limits
// Get your free API key at: https://www.coingecko.com/en/api
// Add it to your .env file as: VITE_COINGECKO_API_KEY=your_api_key_here
if (!COINGECKO_API_KEY) {
  console.warn("VITE_COINGECKO_API_KEY not set. Using free tier with rate limits (10-50 calls/minute).");
  console.warn("Get your free API key at: https://www.coingecko.com/en/api");
}

// CoinMarketCap API key is optional but recommended for better rate limits
// Get your free API key at: https://coinmarketcap.com/api/
// Add it to your .env file as: VITE_COINMARKETCAP_API_KEY=your_api_key_here
if (!COINMARKETCAP_API_KEY) {
  console.warn("VITE_COINMARKETCAP_API_KEY not set. Using free tier with rate limits (10,000 calls/month).");
  console.warn("Get your free API key at: https://coinmarketcap.com/api/");
}

export const API_URLS = {
  ethereum: {
    sepolia: `https://api-sepolia.etherscan.io/api?module=account&action=txlist&apikey=${ETHERSCAN_API_KEY}`,
    mainnet: `https://api.etherscan.io/api?module=account&action=txlist&apikey=${ETHERSCAN_API_KEY}`,
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

export function getTokens() {
  return TOKENS_CONFIG;
}

// Detect address network
export function detectAddressNetwork(address) {
  if (!address || typeof address !== "string") return "Unknown";

  const trimmed = address.trim();
  const lower = trimmed.toLowerCase();

  // Ethereum: 0x + 40 hex chars
  if (trimmed.startsWith("0x") && trimmed.length === 42) {
    const hexPart = trimmed.slice(2);
    if (/^[0-9a-fA-F]{40}$/.test(hexPart)) return "Ethereum";
  }

  // Bitcoin Legacy (mainnet/testnet) by first char and length 26..35
  if ((trimmed.startsWith("1") || trimmed.startsWith("3") || trimmed.startsWith("m") || trimmed.startsWith("n") || trimmed.startsWith("2")) && trimmed.length >= 26 && trimmed.length <= 35) {
    return "Bitcoin";
  }

  // Bitcoin Bech32 (mainnet/testnet)
  if (lower.startsWith("bc1q") || lower.startsWith("bc1p") || lower.startsWith("tb1q") || lower.startsWith("tb1p")) {
    return "Bitcoin";
  }

  // Solana: Base58, len usually >= 36
  const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (trimmed.length >= 36 && [...trimmed].every((c) => base58Chars.includes(c))) {
    return "Solana";
  }

  // ICP Principal (simplified): alphanumeric, hyphen-separated groups
  // Example: nppey-3ctwu-sps4z-cd2gh-fovyr-4lnq6-rq66v-pvtvq-oqal3-bvwhc-nae
  if (/^[a-zA-Z0-9-]+$/.test(trimmed) && trimmed.includes("-")) {
    const parts = trimmed.split("-").filter(Boolean);
    if (parts.length >= 5) {
      return "Internet Computer";
    }
  }

  return "Unknown";
}

// Return list of tokens supported by the detected network of the address
export function getSupportedTokensForAddress(address) {
  const network = detectAddressNetwork(address);
  if (network === "Unknown") return [];
  return TOKENS_CONFIG.filter((t) => t.chain === network);
}

// Very simple fee info by network/token
export function getFeeInfo(token) {
  if (!token) return "";
  switch (token.chain) {
    case "Bitcoin":
      return "Network fee: dynamic sat/vB (depends on mempool).";
    case "Ethereum":
      return "Network fee: gas (Gwei) based on network congestion.";
    case "Solana":
      return "Network fee: ~0.000005 SOL per tx (approx).";
    case "Internet Computer":
      return "Network fee: minimal cycles via ICRC transfer.";
    default:
      return "Network fee varies by network conditions.";
  }
}

export async function sendToken(tokenId, to, amount, principal) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  if (token.type === "native") {
    switch (token.id) {
      case 1: // BTC
        return await wallet.bitcoin_send({ destination_address: to, amount_in_satoshi: amount });
      case 2: // ETH
        return await wallet.ethereum_send(to, amount);
      case 3: // SOL
        return await wallet.solana_send(to, amount);
      default:
        throw new Error("Native token not supported");
    }
  }

  if (token.type === "icrc") {
    if (!principal) {
      throw new Error("Principal is required for ICRC tokens");
    }

    // Get decimals dynamically from ledger if token.decimals is null
    let decimals = token.decimals;
    if (decimals === null) {
      switch (token.id) {
        case 4: // ICP
          decimals = await icp_ledger.decimals();
          break;
        case 5: // Fradium
          decimals = await fradium_ledger.icrc1_decimals();
          break;
        default:
          throw new Error("Unknown ICRC token for decimals");
      }
    }

    // Convert amount to smallest unit (e8s)
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));

    // Convert string principal to Principal object
    const toPrincipal = Principal.fromText(to);

    switch (token.id) {
      case 4: // ICP
        return await icp_ledger.icrc1_transfer({
          from_subaccount: [],
          to: { owner: toPrincipal, subaccount: [] },
          amount: BigInt(amountInSmallestUnit),
          fee: [],
          memo: [],
          created_at_time: [],
        });

      case 5: // Fradium
        return await fradium_ledger.icrc1_transfer({
          from_subaccount: [],
          to: { owner: toPrincipal, subaccount: [] },
          amount: BigInt(amountInSmallestUnit),
          fee: [],
          memo: [],
          created_at_time: [],
        });

      default:
        throw new Error(`Unsupported ICRC token: ${token.symbol}`);
    }
  }

  throw new Error("Unsupported token type");
}

// Enhanced send token function with proper backend integration
export async function sendTokenToBackend(tokenId, to, amount, principal) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  console.log(`Sending ${amount} ${token.symbol} to ${to} via ${token.chain}`);

  try {
    let result;

    if (token.type === "native") {
      // Convert amount to proper units based on token decimals
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, token.decimals));

      switch (token.chain) {
        case "Bitcoin":
          result = await wallet.bitcoin_send({
            destination_address: to,
            amount_in_satoshi: BigInt(amountInSmallestUnit),
          });
          break;

        case "Ethereum":
          result = await wallet.ethereum_send(to, BigInt(amountInSmallestUnit));
          break;

        case "Solana":
          result = await wallet.solana_send(to, BigInt(amountInSmallestUnit));
          break;

        default:
          throw new Error(`Unsupported native token chain: ${token.chain}`);
      }
    } else if (token.type === "icrc") {
      if (!principal) {
        throw new Error("Principal is required for ICRC tokens");
      }

      // Get decimals dynamically from ledger if token.decimals is null
      let decimals = token.decimals;
      if (decimals === null) {
        switch (token.id) {
          case 4: // ICP
            decimals = await icp_ledger.decimals();
            break;
          case 5: // Fradium
            decimals = await fradium_ledger.icrc1_decimals();
            break;
          default:
            throw new Error("Unknown ICRC token for decimals");
        }
      }

      // Convert amount to smallest unit (e8s)
      const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));

      // Convert string principal to Principal object
      const toPrincipal = Principal.fromText(to);

      switch (token.id) {
        case 4: // ICP
          result = await icp_ledger.icrc1_transfer({
            from_subaccount: [],
            to: { owner: toPrincipal, subaccount: [] },
            amount: BigInt(amountInSmallestUnit),
            fee: [],
            memo: [],
            created_at_time: [],
          });
          break;

        case 5: // Fradium
          result = await fradium_ledger.icrc1_transfer({
            from_subaccount: [],
            to: { owner: toPrincipal, subaccount: [] },
            amount: BigInt(amountInSmallestUnit),
            fee: [],
            memo: [],
            created_at_time: [],
          });
          break;

        default:
          throw new Error(`Unsupported ICRC token: ${token.symbol}`);
      }

      // Handle ICRC transfer result
      if (result && typeof result === "object" && "Ok" in result) {
        result = result.Ok;
      } else if (result && typeof result === "object" && "Err" in result) {
        throw new Error(`Transfer failed: ${safeStringify(result.Err)}`);
      }
    } else {
      throw new Error(`Unsupported token type: ${token.type}`);
    }

    console.log(`Successfully sent ${amount} ${token.symbol} to ${to}. Transaction ID: ${result}`);
    return {
      success: true,
      transactionId: result,
      token: token,
      amount: amount,
      destination: to,
    };
  } catch (error) {
    console.error(`Failed to send ${token.symbol}:`, error);
    // Safely handle error message that might contain BigInt
    const errorMessage = error.message || error.toString();
    throw new Error(`Failed to send ${token.symbol}: ${errorMessage}`);
  }
}

export async function getBalance(tokenId, principal) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  console.log("getBalance called with tokenId:", tokenId, "principal:", principal, "principal type:", typeof principal);

  if (token.type === "native") {
    switch (token.id) {
      case 1: // BTC
        return await wallet.bitcoin_balance();
      case 2: // ETH
        return await wallet.ethereum_balance();
      case 3: // SOL
        return await wallet.solana_balance();
      default:
        throw new Error("Native token not supported");
    }
  }

  if (token.type === "icrc") {
    if (!principal) {
      throw new Error("Principal is required for ICRC tokens");
    }

    switch (token.id) {
      case 4: // ICP
        try {
          console.log("Fetching ICP balance for principal:", principal, "type:", typeof principal);
          // Convert string principal to Principal object if needed
          const principalObj = typeof principal === "string" ? Principal.fromText(principal) : principal;
          console.log("Principal object:", principalObj, "type:", typeof principalObj);

          let balance;
          try {
            // Try account_balance first (more compatible)
            const tokensResult = await icp_ledger.account_balance({
              account: {
                owner: principalObj,
                subaccount: [],
              },
            });
            console.log("ICP balance from account_balance:", tokensResult, "type:", typeof tokensResult);
            // Extract e8s from Tokens interface
            balance = tokensResult.e8s;
            console.log("ICP balance e8s:", balance, "type:", typeof balance, "isBigInt:", typeof balance === "bigint");
          } catch (error) {
            console.error("Error calling account_balance:", error);
            // Try icrc1_balance_of as fallback
            try {
              balance = await icp_ledger.icrc1_balance_of({
                owner: principalObj,
                subaccount: [],
              });
              console.log("ICP balance from icrc1_balance_of:", balance, "type:", typeof balance, "isBigInt:", typeof balance === "bigint");
            } catch (altError) {
              console.error("Both methods failed:", altError);
              throw error; // Throw original error
            }
          }

          // Get decimals dynamically from ledger if token.decimals is null
          let decimals = token.decimals;
          if (decimals === null) {
            try {
              decimals = await icp_ledger.icrc1_decimals();
            } catch (error) {
              console.warn("Failed to fetch ICP decimals, using default 8:", error);
              decimals = 8; // Default decimals for ICRC tokens
            }
          }
          console.log("ICP decimals:", decimals, "type:", typeof decimals);

          // Convert from e8s to ICP using dynamic decimals
          // balance is a bigint, so we need to convert it properly
          let balanceNumber;
          if (typeof balance === "bigint") {
            // For BigInt, convert to string first to avoid precision loss
            balanceNumber = parseFloat(balance.toString());
          } else {
            balanceNumber = Number(balance);
          }
          const divisor = Math.pow(10, decimals);
          const result = balanceNumber / divisor;

          // Handle edge cases
          if (isNaN(result) || !isFinite(result)) {
            console.warn("Invalid balance calculation for ICP:", { balance, balanceNumber, decimals, divisor, result });
            return "0";
          }

          return result.toString();
        } catch (error) {
          console.error("Error fetching ICP balance:", error);
          return "0";
        }
      case 5: // Fradium (FADM)
        try {
          console.log("Fetching Fradium balance for principal:", principal, "type:", typeof principal);
          // Convert string principal to Principal object if needed
          const principalObj = typeof principal === "string" ? Principal.fromText(principal) : principal;
          console.log("Principal object:", principalObj, "type:", typeof principalObj);

          const balance = await fradium_ledger.icrc1_balance_of({
            owner: principalObj,
            subaccount: [],
          });
          console.log("Fradium balance raw:", balance, "type:", typeof balance, "isBigInt:", typeof balance === "bigint");

          // Get decimals dynamically from ledger if token.decimals is null
          let decimals = token.decimals;
          if (decimals === null) {
            try {
              decimals = await fradium_ledger.icrc1_decimals();
            } catch (error) {
              console.warn("Failed to fetch Fradium decimals, using default 8:", error);
              decimals = 8; // Default decimals for ICRC tokens
            }
          }

          // Convert from e8s to FADM using dynamic decimals
          // balance is a bigint, so we need to convert it properly
          let balanceNumber;
          if (typeof balance === "bigint") {
            // For BigInt, convert to string first to avoid precision loss
            balanceNumber = parseFloat(balance.toString());
          } else {
            balanceNumber = Number(balance);
          }
          const divisor = Math.pow(10, decimals);
          const result = balanceNumber / divisor;

          // Handle edge cases
          if (isNaN(result) || !isFinite(result)) {
            console.warn("Invalid balance calculation for Fradium:", { balance, balanceNumber, decimals, divisor, result });
            return "0";
          }

          return result.toString();
        } catch (error) {
          console.error("Error fetching Fradium balance:", error);
          return "0";
        }
      default:
        throw new Error("ICRC token not supported");
    }
  }

  throw new Error("Unsupported token type");
}

// Function to format amount with specific rules
export function formatAmount(amount) {
  // Convert to number if it's a string
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // If amount is 0, return "0.0"
  if (numAmount === 0) {
    return "0.0";
  }

  // Convert to string with maximum precision
  const amountStr = numAmount.toString();

  // If it's an integer (no decimal part), add .0
  if (!amountStr.includes(".")) {
    return amountStr + ".0";
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = amountStr.split(".");

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  // If decimal part becomes empty after trimming, add .0
  if (trimmedDecimal === "") {
    return integerPart + ".0";
  }

  // Return with trimmed decimal part
  return integerPart + "." + trimmedDecimal;
}

// Function to get network icon based on chain
export function getNetworkIcon(chain) {
  const network = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === chain.toLowerCase());
  return network ? network.icon : null;
}

// Function to get USD price for a token with fallback APIs
export async function getUSD(tokenId) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  // Map token symbols to CoinGecko IDs
  const coinGeckoIds = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    ICP: "internet-computer",
    FADM: "fradium", // Note: Fradium might not be on CoinGecko, we'll handle this
  };

  const coinGeckoId = coinGeckoIds[token.symbol];

  // Primary API: CoinGecko
  try {
    if (coinGeckoId) {
      // Build URL with API key if available
      const baseUrl = "https://api.coingecko.com/api/v3/simple/price";
      const params = new URLSearchParams({
        ids: coinGeckoId,
        vs_currencies: "usd",
      });

      // Add API key if available
      if (COINGECKO_API_KEY) {
        params.append("x_cg_demo_api_key", COINGECKO_API_KEY);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(COINGECKO_API_KEY && { "x-cg-demo-api-key": COINGECKO_API_KEY }),
        },
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      if (data[coinGeckoId] && data[coinGeckoId].usd) {
        return data[coinGeckoId].usd;
      }
    }
  } catch (error) {
    console.warn("CoinGecko API failed:", error);
  }

  // Fallback API: CoinMarketCap (requires API key, but we can try without)
  try {
    const cmcIds = {
      BTC: "1",
      ETH: "1027",
      SOL: "5426",
      ICP: "8916",
    };

    const cmcId = cmcIds[token.symbol];

    if (cmcId) {
      // Build headers with API key if available
      const headers = {
        Accept: "application/json",
      };

      // Add API key if available
      if (COINMARKETCAP_API_KEY) {
        headers["X-CMC_PRO_API_KEY"] = COINMARKETCAP_API_KEY;
      }

      const response = await fetch(`https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail?id=${cmcId}`, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.statistics && data.data.statistics.price) {
        return data.data.statistics.price;
      }
    }
  } catch (error) {
    console.warn("CoinMarketCap API failed:", error);
  }

  // Fallback API: CoinPaprika
  try {
    const paprikaIds = {
      BTC: "btc-bitcoin",
      ETH: "eth-ethereum",
      SOL: "sol-solana",
      ICP: "icp-internet-computer",
    };

    const paprikaId = paprikaIds[token.symbol];

    if (paprikaId) {
      const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${paprikaId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`CoinPaprika API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.quotes && data.quotes.USD && data.quotes.USD.price) {
        return data.quotes.USD.price;
      }
    }
  } catch (error) {
    console.warn("CoinPaprika API failed:", error);
  }

  // Final fallback: Use cached/default prices or return null
  console.warn(`All price APIs failed for ${token.symbol}, using fallback`);

  // For tokens not supported by major APIs, return a default price or null
  const fallbackPrices = {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    ICP: 0,
    FADM: 0, // Placeholder price for Fradium
  };

  return fallbackPrices[token.symbol] || null;
}

// Function to get USD prices for multiple tokens at once
export async function getUSDPrices(tokenIds) {
  const promises = tokenIds.map((tokenId) => getUSD(tokenId));
  const results = await Promise.allSettled(promises);

  const prices = {};
  results.forEach((result, index) => {
    const tokenId = tokenIds[index];
    if (result.status === "fulfilled") {
      prices[tokenId] = result.value;
    } else {
      console.error(`Failed to get USD price for token ${tokenId}:`, result.reason);
      prices[tokenId] = null;
    }
  });

  return prices;
}

// Get chain name from token type
export function getChainFromTokenType(tokenType) {
  if (!tokenType) return "Unknown";

  // Handle different token type structures
  if (typeof tokenType === "string") {
    return tokenType;
  }

  if (typeof tokenType === "object") {
    // Handle object structure like { Bitcoin: null }
    const keys = Object.keys(tokenType);
    if (keys.length > 0) {
      return keys[0];
    }
  }

  return "Unknown";
}

// Get icon by chain name
export function getIconByChain(chain) {
  const token = TOKENS_CONFIG.find((t) => t.chain.toLowerCase() === chain.toLowerCase());
  return token ? `/${token.imageUrl}` : "/assets/images/coins/bitcoin.webp";
}
