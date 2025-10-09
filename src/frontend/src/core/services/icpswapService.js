import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { ICPSWAP_CONFIG } from "@/core/config/icpswapConfig.js";

// Minimal IDL snippets for ICPSwap swap info/router per docs.
// Note: We only include what we use (quote + one-step swap), following existing pattern.

const swapInfoIdl = ({ IDL }) => {
  const Token = IDL.Record({
    standard: IDL.Text, // e.g. "ICRC-1"
    canister_id: IDL.Principal,
  });
  return IDL.Service({
    // get quote exact-in: returns expected out amount and fee
    get_quote: IDL.Func(
      [IDL.Record({ token_in: Token, token_out: Token, amount_in: IDL.Nat, slippage_bps: IDL.Nat16 })],
      [IDL.Variant({ Ok: IDL.Record({ amount_out: IDL.Nat, fee: IDL.Nat }), Err: IDL.Text })],
      ["query"]
    ),
  });
};

const routerIdl = ({ IDL }) => {
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) });
  const Token = IDL.Record({ standard: IDL.Text, canister_id: IDL.Principal });
  return IDL.Service({
    // One-step trade for ICRC-1 tokens per docs (exact in)
    icrc1_swap_exact_tokens_for_tokens: IDL.Func(
      [
        IDL.Record({
          token_in: Token,
          token_out: Token,
          amount_in: IDL.Nat,
          amount_out_min: IDL.Nat,
          recipient: Account,
          // optional referral or router params omitted
        }),
      ],
      [IDL.Variant({ Ok: IDL.Record({ amount_out: IDL.Nat }), Err: IDL.Text })],
      []
    ),
  });
};

function getAgent() {
  const host = process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://icp0.io";
  return new HttpAgent({ host });
}

function getInfoActor(agent) {
  const canisterId = ICPSWAP_CONFIG.infoCanisterId;
  if (!canisterId) throw new Error("ICPSWAP infoCanisterId missing");
  return Actor.createActor(swapInfoIdl, { agent, canisterId: Principal.fromText(canisterId) });
}

function getRouterActor(agent) {
  const canisterId = ICPSWAP_CONFIG.routerCanisterId;
  if (!canisterId) throw new Error("ICPSWAP routerCanisterId missing");
  return Actor.createActor(routerIdl, { agent, canisterId: Principal.fromText(canisterId) });
}

export async function getQuote({ tokenInId, tokenOutId, amountIn }) {
  const agent = getAgent();
  const info = getInfoActor(agent);
  const tokenIn = { standard: "ICRC-1", canister_id: Principal.fromText(tokenInId) };
  const tokenOut = { standard: "ICRC-1", canister_id: Principal.fromText(tokenOutId) };
  const slippageBps = 100n; // 1%
  const res = await info.get_quote({ token_in: tokenIn, token_out: tokenOut, amount_in: BigInt(amountIn), slippage_bps: Number(slippageBps) });
  if ("Err" in res) throw new Error(res.Err);
  return res.Ok;
}

export async function swapExactIn({ tokenInId, tokenOutId, amountIn, amountOutMin, recipientPrincipal, subaccount }) {
  const agent = getAgent();
  const router = getRouterActor(agent);
  const tokenIn = { standard: "ICRC-1", canister_id: Principal.fromText(tokenInId) };
  const tokenOut = { standard: "ICRC-1", canister_id: Principal.fromText(tokenOutId) };
  const recipient = { owner: Principal.fromText(recipientPrincipal), subaccount: subaccount ? [subaccount] : [] };
  const res = await router.icrc1_swap_exact_tokens_for_tokens({ token_in: tokenIn, token_out: tokenOut, amount_in: BigInt(amountIn), amount_out_min: BigInt(amountOutMin), recipient });
  if ("Err" in res) throw new Error(res.Err);
  return res.Ok;
}


