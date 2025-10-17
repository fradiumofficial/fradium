import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpDown, ChevronDown, AlertTriangle } from "lucide-react";

import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { swapService, isSwapPairSupported } from "@/core/services/swap/swapService.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";

if (typeof window !== 'undefined') {
  window.swapService = swapService;
}

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

  // Only show tokens that have swap pairs
  const availableTokens = useMemo(() => {
    return TOKENS_CONFIG.filter((token) => 
      ["FRADIUM", "ckBTC", "ckETH"].includes(token.symbol) &&
      token.type === "icrc" && 
      token.chain === "Internet Computer"
    );
  }, []);

  // Get available TO tokens based on FROM token selection
  const getAvailableToTokens = (selectedFromToken) => {
    if (!selectedFromToken) return availableTokens;
    
    return availableTokens.filter(token => {
      if (token.symbol === selectedFromToken.symbol) return false;
      return isSwapPairSupported(selectedFromToken.symbol, token.symbol);
    });
  };

  useEffect(() => {
    if (availableTokens.length > 0 && !fromToken) {
      const fradiumToken = availableTokens.find((token) => token.symbol === "FRADIUM");
      setFromToken(fradiumToken || availableTokens[0]);
    }

    if (availableTokens.length > 0 && !toToken && fromToken) {
      const availableToTokens = getAvailableToTokens(fromToken);
      const ckBTCToken = availableToTokens.find((token) => token.symbol === "ckBTC");
      setToToken(ckBTCToken || availableToTokens[0]);
    }
  }, [availableTokens, fromToken]);

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

      const quote = await swapService.getSwapQuote({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: parseFloat(fromAmount),
      });

      setSwapQuote(quote);
      setToAmount(quote.estimatedOutput.toFixed(6));
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
      setFromAmount("");
      setToAmount("");
      setSwapQuote(null);
      setError(null);
    }
  };

  const handleFromTokenChange = (token) => {
    setFromToken(token);
    
    // Check if current toToken is still valid
    const availableToTokens = getAvailableToTokens(token);
    if (!availableToTokens.find(t => t.symbol === toToken?.symbol)) {
      setToToken(availableToTokens[0] || null);
    }
    
    setFromAmount("");
    setToAmount("");
    setSwapQuote(null);
    setError(null);
  };

  const handleToTokenChange = (token) => {
    setToToken(token);
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

      const result = await swapService.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: swapAmount,
        minAmountOut: swapQuote.minAmountOut,
        userPrincipal: principal,
      });

      if (result.success) {
        const outputAmount = swapService.fromSmallestUnit(result.amountOut, toToken.symbol);
        onClose();
        window.dispatchEvent(new CustomEvent("refreshBalances"));
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
    setIsLoading(false);
    setIsSwapping(false);
    onClose();
  };

  const getBalanceForToken = (token) => {
    if (!token) return "0";
    const balance = balances[token.id] || "0";
    return parseFloat(balance).toFixed(6);
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
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={handleClose}>
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center p-4 gap-4">
            <div className="w-full text-center text-white text-lg font-medium">Swap Tokens</div>

            {/* Liquidity Warning Banner */}
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <strong>Demo Mode:</strong> Pools are deployed on ICPSwap mainnet but currently have no liquidity. 
                  Swap quotes are calculated but cannot be executed until liquidity is added.
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="space-y-4">
                {/* From Token */}
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
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]">
                        {availableTokens.map((token) => (
                          <DropdownMenuItem 
                            key={token.id} 
                            onClick={() => handleFromTokenChange(token)} 
                            className="text-white hover:bg-white/5 cursor-pointer px-4 py-3"
                          >
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

                    <input 
                      type="number" 
                      placeholder="0.0" 
                      value={fromAmount} 
                      onChange={(e) => setFromAmount(e.target.value)} 
                      className="w-24 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-[#B0B6BE] focus:outline-none focus:ring-2 focus:ring-[#9BE4A0]"
                    />
                  </div>
                  {fromToken && (
                    <div className="text-xs text-white/60 mt-1">
                      Balance: {getBalanceForToken(fromToken)} {fromToken.symbol}
                    </div>
                  )}
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-end pr-8">
                  <button 
                    onClick={handleSwapTokens} 
                    className="p-4 rounded-full bg-[#23272F] border border-[#393E4B] hover:bg-[#393E4B] transition-colors"
                    disabled={!fromToken || !toToken}
                  >
                    <ArrowUpDown className="w-5 h-5 text-white/90" />
                  </button>
                </div>

                {/* To Token */}
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
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]">
                        {getAvailableToTokens(fromToken).map((token) => (
                          <DropdownMenuItem 
                            key={token.id} 
                            onClick={() => handleToTokenChange(token)} 
                            className="text-white hover:bg-white/5 cursor-pointer px-4 py-3"
                          >
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

                    <input 
                      type="text" 
                      placeholder="0.0" 
                      value={isLoading ? "Loading..." : toAmount || "0"} 
                      readOnly 
                      className="w-24 px-4 py-3 bg-[#FFFFFF08] border border-white/10 rounded-xl text-white/70 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Swap Details */}
                {swapQuote && !error && (
                  <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium text-sm mb-3">Swap Details</h4>
                    
                    {!swapQuote.hasLiquidity && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 mb-3">
                        <p className="text-orange-400 text-xs">
                          ⚠️ This pool has no liquidity. Quote shown is based on initial pool price. Swap execution will fail until liquidity is added.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Rate</span>
                      <span className="text-white">
                        1 {fromToken.symbol} = {swapQuote.rate.toFixed(6)} {toToken.symbol}
                      </span>
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

                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Pool Status</span>
                      <span className={`text-sm ${swapQuote.hasLiquidity ? 'text-green-400' : 'text-orange-400'}`}>
                        {swapQuote.hasLiquidity ? '✓ Has Liquidity' : '⚠ No Liquidity'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Auth Warning */}
                {!isAuthenticated && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      Please connect your wallet to perform swaps
                    </p>
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
                    disabled={isSwapDisabled() || !swapQuote?.hasLiquidity}
                  >
                    {isSwapping ? "Swapping..." : swapQuote?.hasLiquidity ? "Swap" : "No Liquidity"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full px-2 pb-2">
              <div className="text-xs text-[#B0B6BE] text-center">
                Powered by ICPSwap • Pools: {fromToken?.symbol}/{toToken?.symbol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}