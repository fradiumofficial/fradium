// Solana Data Extractor Service
// Port 1:1 dari data_extractor.rs ke JavaScript
// Mengikuti struktur dan logika yang sama persis dengan implementasi Rust

const HELIUS_BASE = "https://api.helius.xyz";
const JUPITER_LITE_URL = "https://lite-api.jup.ag/price/v3?ids=";
const CRYPTOCOMPARE_URL = "https://min-api.cryptocompare.com/data/pricehistorical";

const LAMPORTS_TO_SOL_F64 = 1_000_000_000.0;
const HELIUS_MAX_RECORDS = 1000;
const MAX_TRANSACTIONS_PER_ADDRESS = 50000;
const MAX_RETRIES = 3;

// Program sets (sinkron dengan config.rs)
const DEX_PROGRAMS = new Set(["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"]);
const LENDING_PROGRAMS = new Set(["So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo", "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg", "LendZqTs7gn5CTSJU1jWKhKuVpjg9avMpS7FgG7V4CJ"]);
const STAKING_PROGRAMS = new Set(["MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD", "StakeSSzfxn391k3LvdKbZP5WVwWd6AsY39qcgwy7f3J", "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"]);
// Gabungan program untuk deteksi konteks (sinkron dengan config.rs)
const COMPREHENSIVE_PROGRAMS = new Set([
  // System + Token
  "11111111111111111111111111111112",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  // Raydium/Orca/Jupiter dll
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUQpMDdHwMBSPBy4kD",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
  // Orca historical
  "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1",
  "EhYXq3ANp5nAerUpbSgd7VK2RRcxK1zNuSQ755G5Mtc1",
  // Serum
  "EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  "BJ3jrUzddfuSrZHXSCxMbUE2yoHqpiUWyypURhoxiFwZ",
  // Lending
  "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",
  "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg",
  "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",
  "LendZqTs7gn5CTSJU1jWKhKuVpjg9avMpS7FgG7V4CJ",
  "FC81tbGt6JWRXidaWYFXxGnTk2VgEYrLR9c2YLGgCu8z",
  // Staking
  "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
  "StakeSSzfxn391k3LvdKbZP5WVwWd6AsY39qcgwy7f3J",
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  "SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY",
  // Cross-chain Bridges
  "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
  "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
  "HDwcJBJXjL9FpJ7UBsYBtaDjsBUhuLCUYoz3zr8SWWaQ",
  // NFT Marketplaces
  "CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz",
  "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk",
  "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
  // Other DeFi
  "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR",
  "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
  // Oracles
  "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH",
  "gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s",
  // Governance
  "Gov1BBdCNNqVD39vdFm93vVEwX7xEYqR3AwKbyKPP4",
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw",
]);

// Data structures matching Rust models
const KNOWN_TOKENS = new Map([
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", { symbol: "USDC", decimals: 6, name: "USD Coin" }],
  ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", { symbol: "USDT", decimals: 6, name: "Tether" }],
  ["So11111111111111111111111111111111111111112", { symbol: "WSOL", decimals: 9, name: "Wrapped SOL" }],
  ["9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", { symbol: "BTC", decimals: 6, name: "Bitcoin (Sollet)" }],
  ["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", { symbol: "mSOL", decimals: 9, name: "Marinade staked SOL" }],
  ["J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", { symbol: "jitoSOL", decimals: 9, name: "Jito Staked SOL" }],
  ["bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", { symbol: "bSOL", decimals: 9, name: "BlazeStake Staked SOL" }],
]);

// Transaction types matching Rust enum
const TransactionType = {
  SolTransfer: "SolTransfer",
  TokenTransfer: "TokenTransfer",
  Failed: "Failed",
  FeeOnly: "FeeOnly",
};

// Transaction context matching Rust enum
const TransactionContext = {
  DexSwap: "DEX_SWAP",
  Lending: "LENDING",
  Staking: "STAKING",
  PureTransfer: "PURE_TRANSFER",
  OtherProgram: "OTHER_PROGRAM",
  Unknown: "UNKNOWN",
};

// Helper functions matching Rust implementation
function isWrappedSOL(mint) {
  return mint === "So11111111111111111111111111111111111111112";
}

function normalizeTokenAmount(raw, decimals) {
  const d = Math.min(Math.max(Number(decimals || 9), 0), 18);
  return Number(raw) / Math.pow(10, d);
}

function normalizeAddress(addr) {
  return String(addr || "").trim();
}

// SolanaDataExtractor class matching Rust struct
class SolanaDataExtractor {
  constructor() {
    this.priceConverter = new SolanaPriceConverter();
    this.classifier = new TransactionClassifier();
  }

  // get_all_transactions - matches Rust method exactly
  async getAllTransactions(address) {
    console.log(`Fetching Solana transactions for address: ${address}`);

    let allRawTransactions = [];
    let beforeSignature = null;
    let pageCount = 0;

    while (true) {
      if (allRawTransactions.length >= MAX_TRANSACTIONS_PER_ADDRESS) {
        console.log(`Limiting to ${MAX_TRANSACTIONS_PER_ADDRESS} transactions`);
        allRawTransactions = allRawTransactions.slice(0, MAX_TRANSACTIONS_PER_ADDRESS);
        break;
      }

      pageCount += 1;
      console.log(`Fetching page ${pageCount}`);

      const pageTransactions = await this.fetchTransactionPage(address, beforeSignature);

      if (!Array.isArray(pageTransactions) || pageTransactions.length === 0) {
        break;
      }

      // Just store the raw transactions - no parsing here
      allRawTransactions.push(...pageTransactions);

      if (pageTransactions.length < HELIUS_MAX_RECORDS) {
        break;
      }

      beforeSignature = pageTransactions[pageTransactions.length - 1]?.signature || null;
    }

    console.log(`Total raw transactions fetched: ${allRawTransactions.length}`);
    return allRawTransactions;
  }

  // parse_all_transactions - matches Rust method exactly
  async parseAllTransactions(rawTransactions, targetAddress) {
    let allParsedTransactions = [];

    for (const rawTx of rawTransactions) {
      const parsedTxs = await this.parseSolanaTransaction(rawTx, targetAddress);
      allParsedTransactions.push(...parsedTxs);
    }

    console.log(`Total parsed transactions: ${allParsedTransactions.length}`);
    return allParsedTransactions;
  }

  // fetch_transaction_page - matches Rust method exactly
  async fetchTransactionPage(address, beforeSignature) {
    let url = `${HELIUS_BASE}/v0/addresses/${address}/transactions?api-key=${process.env.VITE_HELIUS_API_KEY}`;

    if (beforeSignature) {
      url += `&before=${encodeURIComponent(beforeSignature)}`;
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Solana-Fraud-Detector/1.0",
            Accept: "application/json",
          },
        });

        if (response.status === 200) {
          const transactions = await response.json();
          return transactions;
        } else if (response.status === 429) {
          console.log(`Rate limited, attempt ${attempt + 1} of ${MAX_RETRIES}`);
          continue;
        } else {
          const errorBody = await response.text().catch(() => "");
          throw new Error(`API Error: HTTP ${response.status} - ${errorBody}`);
        }
      } catch (error) {
        console.log(`Request failed, attempt ${attempt + 1} of ${MAX_RETRIES}: ${error.message}`);
        if (attempt === MAX_RETRIES - 1) {
          throw new Error(`All retry attempts failed: ${error.message}`);
        }
      }
    }

    throw new Error("Maximum retry attempts exceeded");
  }

  // parse_solana_transaction - matches Rust method exactly
  async parseSolanaTransaction(rawTx, targetAddress) {
    let parsedTransactions = [];

    // Basic transaction info
    const signature = rawTx.signature || "";
    const slot = Number(rawTx.slot || 0);
    const timestamp = Number(rawTx.timestamp || 0);
    const feeLamports = Number(rawTx.fee || 0);

    // Validate basic data (matches Rust validation)
    if (!signature || slot === 0 || timestamp === 0) {
      console.log(`Skipping invalid transaction: sig=${signature.slice(0, 20)}, slot=${slot}, ts=${timestamp}`);
      return parsedTransactions;
    }

    const succeeded = !rawTx.meta?.err;

    // Get transaction context (enhanced classification)
    const txContext = this.classifier.classifyTransactionContext(rawTx);
    const isProgrammatic = this.classifier.isProgrammaticTransaction(rawTx);

    // Handle failed transactions (matches Rust logic)
    if (!succeeded) {
      const parsedTx = {
        signature: signature,
        slot: slot,
        timestamp: timestamp,
        tx_type: TransactionType.Failed,
        tx_context: txContext,
        is_programmatic: isProgrammatic,
        from: targetAddress,
        to: targetAddress,
        value_normalized: 0.0,
        value_sol: 0.0,
        fee_lamports: feeLamports,
        success: false,
        mint_address: "So11111111111111111111111111111111111111112",
        decimals: 9,
        price_fetch_success: true,
        sol_ratio: null,
      };
      parsedTransactions.push(parsedTx);
      return parsedTransactions;
    }

    // Parse successful transactions (matches Rust parsing)
    const solTransfers = this.extractSolTransfers(rawTx, targetAddress);
    const tokenTransfers = await this.extractTokenTransfers(rawTx, targetAddress);

    const solTransfersEmpty = solTransfers.length === 0;

    // Process SOL transfers
    for (const transfer of solTransfers) {
      const parsedTx = {
        ...transfer,
        signature: signature,
        slot: slot,
        timestamp: timestamp,
        tx_type: TransactionType.SolTransfer,
        tx_context: txContext,
        is_programmatic: isProgrammatic,
        fee_lamports: feeLamports,
        success: true,
        price_fetch_success: true,
        value_sol: transfer.value_normalized,
      };
      parsedTransactions.push(parsedTx);
    }

    // Process token transfers with proper price conversion
    for (const transfer of tokenTransfers) {
      const mintAddress = transfer.mint_address;
      const rawValue = transfer.value_normalized;
      const decimals = transfer.decimals;

      // Normalize token amount properly (matches Rust)
      const normalizedValue = rawValue > 1000000.0 ? normalizeTokenAmount(Math.floor(rawValue), decimals) : rawValue;

      // Convert to SOL value with enhanced error handling
      const [solRatio, priceSuccess] = await this.priceConverter.getTokenSolRatio(mintAddress, timestamp);
      const valueSol = priceSuccess ? normalizedValue * solRatio : 0.0;

      const parsedTx = {
        ...transfer,
        signature: signature,
        slot: slot,
        timestamp: timestamp,
        tx_type: TransactionType.TokenTransfer,
        tx_context: txContext,
        is_programmatic: isProgrammatic,
        fee_lamports: solTransfersEmpty ? feeLamports : 0,
        success: true,
        value_normalized: normalizedValue,
        value_sol: valueSol,
        price_fetch_success: priceSuccess,
        sol_ratio: solRatio,
      };
      parsedTransactions.push(parsedTx);
    }

    // If no transfers found but transaction succeeded, create fee-only entry
    if (parsedTransactions.length === 0 && succeeded) {
      const parsedTx = {
        signature: signature,
        slot: slot,
        timestamp: timestamp,
        tx_type: TransactionType.FeeOnly,
        tx_context: txContext,
        is_programmatic: isProgrammatic,
        from: targetAddress,
        to: targetAddress,
        value_normalized: 0.0,
        value_sol: 0.0,
        fee_lamports: feeLamports,
        success: true,
        mint_address: "So11111111111111111111111111111111111111112",
        decimals: 9,
        price_fetch_success: true,
        sol_ratio: null,
      };
      parsedTransactions.push(parsedTx);
    }

    return parsedTransactions;
  }

  // extract_sol_transfers - matches Rust method exactly
  extractSolTransfers(rawTx, targetAddress) {
    let transfers = [];

    // Method 1: nativeTransfers (most reliable for SOL) - matches Rust logic
    for (const transfer of rawTx.native_transfers || []) {
      const fromAddr = transfer.from_user_account || "";
      const toAddr = transfer.to_user_account || "";

      if ((fromAddr && fromAddr.toLowerCase() === targetAddress.toLowerCase()) || (toAddr && toAddr.toLowerCase() === targetAddress.toLowerCase())) {
        const solAmount = Number(transfer.amount || 0) / LAMPORTS_TO_SOL_F64;

        const parsedTx = {
          from: fromAddr,
          to: toAddr,
          value_normalized: solAmount,
          mint_address: "So11111111111111111111111111111111111111112",
          decimals: 9,
        };
        transfers.push(parsedTx);
      }
    }

    // Method 2: tokenTransfers for WSOL (wrapped SOL) - matches Rust logic
    for (const transfer of rawTx.token_transfers || []) {
      if (!isWrappedSOL(transfer.mint)) {
        continue;
      }

      const fromAddr = transfer.from_user_account || "";
      const toAddr = transfer.to_user_account || "";

      if (fromAddr.toLowerCase() === targetAddress.toLowerCase() || toAddr.toLowerCase() === targetAddress.toLowerCase()) {
        let amount = 0.0;
        if (transfer.raw_token_amount) {
          const rawAmount = Number(transfer.raw_token_amount);
          if (Number.isFinite(rawAmount)) {
            amount = normalizeTokenAmount(rawAmount, 9); // WSOL has 9 decimals
          }
        }
        if (amount === 0.0) {
          amount = Number(transfer.token_amount || 0.0);
        }

        const parsedTx = {
          from: fromAddr,
          to: toAddr,
          value_normalized: amount,
          mint_address: "So11111111111111111111111111111111111111112",
          decimals: 9,
        };
        transfers.push(parsedTx);
      }
    }

    return transfers;
  }

  // extract_token_transfers - matches Rust method exactly
  async extractTokenTransfers(rawTx, targetAddress) {
    let transfers = [];

    for (const transfer of rawTx.token_transfers || []) {
      if (isWrappedSOL(transfer.mint)) {
        continue; // Skip WSOL (handled separately)
      }

      const mint = normalizeAddress(transfer.mint);
      const fromAddr = transfer.from_user_account || "";
      const toAddr = transfer.to_user_account || "";

      if ((fromAddr && fromAddr.toLowerCase() === targetAddress.toLowerCase()) || (toAddr && toAddr.toLowerCase() === targetAddress.toLowerCase())) {
        // Get token info with caching (matches Rust caching)
        const tokenInfo = await this.priceConverter.getTokenInfo(mint);

        // Use raw amount when available for precision
        let rawAmount = 0.0;
        if (transfer.raw_token_amount) {
          const raw = Number(transfer.raw_token_amount);
          if (Number.isFinite(raw)) {
            rawAmount = normalizeTokenAmount(raw, tokenInfo.decimals);
          }
        }
        if (rawAmount === 0.0) {
          rawAmount = Number(transfer.token_amount || 0.0);
        }

        const parsedTx = {
          from: fromAddr,
          to: toAddr,
          value_normalized: rawAmount,
          mint_address: mint,
          decimals: tokenInfo.decimals,
        };
        transfers.push(parsedTx);
      }
    }

    return transfers;
  }
}

// TransactionClassifier class matching Rust struct
class TransactionClassifier {
  constructor() {
    this.dexPrograms = new Set(DEX_PROGRAMS);
    this.lendingPrograms = new Set(LENDING_PROGRAMS);
    this.stakingPrograms = new Set(STAKING_PROGRAMS);
    this.comprehensivePrograms = new Set(COMPREHENSIVE_PROGRAMS);
  }

  // classify_transaction_context - matches Rust method exactly
  classifyTransactionContext(rawTx) {
    const programIds = new Set((rawTx.transaction?.message?.instructions || []).map((instr) => instr.program_id));

    // Check for DEX activity (matches Rust dex_programs check)
    if (this.hasIntersection(programIds, this.dexPrograms)) {
      return TransactionContext.DexSwap;
    }

    // Check for lending (matches Rust lending_programs check)
    if (this.hasIntersection(programIds, this.lendingPrograms)) {
      return TransactionContext.Lending;
    }

    // Check for staking (matches Rust staking_programs check)
    if (this.hasIntersection(programIds, this.stakingPrograms)) {
      return TransactionContext.Staking;
    }

    // Check for pure transfers (matches Rust pure transfer logic)
    const hasTransfers = (rawTx.token_transfers?.length || 0) > 0 || (rawTx.native_transfers?.length || 0) > 0;
    if (hasTransfers && !this.hasIntersection(programIds, this.comprehensivePrograms)) {
      return TransactionContext.PureTransfer;
    }

    // Check for other known programs
    if (this.hasIntersection(programIds, this.comprehensivePrograms)) {
      return TransactionContext.OtherProgram;
    }

    return TransactionContext.Unknown;
  }

  // is_programmatic_transaction - matches Rust method exactly
  isProgrammaticTransaction(rawTx) {
    // High instruction count suggests programmatic (matches Rust logic)
    const instructionCount = (rawTx.transaction?.message?.instructions || []).length;
    if (instructionCount > 10) {
      return true;
    }

    // Multiple token transfers in single tx suggests programmatic (matches Rust logic)
    if ((rawTx.token_transfers?.length || 0) > 5) {
      return true;
    }

    // Interaction with known program addresses (matches Rust logic)
    const programIds = new Set((rawTx.transaction?.message?.instructions || []).map((instr) => instr.program_id));
    return this.hasIntersection(programIds, this.comprehensivePrograms);
  }

  // Helper method to check intersection between two sets
  hasIntersection(set1, set2) {
    for (const item of set1) {
      if (set2.has(item)) {
        return true;
      }
    }
    return false;
  }
}

// SolanaPriceConverter class (placeholder - will be implemented separately)
class SolanaPriceConverter {
  constructor() {
    this.tokenInfoCache = new Map();
    this.priceCache = new Map();
  }

  async getTokenInfo(mint) {
    const key = normalizeAddress(mint);
    if (this.tokenInfoCache.has(key)) {
      return this.tokenInfoCache.get(key);
    }

    if (KNOWN_TOKENS.has(key)) {
      const info = KNOWN_TOKENS.get(key);
      this.tokenInfoCache.set(key, info);
      return info;
    }

    try {
      // Helius token metadata endpoint
      const url = `${HELIUS_BASE}/v0/token-metadata`;
      const body = JSON.stringify({ mintAccounts: [key] });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.VITE_HELIUS_API_KEY,
        },
        body,
      });

      if (res.ok) {
        const arr = await res.json();
        const t = Array.isArray(arr) && arr.length ? arr[0] : null;
        const info = {
          symbol: String(t?.symbol ?? "UNKNOWN").toUpperCase(),
          decimals: Number(t?.decimals ?? 9),
          name: String(t?.name ?? "Unknown"),
        };
        this.tokenInfoCache.set(key, info);
        return info;
      }
    } catch (error) {
      console.log(`Failed to fetch token info for ${key}: ${error.message}`);
    }

    // Fallback for unknown tokens
    const fallback = { symbol: "UNKNOWN", decimals: 9, name: "Unknown Token" };
    this.tokenInfoCache.set(key, fallback);
    return fallback;
  }

  async getTokenSolRatio(mint, timestamp) {
    const info = await this.getTokenInfo(mint);
    const symbol = info.symbol;

    if (symbol === "WSOL" || isWrappedSOL(mint)) {
      return [1.0, true];
    }

    const cacheKey = `${symbol}_${tsToDailyKey(timestamp)}`;
    if (this.priceCache.has(cacheKey)) {
      const v = this.priceCache.get(cacheKey);
      return [v, v > 0];
    }

    // Try stablecoin ratio first
    if (["USDC", "USDT", "BUSD", "DAI"].includes(symbol)) {
      const [ratio, ok] = await getStablecoinSolRatio(timestamp, process.env.VITE_CRYPTOCOMPARE_API_KEY);
      if (ok) {
        this.priceCache.set(cacheKey, ratio);
        return [ratio, true];
      }
    }

    // Try Jupiter API for recent transactions
    let [p, ok] = await fetchTokenPriceJupiter(mint, timestamp, process.env.VITE_CRYPTOCOMPARE_API_KEY);
    if (!ok) {
      [p, ok] = await fetchTokenPriceCryptoCompare(symbol, timestamp, process.env.VITE_CRYPTOCOMPARE_API_KEY);
    }

    this.priceCache.set(cacheKey, p);
    return [p, ok];
  }
}

function tsToDailyKey(ts) {
  const d = new Date(Number(ts) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDailyTimestamp(ts) {
  const d = new Date(Number(ts) * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    // Normalized HTTP error including 401 for clearer surface upstream
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const priceCache = new Map();
const tokenPriceCache = new Map();
const tokenInfoCache = new Map();

async function getSolPriceUsd(timestamp, cryptocompareApiKey) {
  const key = `SOL_USD_${tsToDailyKey(timestamp)}`;
  if (priceCache.has(key)) return [priceCache.get(key), priceCache.get(key) > 0];
  const dayTs = getDailyTimestamp(timestamp);
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=SOL&tsyms=USD&ts=${dayTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const v = data?.SOL?.USD ?? 0.0;
    if (v > 0) {
      priceCache.set(key, v);
      return [v, true];
    }
  } catch {}
  return [0.0, false];
}

async function getStablecoinSolRatio(timestamp, cryptocompareApiKey) {
  const [solUsd, ok] = await getSolPriceUsd(timestamp, cryptocompareApiKey);
  if (ok && solUsd > 0) return [1.0 / solUsd, true];
  return [0.0, false];
}

async function fetchTokenPriceJupiter(mint, timestamp, cryptocompareApiKey) {
  const nowSec = Math.floor(Date.now() / 1000);
  const days = (nowSec - Number(timestamp)) / (24 * 3600);
  if (days > 7) return [0.0, false];
  try {
    const data = await fetchJson(`${JUPITER_LITE_URL}${encodeURIComponent(mint)}`);
    const usd = data?.[mint]?.usdPrice ?? 0.0;
    if (usd > 0) {
      const [solUsd, ok] = await getSolPriceUsd(timestamp, cryptocompareApiKey);
      if (ok && solUsd > 0) return [usd / solUsd, true];
    }
  } catch {}
  return [0.0, false];
}

async function fetchTokenPriceCryptoCompare(symbol, timestamp, cryptocompareApiKey) {
  const dayTs = getDailyTimestamp(timestamp);
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=${encodeURIComponent(symbol)}&tsyms=SOL&ts=${dayTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const ratio = data?.[symbol]?.SOL ?? 0.0;
    if (ratio > 0) return [ratio, true];
  } catch {}
  return [0.0, false];
}

async function getTokenInfo(mint, helHeaders) {
  const key = normalizeAddress(mint);
  if (tokenInfoCache.has(key)) return tokenInfoCache.get(key);
  if (KNOWN_TOKENS.has(key)) {
    const info = KNOWN_TOKENS.get(key);
    tokenInfoCache.set(key, info);
    return info;
  }
  try {
    // Helius token metadata simple endpoint
    const url = `${HELIUS_BASE}/v0/token-metadata`;
    const body = JSON.stringify({ mintAccounts: [key] });
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...helHeaders }, body });
    if (res.ok) {
      const arr = await res.json();
      const t = Array.isArray(arr) && arr.length ? arr[0] : null;
      const info = { symbol: String(t?.symbol ?? "UNKNOWN").toUpperCase(), decimals: Number(t?.decimals ?? 9), name: String(t?.name ?? "Unknown") };
      tokenInfoCache.set(key, info);
      return info;
    }
  } catch {}
  const fallback = { symbol: "UNKNOWN", decimals: 9, name: "Unknown Token" };
  tokenInfoCache.set(key, fallback);
  return fallback;
}

async function getTokenSolRatio(mint, timestamp, cryptocompareApiKey, helHeaders) {
  const info = await getTokenInfo(mint, helHeaders);
  const symbol = info.symbol;
  if (symbol === "WSOL" || isWrappedSOL(mint)) return [1.0, true];
  const cacheKey = `${symbol}_${tsToDailyKey(timestamp)}`;
  if (tokenPriceCache.has(cacheKey)) {
    const v = tokenPriceCache.get(cacheKey);
    return [v, v > 0];
  }
  if (["USDC", "USDT", "BUSD", "DAI"].includes(symbol)) {
    const [ratio, ok] = await getStablecoinSolRatio(timestamp, cryptocompareApiKey);
    if (ok) {
      tokenPriceCache.set(cacheKey, ratio);
      return [ratio, true];
    }
  }
  let [p, ok] = await fetchTokenPriceJupiter(mint, timestamp, cryptocompareApiKey);
  if (!ok) [p, ok] = await fetchTokenPriceCryptoCompare(symbol, timestamp, cryptocompareApiKey);
  tokenPriceCache.set(cacheKey, p);
  return [p, ok];
}

// Legacy functions removed - now using SolanaDataExtractor class

function addStats(obj, prefix, values, includeTotal) {
  if (!Array.isArray(values) || values.length === 0) {
    if (includeTotal) obj[`${prefix}_total`] = 0.0;
    obj[`${prefix}_min`] = 0.0;
    obj[`${prefix}_max`] = 0.0;
    obj[`${prefix}_mean`] = 0.0;
    obj[`${prefix}_median`] = 0.0;
    obj[`${prefix}_std`] = 0.0;
    return;
  }
  if (includeTotal) obj[`${prefix}_total`] = values.reduce((a, b) => a + b, 0);
  obj[`${prefix}_min`] = values.reduce((a, b) => Math.min(a, b), Infinity);
  obj[`${prefix}_max`] = values.reduce((a, b) => Math.max(a, b), -Infinity);
  obj[`${prefix}_mean`] = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  obj[`${prefix}_median`] = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const mean = obj[`${prefix}_mean`];
  obj[`${prefix}_std`] = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
}

function addIntervalStats(obj, prefix, slots) {
  if (!slots || slots.length <= 1) {
    addStats(obj, prefix, [], true);
    return;
  }
  const unique = [...new Set(slots)].sort((a, b) => a - b);
  const intervals = unique.slice(1).map((v, i) => Number(v - unique[i]));
  addStats(obj, prefix, intervals, true);
}

function isKnownProgram(addr) {
  return COMPREHENSIVE_PROGRAMS.has(addr);
}

async function getSolBtcRatio(timestamp, cryptocompareApiKey) {
  const key = `SOL_BTC_${tsToDailyKey(timestamp)}`;
  if (priceCache.has(key)) return priceCache.get(key);
  const dayTs = getDailyTimestamp(timestamp);
  try {
    const url = `${CRYPTOCOMPARE_URL}?fsym=SOL&tsyms=BTC&ts=${dayTs}&api_key=${cryptocompareApiKey}`;
    const data = await fetchJson(url);
    const v = data?.SOL?.BTC ?? 0.0;
    if (v > 0) {
      priceCache.set(key, v);
      return v;
    }
  } catch {}
  // Fallback yang sama seperti Rust
  const d = new Date(Number(timestamp) * 1000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const ratio = y <= 2021 ? (m <= 6 ? 0.0005 : 0.002) : y === 2022 ? (m <= 6 ? 0.003 : 0.001) : y === 2023 ? 0.0008 : 0.002;
  priceCache.set(key, ratio);
  return ratio;
}

export async function extractFeatures(address, options = {}) {
  const heliusApiKey = process.env.VITE_HELIUS_API_KEY;
  const cryptocompareApiKey = process.env.VITE_CRYPTOCOMPARE_API_KEY;

  if (!cryptocompareApiKey) {
    throw new Error("CryptoCompare API key is not configured. Set VITE_CRYPTOCOMPARE_API_KEY in src/frontend/.env and rebuild.");
  }

  if (!heliusApiKey) {
    throw new Error("Helius API key is not configured. Set VITE_HELIUS_API_KEY in src/frontend/.env and rebuild.");
  }

  // Use SolanaDataExtractor class matching Rust implementation
  const extractor = new SolanaDataExtractor();

  let raw;
  try {
    raw = await extractor.getAllTransactions(address);
  } catch (err) {
    if (err && (err.status === 401 || String(err.message || "").includes("401"))) {
      throw new Error("Helius HTTP 401. Please check your API key. Set VITE_HELIUS_API_KEY in src/frontend/.env and rebuild, or provide options.heliusApiKey when calling.");
    }
    throw err;
  }
  const parsed = await extractor.parseAllTransactions(raw, address);

  console.log(`[DEBUG] Raw transactions: ${raw.length}, Parsed transfers: ${parsed.length}`);

  const sent = [];
  const received = [];
  const allValuesBtc = [];
  const allFeesBtc = [];
  const slots = [];
  const counterparties = new Map();

  let failed = 0,
    solTxs = 0,
    tokenTxs = 0,
    dexTxs = 0,
    lendingTxs = 0,
    stakingTxs = 0,
    programmaticTxs = 0,
    priceFailures = 0;
  const uniqueTokens = new Set();
  const contextCounts = new Map();
  let accountCreationCosts = 0.0;

  for (const t of parsed) {
    const solBtc = await getSolBtcRatio(t.timestamp, cryptocompareApiKey);
    const valueBtc = t.value_sol * solBtc;
    allValuesBtc.push(valueBtc);
    slots.push(Number(t.slot));

    switch (t.tx_type) {
      case "Failed":
        failed += 1;
        break;
      case "SolTransfer":
        solTxs += 1;
        break;
      case "TokenTransfer":
        tokenTxs += 1;
        uniqueTokens.add(t.mint_address);
        if (!t.price_fetch_success) priceFailures += 1;
        break;
      default:
        break;
    }

    const ctx = t.tx_context;
    if (ctx === "DEX_SWAP") dexTxs += 1;
    else if (ctx === "LENDING") lendingTxs += 1;
    else if (ctx === "STAKING") stakingTxs += 1;
    contextCounts.set(ctx, (contextCounts.get(ctx) || 0) + 1);

    if (t.is_programmatic) programmaticTxs += 1;

    const feeSol = Number(t.fee_lamports) / LAMPORTS_TO_SOL_F64;
    const feeBtc = feeSol * solBtc;
    if (feeSol > 0.002) accountCreationCosts += feeSol;

    if (t.from.toLowerCase() === address.toLowerCase() && valueBtc > 0) {
      sent.push({ value_btc: valueBtc, value_sol: t.value_sol, fee_btc: feeBtc, slot: Number(t.slot), tx_context: ctx });
      allFeesBtc.push(feeBtc);
      if (!isKnownProgram(t.to)) counterparties.set(t.to, (counterparties.get(t.to) || 0) + 1);
    }
    if (t.to.toLowerCase() === address.toLowerCase() && valueBtc > 0) {
      received.push({ value_btc: valueBtc, value_sol: t.value_sol, fee_btc: 0.0, slot: Number(t.slot), tx_context: ctx });
      if (!isKnownProgram(t.from)) counterparties.set(t.from, (counterparties.get(t.from) || 0) + 1);
    }
  }

  const features = {};
  features["num_txs_as_sender"] = sent.length;
  features["num_txs_as_receiver"] = received.length;
  features["total_txs"] = raw.length;
  features["parsed_txs_count"] = parsed.length; // Add parsed transactions count for Rust compatibility

  features["failed_txs"] = failed;
  features["success_rate"] = raw.length > 0 ? (raw.length - failed) / raw.length : 0.0;
  features["sol_txs"] = solTxs;
  features["token_txs"] = tokenTxs;
  features["unique_tokens_transacted"] = uniqueTokens.size;
  features["sol_to_token_ratio"] = tokenTxs > 0 ? solTxs / tokenTxs : Infinity;

  features["dex_swap_txs"] = dexTxs;
  features["lending_txs"] = lendingTxs;
  features["staking_txs"] = stakingTxs;
  features["programmatic_txs"] = programmaticTxs;
  features["programmatic_ratio"] = raw.length > 0 ? programmaticTxs / raw.length : 0.0;

  const defi = dexTxs + lendingTxs + stakingTxs;
  features["defi_txs_total"] = defi;
  features["defi_ratio"] = raw.length > 0 ? defi / raw.length : 0.0;
  features["dex_to_total_ratio"] = raw.length > 0 ? dexTxs / raw.length : 0.0;

  features["price_fetch_failures"] = priceFailures;
  features["price_fetch_success_rate"] = raw.length > 0 ? (raw.length - priceFailures) / raw.length : 0.0;
  features["account_creation_costs_sol"] = accountCreationCosts;

  features["transaction_context_diversity"] = contextCounts.size;
  const maxCtx = Math.max(0, ...[...contextCounts.values()]);
  features["most_common_context_ratio"] = raw.length > 0 ? maxCtx / raw.length : 0.0;

  const validSlots = slots.filter((s) => Number(s) > 0);
  if (validSlots.length) {
    const first = Math.min(...validSlots);
    const last = Math.max(...validSlots);
    const lifetime = last - first;
    const uniqueSlots = new Set(validSlots).size;
    features["first_slot_appeared_in"] = first;
    features["last_slot_appeared_in"] = last;
    features["lifetime_in_slots"] = lifetime;
    features["num_timesteps_appeared_in"] = uniqueSlots;
    features["slot_density"] = lifetime > 0 ? raw.length / lifetime : 0.0;
  } else {
    features["first_slot_appeared_in"] = 0.0;
    features["last_slot_appeared_in"] = 0.0;
    features["lifetime_in_slots"] = 0.0;
    features["num_timesteps_appeared_in"] = 0.0;
    features["slot_density"] = 0.0;
  }

  const sentSlots = sent.map((t) => t.slot).filter((s) => s > 0);
  const recvSlots = received.map((t) => t.slot).filter((s) => s > 0);
  features["first_sent_slot"] = sentSlots.length ? Math.min(...sentSlots) : 0.0;
  features["first_received_slot"] = recvSlots.length ? Math.min(...recvSlots) : 0.0;

  addStats(features, "btc_transacted", allValuesBtc, true);
  addStats(
    features,
    "btc_sent",
    sent.map((t) => t.value_btc),
    true
  );
  addStats(
    features,
    "btc_received",
    received.map((t) => t.value_btc),
    true
  );
  addStats(features, "fees", allFeesBtc, true);

  addStats(
    features,
    "sol_sent",
    sent.map((t) => t.value_sol),
    true
  );
  addStats(
    features,
    "sol_received",
    received.map((t) => t.value_sol),
    true
  );

  const feeShares = sent.filter((t) => t.value_btc > 0).map((t) => (t.fee_btc / t.value_btc) * 100.0);
  addStats(features, "fees_as_share", feeShares, true);

  const uniqueSlotsSorted = [...new Set(validSlots)].sort((a, b) => a - b);
  addIntervalStats(features, "slots_btwn_txs", uniqueSlotsSorted);
  addIntervalStats(
    features,
    "slots_btwn_input_txs",
    sentSlots.sort((a, b) => a - b)
  );
  addIntervalStats(
    features,
    "slots_btwn_output_txs",
    recvSlots.sort((a, b) => a - b)
  );

  const humanCounter = [...counterparties].filter(([addr]) => !isKnownProgram(addr));
  features["transacted_w_address_total"] = humanCounter.length;
  features["num_addr_transacted_multiple"] = humanCounter.filter(([, c]) => c > 1).length;
  addStats(
    features,
    "transacted_w_address",
    humanCounter.map(([, c]) => Number(c)),
    false
  );

  const allTxs = [...sent, ...received];
  const complexityScoreMap = { PURE_TRANSFER: 1.0, DEX_SWAP: 3.0, LENDING: 2.5, STAKING: 2.0, OTHER_PROGRAM: 2.0 };
  features["avg_tx_complexity"] = allTxs.length ? allTxs.reduce((s, tx) => s + (complexityScoreMap[tx.tx_context] || 1.5), 0) / allTxs.length : 0.0;

  // burst score: rasio interval < 10 slot
  const intervals = uniqueSlotsSorted.slice(1).map((v, i) => v - uniqueSlotsSorted[i]);
  const shortIntervals = intervals.filter((x) => x < 10).length;
  features["burst_activity_score"] = intervals.length ? shortIntervals / intervals.length : 0.0;

  // round number ratio (<=2 desimal atau bil bulat)
  const roundValues = allValuesBtc.filter((v) => v > 0);
  const roundCount = roundValues.filter((v) => {
    const s = v.toFixed(8);
    const trimmed = s.replace(/0+$/, "").replace(/\.$/, "");
    return !trimmed.includes(".") || (trimmed.split(".")[1] || "").length <= 2;
  }).length;
  features["round_number_ratio"] = roundValues.length ? roundCount / roundValues.length : 0.0;

  return features;
}

export function buildFeatureVector(featureNames, featureMap) {
  return featureNames.map((name) => Number(featureMap[name] ?? 0.0));
}

export function getTxCountFromFeatures(featureMap) {
  // Use parsed transactions count (not raw transactions) to match Rust behavior
  return Math.trunc(Number(featureMap.parsed_txs_count || featureMap.total_txs || 0));
}

const SolanaAnalyzeService = {
  extractFeatures,
  buildFeatureVector,
  getTxCountFromFeatures,
  SolanaDataExtractor,
  TransactionClassifier,
  SolanaPriceConverter,
};

export default SolanaAnalyzeService;
export { SolanaDataExtractor, TransactionClassifier, SolanaPriceConverter };
