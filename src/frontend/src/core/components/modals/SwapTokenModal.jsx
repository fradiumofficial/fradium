import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/core/providers/AuthProvider.jsx";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { getSwappableTokens } from "@/core/config/icpswapConfig.js";
import { getQuote, swapExactIn } from "@/core/services/icpswapService.js";
import { icp_ledger } from "declarations/icp_ledger";
import { ckbtc_ledger } from "declarations/ckbtc_ledger";
import { cketh_ledger } from "declarations/cketh_ledger";

function findTokenBySymbol(symbol) {
  return TOKENS_CONFIG.find((t) => t.symbol === symbol);
}

function formatAmount(n, decimals = 8) {
  if (n == null) return "0";
  const num = typeof n === "bigint" ? Number(n) : Number(n);
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

async function approveIfNeeded({ tokenCanisterId, amount, spenderCanisterId }) {
  // Use known declarations by matching canister ID
  let ledger = null;
  const token = TOKENS_CONFIG.find((t) => t.canisterId === tokenCanisterId);
  if (!token) throw new Error("Unknown token for approval");
  if (token.symbol === "ICP") ledger = icp_ledger;
  if (token.symbol === "ckBTC") ledger = ckbtc_ledger;
  if (token.symbol === "ckETH") ledger = cketh_ledger;
  if (!ledger || !ledger.icrc2_approve) return; // skip if not available
  // Approve router to spend amount
  await ledger.icrc2_approve({
    from_subaccount: [],
    spender: { owner: spenderCanisterId, subaccount: [] },
    amount: BigInt(amount),
    expected_allowance: [],
    expires_at: [],
    fee: [],
    memo: [],
    created_at_time: [],
  });
}

export default function SwapTokenModal({ open, onClose, defaultInSymbol = "ICP" }) {
  const { identity, isAuthenticated } = useAuth();
  const swappable = useMemo(() => getSwappableTokens(TOKENS_CONFIG), []);
  const [tokenInSym, setTokenInSym] = useState(defaultInSymbol);
  const [tokenOutSym, setTokenOutSym] = useState("ckBTC");
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [swapping, setSwapping] = useState(false);

  const tokenIn = useMemo(() => findTokenBySymbol(tokenInSym), [tokenInSym]);
  const tokenOut = useMemo(() => findTokenBySymbol(tokenOutSym), [tokenOutSym]);

  useEffect(() => {
    setQuote(null);
    setError("");
  }, [tokenInSym, tokenOutSym, amountIn]);

  async function handleQuote() {
    try {
      setLoading(true);
      setError("");
      if (!tokenIn || !tokenOut) throw new Error("Select tokens");
      if (!amountIn || Number(amountIn) <= 0) throw new Error("Enter amount");
      // Convert human to base units; default decimals 8 when null
      const inDecimals = tokenIn.decimals != null ? tokenIn.decimals : 8;
      const baseIn = BigInt(Math.floor(Number(amountIn) * Math.pow(10, inDecimals)));
      const q = await getQuote({ tokenInId: tokenIn.canisterId, tokenOutId: tokenOut.canisterId, amountIn: baseIn });
      setQuote(q);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSwap() {
    try {
      if (!isAuthenticated || !identity) throw new Error("Connect wallet");
      if (!tokenIn || !tokenOut || !quote) throw new Error("Get quote first");
      setSwapping(true);
      const inDecimals = tokenIn.decimals != null ? tokenIn.decimals : 8;
      const baseIn = BigInt(Math.floor(Number(amountIn) * Math.pow(10, inDecimals)));
      const minOut = quote.amount_out ? quote.amount_out : 0n;
      // Approve router to spend tokenIn
      // eslint-disable-next-line no-undef
      const routerId = process.env.CANISTER_ID_ICPSWAP_ROUTER;
      if (!routerId) throw new Error("Router canister id missing");
      await approveIfNeeded({ tokenCanisterId: tokenIn.canisterId, amount: baseIn, spenderCanisterId: routerId });
      const res = await swapExactIn({
        tokenInId: tokenIn.canisterId,
        tokenOutId: tokenOut.canisterId,
        amountIn: baseIn,
        amountOutMin: minOut,
        recipientPrincipal: identity.getPrincipal().toText(),
      });
      setQuote(null);
      setAmountIn("");
      if (onClose) onClose();
      return res;
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSwapping(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-md rounded-2xl bg-[#12151C] border border-white/10 p-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-lg font-semibold">Swap</h3>
            <button className="text-white/70 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">From</label>
              <select className="w-full bg-white/5 text-white rounded-lg p-2" value={tokenInSym} onChange={(e) => setTokenInSym(e.target.value)}>
                {swappable.map((t) => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">To</label>
              <select className="w-full bg-white/5 text-white rounded-lg p-2" value={tokenOutSym} onChange={(e) => setTokenOutSym(e.target.value)}>
                {swappable.filter((t) => t.symbol !== tokenInSym).map((t) => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Amount</label>
              <input className="w-full bg-white/5 text-white rounded-lg p-2" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
            </div>

            {quote && (
              <div className="text-white/80 text-sm bg-white/5 rounded-lg p-2">
                <div>Expected Out: {formatAmount(quote.amount_out)}</div>
                {quote.fee != null && <div>Fee: {formatAmount(quote.fee)}</div>}
              </div>
            )}

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex gap-2 pt-2">
              <button disabled={loading} className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2" onClick={handleQuote}>{loading ? "Quoting..." : "Get Quote"}</button>
              <button disabled={swapping || !quote} className="flex-1 bg-green-600/90 hover:bg-green-600 text-white rounded-lg py-2" onClick={handleSwap}>{swapping ? "Swapping..." : "Swap"}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


