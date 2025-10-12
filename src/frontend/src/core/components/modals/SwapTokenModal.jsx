// React
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Token Configuration
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";

// Wallet Provider
import { useWallet } from "@/core/providers/WalletProvider";

// Swap Service
import { SwapService } from "@/core/services/swap/swapService.js";

export default function SwapTokenModal({ isOpen, onClose }) {
  // Wallet Provider
  const { balances, usdPrices } = useWallet();

  // Swap States
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapQuote, setSwapQuote] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Available tokens for swapping (ICRC tokens only)
  const availableTokens = useMemo(() => {
    return TOKENS_CONFIG.filter(token => 
      token.type === "icrc" && 
      token.chain === "Internet Computer"
    );
  }, []);

  // Initialize with first available token
  useEffect(() => {
    if (availableTokens.length > 0 && !fromToken) {
      setFromToken(availableTokens[0]);
    }
  }, [availableTokens, fromToken]);

  // Calculate swap quote when fromAmount or tokens change
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      getSwapQuote();
    } else {
      setSwapQuote(null);
      setToAmount("");
    }
  }, [fromToken, toToken, fromAmount]);

  const getSwapQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const quote = await SwapService.getSwapQuote({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: parseFloat(fromAmount)
      });

      setSwapQuote(quote);
      setToAmount(quote.estimatedOutput.toString());
    } catch (err) {
      console.error("Swap quote error:", err);
      setError(err.message || "Failed to get swap quote");
      setSwapQuote(null);
      setToAmount("");
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
      setFromAmount(toAmount);
      setToAmount(fromAmount);
    }
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !swapQuote) return;

    // Check if user has sufficient balance
    const userBalance = parseFloat(balances[fromToken.id] || "0");
    const swapAmount = parseFloat(fromAmount);
    
    if (userBalance < swapAmount) {
      setError(`Insufficient balance. You have ${userBalance.toFixed(6)} ${fromToken.symbol}, but trying to swap ${swapAmount.toFixed(6)} ${fromToken.symbol}`);
      return;
    }

    try {
      setIsSwapping(true);
      setError(null);

      const result = await SwapService.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: swapAmount,
        minAmountOut: swapQuote.minAmountOut,
        recipient: null // Use current user's address
      });

      if (result.success) {
        // Success - close modal and refresh balances
        onClose();
        // Trigger balance refresh
        window.dispatchEvent(new CustomEvent("refreshBalances"));
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
    setIsLoading(false);
    setIsSwapping(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#171A1C] rounded-2xl border border-white/10 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-lg font-semibold">Swap Tokens</h3>
          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Swap Form */}
        <div className="space-y-4">
          {/* From Token */}
          <div>
            <label className="text-white/90 text-sm font-medium mb-2 block">From</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={fromToken?.id || ""}
                  onChange={(e) => {
                    const token = availableTokens.find(t => t.id === parseInt(e.target.value));
                    setFromToken(token);
                  }}
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors"
                >
                  {availableTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors"
                />
              </div>
            </div>
            {fromToken && (
              <div className="text-xs text-white/60 mt-1">
                Balance: {parseFloat(balances[fromToken.id] || "0").toFixed(6)} {fromToken.symbol}
                {parseFloat(balances[fromToken.id] || "0") === 0 && (
                  <span className="text-red-400 ml-2">(No balance)</span>
                )}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-2 rounded-full bg-[#23272F] border border-[#393E4B] hover:bg-[#393E4B] transition-colors"
              disabled={!fromToken || !toToken}
            >
              <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17l4 4m0-4l-4 4M8 7l-4-4m0 4l4-4M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div>
            <label className="text-white/90 text-sm font-medium mb-2 block">To</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={toToken?.id || ""}
                  onChange={(e) => {
                    const token = TOKENS_CONFIG.find(t => t.id === parseInt(e.target.value));
                    setToToken(token);
                  }}
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0] transition-colors"
                >
                  <option value="">Select token</option>
                  {TOKENS_CONFIG.filter(token => 
                    token.type === "icrc" && 
                    token.chain === "Internet Computer" &&
                    token.id !== fromToken?.id
                  ).map(token => (
                    <option key={token.id} value={token.id}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white/60 text-sm outline-none"
                />
              </div>
            </div>
            {isLoading && (
              <div className="text-xs text-[#9BE4A0] mt-1">Getting quote...</div>
            )}
          </div>

          {/* Swap Quote Info */}
          {swapQuote && (
            <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Rate</span>
                <span className="text-white">1 {fromToken.symbol} = {swapQuote.rate} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Price Impact</span>
                <span className="text-white">{swapQuote.priceImpact}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Fee</span>
                <span className="text-white">{swapQuote.fee} {fromToken.symbol}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 py-3 rounded-lg border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 rounded-lg bg-[#9BE4A0] text-black font-medium hover:bg-[#8BD490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSwap}
              disabled={
                !fromToken || 
                !toToken || 
                !fromAmount || 
                !swapQuote || 
                isSwapping ||
                parseFloat(balances[fromToken?.id] || "0") < parseFloat(fromAmount || "0")
              }
            >
              {isSwapping ? "Swapping..." : "Swap"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
