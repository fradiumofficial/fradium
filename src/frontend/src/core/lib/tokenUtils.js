import { wallet } from "declarations/wallet";
import { icp_ledger } from "declarations/icp_ledger";
import { icp_index } from "declarations/icp_index";
import { fradium_ledger } from "declarations/fradium_ledger";
import { ckbtc_ledger } from "declarations/ckbtc_ledger";
import { ckbtc_minter } from "declarations/ckbtc_minter";
import { cketh_ledger } from "declarations/cketh_ledger";
import { cketh_minter } from "declarations/cketh_minter";
import { Principal } from "@dfinity/principal";
import { TOKENS_CONFIG, API_KEYS, NETWORK_CONFIG, COINGECKO_IDS, COINMARKETCAP_IDS, COINPAPRIKA_IDS, FALLBACK_PRICES, TOKEN_TYPE_MAPPINGS, DEFAULT_DECIMALS, CACHE_CONFIG } from "@/core/config/tokenConfig.js";

// Helper function to safely stringify objects that may contain BigInt
function safeStringify(obj) {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}

// Helper functions for localStorage caching (similar to WalletProvider)
function getBalanceCacheKey(principal, tokenId) {
  return principal ? `${CACHE_CONFIG.BALANCE_CACHE_PREFIX}${principal}_${tokenId}` : `${CACHE_CONFIG.BALANCE_CACHE_PREFIX}default_${tokenId}`;
}

function loadBalanceFromStorage(principal, tokenId) {
  const key = getBalanceCacheKey(principal, tokenId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if cache is still valid
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_CONFIG.BALANCE_CACHE_DURATION) {
        return parsed.balance;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error("Error loading balance from localStorage:", error);
  }
  return null;
}

function saveBalanceToStorage(principal, tokenId, balance) {
  const key = getBalanceCacheKey(principal, tokenId);
  try {
    const cacheData = {
      balance: balance,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving balance to localStorage:", error);
  }
}

function clearBalanceCache(principal, tokenId = null) {
  try {
    if (tokenId !== null) {
      // Clear cache for specific token
      const key = getBalanceCacheKey(principal, tokenId);
      localStorage.removeItem(key);
    } else {
      // Clear all balance cache for this principal
      const principalString = principal?.toString() || null;
      if (principalString) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${CACHE_CONFIG.BALANCE_CACHE_PREFIX}${principalString}_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });
      }
    }
  } catch (error) {
    console.error("Error clearing balance cache:", error);
  }
}

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
export function getSupportedTokensForAddress(address, principal = null) {
  const network = detectAddressNetwork(address);
  if (network === "Unknown") return [];

  // Filter by network first
  const networkTokens = TOKENS_CONFIG.filter((t) => t.chain === network);

  // If no principal provided, return all network tokens
  if (!principal) return networkTokens;

  // Filter by user visibility settings
  return networkTokens.filter((token) => {
    try {
      return getTokenVisibility(principal, token.id);
    } catch (error) {
      console.error(`Error checking visibility for token ${token.symbol}:`, error);
      return true; // Default to visible if error
    }
  });
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
        case 6: // ckBTC
          decimals = await ckbtc_ledger.icrc1_decimals();
          decimals = 8; // ckBTC typically has 8 decimals like BTC
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

      case 6: // ckBTC
        return await ckbtc_ledger.icrc1_transfer({
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
            decimals = Number(await icp_ledger.decimals());
            break;
          case 5: // Fradium
            decimals = Number(await fradium_ledger.icrc1_decimals());
            break;
          case 6: // ckBTC
            {
              let d = 8;
              try {
                d = Number(await ckbtc_ledger.icrc1_decimals());
              } catch (_e) {
                d = 8; // fallback
              }
              decimals = d;
            }
            break;
          case 7: // ckETH
            {
              let d = 18;
              try {
                d = Number(await cketh_ledger.icrc1_decimals());
              } catch (_e) {
                d = 18; // fallback
              }
              decimals = d;
            }
            break;
          default:
            throw new Error("Unknown ICRC token for decimals");
        }
      }

      // Ensure decimals is a finite number
      decimals = Number(decimals);
      if (!Number.isFinite(decimals)) {
        decimals = 8;
      }

      // Convert amount to smallest unit (e8s)
      const power = Math.pow(10, Number(decimals));
      const amountInSmallestUnit = Math.floor(Number(amount) * power);

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

        case 6: // ckBTC
          result = await ckbtc_ledger.icrc1_transfer({
            from_subaccount: [],
            to: { owner: toPrincipal, subaccount: [] },
            amount: BigInt(amountInSmallestUnit),
            fee: [],
            memo: [],
            created_at_time: [],
          });
          break;

        case 7: // ckETH
          result = await cketh_ledger.icrc1_transfer({
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

// Send ICRC token using raw smallest unit amount to a specific account (owner + optional subaccount)
export async function sendIcrcToAccountRaw(tokenSymbol, ownerPrincipalText, subaccountBlob, amountNat) {
  // Map symbol to ledger
  const symbol = typeof tokenSymbol === "string" ? tokenSymbol : Object.keys(tokenSymbol || {})[0] || "";
  const owner = Principal.fromText(ownerPrincipalText);
  const toRecord = { owner, subaccount: subaccountBlob ? [subaccountBlob] : [] };
  const amount = BigInt(amountNat);

  // Choose ledger by symbol
  let ledger = null;
  switch (symbol) {
    case "ICP":
      ledger = icp_ledger;
      break;
    case "FRADIUM":
      ledger = fradium_ledger;
      break;
    case "ckBTC":
      ledger = ckbtc_ledger;
      break;
    case "ckETH":
      ledger = cketh_ledger;
      break;
    default:
      throw new Error(`Unsupported ICRC symbol for raw transfer: ${symbol}`);
  }

  const res = await ledger.icrc1_transfer({
    from_subaccount: [],
    to: toRecord,
    amount,
    fee: [],
    memo: [],
    created_at_time: [],
  });

  if (res && typeof res === "object" && "Err" in res) {
    throw new Error(`ICRC transfer failed: ${safeStringify(res.Err)}`);
  }

  return res?.Ok ?? res;
}

export async function getBalance(tokenId, principal, useCache = true, identity = null) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  // Get principal string for caching
  const principalString = principal?.toString() || null;

  // Retry mechanism - try up to 3 times
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchBalanceWithRetry(token, principal, principalString, useCache, identity);
    } catch (error) {
      lastError = error;
      console.warn(`Balance fetch attempt ${attempt}/${maxRetries} failed for ${token.symbol}:`, error.message);
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Failed to fetch ${token.symbol} balance after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
}

// Helper function to fetch balance (extracted from original getBalance logic)
async function fetchBalanceWithRetry(token, principal, principalString, useCache, identity = null) {
  if (token.type === "native") {
    try {
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
    } catch (error) {
      console.error(`Error fetching ${token.symbol} balance:`, error);
      throw new Error(`Failed to fetch ${token.symbol} balance: ${error.message || "Unknown error"}`);
    }
  }

  if (token.type === "icrc") {
    if (!principal) {
      throw new Error("Principal is required for ICRC tokens");
    }

    switch (token.id) {
      case 4: // ICP
        try {
          const balance = await icp_index.icrc1_balance_of({
            owner: principal,
            subaccount: [],
          });

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

          // Convert from e8s to ICP using dynamic decimals
          // balance is a bigint, so we need to convert it properly
          const balanceNumber = Number(balance);
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
          throw new Error(`Failed to fetch ICP balance: ${error.message || "Unknown error"}`);
        }
      case 5: // Fradium (FADM)
        try {
          const balance = await fradium_ledger.icrc1_balance_of({
            owner: principal,
            subaccount: [],
          });

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
          const balanceNumber = Number(balance);
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
          throw new Error(`Failed to fetch Fradium balance: ${error.message || "Unknown error"}`);
        }
      case 6: // ckBTC
        try {
          // Trigger balance refresh on ckBTC minter before reading ledger balance
          try {
            const result = await ckbtc_minter.update_balance({ owner: [principal], subaccount: [] });
            console.log("ckBTC update_balance result:", result);
          } catch (e) {
            // Ignore refresh errors like AlreadyProcessing/NoNewUtxos and proceed to read balance
            console.warn("ckBTC update_balance warning:", e);
          }

          const balance = await ckbtc_ledger.icrc1_balance_of({
            owner: principal,
            subaccount: [],
          });

          // Get decimals dynamically from ledger if token.decimals is null
          let decimals = token.decimals;
          if (decimals === null) {
            // decimals = await ckbtc_ledger.icrc1_decimals();
            decimals = 8; // ckBTC typically has 8 decimals like BTC
          }

          // Convert from e8s to ckBTC using dynamic decimals
          // balance is a bigint, so we need to convert it properly
          const balanceNumber = Number(balance);
          const divisor = Math.pow(10, decimals);
          const result = balanceNumber / divisor;

          // Handle edge cases
          if (isNaN(result) || !isFinite(result)) {
            console.warn("Invalid balance calculation for ckBTC:", { balance, balanceNumber, decimals, divisor, result });
            return "0";
          }

          const resultString = result.toString();

          // Save to cache if useCache is enabled
          if (useCache && principalString) {
            saveBalanceToStorage(principalString, token.id, resultString);
          }

          return resultString;
        } catch (error) {
          console.error("Error fetching ckBTC balance:", error);
          throw new Error(`Failed to fetch ckBTC balance: ${error.message || "Unknown error"}`);
        }
      case 7: // ckETH
        try {
          // ckETH doesn't need update_balance like ckBTC, directly read from ledger
          const balance = await cketh_ledger.icrc1_balance_of({
            owner: principal,
            subaccount: [],
          });

          // Get decimals dynamically from ledger if token.decimals is null
          let decimals = token.decimals;
          if (decimals === null) {
            try {
              decimals = await cketh_ledger.icrc1_decimals();
            } catch (error) {
              console.warn("Failed to fetch ckETH decimals, using default 18:", error);
              decimals = 18; // ckETH typically has 18 decimals like ETH
            }
          }

          // Convert from e18s to ckETH using dynamic decimals
          // balance is a bigint, so we need to convert it properly
          const balanceNumber = Number(balance);
          const divisor = Math.pow(10, decimals);
          const result = balanceNumber / divisor;

          // Handle edge cases
          if (isNaN(result) || !isFinite(result)) {
            console.warn("Invalid balance calculation for ckETH:", { balance, balanceNumber, decimals, divisor, result });
            return "0";
          }

          const resultString = result.toString();

          // Save to cache if useCache is enabled
          if (useCache && principalString) {
            saveBalanceToStorage(principalString, token.id, resultString);
          }

          return resultString;
        } catch (error) {
          console.error("Error fetching ckETH balance:", error);
          throw new Error(`Failed to fetch ckETH balance: ${error.message || "Unknown error"}`);
        }
      default:
        throw new Error("ICRC token not supported");
    }
  }

  if (token.type === "sns") {
    if (!principal) {
      throw new Error("Principal is required for SNS tokens");
    }

    try {
      // Import SNS Token Service dynamically to avoid circular dependencies
      const { SNSTokenService } = await import("@/core/services/snsTokenService.js");

      const balance = await SNSTokenService.getBalance(token.symbol, principal, [], identity);

      // Save to cache if useCache is enabled
      if (useCache && principalString) {
        saveBalanceToStorage(principalString, token.id, balance.toString());
      }

      return balance.toString();
    } catch (error) {
      console.error(`Error fetching ${token.symbol} balance:`, error);
      throw new Error(`Failed to fetch ${token.symbol} balance: ${error.message || "Unknown error"}`);
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

  // Special handling for Fradium token - return 0 directly since it's not available on major APIs
  if (token.symbol === "FADM") {
    return 0;
  }

  // Retry mechanism - try up to 3 times
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchUSDPriceWithRetry(token);
    } catch (error) {
      lastError = error;
      console.warn(`USD price fetch attempt ${attempt}/${maxRetries} failed for ${token.symbol}:`, error.message);
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Failed to fetch ${token.symbol} USD price after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
}

// Helper function to fetch USD price (extracted from original getUSD logic)
async function fetchUSDPriceWithRetry(token) {
  const coinGeckoId = COINGECKO_IDS[token.symbol];

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
      if (API_KEYS.COINGECKO_API_KEY) {
        params.append("x_cg_demo_api_key", API_KEYS.COINGECKO_API_KEY);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(API_KEYS.COINGECKO_API_KEY && { "x-cg-demo-api-key": API_KEYS.COINGECKO_API_KEY }),
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
    // Don't throw here, try fallback APIs
  }

  // Fallback API: CoinMarketCap (requires API key, but we can try without)
  try {
    const cmcId = COINMARKETCAP_IDS[token.symbol];

    if (cmcId) {
      // Build headers with API key if available
      const headers = {
        Accept: "application/json",
      };

      // Add API key if available
      if (API_KEYS.COINMARKETCAP_API_KEY) {
        headers["X-CMC_PRO_API_KEY"] = API_KEYS.COINMARKETCAP_API_KEY;
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
    // Don't throw here, try fallback APIs
  }

  // Fallback API: CoinPaprika
  try {
    const paprikaId = COINPAPRIKA_IDS[token.symbol];

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
    // Don't throw here, try fallback
  }

  // Final fallback: Use cached/default prices or return 0
  console.warn(`All price APIs failed for ${token.symbol}, using fallback`);

  const fallbackPrice = FALLBACK_PRICES[token.symbol];
  if (fallbackPrice === undefined) {
    console.warn(`No fallback price available for ${token.symbol}, returning 0`);
    return 0;
  }

  return fallbackPrice;
}

// Token visibility management functions for localStorage
function getTokenVisibilityKey(principal, tokenId) {
  const principalString = principal?.toString() || "default";
  return `token_visibility_${principalString}_${tokenId}`;
}

function getUserSettingsKey(principal) {
  const principalString = principal?.toString() || "default";
  return `user_token_settings_${principalString}`;
}

function hasUserTokenSettings(principal) {
  try {
    const key = getUserSettingsKey(principal);
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error("Error checking user token settings:", error);
    return false;
  }
}

function initializeUserTokenSettings(principal) {
  try {
    const principalString = principal?.toString() || "default";
    const key = getUserSettingsKey(principal);

    // Mark user as initialized
    localStorage.setItem(key, JSON.stringify({ initialized: true, timestamp: Date.now() }));

    // Set default visibility for all tokens
    TOKENS_CONFIG.forEach((token) => {
      const tokenKey = getTokenVisibilityKey(principal, token.id);
      let isVisible = true;

      // SNS tokens are hidden by default for new users
      if (token.type === "sns") {
        isVisible = false;
      }

      localStorage.setItem(tokenKey, JSON.stringify(isVisible));
    });

    console.log(`Initialized token settings for new user: ${principalString}`);
  } catch (error) {
    console.error("Error initializing user token settings:", error);
  }
}

export function getTokenVisibility(principal, tokenId) {
  try {
    const key = getTokenVisibilityKey(principal, tokenId);
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return JSON.parse(saved);
    }

    // Check if this is a new user (no token visibility settings at all)
    if (!hasUserTokenSettings(principal)) {
      // Initialize default settings for new user
      initializeUserTokenSettings(principal);
    }

    // Get the token to check if it's SNS
    const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
    if (token && token.type === "sns") {
      // Default SNS tokens to hidden for new users
      return false;
    }

    // Default to visible (true) for non-SNS tokens
    return true;
  } catch (error) {
    console.error("Error loading token visibility from localStorage:", error);
    return true; // Default to visible
  }
}

export function setTokenVisibility(principal, tokenId, isVisible) {
  try {
    const key = getTokenVisibilityKey(principal, tokenId);
    localStorage.setItem(key, JSON.stringify(isVisible));
  } catch (error) {
    console.error("Error saving token visibility to localStorage:", error);
  }
}

export function getAllTokenVisibility(principal) {
  try {
    const principalString = principal?.toString() || "default";
    const prefix = `token_visibility_${principalString}_`;
    const visibility = {};

    // Get all keys that match our pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const tokenId = parseInt(key.replace(prefix, ""));
        if (!isNaN(tokenId)) {
          visibility[tokenId] = getTokenVisibility(principal, tokenId);
        }
      }
    }

    return visibility;
  } catch (error) {
    console.error("Error loading all token visibility from localStorage:", error);
    return {};
  }
}

export function clearTokenVisibility(principal, tokenId = null) {
  try {
    const principalString = principal?.toString() || "default";
    const prefix = `token_visibility_${principalString}_`;

    if (tokenId !== null) {
      // Clear specific token visibility
      const key = getTokenVisibilityKey(principal, tokenId);
      localStorage.removeItem(key);
    } else {
      // Clear all token visibility for this principal
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error("Error clearing token visibility:", error);
  }
}

// Function to manually initialize user token settings (useful for existing users)
export function initializeUserTokenSettingsManually(principal) {
  try {
    const principalString = principal?.toString() || "default";
    const key = getUserSettingsKey(principal);

    // Mark user as initialized
    localStorage.setItem(key, JSON.stringify({ initialized: true, timestamp: Date.now() }));

    // Set default visibility for all tokens
    TOKENS_CONFIG.forEach((token) => {
      const tokenKey = getTokenVisibilityKey(principal, token.id);
      let isVisible = true;

      // SNS tokens are hidden by default for new users
      if (token.type === "sns") {
        isVisible = false;
      }

      localStorage.setItem(tokenKey, JSON.stringify(isVisible));
    });

    console.log(`Manually initialized token settings for user: ${principalString}`);
    return true;
  } catch (error) {
    console.error("Error manually initializing user token settings:", error);
    return false;
  }
}

// Function to check if user is new (hasn't been initialized yet)
export function isNewUser(principal) {
  return !hasUserTokenSettings(principal);
}

// Export cache management functions
export { clearBalanceCache };

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
    return TOKEN_TYPE_MAPPINGS[tokenType] || tokenType;
  }

  if (typeof tokenType === "object") {
    // Handle object structure like { Bitcoin: null }
    const keys = Object.keys(tokenType);
    if (keys.length > 0) {
      return TOKEN_TYPE_MAPPINGS[keys[0]] || keys[0];
    }
  }

  return "Unknown";
}

// Get icon by chain name and token type
export function getIconByChain(chain, tokenType = null) {
  // For Internet Computer chain, determine token based on tokenType
  if (chain.toLowerCase() === "internet computer" && tokenType) {
    if (tokenType === "icp") {
      const token = TOKENS_CONFIG.find((t) => t.id === 4); // ICP token
      return token ? `/${token.imageUrl}` : "/assets/images/coins/icp.webp";
    } else if (tokenType === "fradium") {
      const token = TOKENS_CONFIG.find((t) => t.id === 5); // Fradium token
      return token ? `/${token.imageUrl}` : "/assets/images/coins/fradium.webp";
    } else if (tokenType === "ckbtc") {
      const token = TOKENS_CONFIG.find((t) => t.id === 6); // ckBTC token
      return token ? `/${token.imageUrl}` : "/assets/images/coins/ckbtc.webp";
    } else if (tokenType === "cketh") {
      const token = TOKENS_CONFIG.find((t) => t.id === 7); // ckETH token
      return token ? `/${token.imageUrl}` : "/assets/images/coins/cketh.webp";
    } else {
      // Check if it's an SNS token
      const snsToken = TOKENS_CONFIG.find((token) => token.type === "sns" && token.symbol.toLowerCase() === tokenType.toLowerCase());
      if (snsToken) {
        return `/${snsToken.imageUrl}`;
      }
    }
  }

  // For other chains, find by chain name
  const token = TOKENS_CONFIG.find((t) => t.chain.toLowerCase() === chain.toLowerCase());
  return token ? `/${token.imageUrl}` : "/assets/images/coins/bitcoin.webp";
}

// Ensure path starts with "/" so it works from nested routes
function ensureLeadingSlash(path) {
  if (!path || typeof path !== "string") return null;
  return path.startsWith("/") ? path : `/${path}`;
}

// Normalize symbol variants from UI (e.g., "Fradium" -> "FRADIUM")
function normalizeSymbol(symbol) {
  if (!symbol) return symbol;
  const s = String(symbol);
  if (s.toLowerCase() === "fradium") return "FRADIUM";
  return s.toUpperCase();
}

// Get token icon by symbol with safe public path
export function getTokenIconBySymbol(symbol) {
  try {
    const normalized = normalizeSymbol(symbol);
    const token = TOKENS_CONFIG.find((t) => t.symbol === normalized || t.symbol?.toUpperCase?.() === normalized);
    if (token?.imageUrl) {
      return ensureLeadingSlash(token.imageUrl);
    }
  } catch (e) {
    console.warn("getTokenIconBySymbol error:", e);
  }
  // Fallback generic icon
  return "/assets/images/coins/bitcoin.webp";
}

// Get ckETH helper contract address for deposits
export async function getCkEthHelperContractAddress() {
  try {
    if (!cketh_minter) {
      throw new Error("ckETH minter not available");
    }
    const address = await cketh_minter.smart_contract_address();
    return address;
  } catch (error) {
    console.error("Error fetching ckETH helper contract address:", error);
    return null;
  }
}

// Get ckETH minter address (for reference, not for direct deposits)
export async function getCkEthMinterAddress() {
  try {
    if (!cketh_minter) {
      throw new Error("ckETH minter not available");
    }
    const address = await cketh_minter.minter_address();
    return address;
  } catch (error) {
    console.error("Error fetching ckETH minter address:", error);
    return null;
  }
}
