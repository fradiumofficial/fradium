import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { swapService } from "@/core/services/swap/swapService.js";

window.swapService = swapService;

export default function SwapTokenModal({ isOpen, onClose }) {
  const { balances, usdPrices } = useWallet();
  const { identity, isAuthenticated } = useAuth();

  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapQuote, setSwapQuote] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [tokenPrices, setTokenPrices] = useState({});
  const [poolInfo, setPoolInfo] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const availableTokens = useMemo(() => {
    return TOKENS_CONFIG.filter((token) => token.type === "icrc" && token.chain === "Internet Computer");
  }, []);

  useEffect(() => {
    if (availableTokens.length > 0 && !fromToken) {
      setFromToken(availableTokens[0]);
    }

    // Load real-time token prices
    const loadPrices = async () => {
      const tokens = availableTokens.map((t) => t.symbol);
      const prices = await swapService.getTokenPrices(tokens);
      setTokenPrices(prices);
    };

    if (availableTokens.length > 0) {
      loadPrices();
    }
  }, [availableTokens, fromToken]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      getSwapQuote();
    } else {
      setSwapQuote(null);
      setToAmount("");
      setPoolInfo(null);
    }
  }, [fromToken, toToken, fromAmount]);

  const getSwapQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    try {
      setIsLoading(true);
      setError(null);

      const quote = await swapService.getSwapQuote({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: parseFloat(fromAmount),
      });

      setSwapQuote(quote);
      setToAmount(quote.estimatedOutput.toString());

      // Load pool information for additional context
      if (quote.poolId) {
        try {
          const poolData = await swapService.getPoolInfo(quote.poolId);
          setPoolInfo(poolData);
        } catch (poolErr) {
          console.warn("Could not load pool info:", poolErr);
          setPoolInfo(null);
        }
      }
    } catch (err) {
      console.error("Swap quote error:", err);
      setError(err.message || "Failed to get swap quote");
      setSwapQuote(null);
      setToAmount("");
      setPoolInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapTokens = () => {
    if (fromToken && toToken) {
      const newFromToken = toToken;
      const newToToken = fromToken;
      setFromToken(newFromToken);
      setToToken(newToToken);
      setFromAmount(toAmount || "");
      setToAmount(fromAmount || "");
    }
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !swapQuote) return;

    if (!isAuthenticated || !identity) {
      setError("Please connect your wallet to perform swaps");
      return;
    }

    const principal = identity.getPrincipal().toString();
    if (!principal) {
      setError("Unable to get wallet address. Please try reconnecting your wallet.");
      return;
    }

    const userBalance = await swapService.getTokenBalance(fromToken.symbol, principal);
    const swapAmount = parseFloat(fromAmount);

    if (userBalance < swapAmount) {
      setError(`Insufficient balance. You have ${userBalance.toFixed(6)} ${fromToken.symbol}, but trying to swap ${swapAmount.toFixed(6)} ${fromToken.symbol}`);
      return;
    }

    try {
      setIsSwapping(true);
      setError(null);
      setSuccessMessage(null);

      const result = await swapService.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: swapAmount,
        minAmountOut: swapQuote.minAmountOut,
        recipient: null, // Use current user's address
        userPrincipal: principal,
      });

      if (result.success) {
        // Convert BigInt to display number
        const outputAmount = swapService.fromSmallestUnit(result.amountOut, toToken.symbol);
        
        // Success - close modal and refresh balances
        onClose();
        // Trigger balance refresh
        window.dispatchEvent(new CustomEvent("refreshBalances"));

        // Show success message
        alert(`Swap successful! You received ${outputAmount.toFixed(6)} ${toToken.symbol}`);
      } else {
        throw new Error(result.error || "Swap failed");
      }
    } catch (err) {
      console.error("Swap execution error:", err);
      setError(err.message || "Swap execution failed");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleClose = () => {
    setFromAmount("");
    setToAmount("");
    setSwapQuote(null);
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
    setIsSwapping(false);
    setPoolInfo(null);
    onClose();
  };

  const getBalanceForToken = (token) => {
    if (!token) return "0";
    const balance = balances[token.id] || "0";
    return parseFloat(balance).toFixed(6);
  };

  const getUSDValue = (token, amount) => {
    if (!token || !amount) return "0.00";
    const price = usdPrices[token.symbol] || tokenPrices[token.symbol] || 0;
    return (parseFloat(amount) * price).toFixed(2);
  };

  const isSwapDisabled = () => {
    if (!isAuthenticated) return true;
    if (!fromToken || !toToken) return true;
    if (!fromAmount || !swapQuote) return true;
    if (isSwapping || isLoading) return true;
    
    const userBalance = parseFloat(getBalanceForToken(fromToken));
    const swapAmount = parseFloat(fromAmount || "0");
    if (userBalance < swapAmount) return true;
    
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#171A1C] rounded-2xl border border-white/10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-lg font-semibold">Swap Tokens</h3>
          <button className="text-white/70 hover:text-white transition-colors" onClick={handleClose} aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/90 text-sm font-medium mb-2 block">From</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={fromToken?.id || ""}
                  onChange={(e) => {
                    const token = availableTokens.find((t) => t.id === parseInt(e.target.value));
                    setFromToken(token);
                    setError(null);
                  }}
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors">
                  {availableTokens.map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <input type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors" />
              </div>
            </div>
            {fromToken && (
              <div className="text-xs text-white/60 mt-1">
                Balance: {parseFloat(balances[fromToken.id] || "0").toFixed(6)} {fromToken.symbol}
                {tokenPrices[fromToken.symbol] && <span className="text-white/40 ml-2">(${(parseFloat(balances[fromToken.id] || "0") * tokenPrices[fromToken.symbol]).toFixed(2)})</span>}
                {parseFloat(balances[fromToken.id] || "0") === 0 && <span className="text-red-400 ml-2">(No balance)</span>}
              </div>
            )}
            {fromToken && fromAmount && (
              <div className="text-xs text-white/40 mt-1">
                ≈ ${getUSDValue(fromToken, fromAmount)}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button onClick={handleSwapTokens} className="p-2 rounded-full bg-[#23272F] border border-[#393E4B] hover:bg-[#393E4B] transition-colors" disabled={!fromToken || !toToken}>
              <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div>
            <label className="text-white/90 text-sm font-medium mb-2 block">To</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={toToken?.id || ""}
                  onChange={(e) => {
                    const token = TOKENS_CONFIG.find((t) => t.id === parseInt(e.target.value));
                    setToToken(token);
                    setError(null);
                  }}
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors">
                  <option value="">Select token</option>
                  {TOKENS_CONFIG.filter((token) => token.type === "icrc" && token.chain === "Internet Computer" && token.id !== fromToken?.id).map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <input type="number" placeholder="0.0" value={toAmount} readOnly className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white/60 text-sm outline-none" />
              </div>
            </div>
            {isLoading && <div className="text-xs text-[#9BE4A0] mt-1">Getting quote...</div>}
          </div>

          {swapQuote && !error && (
            <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4 space-y-2">
              <h4 className="text-white font-medium text-sm mb-3">Swap Details</h4>
              {swapQuote.source === "market" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-3">
                  <p className="text-yellow-400 text-xs">Using market-based pricing. Pool liquidity not available for this pair.</p>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Rate</span>
                <span className="text-white">
                  1 {fromToken.symbol} = {swapQuote.rate.toFixed(6)} {toToken.symbol}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Price Impact</span>
                <span className={`text-sm ${parseFloat(swapQuote.priceImpact) > 1 ? "text-red-400" : "text-white"}`}>{swapQuote.priceImpact}%</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Fee</span>
                <span className="text-white">
                  {swapQuote.fee.toFixed(6)} {fromToken.symbol}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Min Received</span>
                <span className="text-white">
                  {swapQuote.minAmountOut.toFixed(6)} {toToken.symbol}
                </span>
              </div>
              
              {poolInfo && poolInfo.liquidity > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Pool Liquidity</span>
                  <span className="text-white">
                    ${(poolInfo.liquidity / 1e8).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Quote Source</span>
                <span className={`text-sm ${swapQuote.source === "pool" ? "text-green-400" : "text-yellow-400"}`}>{swapQuote.source === "pool" ? "Liquidity Pool" : "Market Price"}</span>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please connect your wallet to perform swaps
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button className="flex-1 py-3 rounded-lg border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors" onClick={handleClose}>
              Cancel
            </button>
            <button className="flex-1 py-3 rounded-lg bg-[#9BE4A0] text-black font-medium hover:bg-[#8BD490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSwap} disabled={!isAuthenticated || !fromToken || !toToken || !fromAmount || !swapQuote || isSwapping || parseFloat(balances[fromToken?.id] || "0") < parseFloat(fromAmount || "0")}>
              {isSwapping ? "Swapping..." : "Swap"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}