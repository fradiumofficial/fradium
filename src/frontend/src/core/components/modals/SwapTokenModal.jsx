import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { swapService } from "@/core/services/swap/swapService.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";

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
      // Set default to Fradium
      const fradiumToken = availableTokens.find((token) => token.symbol === "FRADIUM");
      setFromToken(fradiumToken || availableTokens[0]);
    }

    if (availableTokens.length > 0 && !toToken) {
      // Set default to ICP
      const icpToken = availableTokens.find((token) => token.symbol === "ICP");
      setToToken(icpToken || availableTokens[1] || availableTokens[0]);
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
  }, [availableTokens, fromToken, toToken]);

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

  const handleFromTokenChange = (token) => {
    setFromToken(token);
    // If the new from token is the same as to token, reset to token
    if (token.symbol === toToken?.symbol) {
      const availableToTokens = TOKENS_CONFIG.filter((t) => t.type === "icrc" && t.chain === "Internet Computer" && t.symbol !== token.symbol);
      setToToken(availableToTokens[0] || null);
    }
    // Clear amounts when changing tokens
    setFromAmount("");
    setToAmount("");
    setSwapQuote(null);
    setError(null);
  };

  const handleToTokenChange = (token) => {
    setToToken(token);
    // If the new to token is the same as from token, reset from token
    if (token.symbol === fromToken?.symbol) {
      const availableFromTokens = availableTokens.filter((t) => t.symbol !== token.symbol);
      setFromToken(availableFromTokens[0] || null);
    }
    // Clear amounts when changing tokens
    setFromAmount("");
    setToAmount("");
    setSwapQuote(null);
    setError(null);
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10">
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={handleClose} aria-label="Close">
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center p-4 gap-4 h-auto">
            <div className="w-full text-center text-white text-lg font-medium">Swap Tokens</div>

            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="space-y-4">
                {/* From Token Selection */}
                <div>
                  <label className="block text-white/90 text-[13px] font-medium mb-2">From</label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex-1 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white text-left focus:outline-none focus:border-[#9BE4A0] transition-all flex items-center justify-between hover:border-white/20">
                          <div className="flex items-center gap-3">
                            <img src={fromToken?.imageUrl} alt={fromToken?.name} className="w-6 h-6 rounded-full" />
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{fromToken?.name}</span>
                              <span className="text-white/50 text-xs">{fromToken?.symbol}</span>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]" align="start">
                        {availableTokens
                          .filter((token) => token.symbol !== toToken?.symbol)
                          .map((token) => (
                            <DropdownMenuItem key={token.id} onClick={() => handleFromTokenChange(token)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                              <div className="flex items-center gap-3">
                                <img src={token.imageUrl} alt={token.name} className="w-6 h-6 rounded-full" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{token.name}</span>
                                  <span className="text-white/50 text-xs">{token.symbol}</span>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <input type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="w-24 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-[#B0B6BE] focus:outline-none focus:ring-2 focus:ring-[#9BE4A0] focus:border-[#9BE4A0] transition-all" />
                  </div>
                  {fromToken && (
                    <div className="text-xs text-white/60 mt-1">
                      Balance: {parseFloat(balances[fromToken.id] || "0").toFixed(6)} {fromToken.symbol}
                      {tokenPrices[fromToken.symbol] && <span className="text-white/40 ml-2">(${(parseFloat(balances[fromToken.id] || "0") * tokenPrices[fromToken.symbol]).toFixed(2)})</span>}
                      {parseFloat(balances[fromToken.id] || "0") === 0 && <span className="text-red-400 ml-2">(No balance)</span>}
                    </div>
                  )}
                  {fromToken && fromAmount && <div className="text-xs text-white/40 mt-1">≈ ${getUSDValue(fromToken, fromAmount)}</div>}
                </div>

                {/* Swap Button */}
                <div className="flex justify-end pr-8">
                  <button onClick={handleSwapTokens} className="p-4 rounded-full bg-[#23272F] border border-[#393E4B] hover:bg-[#393E4B] transition-colors" disabled={!fromToken || !toToken}>
                    <ArrowUpDown className="w-5 h-5 text-white/90" />
                  </button>
                </div>

                {/* To Token Selection */}
                <div>
                  <label className="block text-white/90 text-[13px] font-medium mb-2">To</label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex-1 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white text-left focus:outline-none focus:border-[#9BE4A0] transition-all flex items-center justify-between hover:border-white/20">
                          <div className="flex items-center gap-3">
                            <img src={toToken?.imageUrl} alt={toToken?.name} className="w-6 h-6 rounded-full" />
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{toToken?.name || "Select token"}</span>
                              <span className="text-white/50 text-xs">{toToken?.symbol || ""}</span>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]" align="start">
                        {TOKENS_CONFIG.filter((token) => token.type === "icrc" && token.chain === "Internet Computer" && token.symbol !== fromToken?.symbol).map((token) => (
                          <DropdownMenuItem key={token.id} onClick={() => handleToTokenChange(token)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                            <div className="flex items-center gap-3">
                              <img src={token.imageUrl} alt={token.name} className="w-6 h-6 rounded-full" />
                              <div className="flex flex-col">
                                <span className="font-medium">{token.name}</span>
                                <span className="text-white/50 text-xs">{token.symbol}</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <input type="text" placeholder="0.0" value={isLoading ? "Getting quote..." : toAmount || "0"} readOnly className="w-24 px-4 py-3 bg-[#FFFFFF08] border border-white/10 rounded-xl text-white/70 cursor-not-allowed" />
                  </div>
                  {isLoading && <div className="text-xs text-[#9BE4A0] mt-1">Getting quote...</div>}
                </div>

                {/* Swap Details */}
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
                        <span className="text-white">${(poolInfo.liquidity / 1e8).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Quote Source</span>
                      <span className={`text-sm ${swapQuote.source === "pool" ? "text-green-400" : "text-yellow-400"}`}>{swapQuote.source === "pool" ? "Liquidity Pool" : "Market Price"}</span>
                    </div>
                  </div>
                )}

                {/* Authentication Warning */}
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

                {/* Error Display */}
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 py-3 rounded-lg border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="flex-1 py-3 rounded-lg bg-[#9BE4A0] text-black font-medium hover:bg-[#8BD490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSwap} disabled={isSwapDisabled()}>
                    {isSwapping ? "Swapping..." : "Swap"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full px-2 sm:px-3 pb-2">
              <div className="text-xs text-[#B0B6BE] text-center">Powered by ICP Swap</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
