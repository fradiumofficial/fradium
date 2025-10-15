import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";

// Environment-based configuration
const isLocal = process.env.DFX_NETWORK !== "ic";

// ICRC-1 Interface for SNS tokens (standardized)
const ICRC1_INTERFACE = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const Value = IDL.Variant({
    Int: IDL.Int,
    Nat: IDL.Nat,
    Blob: IDL.Vec(IDL.Nat8),
    Text: IDL.Text,
  });

  const Memo = IDL.Vec(IDL.Nat8);
  const Timestamp = IDL.Nat64;

  const TransferArg = IDL.Record({
    to: Account,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(Memo),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(Timestamp),
    amount: IDL.Nat,
  });

  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({
      message: IDL.Text,
      error_code: IDL.Nat,
    }),
  });

  const TransferResult = IDL.Variant({ Ok: IDL.Nat, Err: TransferError });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_transfer: IDL.Func([TransferArg], [TransferResult], []),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, Value))], ["query"]),
  });
};

// SNS Index Interface for transaction history
const SNS_INDEX_INTERFACE = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const GetTransactionsRequest = IDL.Record({
    max_results: IDL.Nat,
    start: IDL.Opt(IDL.Nat),
    account: Account,
  });

  const BlockIndex = IDL.Nat;
  const Timestamp = IDL.Nat64;
  const Memo = IDL.Vec(IDL.Nat8);

  const Transfer = IDL.Record({
    from: Account,
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(Memo),
    created_at_time: IDL.Opt(Timestamp),
  });

  const Mint = IDL.Record({
    to: Account,
    amount: IDL.Nat,
    memo: IDL.Opt(Memo),
    created_at_time: IDL.Opt(Timestamp),
  });

  const Burn = IDL.Record({
    from: Account,
    amount: IDL.Nat,
    memo: IDL.Opt(Memo),
    created_at_time: IDL.Opt(Timestamp),
  });

  const TransactionOperation = IDL.Variant({
    Transfer: Transfer,
    Mint: Mint,
    Burn: Burn,
  });

  const Transaction = IDL.Record({
    operation: IDL.Opt(TransactionOperation),
    memo: IDL.Opt(Memo),
    timestamp: Timestamp,
  });

  const TransactionWithId = IDL.Record({
    id: BlockIndex,
    transaction: Transaction,
  });

  const GetTransactionsResponse = IDL.Record({
    transactions: IDL.Vec(TransactionWithId),
    oldest_block_index: IDL.Opt(BlockIndex),
    latest_block_index: IDL.Opt(BlockIndex),
  });

  return IDL.Service({
    get_account_transactions: IDL.Func([GetTransactionsRequest], [IDL.Variant({ Ok: GetTransactionsResponse, Err: IDL.Text })], ["query"]),
  });
};

export class SNSTokenService {
  /**
   * Get SNS token configuration by symbol
   * @param {string} symbol - Token symbol
   * @returns {Object|null} Token configuration or null
   */
  static getTokenConfig(symbol) {
    return TOKENS_CONFIG.find((token) => token.type === "sns" && token.symbol === symbol) || null;
  }

  /**
   * Get SNS token configuration by ID
   * @param {number} tokenId - Token ID
   * @returns {Object|null} Token configuration or null
   */
  static getTokenConfigById(tokenId) {
    return TOKENS_CONFIG.find((token) => token.type === "sns" && token.id === tokenId) || null;
  }

  /**
   * Get all SNS tokens
   * @returns {Array} Array of SNS token configurations
   */
  static getAllSNSTokens() {
    return TOKENS_CONFIG.filter((token) => token.type === "sns");
  }

  /**
   * Create agent for IC network
   * @param {Identity} identity - Authenticated identity
   * @returns {HttpAgent} Configured agent
   */
  static createAgent(identity = null) {
    const agent = new HttpAgent({
      identity,
      host: isLocal ? "http://localhost:4943" : "https://ic0.app",
    });

    // Fetch root key for local development
    if (isLocal) {
      agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }

    return agent;
  }

  /**
   * Create ICRC-1 actor for SNS token
   * @param {string} ledgerCanisterId - Ledger canister ID
   * @param {Identity} identity - Authenticated identity
   * @returns {Actor} ICRC-1 actor
   */
  static createLedgerActor(ledgerCanisterId, identity = null) {
    const agent = this.createAgent(identity);
    return Actor.createActor(ICRC1_INTERFACE, {
      agent,
      canisterId: Principal.fromText(ledgerCanisterId),
    });
  }

  /**
   * Create SNS Index actor for transaction history
   * @param {string} indexCanisterId - Index canister ID
   * @param {Identity} identity - Authenticated identity
   * @returns {Actor} SNS Index actor
   */
  static createIndexActor(indexCanisterId, identity = null) {
    const agent = this.createAgent(identity);
    return Actor.createActor(SNS_INDEX_INTERFACE, {
      agent,
      canisterId: Principal.fromText(indexCanisterId),
    });
  }

  /**
   * Get SNS token balance
   * @param {string} symbol - Token symbol
   * @param {string|Principal} principal - User principal
   * @param {Array} subaccount - Optional subaccount
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<number>} Token balance
   */
  static async getBalance(symbol, principal, subaccount = [], identity = null) {
    try {
      const tokenConfig = this.getTokenConfig(symbol);
      if (!tokenConfig) {
        throw new Error(`SNS token ${symbol} not found`);
      }

      const actor = this.createLedgerActor(tokenConfig.ledgerCanisterId, identity);
      const principalObj = typeof principal === "string" ? Principal.fromText(principal) : principal;

      const result = await actor.icrc1_balance_of({
        owner: principalObj,
        subaccount: subaccount.length > 0 ? [subaccount] : [],
      });

      // Convert from smallest unit to token units
      return Number(result) / Math.pow(10, tokenConfig.decimals);
    } catch (error) {
      console.error(`Error fetching ${symbol} balance:`, error);
      throw new Error(`Failed to fetch ${symbol} balance: ${error.message}`);
    }
  }

  /**
   * Get SNS token fee
   * @param {string} symbol - Token symbol
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<number>} Token fee
   */
  static async getFee(symbol, identity = null) {
    try {
      const tokenConfig = this.getTokenConfig(symbol);
      if (!tokenConfig) {
        throw new Error(`SNS token ${symbol} not found`);
      }

      const actor = this.createLedgerActor(tokenConfig.ledgerCanisterId, identity);
      const fee = await actor.icrc1_fee();

      // Convert from smallest unit to token units
      return Number(fee) / Math.pow(10, tokenConfig.decimals);
    } catch (error) {
      console.error(`Error fetching ${symbol} fee:`, error);
      // Return fallback fee from config
      return tokenConfig.fee || 0;
    }
  }

  /**
   * Transfer SNS tokens
   * @param {string} symbol - Token symbol
   * @param {string|Principal} fromPrincipal - From principal
   * @param {string|Principal} toPrincipal - To principal
   * @param {number} amount - Amount to transfer
   * @param {Array} fromSubaccount - From subaccount
   * @param {Array} toSubaccount - To subaccount
   * @param {Array} memo - Optional memo
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<Object>} Transfer result
   */
  static async transfer(symbol, fromPrincipal, toPrincipal, amount, fromSubaccount = [], toSubaccount = [], memo = [], identity = null) {
    try {
      const tokenConfig = this.getTokenConfig(symbol);
      if (!tokenConfig) {
        throw new Error(`SNS token ${symbol} not found`);
      }

      const actor = this.createLedgerActor(tokenConfig.ledgerCanisterId, identity);

      // Convert amount to smallest unit
      const amountInSmallestUnit = BigInt(Math.floor(amount * Math.pow(10, tokenConfig.decimals)));

      // Get fee
      const fee = await this.getFee(symbol, identity);
      const feeInSmallestUnit = BigInt(Math.floor(fee * Math.pow(10, tokenConfig.decimals)));

      const fromPrincipalObj = typeof fromPrincipal === "string" ? Principal.fromText(fromPrincipal) : fromPrincipal;

      const toPrincipalObj = typeof toPrincipal === "string" ? Principal.fromText(toPrincipal) : toPrincipal;

      const result = await actor.icrc1_transfer({
        from_subaccount: fromSubaccount.length > 0 ? [fromSubaccount] : [],
        to: {
          owner: toPrincipalObj,
          subaccount: toSubaccount.length > 0 ? [toSubaccount] : [],
        },
        amount: amountInSmallestUnit,
        fee: [feeInSmallestUnit],
        memo: memo.length > 0 ? [memo] : [],
        created_at_time: [],
      });

      if (result.Err) {
        throw new Error(`Transfer failed: ${JSON.stringify(result.Err)}`);
      }

      return {
        success: true,
        transactionId: result.Ok.toString(),
        amount: amount,
        fee: fee,
      };
    } catch (error) {
      console.error(`Error transferring ${symbol}:`, error);
      throw new Error(`Failed to transfer ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get SNS token transaction history
   * @param {string} symbol - Token symbol
   * @param {string|Principal} principal - User principal
   * @param {number} limit - Number of transactions to fetch
   * @param {number} offset - Offset for pagination
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<Array>} Transaction history
   */
  static async getTransactionHistory(symbol, principal, limit = 20, offset = 0, identity = null) {
    try {
      const tokenConfig = this.getTokenConfig(symbol);
      if (!tokenConfig) {
        throw new Error(`SNS token ${symbol} not found`);
      }

      const actor = this.createIndexActor(tokenConfig.indexCanisterId, identity);
      const principalObj = typeof principal === "string" ? Principal.fromText(principal) : principal;

      // Convert principal to account identifier (simplified)
      const accountId = principalObj.toText();

      const result = await actor.get_account_transactions({
        max_results: BigInt(limit),
        start: [BigInt(offset)],
        account: {
          owner: principalObj,
          subaccount: [],
        },
      });

      if (result.Err) {
        throw new Error(`Failed to fetch transactions: ${result.Err}`);
      }

      const transactions = result.Ok.transactions
        .map((tx) => {
          const operation = tx.transaction.operation[0];
          if (!operation) return null;

          let fromPrincipal, toPrincipal, amount, fee, kind;
          let isSent = false;

          if (operation.Transfer) {
            const transfer = operation.Transfer;
            fromPrincipal = transfer.from.owner;
            toPrincipal = transfer.to.owner;
            amount = Number(transfer.amount);
            fee = transfer.fee[0] ? Number(transfer.fee[0]) : 0;
            kind = "Transfer";
            isSent = fromPrincipal.toText() === principalObj.toText();
          } else if (operation.Mint) {
            const mint = operation.Mint;
            fromPrincipal = Principal.fromText("system"); // Mints come from the system
            toPrincipal = mint.to.owner;
            amount = Number(mint.amount);
            fee = 0;
            kind = "Mint";
            isSent = false; // Mints are always received by the user if they are the recipient
          } else if (operation.Burn) {
            const burn = operation.Burn;
            fromPrincipal = burn.from.owner;
            toPrincipal = Principal.fromText("system"); // Burns go to the system
            amount = Number(burn.amount);
            fee = 0; // Assuming no fee for burn, adjust if SNS specifies
            kind = "Burn";
            isSent = burn.from.owner.toText() === principalObj.toText();
          } else {
            return null; // Unsupported operation type
          }

          const otherParty = isSent ? toPrincipal.toText() : fromPrincipal.toText();
          const otherPartyStr = otherParty || "Unknown";

          const decimals = tokenConfig.decimals || 8; // Fallback to 8 if not specified
          const divisor = Math.pow(10, decimals);

          return {
            hash: tx.id.toString(),
            chain: "Internet Computer",
            title: isSent ? `Transfer ${symbol} to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received ${symbol} from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
            amount: isSent ? -amount / divisor : amount / divisor,
            status: "Completed", // SNS transactions are typically completed once in index
            timestamp: Number(tx.transaction.timestamp) / 1000000, // Convert nanoseconds to milliseconds
            from: fromPrincipal.toText() || "Unknown",
            to: toPrincipal.toText() || "Unknown",
            fee: fee / divisor,
            memo: operation.Transfer?.memo || operation.Mint?.memo || operation.Burn?.memo || [],
            kind: kind,
            tokenType: symbol.toLowerCase(), // Use token symbol as tokenType for SNS
            symbol: symbol,
          };
        })
        .filter((tx) => tx !== null);

      return transactions;
    } catch (error) {
      console.error(`Error fetching ${symbol} transaction history:`, error);
      throw new Error(`Failed to fetch ${symbol} transaction history: ${error.message}`);
    }
  }

  /**
   * Get SNS token metadata
   * @param {string} symbol - Token symbol
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<Object>} Token metadata
   */
  static async getMetadata(symbol, identity = null) {
    try {
      const tokenConfig = this.getTokenConfig(symbol);
      if (!tokenConfig) {
        throw new Error(`SNS token ${symbol} not found`);
      }

      const actor = this.createLedgerActor(tokenConfig.ledgerCanisterId, identity);

      const [name, symbolResult, decimals, totalSupply] = await Promise.all([actor.icrc1_name(), actor.icrc1_symbol(), actor.icrc1_decimals(), actor.icrc1_total_supply()]);

      return {
        name: name,
        symbol: symbolResult,
        decimals: Number(decimals),
        totalSupply: Number(totalSupply),
        ledgerCanisterId: tokenConfig.ledgerCanisterId,
        indexCanisterId: tokenConfig.indexCanisterId,
        rootCanisterId: tokenConfig.rootCanisterId,
      };
    } catch (error) {
      console.error(`Error fetching ${symbol} metadata:`, error);
      throw new Error(`Failed to fetch ${symbol} metadata: ${error.message}`);
    }
  }

  /**
   * Get balances for all SNS tokens
   * @param {string|Principal} principal - User principal
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<Object>} Balances object
   */
  static async getAllBalances(principal, identity = null) {
    try {
      const snsTokens = this.getAllSNSTokens();
      const balancePromises = snsTokens.map(async (token) => {
        try {
          const balance = await this.getBalance(token.symbol, principal, [], identity);
          return { symbol: token.symbol, balance };
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          return { symbol: token.symbol, balance: 0 };
        }
      });

      const results = await Promise.all(balancePromises);

      const balances = {};
      results.forEach((result) => {
        balances[result.symbol] = result.balance;
      });

      return balances;
    } catch (error) {
      console.error("Error fetching all SNS balances:", error);
      throw new Error(`Failed to fetch all SNS balances: ${error.message}`);
    }
  }

  /**
   * Get transaction history for all SNS tokens
   * @param {string|Principal} principal - User principal
   * @param {number} limit - Number of transactions per token
   * @param {Identity} identity - Authenticated identity
   * @returns {Promise<Array>} Combined transaction history
   */
  static async getAllTransactionHistory(principal, limit = 10, identity = null) {
    try {
      const snsTokens = this.getAllSNSTokens();

      // Fetch all transaction histories in parallel
      const historyPromises = snsTokens.map(async (token) => {
        try {
          const transactions = await this.getTransactionHistory(token.symbol, principal, limit, 0, identity);
          return transactions;
        } catch (error) {
          console.error(`Error fetching ${token.symbol} transaction history:`, error);
          return [];
        }
      });

      const results = await Promise.all(historyPromises);

      // Flatten and sort by timestamp
      const allTransactions = results.flat();
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      return allTransactions;
    } catch (error) {
      console.error("Error fetching all SNS transaction history:", error);
      throw new Error(`Failed to fetch all SNS transaction history: ${error.message}`);
    }
  }
}

export default SNSTokenService;
