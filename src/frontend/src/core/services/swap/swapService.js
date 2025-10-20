// ICPSwap Integration Service
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// ==================== MAINNET CONFIGURATION ====================
const NETWORK_CONFIG = {
  host: "https://ic0.app",
  swapFactory: "4mmnk-kiaaa-aaaag-qbllq-cai",
  positionIndex: "w4a7l-dqaaa-aaaag-qjhpq-cai",
};

const TOKEN_CANISTERS = {
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  KONG: "o7oak-iyaaa-aaaaq-aadzq-cai",
  CHAT: "2ouva-viaaa-aaaaq-aaamq-cai",
  ICS: "ca6gz-lqaaa-aaaaq-aacwa-cai",
  PANDA: "druyg-tyaaa-aaaaq-aactq-cai",
  SNEED: "hvgxa-wqaaa-aaaaq-aacia-cai",
  OGY: "lkwrt-vyaaa-aaaaq-aadhq-cai",
  WTN: "jcmow-hyaaa-aaaaq-aadlq-cai",
  SONIC: "qbizb-wiaaa-aaaaq-aabwq-cai"
};

const TOKEN_DECIMALS = {
  ICP: 8,
  KONG: 8,
  CHAT: 8,
  ICS: 8,
  PANDA: 8,
  SNEED: 8,
  OGY: 8,
  WTN: 8,
  SONIC: 8
};

// Populated dynamically by querying actual ledger fees
const TOKEN_TRANSFER_FEES = {};

const KNOWN_POOLS = {
  "ICP_KONG": {
    canisterId: "ye4fx-gqaaa-aaaag-qnara-cai",
    fee: 3000,
    token0: "o7oak-iyaaa-aaaaq-aadzq-cai",  // KONG
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_low_liquidity"  // Updated status
  },
  
  "CHAT_ICP": {
    canisterId: "ne2vj-6yaaa-aaaag-qb3ia-cai",
    fee: 3000,
    token0: "2ouva-viaaa-aaaaq-aaamq-cai",  // CHAT
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_ICS": {
    canisterId: "uizni-yiaaa-aaaag-qjrca-cai",
    fee: 3000,
    token0: "ca6gz-lqaaa-aaaaq-aacwa-cai",  // ICS
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_PANDA": {
    canisterId: "5fq4w-lyaaa-aaaag-qjqta-cai",
    fee: 3000,
    token0: "druyg-tyaaa-aaaaq-aactq-cai",  // PANDA
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_SNEED": {
    canisterId: "osyzs-xiaaa-aaaag-qc76q-cai",
    fee: 3000,
    token0: "hvgxa-wqaaa-aaaaq-aacia-cai",  // SNEED
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_OGY": {
    canisterId: "ttnzy-lyaaa-aaaag-qj2bq-cai",
    fee: 3000,
    token0: "lkwrt-vyaaa-aaaaq-aadhq-cai",  // OGY
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_WTN": {
    canisterId: "oqn67-kaaaa-aaaag-qj72q-cai",
    fee: 3000,
    token0: "jcmow-hyaaa-aaaaq-aadlq-cai",  // WTN
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_with_liquidity"
  },
  
  "ICP_SONIC": {
    canisterId: "jknac-2aaaa-aaaag-qcmfq-cai",
    fee: 3000,
    token0: "qbizb-wiaaa-aaaaq-aabwq-cai",  // SONIC
    token1: "ryjl3-tyaaa-aaaaa-aaaba-cai",  // ICP
    status: "active_low_liquidity"  // Warning: only $7K liquidity
  }
};

export const SUPPORTED_SWAP_PAIRS = [
  { from: "ICP", to: "KONG", hasLiquidity: true },
  { from: "KONG", to: "ICP", hasLiquidity: true },
  
  // New pairs
  { from: "ICP", to: "CHAT", hasLiquidity: true },
  { from: "CHAT", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "ICS", hasLiquidity: true },
  { from: "ICS", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "PANDA", hasLiquidity: true },
  { from: "PANDA", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "SNEED", hasLiquidity: true },
  { from: "SNEED", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "OGY", hasLiquidity: true },
  { from: "OGY", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "WTN", hasLiquidity: true },
  { from: "WTN", to: "ICP", hasLiquidity: true },
  
  { from: "ICP", to: "SONIC", hasLiquidity: true },
  { from: "SONIC", to: "ICP", hasLiquidity: true },
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
  
  // Calculate raw price: (sqrtPriceX96 / 2^96)^2
  const numerator = sqrtPrice * sqrtPrice;
  const denominator = Q96 * Q96;
  const rawPrice = Number(numerator) / Number(denominator);
  
  // Adjust for token decimals
  // Price represents: how much token1 you get per 1 token0
  const decimalAdjustment = Math.pow(10, decimals1 - decimals0);
  
  return rawPrice * decimalAdjustment;
}

function estimateSwapOutput(amountIn, sqrtPriceX96, zeroForOne, decimals0, decimals1, feeTier) {
  // Get the price of token0 in terms of token1
  const price = calculatePriceFromSqrt(sqrtPriceX96, decimals0, decimals1);
  
  let estimatedOutput;
  
  if (zeroForOne) {
    // Swapping token0 → token1
    // 1 token0 = price * token1
    estimatedOutput = amountIn * price;
  } else {
    // Swapping token1 → token0
    // 1 token1 = (1/price) * token0
    estimatedOutput = amountIn / price;
  }

  // Apply swap fee (0.3% = 3000/1000000)
  const feeMultiplier = 1 - (feeTier / 1000000);
  return estimatedOutput * feeMultiplier;
}

// ==================== SWAP SERVICE ====================

export class ICPSwapService {
  constructor() {
    this.config = NETWORK_CONFIG;
    this.agent = null;
    this._identity = null;
    this.knownPools = { ...KNOWN_POOLS };
    this.feesInitialized = false;
  }

  async initializeWithIdentity(identity) {
    if (!identity) {
      this.agent = new HttpAgent({ host: this.config.host });
      this._identity = null;
    } else {
      this._identity = identity;
      this.agent = await HttpAgent.create({
        host: this.config.host,
        identity: identity
      });
    }

    await this.queryTokenFees();
    return this.agent;
  }

  async initialize() {
    if (!this.agent) {
      this.agent = new HttpAgent({ host: this.config.host });
      this._identity = null;
    }
    await this.queryTokenFees();
    return this.agent;
  }

  async queryTokenFees() {
    if (this.feesInitialized) return TOKEN_TRANSFER_FEES;

    for (const [symbol, canisterId] of Object.entries(TOKEN_CANISTERS)) {
      try {
        const actor = await this.getTokenActor(canisterId);
        const fee = await actor.icrc1_fee();
        TOKEN_TRANSFER_FEES[canisterId] = BigInt(fee);
      } catch (error) {
        console.error(`Failed to query fee for ${symbol}:`, error);
        TOKEN_TRANSFER_FEES[canisterId] = BigInt(10000); // Safe fallback
      }
    }

    this.feesInitialized = true;
    return TOKEN_TRANSFER_FEES;
  }

  getTokenTransferFee(tokenCanisterId) {
    const fee = TOKEN_TRANSFER_FEES[tokenCanisterId];
    if (!fee) {
      console.warn(`Fee not found for ${tokenCanisterId}, using fallback`);
      return BigInt(10000);
    }
    return BigInt(fee);
  }

  async reinitializeAgent(identity) {
    if (!identity) {
      console.warn("No identity provided for reinitializeAgent");
      return;
    }

    this._identity = identity;
    this.agent = await HttpAgent.create({
      host: this.config.host,
      identity: identity
    });

    this.feesInitialized = false;
    await this.queryTokenFees();
  }

  async getAgent() {
    if (!this.agent) {
      await this.initialize();
    }
    return this.agent;
  }

  getIdentity() {
    return this._identity;
  }

  isAuthenticated() {
    return !!this._identity;
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
      throw new Error(`Swap pair ${token0Symbol}/${token1Symbol} is not supported. Only ICP ↔ KONG pairs are available.`);
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
        throw new Error(`Pool error: ${formatErrorForDisplay(metadata.err)}`);
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
    let depositSucceeded = false;
    let poolActor = null;
    let pool = null;
    let approvalSucceeded = false;

    try {
      if (!this._identity) {
        throw new Error("Not authenticated. Please log in first.");
      }

      if (!this.feesInitialized) {
        await this.queryTokenFees();
      }

      pool = await this.findPool(fromToken, toToken);
      if (!pool) throw new Error(`No pool exists for ${fromToken}/${toToken}`);

      poolActor = await this.getPoolActor(pool.canisterId.toString());
      const metadata = await poolActor.metadata();

      if ('err' in metadata) {
        throw new Error(`Pool error: ${formatErrorForDisplay(metadata.err)}`);
      }

      if (Number(metadata.ok.liquidity) === 0) {
        throw new Error(`Cannot execute swap: Pool has no liquidity`);
      }

      const fromTokenActor = await this.getTokenActor(TOKEN_CANISTERS[fromToken]);
      const user = Principal.fromText(userPrincipal);

      const amountInSmallest = this.toSmallestUnit(amount, fromToken);
      const minAmountOutSmallest = this.toSmallestUnit(minAmountOut, toToken);

      const transactionFee = this.getTokenTransferFee(TOKEN_CANISTERS[fromToken]);
      const depositFee = this.getTokenTransferFee(TOKEN_CANISTERS[fromToken]);

      const balance = await fromTokenActor.icrc1_balance_of({ owner: user, subaccount: [] });

      const totalAmountForApproval = amountInSmallest + depositFee + transactionFee;
      const totalNeededInWallet = totalAmountForApproval + transactionFee;

      if (balance < totalNeededInWallet) {
        const shortfall = this.fromSmallestUnit(totalNeededInWallet - balance, fromToken);
        throw new Error(
          `Insufficient balance.\n` +
          `Have: ${this.fromSmallestUnit(balance, fromToken)} ${fromToken}\n` +
          `Need: ${this.fromSmallestUnit(totalNeededInWallet, fromToken)} ${fromToken}\n` +
          `Short: ${shortfall} ${fromToken}`
        );
      }

      // STEP 1: APPROVE
      console.log("Approving tokens for swap...");

      const approveResult = await fromTokenActor.icrc2_approve({
        spender: { owner: pool.canisterId, subaccount: [] },
        amount: totalAmountForApproval,
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        expires_at: [],
        expected_allowance: []
      });

      if ('Err' in approveResult) {
        throw new Error(`Approval failed: ${formatErrorForDisplay(approveResult.Err)}`);
      }

      approvalSucceeded = true;
      await new Promise(resolve => setTimeout(resolve, 2000));

      // STEP 2: DEPOSIT
      console.log("Depositing to pool...");

      const depositResult = await poolActor.depositFrom({
        token: TOKEN_CANISTERS[fromToken],
        amount: amountInSmallest,
        fee: depositFee
      });

      if ('err' in depositResult) {
        throw new Error(`Deposit failed: ${formatErrorForDisplay(depositResult.err)}`);
      }

      depositSucceeded = true;

      // STEP 3: VERIFY DEPOSIT
      await new Promise(resolve => setTimeout(resolve, 1500));

      const balanceCheck = await poolActor.getUserUnusedBalance(user);
      if ('err' in balanceCheck) {
        console.warn("Could not verify deposit balance:", formatErrorForDisplay(balanceCheck.err));
      } else {
        const zeroForOne = TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address;
        const depositedBalance = zeroForOne ? balanceCheck.ok.balance0 : balanceCheck.ok.balance1;

        if (depositedBalance < amountInSmallest * 95n / 100n) {
          console.warn(
            `WARNING: Deposited amount (${this.fromSmallestUnit(depositedBalance, fromToken)}) ` +
            `is less than expected (${amount}). Proceeding with caution...`
          );
        }
      }

      // STEP 4: EXECUTE SWAP
      console.log("Executing swap...");

      const swapResult = await poolActor.swap({
        amountIn: amountInSmallest.toString(),
        zeroForOne: TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address,
        amountOutMinimum: minAmountOutSmallest.toString()
      });

      if ('err' in swapResult) {
        throw new Error(`SWAP_FAILED: ${formatErrorForDisplay(swapResult.err)}`);
      }

      const amountOut = BigInt(swapResult.ok);
      const outputAmount = this.fromSmallestUnit(amountOut, toToken);

      console.log(`Swap successful: Received ${outputAmount} ${toToken}`);

      // STEP 5: AUTO-WITHDRAW
      console.log("Withdrawing tokens to wallet...");

      const withdrawFee = this.getTokenTransferFee(TOKEN_CANISTERS[toToken]);
      const withdrawAmount = amountOut > withdrawFee ? amountOut - withdrawFee : amountOut;

      const withdrawResult = await poolActor.withdraw({
        token: TOKEN_CANISTERS[toToken],
        amount: withdrawAmount,
        fee: withdrawFee
      });

      if ('err' in withdrawResult) {
        console.warn(`Swap succeeded but withdrawal failed: ${formatErrorForDisplay(withdrawResult.err)}`);
        return {
          success: true,
          amountOut: outputAmount,
          amountOutRaw: amountOut,
          message: `Swap successful! ${outputAmount} ${toToken} is in the pool. Manual withdrawal needed.`,
          txHash: swapResult.ok.toString(),
          needsManualWithdrawal: true,
          withdrawInstructions: {
            poolCanisterId: pool.canisterId.toString(),
            tokenCanister: TOKEN_CANISTERS[toToken],
            tokenSymbol: toToken,
            amount: this.fromSmallestUnit(withdrawAmount, toToken)
          }
        };
      }

      const withdrawnAmount = this.fromSmallestUnit(withdrawAmount, toToken);
      console.log(`Withdrawal successful: ${withdrawnAmount} ${toToken} sent to wallet`);

      return {
        success: true,
        amountOut: withdrawnAmount,
        amountOutRaw: withdrawAmount,
        message: "Swap completed successfully",
        txHash: swapResult.ok.toString(),
        withdrawTxHash: withdrawResult.ok.toString()
      };

    } catch (error) {
      console.error("Swap error:", error.message);

      // AUTOMATIC RECOVERY
      if (depositSucceeded && poolActor && pool) {
        console.warn("Deposit succeeded but swap failed - attempting automatic recovery");

        try {
          const user = Principal.fromText(userPrincipal);
          const balanceCheck = await poolActor.getUserUnusedBalance(user);

          if ('ok' in balanceCheck) {
            const metadata = await poolActor.metadata();
            const zeroForOne = TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address;
            const stuckBalance = zeroForOne ? balanceCheck.ok.balance0 : balanceCheck.ok.balance1;

            if (stuckBalance > 0n) {
              const withdrawFee = this.getTokenTransferFee(TOKEN_CANISTERS[fromToken]);
              const withdrawAmount = stuckBalance > withdrawFee ? stuckBalance - withdrawFee : stuckBalance;

              const withdrawResult = await poolActor.withdraw({
                token: TOKEN_CANISTERS[fromToken],
                amount: withdrawAmount,
                fee: withdrawFee
              });

              if ('ok' in withdrawResult) {
                const recoveredAmount = this.fromSmallestUnit(withdrawAmount, fromToken);
                console.log(`Recovery successful: ${recoveredAmount} ${fromToken} returned to wallet`);

                return {
                  success: false,
                  error: error.message,
                  recovered: true,
                  recoveredAmount: recoveredAmount,
                  message: `Swap failed but ${recoveredAmount} ${fromToken} was automatically recovered to your wallet.`
                };
              } else {
                console.error("Automatic withdrawal failed:", formatErrorForDisplay(withdrawResult.err));
              }
            }
          }
        } catch (recoveryError) {
          console.error("Recovery attempt failed:", recoveryError);
        }
      }

      // ERROR RESPONSE WITH RECOVERY INSTRUCTIONS
      const errorResponse = {
        success: false,
        error: error.message || "Unknown error",
        recovered: false,
        details: error
      };

      if (depositSucceeded && !approvalSucceeded) {
        errorResponse.message = "Approval succeeded but deposit failed. Your funds are safe in your wallet.";
      } else if (depositSucceeded) {
        errorResponse.needsManualRecovery = true;
        errorResponse.message = "Funds may be stuck in pool - manual recovery may be needed";
        errorResponse.recoveryInstructions = {
          message: "Automatic recovery failed. You may need to manually recover your tokens.",
          poolCanisterId: pool.canisterId.toString(),
          userPrincipal: userPrincipal,
          tokenCanister: TOKEN_CANISTERS[fromToken],
          tokenSymbol: fromToken
        };
      }

      return errorResponse;
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

  // Manual recovery helper
  async recoverStuckFunds(userPrincipal, fromToken, poolCanisterId) {
    try {
      const poolActor = await this.getPoolActor(poolCanisterId);
      const user = Principal.fromText(userPrincipal);

      const balanceCheck = await poolActor.getUserUnusedBalance(user);

      if ('err' in balanceCheck) {
        throw new Error(`Cannot check balance: ${formatErrorForDisplay(balanceCheck.err)}`);
      }

      const metadata = await poolActor.metadata();
      if ('err' in metadata) {
        throw new Error(`Cannot get pool metadata: ${formatErrorForDisplay(metadata.err)}`);
      }

      const zeroForOne = TOKEN_CANISTERS[fromToken] === metadata.ok.token0.address;
      const stuckBalance = zeroForOne ? balanceCheck.ok.balance0 : balanceCheck.ok.balance1;

      if (stuckBalance === 0n) {
        return {
          success: true,
          message: "No stuck funds found",
          stuckBalance: 0
        };
      }

      const stuckAmount = this.fromSmallestUnit(stuckBalance, fromToken);
      console.log(`Found stuck funds: ${stuckAmount} ${fromToken}`);

      const withdrawFee = this.getTokenTransferFee(TOKEN_CANISTERS[fromToken]);
      const withdrawAmount = stuckBalance > withdrawFee ? stuckBalance - withdrawFee : stuckBalance;

      const withdrawResult = await poolActor.withdraw({
        token: TOKEN_CANISTERS[fromToken],
        amount: withdrawAmount,
        fee: withdrawFee
      });

      if ('err' in withdrawResult) {
        throw new Error(`Withdrawal failed: ${formatErrorForDisplay(withdrawResult.err)}`);
      }

      const recoveredAmount = this.fromSmallestUnit(withdrawAmount, fromToken);
      console.log(`Recovery successful: ${recoveredAmount} ${fromToken} returned to wallet`);

      return {
        success: true,
        message: `Successfully recovered ${recoveredAmount} ${fromToken}`,
        recoveredAmount: recoveredAmount,
        txHash: withdrawResult.ok.toString()
      };

    } catch (error) {
      console.error("Recovery failed:", error);
      return {
        success: false,
        error: error.message,
        message: "Manual recovery failed. Please contact ICPSwap support."
      };
    }
  }

  // Check for stuck funds across all pools
  async checkForStuckFunds(userPrincipal) {
    const stuckFunds = [];
    const user = Principal.fromText(userPrincipal);

    for (const [poolKey, poolInfo] of Object.entries(this.knownPools)) {
      try {
        const poolActor = await this.getPoolActor(poolInfo.canisterId);
        const balanceCheck = await poolActor.getUserUnusedBalance(user);

        if ('ok' in balanceCheck) {
          const balance0 = balanceCheck.ok.balance0;
          const balance1 = balanceCheck.ok.balance1;

          if (balance0 > 0n || balance1 > 0n) {
            const token0Symbol = Object.keys(TOKEN_CANISTERS).find(
              k => TOKEN_CANISTERS[k] === poolInfo.token0
            );
            const token1Symbol = Object.keys(TOKEN_CANISTERS).find(
              k => TOKEN_CANISTERS[k] === poolInfo.token1
            );

            const stuck = {
              pool: poolKey,
              poolCanisterId: poolInfo.canisterId,
              funds: []
            };

            if (balance0 > 0n) {
              stuck.funds.push({
                token: token0Symbol,
                amount: this.fromSmallestUnit(balance0, token0Symbol),
                amountRaw: balance0
              });
            }

            if (balance1 > 0n) {
              stuck.funds.push({
                token: token1Symbol,
                amount: this.fromSmallestUnit(balance1, token1Symbol),
                amountRaw: balance1
              });
            }

            stuckFunds.push(stuck);
            console.log(`Found stuck funds in ${poolKey}:`, stuck.funds);
          }
        }
      } catch (error) {
        console.error(`Error checking pool ${poolKey}:`, error);
      }
    }

    if (stuckFunds.length > 0) {
      console.log(`Found stuck funds in ${stuckFunds.length} pool(s)`);
    }

    return stuckFunds;
  }

  // Get detailed fee breakdown
  getFeesBreakdown(amount, fromToken) {
    const amountInSmallest = this.toSmallestUnit(amount, fromToken);
    const transferFee = this.getTokenTransferFee(TOKEN_CANISTERS[fromToken]);

    return {
      swapAmount: amount,
      swapAmountSmallest: amountInSmallest.toString(),
      transferFee: this.fromSmallestUnit(transferFee, fromToken),
      transferFeeSmallest: transferFee.toString(),
      approvalFee: this.fromSmallestUnit(transferFee, fromToken),
      depositFee: this.fromSmallestUnit(transferFee, fromToken),
      totalFeesInToken: this.fromSmallestUnit(transferFee * 3n, fromToken),
      totalNeeded: this.fromSmallestUnit(amountInSmallest + (transferFee * 3n), fromToken),
      breakdown: [
        { step: "Approval", fee: this.fromSmallestUnit(transferFee, fromToken) },
        { step: "Deposit", fee: this.fromSmallestUnit(transferFee, fromToken) },
        { step: "Swap execution", fee: this.fromSmallestUnit(transferFee, fromToken) }
      ]
    };
  }
}

export const swapService = new ICPSwapService();

// Recovery utilities
export const recoveryUtils = {
  async checkStuckFunds(userPrincipal) {
    return await swapService.checkForStuckFunds(userPrincipal);
  },

  async recoverFunds(userPrincipal, fromToken, poolCanisterId) {
    return await swapService.recoverStuckFunds(userPrincipal, fromToken, poolCanisterId);
  },

  async getFeesInfo(amount, fromToken) {
    return swapService.getFeesBreakdown(amount, fromToken);
  }
};

// Make globally available for AuthProvider
if (typeof window !== 'undefined') {
  window.swapService = swapService;
}