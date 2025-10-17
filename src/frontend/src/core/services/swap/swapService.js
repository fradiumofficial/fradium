// ICPSwap Integration Service - REFACTORED TO USE AuthProvider
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// ==================== MAINNET ONLY CONFIGURATION ====================
const NETWORK_CONFIG = {
  host: "https://ic0.app",
  swapFactory: "4mmnk-kiaaa-aaaag-qbllq-cai",
  positionIndex: "w4a7l-dqaaa-aaaag-qjhpq-cai",
};

// Tokens available in your system
const TOKEN_CANISTERS = {
  FRADIUM: "sr4wk-4qaaa-aaaae-qfdta-cai",
  ckBTC: "mc6ru-gyaaa-aaaar-qaaaq-cai",
  ckETH: "apia6-jaaaa-aaaar-qabma-cai",
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP Ledger
  KONG: "o7oak-iyaaa-aaaaq-aadzq-cai"  // KongSwap SNS token
};

const TOKEN_DECIMALS = {
  FRADIUM: 8,
  ckBTC: 8,
  ckETH: 18,
  ICP: 8,
  KONG: 8
};

const KNOWN_POOLS = {
  "ICP_KONG": {
    canisterId: "ye4fx-gqaaa-aaaag-qnara-cai",  // ICPSwap ICP/KONG pool
    fee: 3000,  // Standard ICPSwap fee
    token0: "o7oak-iyaaa-aaaaq-aadzq-cai",  // KONG
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  }
};

const POOL_FEES = {
  "apia6-jaaaa-aaaar-qabma-cai": 9500,  // ckETH
  "mc6ru-gyaaa-aaaar-qaaaq-cai": 11500, // ckBTC
  "sr4wk-4qaaa-aaaae-qfdta-cai": 10000, // FRADIUM
  "ryjl3-tyaaa-aaaaa-aaaba-cai": 10000, // ICP
  "o7oak-iyaaa-aaaaq-aadzq-cai": 10000  // KONG
};

export const SUPPORTED_SWAP_PAIRS = [
  // ICP/KONG pair
  { from: "ICP", to: "KONG", hasLiquidity: true },
  { from: "KONG", to: "ICP", hasLiquidity: true },
];

export function isSwapPairSupported(fromSymbol, toSymbol) {
  return SUPPORTED_SWAP_PAIRS.some(
    pair => (pair.from === fromSymbol && pair.to === toSymbol) ||
      (pair.from === toSymbol && pair.to === fromSymbol)
  );
}
// ==================== CANDID INTERFACES ====================

const getICRCInterface = () => ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
  });

  const TransferArg = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64)
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
      error_code: IDL.Nat,
      message: IDL.Text
    }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
  });

  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    spender: Account,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });

  const AllowanceArgs = IDL.Record({
    account: Account,
    spender: Account
  });

  const Allowance = IDL.Record({
    allowance: IDL.Nat,
    expires_at: IDL.Opt(IDL.Nat64)
  });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ['query']),
    icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArg], [IDL.Variant({ Ok: IDL.Nat, Err: TransferError })], []),
    icrc2_approve: IDL.Func([ApproveArgs], [IDL.Variant({ Ok: IDL.Nat, Err: TransferError })], []),
    icrc2_allowance: IDL.Func([AllowanceArgs], [Allowance], ['query'])
  });
};

const getSwapPoolInterface = () => ({ IDL }) => {
  const Token = IDL.Record({
    address: IDL.Text,
    standard: IDL.Text
  });

  const DepositArgs = IDL.Record({
    token: IDL.Text,
    amount: IDL.Nat,
    fee: IDL.Nat
  });

  const SwapArgs = IDL.Record({
    amountIn: IDL.Text,
    zeroForOne: IDL.Bool,
    amountOutMinimum: IDL.Text
  });

  const Error = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null
  });

  const PoolMetadata = IDL.Record({
    fee: IDL.Nat,
    key: IDL.Text,
    sqrtPriceX96: IDL.Nat,
    tick: IDL.Int,
    liquidity: IDL.Nat,
    token0: Token,
    token1: Token,
    maxLiquidityPerTick: IDL.Nat,
    nextPositionId: IDL.Nat,
  });

  return IDL.Service({
    depositFrom: IDL.Func(
      [DepositArgs],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      []
    ),

    swap: IDL.Func(
      [SwapArgs],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      []
    ),

    metadata: IDL.Func(
      [],
      [IDL.Variant({ ok: PoolMetadata, err: Error })],
      ['query']
    ),

    getUserUnusedBalance: IDL.Func(
      [IDL.Principal],
      [IDL.Variant({ ok: IDL.Record({ balance0: IDL.Nat, balance1: IDL.Nat }), err: Error })],
      ['query']
    ),

    withdraw: IDL.Func(
      [IDL.Record({ token: IDL.Text, amount: IDL.Nat, fee: IDL.Nat })],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      []
    ),

    quote: IDL.Func(
      [IDL.Record({ amountIn: IDL.Text, zeroForOne: IDL.Bool })],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      ['query']
    )
  });
};

// ==================== HELPER FUNCTIONS ====================

function formatErrorForDisplay(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.InternalError) return `Internal Error: ${error.InternalError}`;
  if (error.UnsupportedToken) return `Unsupported Token: ${error.UnsupportedToken}`;
  if (error.InsufficientFunds) return 'Insufficient Funds';
  if (error.CommonError) return 'Common Error';
  if (error.message) return error.message;
  return 'Unknown error occurred';
}

function calculatePriceFromSqrt(sqrtPriceX96, decimals0, decimals1) {
  const Q96 = 2n ** 96n;
  const sqrtPrice = BigInt(sqrtPriceX96);

  const numerator = sqrtPrice * sqrtPrice;
  const denominator = Q96 * Q96;

  const rawPrice = Number(numerator) / Number(denominator);
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1);

  return rawPrice * decimalAdjustment;
}

function estimateSwapOutput(amountIn, sqrtPriceX96, zeroForOne, decimals0, decimals1, feeTier) {
  const price_token0_in_token1 = calculatePriceFromSqrt(sqrtPriceX96, decimals0, decimals1);

  let estimatedOutput;
  if (zeroForOne) {
    estimatedOutput = amountIn * price_token0_in_token1;
  } else {
    estimatedOutput = amountIn / price_token0_in_token1;
  }

  const feeMultiplier = 1 - (feeTier / 1000000);
  return estimatedOutput * feeMultiplier;
}

// ==================== SWAP SERVICE ====================

export class ICPSwapService {
  constructor() {
    this.config = NETWORK_CONFIG;
    this.agent = null;
    this.knownPools = { ...KNOWN_POOLS };
  }

  // ✅ NEW: Initialize with identity from AuthProvider
  async initializeWithIdentity(identity) {
    if (!identity) {
      this.agent = new HttpAgent({ host: this.config.host });
      return this.agent;
    }

    this.agent = await HttpAgent.create({
      host: this.config.host,
      identity: identity
    });

    return this.agent;
  }

  // ✅ MODIFIED: Simplified - no longer creates AuthClient
  async initialize() {
    if (!this.agent) {
      this.agent = new HttpAgent({ host: this.config.host });
    }
    return this.agent;
  }

  // ✅ MODIFIED: Now accepts identity parameter from AuthProvider
  async reinitializeAgent(identity) {
    if (!identity) {
      console.warn("⚠️ No identity provided for reinitializeAgent");
      return;
    }

    this.agent = await HttpAgent.create({
      host: this.config.host,
      identity: identity
    });
  }

  async getAgent() {
    if (!this.agent) {
      await this.initialize();
    }
    return this.agent;
  }

  async getTokenActor(canisterId) {
    const agent = await this.getAgent();
    return Actor.createActor(getICRCInterface(), { agent, canisterId });
  }

  async getPoolActor(poolCanisterId) {
    const agent = await this.getAgent();
    return Actor.createActor(getSwapPoolInterface(), {
      agent,
      canisterId: poolCanisterId
    });
  }

  getPoolKey(token0, token1) {
    return [token0, token1].sort().join('_');
  }

  async findPool(token0Symbol, token1Symbol) {
    if (!isSwapPairSupported(token0Symbol, token1Symbol)) {
      throw new Error(`Swap pair ${token0Symbol}/${token1Symbol} is not supported. Only FRADIUM ↔ ckBTC and FRADIUM ↔ ckETH pairs are available.`);
    }

    const key = this.getPoolKey(token0Symbol, token1Symbol);

    if (this.knownPools[key]) {
      return {
        canisterId: Principal.fromText(this.knownPools[key].canisterId),
        fee: this.knownPools[key].fee,
        token0: { address: this.knownPools[key].token0, standard: "ICRC2" },
        token1: { address: this.knownPools[key].token1, standard: "ICRC2" },
        status: this.knownPools[key].status
      };
    }

    throw new Error(`No pool found for ${token0Symbol}/${token1Symbol}`);
  }

  async getSwapQuote({ fromToken, toToken, amount }) {
    try {
      const pool = await this.findPool(fromToken, toToken);

      if (!pool) {
        throw new Error(`No liquidity pool exists for ${fromToken}/${toToken}.`);
      }

      const poolActor = await this.getPoolActor(pool.canisterId.toString());
      const metadata = await poolActor.metadata();

      if ('err' in metadata) {
        const errorMsg = formatErrorForDisplay(metadata.err);
        throw new Error(`Pool error: ${errorMsg}`);
      }

      const poolData = metadata.ok;
      const hasLiquidity = Number(poolData.liquidity) > 0;
      const zeroForOne = TOKEN_CANISTERS[fromToken] === poolData.token0.address;

      const decimals0 = TOKEN_DECIMALS[
        Object.keys(TOKEN_CANISTERS).find(k => TOKEN_CANISTERS[k] === poolData.token0.address)
      ];
      const decimals1 = TOKEN_DECIMALS[
        Object.keys(TOKEN_CANISTERS).find(k => TOKEN_CANISTERS[k] === poolData.token1.address)
      ];

      const estimatedOutput = estimateSwapOutput(
        amount,
        poolData.sqrtPriceX96,
        zeroForOne,
        decimals0,
        decimals1,
        Number(poolData.fee)
      );

      const feePercentage = Number(poolData.fee) / 1000000;
      const fee = amount * feePercentage;

      return {
        rate: estimatedOutput / amount,
        estimatedOutput: estimatedOutput,
        fee,
        priceImpact: "0.10",
        minAmountOut: estimatedOutput * 0.95,
        validFor: 300,
        poolId: pool.canisterId.toString(),
        poolFee: Number(poolData.fee),
        source: 'icpswap',
        poolPrice: calculatePriceFromSqrt(poolData.sqrtPriceX96, decimals0, decimals1),
        poolLiquidity: Number(poolData.liquidity),
        hasLiquidity: hasLiquidity,
        status: pool.status
      };

    } catch (error) {
      console.error("Quote error:", error);
      throw error;
    }
  }

  async executeSwap({
    fromToken,
    toToken,
    amount,
    minAmountOut,
    userPrincipal
  }) {
    try {
      const pool = await this.findPool(fromToken, toToken);
      if (!pool) throw new Error(`No pool exists for ${fromToken}/${toToken}`);

      const poolActor = await this.getPoolActor(pool.canisterId.toString());
      const metadata = await poolActor.metadata();

      if ('err' in metadata) {
        throw new Error(`Pool error: ${formatErrorForDisplay(metadata.err)}`);
      }

      if (Number(metadata.ok.liquidity) === 0) {
        throw new Error(`Cannot execute swap: Pool has no liquidity. This pool exists but needs liquidity to be added before swaps can be performed.`);
      }

      const fromTokenActor = await this.getTokenActor(TOKEN_CANISTERS[fromToken]);
      const user = Principal.fromText(userPrincipal);

      const amountInSmallest = this.toSmallestUnit(amount, fromToken);
      const minAmountOutSmallest = this.toSmallestUnit(minAmountOut, toToken);

      const transactionFee = await fromTokenActor.icrc1_fee();
      const poolFee = BigInt(POOL_FEES[TOKEN_CANISTERS[fromToken]]);
      const balance = await fromTokenActor.icrc1_balance_of({ owner: user, subaccount: [] });

      const totalAmountForApproval = amountInSmallest + poolFee + transactionFee;
      const totalNeededInWallet = totalAmountForApproval + transactionFee;

      if (balance < totalNeededInWallet) {
        throw new Error(`Insufficient balance. Have: ${this.fromSmallestUnit(balance, fromToken)}, Need: ${this.fromSmallestUnit(totalNeededInWallet, fromToken)}`);
      }

      const approveResult = await fromTokenActor.icrc2_approve({
        spender: { owner: pool.canisterId, subaccount: [] },
        amount: totalAmountForApproval,
        fee: [],
        memo: [], from_subaccount: [], created_at_time: [], expires_at: [], expected_allowance: []
      });

      if ('Err' in approveResult) throw new Error(`Approval failed: ${formatErrorForDisplay(approveResult.Err)}`);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const depositResult = await poolActor.depositFrom({
        token: TOKEN_CANISTERS[fromToken],
        amount: Number(amountInSmallest),
        fee: Number(poolFee)
      });

      if ('err' in depositResult) throw new Error(`Deposit failed: ${formatErrorForDisplay(depositResult.err)}`);

      const zeroForOne = TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address;

      const swapResult = await poolActor.swap({
        amountIn: amountInSmallest.toString(),
        zeroForOne,
        amountOutMinimum: minAmountOutSmallest.toString()
      });

      if ('err' in swapResult) throw new Error(`Swap failed: ${formatErrorForDisplay(swapResult.err)}`);

      const amountOut = BigInt(swapResult.ok);
      const outputAmount = this.fromSmallestUnit(amountOut, toToken);

      return { success: true, amountOut, message: "Swap completed successfully" };

    } catch (error) {
      console.error("Swap execution error:", error);
      return { success: false, error: error.message || "Unknown error", details: error };
    }
  }

  async getTokenBalance(tokenSymbol, userPrincipal) {
    try {
      if (!TOKEN_CANISTERS[tokenSymbol]) {
        console.warn(`Token ${tokenSymbol} not configured`);
        return 0;
      }

      const actor = await this.getTokenActor(TOKEN_CANISTERS[tokenSymbol]);
      const balance = await actor.icrc1_balance_of({
        owner: Principal.fromText(userPrincipal),
        subaccount: []
      });
      return this.fromSmallestUnit(balance, tokenSymbol);
    } catch (error) {
      console.error(`Balance check error for ${tokenSymbol}:`, error);
      return 0;
    }
  }

  async getAllPools() {
    return Object.values(this.knownPools);
  }

  async getTokenPrices(tokenSymbols) {
    const prices = {};
    for (const symbol of tokenSymbols) {
      prices[symbol] = 0;
    }
    return prices;
  }

  toSmallestUnit(amount, tokenSymbol) {
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 8;
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }

  fromSmallestUnit(amount, tokenSymbol) {
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 8;
    return Number(amount) / Math.pow(10, decimals);
  }

  getSupportedTokens() {
    return Object.keys(TOKEN_CANISTERS);
  }

  isTokenSupported(tokenSymbol) {
    return tokenSymbol in TOKEN_CANISTERS;
  }
}

export const swapService = new ICPSwapService();