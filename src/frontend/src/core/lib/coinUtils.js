import { wallet } from "declarations/wallet";

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
    decimals: 8,
    imageUrl: "assets/images/coins/icp.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  },
  {
    id: 5,
    name: "Fradium",
    symbol: "FADM",
    chain: "Internet Computer",
    decimals: 8,
    imageUrl: "assets/images/coins/fradium.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
  },
];

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
    icon: "/assets/images/networks/solana.webp", // Using solana as placeholder for ICP
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

  // ICP Principal (simplified): lowercase, hyphen-separated groups
  // Example: m5rq4-tzmga-7d5hk-l37qx-42aao-gk3xg-jvocx-tqxeh-26hfr-hcaga-qae
  if (/^[a-z0-9-]+$/.test(lower) && lower.includes("-")) {
    const parts = lower.split("-").filter(Boolean);
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

export async function sendToken(tokenId, to, amount) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  if (token.type === "native") {
    switch (token.id) {
      case "BTC":
        return await wallet.bitcoin_send({ destination_address: to, amount_in_satoshi: amount });
      case "ETH":
        return await wallet.ethereum_send(to, amount);
      case "SOL":
        return await wallet.solana_send(to, amount);
      default:
        throw new Error("Native token not supported");
    }
  }

  if (token.type === "icrc" && token.canisterId) {
    const ledger = await initLedgerActor(token.canisterId);
    return await ledger.icrc1_transfer({
      from_subaccount: [],
      to: { owner: to, subaccount: [] },
      amount,
      fee: [],
      memo: [],
      created_at_time: [],
    });
  }

  throw new Error("Unsupported token type");
}

export async function getBalance(tokenId) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

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
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`, {
        method: "GET",
        headers: {
          Accept: "application/json",
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
      const response = await fetch(`https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail?id=${cmcId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
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
