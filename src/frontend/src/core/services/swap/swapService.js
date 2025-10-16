// ICPSwap Integration Service - FIXED Authentication
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

// ==================== YOUR ACTUAL CANISTER IDS ====================
const NETWORK_CONFIG = {
  local: {
    host: "http://localhost:4943",
    swapFactory: "kuvqc-2h777-77777-aaagq-cai",
    positionIndex: "kgth3-wx777-77777-aaafq-cai",
  }
};

const TOKEN_CANISTERS = {
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  FRADIUM: "sr4wk-4qaaa-aaaae-qfdta-cai",
  ckBTC: "mc6ru-gyaaa-aaaar-qaaaq-cai",
  ckETH: "apia6-jaaaa-aaaar-qabma-cai"
};

const TOKEN_DECIMALS = {
  ICP: 8,
  FRADIUM: 8,
  ckBTC: 8,
  ckETH: 18
};

const KNOWN_POOLS = {
  "ckBTC_ckETH": {
    canisterId: "m74gv-ax777-77777-aaarq-cai",
    fee: 3000,
    token0: "apia6-jaaaa-aaaar-qabma-cai", // ckETH
    token1: "mc6ru-gyaaa-aaaar-qaaaq-cai"  // ckBTC
  }
};

const POOL_FEES = {
  "apia6-jaaaa-aaaar-qabma-cai": 9500,
  "mc6ru-gyaaa-aaaar-qaaaq-cai": 11500
};

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

const getSwapFactoryInterface = () => ({ IDL }) => {
  const Token = IDL.Record({
    address: IDL.Text,
    standard: IDL.Text,
  });

  const PoolData = IDL.Record({
    fee: IDL.Nat,
    key: IDL.Text,
    tickSpacing: IDL.Int,
    token0: Token,
    token1: Token,
    canisterId: IDL.Principal,
  });

  return IDL.Service({
    getPools: IDL.Func([], [IDL.Variant({ ok: IDL.Vec(PoolData), err: IDL.Text })], ['query']),
  });
};

// ==================== HELPER FUNCTIONS ====================

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

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

// ==================== PRICE CALCULATION ====================

function calculatePriceFromSqrt(sqrtPriceX96, decimals0, decimals1) {
  const Q96 = 2n ** 96n;
  const sqrtPrice = BigInt(sqrtPriceX96);
  
  const numerator = sqrtPrice * sqrtPrice;
  const denominator = Q96 * Q96;
  
  const rawPrice = Number(numerator) / Number(denominator);
  const decimalAdjustment = Math.pow(10, decimals1 - decimals0);
  
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
    this.isLocal = true;
    this.config = NETWORK_CONFIG.local;
    this.agent = null;
    this.authClient = null;
    this.knownPools = { ...KNOWN_POOLS };
  }

  // ✅ FIX: Initialize with proper authenticated agent
  async initialize() {
    this.authClient = await AuthClient.create();
    
    const isAuthenticated = await this.authClient.isAuthenticated();
    
    if (isAuthenticated) {
      // Get the authenticated identity
      const identity = await this.authClient.getIdentity();
      
      // Create authenticated agent
      this.agent = await HttpAgent.create({
        host: this.config.host,
        identity: identity  // ← CRITICAL: Use authenticated identity
      });
      
      console.log("✅ Authenticated agent created for:", identity.getPrincipal().toString());
    } else {
      // Create anonymous agent for unauthenticated users
      this.agent = new HttpAgent({ host: this.config.host });
      console.log("⚠️ Anonymous agent created (user not logged in)");
    }

    if (this.isLocal) {
      await this.agent.fetchRootKey().catch(err => {
        console.warn("Unable to fetch root key:", err);
      });
    }

    return this.agent;
  }

  // ✅ FIX: Add method to reinitialize agent after login
  async reinitializeAgent() {
    if (!this.authClient) {
      await this.initialize();
      return;
    }

    const identity = await this.authClient.getIdentity();
    
    this.agent = await HttpAgent.create({
      host: this.config.host,
      identity: identity
    });

    if (this.isLocal) {
      await this.agent.fetchRootKey();
    }

    console.log("✅ Agent reinitialized with principal:", identity.getPrincipal().toString());
  }

  // ✅ FIX: Add login method that properly reinitializes agent
  async login() {
    return new Promise((resolve, reject) => {
      this.authClient.login({
        identityProvider: "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943",
        onSuccess: async () => {
          // Reinitialize agent with authenticated identity
          await this.reinitializeAgent();
          resolve();
        },
        onError: reject
      });
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

  async getFactoryActor() {
    const agent = await this.getAgent();
    return Actor.createActor(getSwapFactoryInterface(), {
      agent,
      canisterId: this.config.swapFactory
    });
  }

  async getPoolActor(poolCanisterId) {
    const agent = await this.getAgent();
    return Actor.createActor(getSwapPoolInterface(), {
      agent,
      canisterId: poolCanisterId
    });
  }

  registerPool(token0Symbol, token1Symbol, poolCanisterId, fee = 3000) {
    const key = this.getPoolKey(token0Symbol, token1Symbol);
    this.knownPools[key] = {
      canisterId: poolCanisterId,
      fee,
      token0: TOKEN_CANISTERS[token0Symbol],
      token1: TOKEN_CANISTERS[token1Symbol]
    };
    console.log(`✅ Pool registered: ${key} -> ${poolCanisterId}`);
    return this.knownPools[key];
  }

  getPoolKey(token0, token1) {
    return [token0, token1].sort().join('_');
  }

  async findPool(token0Symbol, token1Symbol) {
    const key = this.getPoolKey(token0Symbol, token1Symbol);

    if (this.knownPools[key]) {
      console.log('✅ Using known pool:', this.knownPools[key]);
      return {
        canisterId: Principal.fromText(this.knownPools[key].canisterId),
        fee: this.knownPools[key].fee,
        token0: { address: this.knownPools[key].token0, standard: "ICRC2" },
        token1: { address: this.knownPools[key].token1, standard: "ICRC2" }
      };
    }

    console.warn(`No pool found for ${token0Symbol}/${token1Symbol}`);
    return null;
  }

  async getSwapQuote({ fromToken, toToken, amount }) {
    try {
      const pool = await this.findPool(fromToken, toToken);

      if (!pool) {
        throw new Error(`No liquidity pool exists for ${fromToken}/${toToken}. Please create a pool first.`);
      }

      const poolActor = await this.getPoolActor(pool.canisterId.toString());
      const metadata = await poolActor.metadata();

      if ('err' in metadata) {
        const errorMsg = formatErrorForDisplay(metadata.err);
        throw new Error(`Pool error: ${errorMsg}`);
      }

      const poolData = metadata.ok;

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

      let quoteFromPool = null;
      try {
        const amountInSmallest = this.toSmallestUnit(amount, fromToken);
        const quoteResult = await poolActor.quote({
          amountIn: amountInSmallest.toString(),
          zeroForOne
        });

        if ('ok' in quoteResult) {
          quoteFromPool = this.fromSmallestUnit(quoteResult.ok, toToken);
          console.log("✅ Got quote from pool:", quoteFromPool, toToken);
        }
      } catch (error) {
        console.log("Pool doesn't support quote function, using calculation");
      }

      const finalOutput = quoteFromPool || estimatedOutput;
      const feePercentage = Number(poolData.fee) / 1000000;
      const fee = amount * feePercentage;

      if (finalOutput < amount * 0.0001) {
        console.warn("⚠️ WARNING: Output seems too low!", {
          input: amount,
          output: finalOutput,
          ratio: finalOutput / amount,
          sqrtPriceX96: poolData.sqrtPriceX96.toString(),
          liquidity: poolData.liquidity.toString()
        });
      }

      return {
        rate: finalOutput / amount,
        estimatedOutput: finalOutput,
        fee,
        priceImpact: "0.10",
        minAmountOut: finalOutput * 0.95,
        validFor: 300,
        poolId: pool.canisterId.toString(),
        poolFee: Number(poolData.fee),
        source: 'icpswap',
        poolPrice: calculatePriceFromSqrt(poolData.sqrtPriceX96, decimals0, decimals1),
        poolLiquidity: Number(poolData.liquidity)
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
      console.log("🔄 Starting swap:", { fromToken, toToken, amount });

      const pool = await this.findPool(fromToken, toToken);
      if (!pool) throw new Error(`No pool exists for ${fromToken}/${toToken}`);
      console.log("✅ Pool found:", pool.canisterId.toString());

      const poolActor = await this.getPoolActor(pool.canisterId.toString());
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
      console.log("💵 Balance check successful.");

      console.log(`📝 Approving pool to spend ${this.fromSmallestUnit(totalAmountForApproval, fromToken)} ${fromToken} (amount + fees)...`);
      const approveResult = await fromTokenActor.icrc2_approve({
        spender: { owner: pool.canisterId, subaccount: [] },
        amount: totalAmountForApproval,
        fee: [],
        memo: [], from_subaccount: [], created_at_time: [], expires_at: [], expected_allowance: []
      });

      if ('Err' in approveResult) throw new Error(`Approval failed: ${formatErrorForDisplay(approveResult.Err)}`);
      console.log("✅ Approval successful.");

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log("💸 Depositing tokens to pool...");
      const depositResult = await poolActor.depositFrom({
        token: TOKEN_CANISTERS[fromToken],
        amount: Number(amountInSmallest),
        fee: Number(poolFee)
      });

      if ('err' in depositResult) throw new Error(`Deposit failed: ${formatErrorForDisplay(depositResult.err)}`);
      console.log("✅ Deposit successful.");

      const metadata = await poolActor.metadata();
      const zeroForOne = TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address;

      console.log("⚡ Executing swap...");
      const swapResult = await poolActor.swap({
        amountIn: amountInSmallest.toString(),
        zeroForOne,
        amountOutMinimum: minAmountOutSmallest.toString()
      });

      if ('err' in swapResult) throw new Error(`Swap failed: ${formatErrorForDisplay(swapResult.err)}`);

      const amountOut = BigInt(swapResult.ok);
      const outputAmount = this.fromSmallestUnit(amountOut, toToken);
      console.log("✅ Swap successful! Received:", outputAmount, toToken);

      return { success: true, amountOut, message: "Swap completed successfully" };

    } catch (error) {
      console.error("❌ Swap execution error:", error);
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

  async getPoolInfo(poolId) {
    try {
      const poolActor = await this.getPoolActor(poolId);
      const metadata = await poolActor.metadata();

      if ('err' in metadata) {
        const errorMsg = formatErrorForDisplay(metadata.err);
        throw new Error(`Metadata error: ${errorMsg}`);
      }

      const poolData = metadata.ok;

      return {
        poolId,
        token0: poolData.token0,
        token1: poolData.token1,
        fee: Number(poolData.fee),
        liquidity: Number(poolData.liquidity),
        tick: poolData.tick,
        sqrtPriceX96: poolData.sqrtPriceX96.toString()
      };
    } catch (error) {
      console.error("Failed to get pool info:", error);
      return null;
    }
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