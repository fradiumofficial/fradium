// ICP Analyze Service
// Port 1:1 dari ICP Rust implementation ke JavaScript
// Menggunakan data real dari ICP canisters, mengikuti logika yang sama persis dengan implementasi Rust

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { sha224 } from "js-sha256";
import { crc32 } from "crc";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const DEFILLAMA_API_URL = "https://coins.llama.fi/prices/historical";
const CRYPTOCOMPARE_API_URL = "https://min-api.cryptocompare.com/data/v2/histoday";

const MAX_API_FAILURES = 3;
const CACHE_DURATION_MS = 300_000; // 5 minutes in milliseconds

// Canister IDs - matching Rust implementation
const CANISTER_IDS = {
  ICP_LEDGER: "ryjl3-tyaaa-aaaaa-aaaba-cai", // Mainnet ICP Ledger
  CKBTC_LEDGER: "mxzaz-hqaaa-aaaar-qaada-cai", // Mainnet ckBTC Ledger
  CKETH_LEDGER: "ss2fx-dyaaa-aaaar-qacoq-cai", // Mainnet ckETH Ledger
  CKUSDC_LEDGER: "mxzaz-hqaaa-aaaar-qaada-cai", // Mainnet ckUSDC Ledger (same as ckBTC for now)
};

// Token configurations matching Rust implementation
const TOKEN_CONFIGS = new Map([
  ["ICP", { symbol: "ICP", decimals: 8, active: true, ledgerCanister: CANISTER_IDS.ICP_LEDGER }],
  ["ckBTC", { symbol: "ckBTC", decimals: 8, active: true, ledgerCanister: CANISTER_IDS.CKBTC_LEDGER }],
  ["ckETH", { symbol: "ckETH", decimals: 18, active: true, ledgerCanister: CANISTER_IDS.CKETH_LEDGER }],
  ["ckUSDC", { symbol: "ckUSDC", decimals: 6, active: true, ledgerCanister: CANISTER_IDS.CKUSDC_LEDGER }],
]);

// Agent configuration
let agent = null;
const ACCOUNT_DOMAIN_SEPARATOR = new TextEncoder().encode("\x0Aaccount-id");

// --- Agent Initialization ---
async function initializeAgent() {
  if (!agent) {
    agent = new HttpAgent({
      host: "https://ic0.app",
      verifyQuerySignatures: false,
    });

    // Fetch root key for local development (if needed)
    if (process.env.NODE_ENV !== "production") {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn("Could not fetch root key, using production mode");
      }
    }
  }
  return agent;
}

// --- Account ID Conversion (matching Rust exactly) ---
function principalToAccountId(principal, subaccount = null) {
  const hasher = sha224.create();
  hasher.update(ACCOUNT_DOMAIN_SEPARATOR);
  hasher.update(principal.toUint8Array());

  const subaccountBytes = subaccount || new Uint8Array(32);
  hasher.update(subaccountBytes);

  const hash = hasher.array();

  // Prepend the 4-byte CRC32 checksum
  const result = new Uint8Array(32);
  const crc = crc32(hash);
  result.set(new Uint8Array([(crc >> 24) & 0xff, (crc >> 16) & 0xff, (crc >> 8) & 0xff, crc & 0xff]), 0);
  result.set(hash.slice(0, 28), 4);

  return result;
}

function getAccountIdForPrincipal(principal) {
  return principalToAccountId(principal, null);
}

// --- ICP Ledger Interface ---
const icpLedgerInterface = ({ IDL }) => {
  const Tokens = IDL.Record({ e8s: IDL.Nat64 });
  const TimeStamp = IDL.Record({ timestamp_nanos: IDL.Nat64 });
  const Transfer = IDL.Record({
    to: IDL.Vec(IDL.Nat8),
    fee: Tokens,
    from: IDL.Vec(IDL.Nat8),
    amount: Tokens,
  });
  const Burn = IDL.Record({
    from: IDL.Vec(IDL.Nat8),
    amount: Tokens,
  });
  const Mint = IDL.Record({
    to: IDL.Vec(IDL.Nat8),
    amount: Tokens,
  });
  const Transaction = IDL.Record({
    memo: IDL.Nat64,
    operation: IDL.Variant({
      Transfer: Transfer,
      Burn: Burn,
      Mint: Mint,
    }),
    timestamp: TimeStamp,
    created_at_time: IDL.Opt(TimeStamp),
  });
  const Block = IDL.Record({
    transaction: Transaction,
    timestamp: TimeStamp,
    parent_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const BlockRange = IDL.Record({
    blocks: IDL.Vec(Block),
    chain_length: IDL.Nat64,
  });

  return IDL.Service({
    account_balance: IDL.Func([IDL.Record({ account: IDL.Vec(IDL.Nat8) })], [Tokens], ["query"]),
    query_blocks: IDL.Func([IDL.Record({ start: IDL.Nat64, length: IDL.Nat64 })], [BlockRange], ["query"]),
  });
};

// --- ICRC Ledger Interface ---
const icrcLedgerInterface = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const Transfer = IDL.Record({
    amount: IDL.Nat,
    from: IDL.Principal,
    to: IDL.Principal,
    fee: IDL.Opt(IDL.Nat),
  });

  const Mint = IDL.Record({
    amount: IDL.Nat,
    to: IDL.Principal,
  });

  const Burn = IDL.Record({
    amount: IDL.Nat,
    from: IDL.Principal,
  });

  const Transaction = IDL.Record({
    burn: IDL.Opt(Burn),
    kind: IDL.Text,
    mint: IDL.Opt(Mint),
    transfer: IDL.Opt(Transfer),
    timestamp: IDL.Nat64,
  });

  const TransactionWithId = IDL.Record({
    id: IDL.Nat,
    transaction: Transaction,
  });

  const GetTransactionsResponse = IDL.Record({
    transactions: IDL.Vec(TransactionWithId),
    log_length: IDL.Nat,
  });

  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    get_transactions: IDL.Func([IDL.Record({ start: IDL.Nat, length: IDL.Nat })], [GetTransactionsResponse], ["query"]),
  });
};

// --- Balance Fetching (matching Rust exactly) ---
async function getICPBalance(principal) {
  try {
    const agent = await initializeAgent();
    const ledgerCanister = Principal.fromText(CANISTER_IDS.ICP_LEDGER);
    const accountId = getAccountIdForPrincipal(principal);

    const actor = Actor.createActor(icpLedgerInterface, {
      agent,
      canisterId: ledgerCanister,
    });

    const result = await actor.account_balance({ account: Array.from(accountId) });
    return Number(result.e8s) / 100000000.0;
  } catch (error) {
    console.error("ICP balance error:", error);
    return 0.0;
  }
}

async function getICRCBalance(principal, ledgerCanister, decimals) {
  try {
    const agent = await initializeAgent();
    const ledgerPrincipal = Principal.fromText(ledgerCanister);

    const actor = Actor.createActor(icrcLedgerInterface, {
      agent,
      canisterId: ledgerPrincipal,
    });

    const result = await actor.icrc1_balance_of({
      owner: principal,
      subaccount: [],
    });

    return Number(result) / Math.pow(10, decimals);
  } catch (error) {
    console.error(`ICRC balance error for ${ledgerCanister}:`, error);
    return 0.0;
  }
}

export async function getAllBalances(principalStr) {
  const balances = new Map();
  const principal = Principal.fromText(principalStr);

  for (const [symbol, config] of TOKEN_CONFIGS) {
    if (!config.active) continue;

    let balance;
    if (symbol === "ICP") {
      balance = await getICPBalance(principal);
    } else {
      balance = await getICRCBalance(principal, config.ledgerCanister, config.decimals);
    }

    balances.set(symbol, balance);
  }

  return balances;
}

// --- Transaction Fetching (matching Rust exactly) ---
async function fetchICPTransactions(principal) {
  try {
    const agent = await initializeAgent();
    const ledgerCanister = Principal.fromText(CANISTER_IDS.ICP_LEDGER);
    const targetAccountId = getAccountIdForPrincipal(principal);

    const actor = Actor.createActor(icpLedgerInterface, {
      agent,
      canisterId: ledgerCanister,
    });

    const result = await actor.query_blocks({ start: 0, length: 2000 });
    const transactions = [];

    for (const block of result.blocks) {
      if (block.transaction.operation.Transfer) {
        const transfer = block.transaction.operation.Transfer;
        const fromAccountId = new Uint8Array(transfer.from);
        const toAccountId = new Uint8Array(transfer.to);

        if (arraysEqual(fromAccountId, targetAccountId) || arraysEqual(toAccountId, targetAccountId)) {
          transactions.push(
            new TransactionData(
              "transfer",
              block.transaction.timestamp.timestamp_nanos,
              Array.from(fromAccountId)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
              Array.from(toAccountId)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
              Number(transfer.amount.e8s),
              Number(transfer.fee.e8s),
              arraysEqual(fromAccountId, targetAccountId),
              arraysEqual(toAccountId, targetAccountId),
              "ICP"
            )
          );
        }
      }
    }

    return transactions;
  } catch (error) {
    console.error("ICP transactions error:", error);
    return [];
  }
}

async function fetchICRCTransactions(principal, config) {
  try {
    const agent = await initializeAgent();
    const ledgerCanister = Principal.fromText(config.ledgerCanister);

    const actor = Actor.createActor(icrcLedgerInterface, {
      agent,
      canisterId: ledgerCanister,
    });

    const result = await actor.get_transactions({
      start: 0,
      length: 2000,
    });

    const transactions = [];

    for (const tx of result.transactions) {
      if (tx.transaction.transfer && tx.transaction.transfer.length > 0) {
        const transfer = tx.transaction.transfer[0];
        if (transfer.from.toString() === principal.toString() || transfer.to.toString() === principal.toString()) {
          transactions.push(new TransactionData("transfer", tx.transaction.timestamp, transfer.from.toString(), transfer.to.toString(), Number(transfer.amount), transfer.fee && transfer.fee.length > 0 ? Number(transfer.fee[0]) : 0, transfer.from.toString() === principal.toString(), transfer.to.toString() === principal.toString(), config.symbol));
        }
      } else if (tx.transaction.mint && tx.transaction.mint.length > 0) {
        const mint = tx.transaction.mint[0];
        if (mint.to.toString() === principal.toString()) {
          transactions.push(new TransactionData("mint", tx.transaction.timestamp, "system", mint.to.toString(), Number(mint.amount), 0, false, true, config.symbol));
        }
      } else if (tx.transaction.burn && tx.transaction.burn.length > 0) {
        const burn = tx.transaction.burn[0];
        if (burn.from.toString() === principal.toString()) {
          transactions.push(new TransactionData("burn", tx.transaction.timestamp, burn.from.toString(), "system", Number(burn.amount), 0, true, false, config.symbol));
        }
      }
    }

    return transactions;
  } catch (error) {
    console.error(`ICRC transactions error for ${config.symbol}:`, error);
    return [];
  }
}

export async function getAllTransactions(principalStr) {
  const allTransactions = [];
  const principal = Principal.fromText(principalStr);

  // Fetch ICP transactions
  const icpTxs = await fetchICPTransactions(principal);
  allTransactions.push(...icpTxs);

  // Fetch ICRC token transactions
  for (const [symbol, config] of TOKEN_CONFIGS) {
    if (!config.active || symbol === "ICP") continue;

    const tokenTxs = await fetchICRCTransactions(principal, config);
    allTransactions.push(...tokenTxs);
  }

  return allTransactions;
}

// Helper function to compare Uint8Arrays
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// In-memory caches (matching Rust STATE cache)
const priceCache = new Map(); // key: token_symbol -> PriceData
const apiHealth = new Map([
  ["coingecko", true],
  ["defillama", true],
  ["cryptocompare", true],
]);
const apiFailureCounts = new Map([
  ["coingecko", 0],
  ["defillama", 0],
  ["cryptocompare", 0],
]);

// --- API Health Management (matching Rust exactly) ---
function recordApiFailure(apiName) {
  const count = apiFailureCounts.get(apiName) || 0;
  const newCount = count + 1;
  apiFailureCounts.set(apiName, newCount);

  if (newCount >= MAX_API_FAILURES) {
    apiHealth.set(apiName, false);
  }
}

function recordApiSuccess(apiName) {
  const count = apiFailureCounts.get(apiName) || 0;
  if (count > 0) {
    const newCount = count - 1;
    apiFailureCounts.set(apiName, newCount);
    if (newCount === 0) {
      apiHealth.set(apiName, true);
    }
  }
}

function isApiHealthy(apiName) {
  return apiHealth.get(apiName) !== false;
}

function getHealthyApis() {
  return Array.from(apiHealth.entries())
    .filter(([_, isHealthy]) => isHealthy)
    .map(([api, _]) => api);
}

// --- Price Data Structures (matching Rust exactly) ---
class PriceData {
  constructor(priceIcp, priceUsd, timestamp) {
    this.price_icp = priceIcp;
    this.price_usd = priceUsd;
    this.timestamp = timestamp;
  }
}

// --- CoinGecko API (matching Rust exactly) ---
async function fetchCoinGeckoPrice(tokenSymbol) {
  if (!isApiHealthy("coingecko")) {
    throw new Error("CoinGecko API is unhealthy");
  }

  const tokenId = {
    ICP: "internet-computer",
    ckBTC: "bitcoin",
    ckETH: "ethereum",
    ckUSDC: "usd-coin",
  }[tokenSymbol];

  if (!tokenId) {
    throw new Error("Unsupported token");
  }

  const url = `${COINGECKO_API_URL}?ids=${tokenId}&vs_currencies=usd`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FradiumICPAnalyzer/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const priceData = data[tokenId];

    if (!priceData || !priceData.usd) {
      throw new Error("Price not found in CoinGecko response");
    }

    recordApiSuccess("coingecko");
    return priceData.usd;
  } catch (error) {
    recordApiFailure("coingecko");
    throw error;
  }
}

// --- DefiLlama API (matching Rust exactly) ---
async function fetchDefiLlamaPrice(tokenSymbol) {
  if (!isApiHealthy("defillama")) {
    throw new Error("DefiLlama API is unhealthy");
  }

  const tokenId = {
    ICP: "coingecko:internet-computer",
    ckBTC: "coingecko:bitcoin",
    ckETH: "coingecko:ethereum",
    ckUSDC: "coingecko:usd-coin",
  }[tokenSymbol];

  if (!tokenId) {
    throw new Error("Unsupported token");
  }

  // Get current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `${DEFILLAMA_API_URL}/${timestamp}/${tokenId}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FradiumICPAnalyzer/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const priceData = data.coins?.[tokenId];

    if (!priceData || !priceData.price) {
      throw new Error("Price not found in DefiLlama response");
    }

    recordApiSuccess("defillama");
    return priceData.price;
  } catch (error) {
    recordApiFailure("defillama");
    throw error;
  }
}

// --- CryptoCompare API (matching Rust exactly) ---
async function fetchCryptoComparePrice(tokenSymbol) {
  if (!isApiHealthy("cryptocompare")) {
    throw new Error("CryptoCompare API is unhealthy");
  }

  const symbol = {
    ICP: "ICP",
    ckBTC: "BTC",
    ckETH: "ETH",
    ckUSDC: "USDC",
  }[tokenSymbol];

  if (!symbol) {
    throw new Error("Unsupported token");
  }

  // Get current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `${CRYPTOCOMPARE_API_URL}?fsym=${symbol}&tsym=USD&limit=1&toTs=${timestamp}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FradiumICPAnalyzer/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.Response !== "Success") {
      throw new Error("No price data found in CryptoCompare response");
    }

    const priceData = data.Data?.Data;
    if (!priceData || !Array.isArray(priceData) || priceData.length === 0) {
      throw new Error("No price data found in CryptoCompare response");
    }

    const latestPrice = priceData[priceData.length - 1];
    if (!latestPrice || !latestPrice.close) {
      throw new Error("No price data found in CryptoCompare response");
    }

    recordApiSuccess("cryptocompare");
    return latestPrice.close;
  } catch (error) {
    recordApiFailure("cryptocompare");
    throw error;
  }
}

// --- Multi-API Price Fetching with Fallback (matching Rust exactly) ---
async function getMultiApiUsdPrice(tokenSymbol) {
  const healthyApis = getHealthyApis();

  if (healthyApis.length === 0) {
    throw new Error("All price APIs are unhealthy");
  }

  const prices = [];
  const errors = [];

  // Try each healthy API
  for (const api of healthyApis) {
    try {
      let result;
      switch (api) {
        case "coingecko":
          result = await fetchCoinGeckoPrice(tokenSymbol);
          break;
        case "defillama":
          result = await fetchDefiLlamaPrice(tokenSymbol);
          break;
        case "cryptocompare":
          result = await fetchCryptoComparePrice(tokenSymbol);
          break;
        default:
          continue;
      }

      if (result > 0.0) {
        prices.push(result);
      } else {
        errors.push(`${api}: Invalid price (zero or negative)`);
      }
    } catch (error) {
      errors.push(`${api}: ${error.message}`);
    }
  }

  if (prices.length === 0) {
    throw new Error("No valid prices from any API");
  }

  // Use median if multiple prices, otherwise use single price
  let finalPrice;
  if (prices.length === 1) {
    finalPrice = prices[0];
  } else {
    prices.sort((a, b) => a - b);
    finalPrice = prices[Math.floor(prices.length / 2)]; // Median
  }

  return finalPrice;
}

// --- Main Price Data Function (matching Rust exactly) ---
export async function getTokenPriceData(tokenSymbol) {
  const now = Date.now();

  // Check cache first
  const cached = priceCache.get(tokenSymbol);
  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    return cached;
  }

  // Get USD price using multi-API approach
  let usdPrice = 0.0;
  try {
    usdPrice = await getMultiApiUsdPrice(tokenSymbol);
  } catch (error) {}

  // Calculate ICP price
  let icpPrice, priceUsd;
  if (tokenSymbol === "ICP") {
    icpPrice = 1.0;
    priceUsd = usdPrice;
  } else {
    let icpUsd = 1.0;
    if (usdPrice > 0.0) {
      try {
        icpUsd = await getMultiApiUsdPrice("ICP");
      } catch (error) {}
    }

    icpPrice = icpUsd > 0.0 ? usdPrice / icpUsd : 0.0;
    priceUsd = usdPrice;
  }

  const newPriceData = new PriceData(icpPrice, priceUsd, now);

  // Cache the result
  priceCache.set(tokenSymbol, newPriceData);

  return newPriceData;
}

// --- Transaction Data Structure (matching Rust exactly) ---
class TransactionData {
  constructor(txType, timestamp, fromAddress, toAddress, amount, fee, isOutgoing, isIncoming, tokenSymbol) {
    this.tx_type = txType;
    this.timestamp = timestamp;
    this.from_address = fromAddress;
    this.to_address = toAddress;
    this.amount = amount;
    this.fee = fee;
    this.is_outgoing = isOutgoing;
    this.is_incoming = isIncoming;
    this.token_symbol = tokenSymbol;
  }
}

// --- User Features Structure (matching Rust exactly) ---
class UserFeatures {
  constructor() {
    this.principal = "";
    this.icp_balance = 0.0;
    this.ckbtc_balance = 0.0;
    this.cketh_balance = 0.0;
    this.ckusdc_balance = 0.0;
    this.num_tokens_held = 0;
    this.total_portfolio_value_usd = 0.0;
    this.portfolio_diversity_score = 0;
    this.icp_value_usd = 0.0;
    this.ckbtc_value_usd = 0.0;
    this.cketh_value_usd = 0.0;
    this.ckusdc_value_usd = 0.0;
    this.total_transactions = 0;
    this.sent_transactions = 0;
    this.received_transactions = 0;
    this.unique_counterparties = 0;
    this.tokens_used = 0;
    this.cross_token_user = false;
    this.has_activity = false;
    this.has_mint_activity = false;
    this.has_burn_activity = false;
    this.total_value_sent_usd = 0.0;
    this.total_value_received_usd = 0.0;
    this.net_flow_usd = 0.0;
    this.avg_transaction_value_usd = 0.0;
    this.sent_amount_mean_usd = 0.0;
    this.received_amount_mean_usd = 0.0;
    this.transaction_value_std_usd = 0.0;
    this.total_value_sent_icp = 0.0;
    this.total_value_received_icp = 0.0;
    this.net_flow_icp = 0.0;
    this.avg_transaction_value_icp = 0.0;
    this.tokens_actively_used = 0;
    this.primary_token_dominance = 0.0;
    this.transaction_span_days = 0.0;
    this.avg_time_between_txs_hours = 0.0;
    this.transaction_frequency_score = 0.0;
    this.send_receive_ratio = 0.0;
    this.value_sent_received_ratio_usd = 0.0;
    this.mint_to_transfer_ratio = 0.0;
    this.defi_activity_score = 0.0;
    this.round_number_transactions = 0;
    this.high_value_transaction_ratio = 0.0;
    this.microtransaction_ratio = 0.0;
    this.icp_transfer = 0;
    this.icp_mint = 0;
    this.icp_burn = 0;
    this.ckbtc_transfer = 0;
    this.ckbtc_mint = 0;
    this.ckbtc_burn = 0;
    this.cketh_transfer = 0;
    this.cketh_mint = 0;
    this.cketh_burn = 0;
    this.ckusdc_transfer = 0;
    this.ckusdc_mint = 0;
    this.ckusdc_burn = 0;
    this.user_type = "";
  }
}

// --- Helper Functions (matching Rust exactly) ---
function calculateStatistics(values) {
  if (values.length === 0) {
    return { mean: 0.0, std: 0.0, sum: 0.0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  if (values.length === 1) {
    return { mean, std: 0.0, sum };
  }

  const variance = values.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (values.length - 1);
  const std = Math.sqrt(variance);

  return { mean, std, sum };
}

function countRoundAmounts(amounts) {
  return amounts.filter((amount) => {
    return Math.abs(amount - Math.round(amount)) < 0.01 || [1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 500.0, 1000.0].includes(amount);
  }).length;
}

function classifyUser(features) {
  if (features.total_portfolio_value_usd > 50000.0) {
    if (features.cross_token_user && features.defi_activity_score > 0.1) {
      return "defi_whale";
    } else {
      return "whale";
    }
  } else if (features.total_portfolio_value_usd > 10000.0) {
    if (features.num_tokens_held >= 3) {
      return "diversified_investor";
    } else if (features.defi_activity_score > 0.2) {
      return "defi_power_user";
    } else {
      return "serious_investor";
    }
  } else if (features.total_portfolio_value_usd > 1000.0) {
    if (features.cross_token_user && features.total_transactions > 20) {
      return "active_multi_token_user";
    } else if (features.total_transactions > 50) {
      return "high_frequency_trader";
    } else {
      return "regular_investor";
    }
  } else if (features.cross_token_user) {
    if (features.has_mint_activity || features.has_burn_activity) {
      return "defi_explorer";
    } else {
      return "multi_token_user";
    }
  } else if (features.total_transactions > 20) {
    return "active_user";
  } else if (features.total_transactions > 5) {
    return "regular_user";
  } else if (features.num_tokens_held > 1) {
    return "portfolio_holder";
  } else if (features.total_transactions > 0) {
    return "light_user";
  } else {
    return "inactive";
  }
}

function preprocessFeaturesForInference(features) {
  // Handle infinite and NaN values
  if (!isFinite(features.send_receive_ratio)) {
    features.send_receive_ratio = features.sent_transactions;
  }
  if (!isFinite(features.value_sent_received_ratio_usd)) {
    features.value_sent_received_ratio_usd = 999.0;
  }

  // Replace NaN with 0.0
  if (isNaN(features.avg_transaction_value_usd)) features.avg_transaction_value_usd = 0.0;
  if (isNaN(features.sent_amount_mean_usd)) features.sent_amount_mean_usd = 0.0;
  if (isNaN(features.received_amount_mean_usd)) features.received_amount_mean_usd = 0.0;
  if (isNaN(features.transaction_value_std_usd)) features.transaction_value_std_usd = 0.0;
  if (isNaN(features.avg_time_between_txs_hours)) features.avg_time_between_txs_hours = 0.0;
  if (isNaN(features.transaction_frequency_score)) features.transaction_frequency_score = 0.0;
  if (isNaN(features.high_value_transaction_ratio)) features.high_value_transaction_ratio = 0.0;
  if (isNaN(features.microtransaction_ratio)) features.microtransaction_ratio = 0.0;
  if (isNaN(features.primary_token_dominance)) features.primary_token_dominance = 0.0;
  if (isNaN(features.mint_to_transfer_ratio)) features.mint_to_transfer_ratio = 0.0;
  if (isNaN(features.defi_activity_score)) features.defi_activity_score = 0.0;
}

// --- Main Feature Building Logic (matching Rust exactly) ---
export async function buildComprehensiveFeatures(principalStr, balances = null, transactions = null) {
  // If balances and transactions are not provided, fetch them from ICP canisters
  if (!balances || !transactions) {
    balances = await getAllBalances(principalStr);
    transactions = await getAllTransactions(principalStr);
  }

  // Validate that we have the required data
  if (!balances || balances.size === 0) {
    throw new Error("No balance data available for ICP address");
  }
  const features = new UserFeatures();
  features.principal = principalStr;

  // Balance features
  features.icp_balance = balances.get("ICP") || 0.0;
  features.ckbtc_balance = balances.get("ckBTC") || 0.0;
  features.cketh_balance = balances.get("ckETH") || 0.0;
  features.ckusdc_balance = balances.get("ckUSDC") || 0.0;

  features.num_tokens_held = Array.from(balances.values()).filter((b) => b > 1e-6).length;
  features.portfolio_diversity_score = Array.from(balances.values()).filter((b) => b > 1e-3).length;

  // Calculate portfolio values with prices
  let totalPortfolioUsd = 0.0;
  let totalPortfolioIcp = 0.0;

  for (const [symbol, balance] of balances) {
    if (balance > 1e-6) {
      const price = await getTokenPriceData(symbol);
      const usdValue = balance * price.price_usd;
      const icpValue = balance * price.price_icp;

      totalPortfolioUsd += usdValue;
      totalPortfolioIcp += icpValue;

      // Set individual token USD values
      switch (symbol) {
        case "ICP":
          features.icp_value_usd = usdValue;
          break;
        case "ckBTC":
          features.ckbtc_value_usd = usdValue;
          break;
        case "ckETH":
          features.cketh_value_usd = usdValue;
          break;
        case "ckUSDC":
          features.ckusdc_value_usd = usdValue;
          break;
      }
    }
  }
  features.total_portfolio_value_usd = totalPortfolioUsd;

  // Transaction features
  features.total_transactions = transactions.length;
  features.has_activity = transactions.length > 0;

  if (transactions.length === 0) {
    features.user_type = classifyUser(features);
    return features;
  }

  // Basic transaction counts
  features.sent_transactions = transactions.filter((tx) => tx.is_outgoing).length;
  features.received_transactions = transactions.filter((tx) => tx.is_incoming).length;
  features.has_mint_activity = transactions.some((tx) => tx.tx_type === "mint");
  features.has_burn_activity = transactions.some((tx) => tx.tx_type === "burn");

  // Calculate counterparties
  const uniqueCounterparties = new Set();
  for (const tx of transactions) {
    const counterparty = tx.is_outgoing ? tx.to_address : tx.from_address;
    if (counterparty !== "system" && counterparty.length > 20) {
      uniqueCounterparties.add(counterparty);
    }
  }
  features.unique_counterparties = uniqueCounterparties.size;

  // Token usage analysis
  const tokenCounts = new Map();
  for (const tx of transactions) {
    const count = tokenCounts.get(tx.token_symbol) || 0;
    tokenCounts.set(tx.token_symbol, count + 1);
  }

  features.tokens_used = tokenCounts.size;
  features.tokens_actively_used = tokenCounts.size;
  features.cross_token_user = tokenCounts.size > 1;

  const maxCount = Math.max(...Array.from(tokenCounts.values()));
  features.primary_token_dominance = maxCount / transactions.length;

  // Calculate USD values for transactions
  const allUsd = [];
  const outgoingUsd = [];
  const incomingUsd = [];
  const allIcp = [];
  const outgoingIcp = [];
  const incomingIcp = [];

  for (const tx of transactions) {
    const decimals = TOKEN_CONFIGS.get(tx.token_symbol)?.decimals || 8;
    const amountNorm = tx.amount / Math.pow(10, decimals);
    const price = await getTokenPriceData(tx.token_symbol);
    const usdValue = amountNorm * price.price_usd;
    const icpValue = amountNorm * price.price_icp;

    allUsd.push(usdValue);
    allIcp.push(icpValue);

    if (tx.is_outgoing) {
      outgoingUsd.push(usdValue);
      outgoingIcp.push(icpValue);
    }
    if (tx.is_incoming) {
      incomingUsd.push(usdValue);
      incomingIcp.push(icpValue);
    }
  }

  // USD statistics
  const sentStats = calculateStatistics(outgoingUsd);
  const receivedStats = calculateStatistics(incomingUsd);
  const avgStats = calculateStatistics(allUsd);

  features.total_value_sent_usd = sentStats.sum;
  features.total_value_received_usd = receivedStats.sum;
  features.net_flow_usd = receivedStats.sum - sentStats.sum;
  features.avg_transaction_value_usd = avgStats.mean;
  features.sent_amount_mean_usd = sentStats.mean;
  features.received_amount_mean_usd = receivedStats.mean;
  features.transaction_value_std_usd = avgStats.std;

  // ICP statistics
  const sentStatsIcp = calculateStatistics(outgoingIcp);
  const receivedStatsIcp = calculateStatistics(incomingIcp);
  const avgStatsIcp = calculateStatistics(allIcp);

  features.total_value_sent_icp = sentStatsIcp.sum;
  features.total_value_received_icp = receivedStatsIcp.sum;
  features.net_flow_icp = receivedStatsIcp.sum - sentStatsIcp.sum;
  features.avg_transaction_value_icp = avgStatsIcp.mean;

  // Temporal analysis
  if (transactions.length > 1) {
    const timestamps = transactions.map((tx) => tx.timestamp).sort((a, b) => a - b);
    const spanNs = timestamps[timestamps.length - 1] - timestamps[0];
    features.transaction_span_days = spanNs / (1_000_000_000.0 * 86400.0);

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push((timestamps[i] - timestamps[i - 1]) / 3_600_000_000_000.0); // Convert to hours
    }

    if (intervals.length > 0) {
      features.avg_time_between_txs_hours = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    if (features.transaction_span_days > 0.0) {
      features.transaction_frequency_score = transactions.length / features.transaction_span_days;
    }
  }

  // Ratio calculations
  features.send_receive_ratio = features.received_transactions > 0 ? features.sent_transactions / features.received_transactions : features.sent_transactions;

  features.value_sent_received_ratio_usd = features.total_value_received_usd > 1e-6 ? features.total_value_sent_usd / features.total_value_received_usd : features.total_value_sent_usd > 0.0 ? 999.0 : 0.0;

  // Transaction breakdown - matching Rust exactly
  let icpTransfer = 0;
  let ckbtcTransfer = 0;
  let ckethMint = 0;
  let ckethBurn = 0;
  let ckusdcMint = 0;
  let ckusdcTransfer = 0;
  let ckethTransfer = 0;
  let ckusdcBurn = 0;
  let ckbtcMint = 0;

  for (const tx of transactions) {
    const tokenSymbol = tx.token_symbol;
    const txType = tx.tx_type;

    if (tokenSymbol === "ICP" && txType === "transfer") icpTransfer++;
    else if (tokenSymbol === "ckBTC" && txType === "transfer") ckbtcTransfer++;
    else if (tokenSymbol === "ckETH" && txType === "mint") ckethMint++;
    else if (tokenSymbol === "ckETH" && txType === "burn") ckethBurn++;
    else if (tokenSymbol === "ckUSDC" && txType === "mint") ckusdcMint++;
    else if (tokenSymbol === "ckUSDC" && txType === "transfer") ckusdcTransfer++;
    else if (tokenSymbol === "ckETH" && txType === "transfer") ckethTransfer++;
    else if (tokenSymbol === "ckUSDC" && txType === "burn") ckusdcBurn++;
    else if (tokenSymbol === "ckBTC" && txType === "mint") ckbtcMint++;
  }

  // Set the breakdown values (matching Rust exactly)
  features.icp_transfer = icpTransfer;
  features.ckbtc_transfer = ckbtcTransfer;
  features.cketh_mint = ckethMint;
  features.cketh_burn = ckethBurn;
  features.ckusdc_mint = ckusdcMint;
  features.ckusdc_transfer = ckusdcTransfer;
  features.cketh_transfer = ckethTransfer;
  features.ckusdc_burn = ckusdcBurn;
  features.ckbtc_mint = ckbtcMint;

  // DeFi activity calculations
  const mintCount = ckethMint + ckusdcMint + ckbtcMint;
  const burnCount = ckethBurn + ckusdcBurn;
  const transferCount = icpTransfer + ckbtcTransfer + ckethTransfer + ckusdcTransfer;

  if (transferCount > 0) {
    features.mint_to_transfer_ratio = mintCount / transferCount;
  }
  features.defi_activity_score = (mintCount + burnCount) / transactions.length;

  // Behavioral analysis
  features.round_number_transactions = countRoundAmounts(allUsd);

  if (allUsd.length > 0) {
    const avgVal = avgStats.mean;
    features.high_value_transaction_ratio = allUsd.filter((v) => v > avgVal * 3.0).length / allUsd.length;
    features.microtransaction_ratio = allUsd.filter((v) => v < 1.0).length / allUsd.length;
  }

  // User classification
  features.user_type = classifyUser(features);

  // Clean up any invalid values
  preprocessFeaturesForInference(features);

  return features;
}

// --- Feature Vector Building (matching Rust exactly) ---
export function featuresToVector(features) {
  return [
    features.icp_balance,
    features.ckbtc_balance,
    features.cketh_balance,
    features.ckusdc_balance,
    features.num_tokens_held,
    features.total_portfolio_value_usd,
    features.portfolio_diversity_score,
    features.total_transactions,
    features.sent_transactions,
    features.received_transactions,
    features.unique_counterparties,
    features.tokens_used,
    features.cross_token_user ? 1.0 : 0.0,
    features.total_value_sent_usd,
    features.total_value_received_usd,
    features.net_flow_usd,
    features.avg_transaction_value_usd,
    features.sent_amount_mean_usd,
    features.received_amount_mean_usd,
    features.transaction_value_std_usd,
    features.tokens_actively_used,
    features.primary_token_dominance,
    features.transaction_span_days,
    features.avg_time_between_txs_hours,
    features.transaction_frequency_score,
    features.send_receive_ratio,
    features.value_sent_received_ratio_usd,
    features.mint_to_transfer_ratio,
    features.defi_activity_score,
    features.round_number_transactions,
    features.high_value_transaction_ratio,
    features.microtransaction_ratio,
    features.icp_transfer,
    features.ckbtc_transfer,
    features.ckbtc_mint,
    features.cketh_transfer,
    features.cketh_mint,
    features.cketh_burn,
    features.ckusdc_transfer,
    features.ckusdc_mint,
    features.ckusdc_burn,
  ];
}

// --- API Health Status Functions (matching Rust exactly) ---
export function getApiHealthReport() {
  const report = [];

  for (const api of ["coingecko", "defillama", "cryptocompare"]) {
    const isHealthy = apiHealth.get(api) !== false;
    const failureCount = apiFailureCounts.get(api) || 0;
    const status = isHealthy ? "HEALTHY" : "FAILED";
    report.push(`  ${api}: ${status} (${failureCount} failures)`);
  }

  return `API Health Status:\n${report.join("\n")}`;
}

// --- Helper function to convert UserFeatures to Map for canister ---
export function prepareFeaturesForCanister(features) {
  const featuresMap = new Map();

  // Helper function to ensure value is a valid number
  const ensureNumber = (value) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return 0.0;
    }
    return num;
  };

  // Convert UserFeatures to HashMap<String, f64> format expected by canister
  featuresMap.set("icp_balance", ensureNumber(features.icp_balance));
  featuresMap.set("ckbtc_balance", ensureNumber(features.ckbtc_balance));
  featuresMap.set("cketh_balance", ensureNumber(features.cketh_balance));
  featuresMap.set("ckusdc_balance", ensureNumber(features.ckusdc_balance));
  featuresMap.set("num_tokens_held", ensureNumber(features.num_tokens_held));
  featuresMap.set("total_portfolio_value_usd", ensureNumber(features.total_portfolio_value_usd));
  featuresMap.set("portfolio_diversity_score", ensureNumber(features.portfolio_diversity_score));
  featuresMap.set("total_transactions", ensureNumber(features.total_transactions));
  featuresMap.set("sent_transactions", ensureNumber(features.sent_transactions));
  featuresMap.set("received_transactions", ensureNumber(features.received_transactions));
  featuresMap.set("unique_counterparties", ensureNumber(features.unique_counterparties));
  featuresMap.set("tokens_used", ensureNumber(features.tokens_used));
  featuresMap.set("cross_token_user", features.cross_token_user ? 1.0 : 0.0);
  featuresMap.set("total_value_sent_usd", ensureNumber(features.total_value_sent_usd));
  featuresMap.set("total_value_received_usd", ensureNumber(features.total_value_received_usd));
  featuresMap.set("net_flow_usd", ensureNumber(features.net_flow_usd));
  featuresMap.set("avg_transaction_value_usd", ensureNumber(features.avg_transaction_value_usd));
  featuresMap.set("sent_amount_mean_usd", ensureNumber(features.sent_amount_mean_usd));
  featuresMap.set("received_amount_mean_usd", ensureNumber(features.received_amount_mean_usd));
  featuresMap.set("transaction_value_std_usd", ensureNumber(features.transaction_value_std_usd));
  featuresMap.set("tokens_actively_used", ensureNumber(features.tokens_actively_used));
  featuresMap.set("primary_token_dominance", ensureNumber(features.primary_token_dominance));
  featuresMap.set("transaction_span_days", ensureNumber(features.transaction_span_days));
  featuresMap.set("avg_time_between_txs_hours", ensureNumber(features.avg_time_between_txs_hours));
  featuresMap.set("transaction_frequency_score", ensureNumber(features.transaction_frequency_score));
  featuresMap.set("send_receive_ratio", ensureNumber(features.send_receive_ratio));
  featuresMap.set("value_sent_received_ratio_usd", ensureNumber(features.value_sent_received_ratio_usd));
  featuresMap.set("mint_to_transfer_ratio", ensureNumber(features.mint_to_transfer_ratio));
  featuresMap.set("defi_activity_score", ensureNumber(features.defi_activity_score));
  featuresMap.set("round_number_transactions", ensureNumber(features.round_number_transactions));
  featuresMap.set("high_value_transaction_ratio", ensureNumber(features.high_value_transaction_ratio));
  featuresMap.set("microtransaction_ratio", ensureNumber(features.microtransaction_ratio));
  featuresMap.set("icp_transfer", ensureNumber(features.icp_transfer));
  featuresMap.set("ckbtc_transfer", ensureNumber(features.ckbtc_transfer));
  featuresMap.set("ckbtc_mint", ensureNumber(features.ckbtc_mint));
  featuresMap.set("cketh_transfer", ensureNumber(features.cketh_transfer));
  featuresMap.set("cketh_mint", ensureNumber(features.cketh_mint));
  featuresMap.set("cketh_burn", ensureNumber(features.cketh_burn));
  featuresMap.set("ckusdc_transfer", ensureNumber(features.ckusdc_transfer));
  featuresMap.set("ckusdc_mint", ensureNumber(features.ckusdc_mint));
  featuresMap.set("ckusdc_burn", ensureNumber(features.ckusdc_burn));

  return featuresMap;
}

// --- Test Function for ICP Integration ---
export async function testICPIntegration() {
  try {
    // Test with a known ICP principal (ICP Foundation)
    const testPrincipal = "rdmx6-jaaaa-aaaah-qcaiq-cai";

    // Test balance fetching
    const balances = await getAllBalances(testPrincipal);

    // Test transaction fetching
    const transactions = await getAllTransactions(testPrincipal);

    // Test feature calculation
    const features = await buildComprehensiveFeatures(testPrincipal);

    return { success: true, balances, transactions: transactions.length, features };
  } catch (error) {
    console.error("❌ ICP Integration Test Failed:", error);
    return { success: false, error: error.message };
  }
}

// --- Convenience API set ---
export const ICPAnalyzeService = {
  getTokenPriceData,
  buildComprehensiveFeatures,
  featuresToVector,
  getApiHealthReport,
  prepareFeaturesForCanister,
  getAllBalances,
  getAllTransactions,
  testICPIntegration,
  TransactionData,
  UserFeatures,
  PriceData,
};

export default ICPAnalyzeService;
