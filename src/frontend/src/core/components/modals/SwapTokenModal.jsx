import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpDown, ChevronDown, AlertTriangle, Info } from "lucide-react";

import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { swapService, isSwapPairSupported } from "@/core/services/swap/swapService.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";

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
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);

  const availableTokens = useMemo(() => {
    const supportedTokens = swapService.getSupportedTokens();
    return TOKENS_CONFIG.filter((token) => supportedTokens.includes(token.symbol) && token.chain === "Internet Computer");
  }, []);

  const getAvailableToTokens = (selectedFromToken) => {
    if (!selectedFromToken) return availableTokens;
    return availableTokens.filter((token) => {
      if (token.symbol === selectedFromToken.symbol) return false;
      return isSwapPairSupported(selectedFromToken.symbol, token.symbol);
    });
  };

  useEffect(() => {
    const ensureSwapServiceIdentity = async () => {
      // Only initialize swapService when modal is open and user is authenticated
      if (isOpen && isAuthenticated && identity) {
        try {
          console.log("🔄 Initializing swap service for swap modal...");

          // Initialize swapService with identity
          await swapService.reinitializeAgent(identity);

          // Verify initialization
          const storedIdentity = swapService.getIdentity?.();
          const principal = storedIdentity?.getPrincipal()?.toString();

          if (principal) {
            console.log("✅ Swap service initialized for modal:", principal);
          } else {
            console.error("❌ Failed to initialize swap service identity");
            setError("Failed to initialize swap service. Please try again.");
          }
        } catch (error) {
          console.error("❌ Failed to initialize swap service:", error);
          setError("Failed to initialize swap service. Please try again.");
        }
      }
    };

    ensureSwapServiceIdentity();
  }, [isOpen, isAuthenticated, identity]);

  useEffect(() => {
    if (availableTokens.length > 0 && !fromToken) {
      const icpToken = availableTokens.find((token) => token.symbol === "ICP");
      setFromToken(icpToken || availableTokens[0]);
    }

    if (availableTokens.length > 0 && !toToken && fromToken) {
      const availableToTokens = getAvailableToTokens(fromToken);
      const kongToken = availableToTokens.find((token) => token.symbol === "KONG");
      setToToken(kongToken || availableToTokens[0]);
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

  const calculateTotalCost = () => {
    if (!fromToken || !fromAmount) return null;

    const swapAmount = parseFloat(fromAmount);

    // Get dynamic fee from swapService
    const tokenCanisterId = fromToken.symbol === "ICP" ? "ryjl3-tyaaa-aaaaa-aaaba-cai" : "o7oak-iyaaa-aaaaq-aadzq-cai";

    const transferFee = swapService.getTokenTransferFee?.(tokenCanisterId) || BigInt(10000);
    const feeInTokens = Number(transferFee) / 100000000; // Convert to token units

    return {
      swapAmount,
      poolFee: feeInTokens,
      approveTxFee: feeInTokens,
      depositTxFee: feeInTokens,
      totalCost: swapAmount + feeInTokens * 3, // 3 fees total
      breakdown: {
        swap: swapAmount,
        poolFee: feeInTokens,
        txFees: feeInTokens * 2,
      },
    };
  };

  const totalCost = calculateTotalCost();

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
    const availableToTokens = getAvailableToTokens(token);
    if (!availableToTokens.find((t) => t.symbol === toToken?.symbol)) {
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

    const userBalance = parseFloat(getBalanceForToken(fromToken));
    if (!totalCost) {
      setError("Unable to calculate total cost");
      return;
    }

    if (userBalance < totalCost.totalCost) {
      setError(`Insufficient balance. You have ${userBalance.toFixed(6)} ${fromToken.symbol}, but need ${totalCost.totalCost.toFixed(6)} (including ${totalCost.poolFee.toFixed(6)} pool fee + ${totalCost.txFees.toFixed(6)} transaction fees)`);
      return;
    }

    try {
      setIsSwapping(true);
      setError(null);

      const result = await swapService.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: parseFloat(fromAmount),
        minAmountOut: swapQuote.minAmountOut,
        userPrincipal: principal,
      });

      if (result.success) {
        // Trigger balance refresh using the correct event name
        window.dispatchEvent(new CustomEvent("balance-updated"));

        alert(`Swap successful! You received ${result.amountOut.toFixed(6)} ${toToken.symbol}`);

        // Close modal after a short delay to allow balance refresh
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (result.recovered) {
        alert(result.message);
        window.dispatchEvent(new CustomEvent("balance-updated"));
        onClose();
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
    setShowFeeBreakdown(false);

    // Clean up swapService when modal is closed
    try {
      if (swapService && swapService._identity) {
        console.log("🧹 Cleaning up swap service identity on modal close");
        // Reset identity to prevent unnecessary network calls
        swapService._identity = null;
      }
    } catch (error) {
      console.warn("Warning: Could not clean up swap service:", error);
    }

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

    if (totalCost) {
      const userBalance = parseFloat(getBalanceForToken(fromToken));
      if (userBalance < totalCost.totalCost) return true;
    }

    return false;
  };

  const isAmountTooSmall = () => {
    if (!fromToken || !fromAmount) return false;
    const amount = parseFloat(fromAmount);
    const minViable = fromToken.symbol === "ICP" ? 0.001 : 0.00001;
    return amount > 0 && amount < minViable;
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

            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="space-y-4">
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
                          <DropdownMenuItem key={token.id} onClick={() => handleFromTokenChange(token)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3">
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

                    <input type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="w-24 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-[#B0B6BE] focus:outline-none focus:ring-2 focus:ring-[#9BE4A0]" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-white/60">
                      Balance: {getBalanceForToken(fromToken)} {fromToken?.symbol}
                    </div>
                    {fromToken && totalCost && (
                      <button onClick={() => setShowFeeBreakdown(!showFeeBreakdown)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {showFeeBreakdown ? "Hide" : "Show"} fees
                      </button>
                    )}
                  </div>

                  {showFeeBreakdown && totalCost && (
                    <div className="mt-2 p-3 bg-[#23272F] border border-[#393E4B] rounded-lg space-y-1">
                      <div className="text-xs font-medium text-white/80 mb-2">Total Cost Breakdown:</div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Swap Amount</span>
                        <span className="text-white">
                          {totalCost.swapAmount.toFixed(6)} {fromToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Pool Fee</span>
                        <span className="text-white">
                          {totalCost.poolFee.toFixed(6)} {fromToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Transaction Fees (×2)</span>
                        <span className="text-white">
                          {totalCost.txFees.toFixed(6)} {fromToken.symbol}
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-xs font-medium">
                        <span className="text-white">Total Required</span>
                        <span className="text-white">
                          {totalCost.totalCost.toFixed(6)} {fromToken.symbol}
                        </span>
                      </div>
                    </div>
                  )}

                  {isAmountTooSmall() && (
                    <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">
                      ⚠️ Amount is very small. Recommended minimum: {fromToken.symbol === "ICP" ? "0.001" : "0.00001"} {fromToken.symbol}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pr-8">
                  <button onClick={handleSwapTokens} className="p-4 rounded-full bg-[#23272F] border border-[#393E4B] hover:bg-[#393E4B] transition-colors" disabled={!fromToken || !toToken}>
                    <ArrowUpDown className="w-5 h-5 text-white/90" />
                  </button>
                </div>

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
                          <DropdownMenuItem key={token.id} onClick={() => handleToTokenChange(token)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3">
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

                    <input type="text" placeholder="0.0" value={isLoading ? "Loading..." : toAmount || "0"} readOnly className="w-24 px-4 py-3 bg-[#FFFFFF08] border border-white/10 rounded-xl text-white/70 cursor-not-allowed" />
                  </div>
                </div>

                {swapQuote && !error && (
                  <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium text-sm mb-3">Swap Details</h4>

                    {!swapQuote.hasLiquidity && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 mb-3">
                        <p className="text-orange-400 text-xs">⚠️ This pool has no liquidity. Quote shown is based on initial pool price. Swap execution will fail until liquidity is added.</p>
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
                      <span className={`text-sm ${swapQuote.hasLiquidity ? "text-green-400" : "text-orange-400"}`}>{swapQuote.hasLiquidity ? "✓ Has Liquidity" : "⚠ No Liquidity"}</span>
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">Please connect your wallet to perform swaps</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 py-3 rounded-lg border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="flex-1 py-3 rounded-lg bg-[#9BE4A0] text-black font-medium hover:bg-[#8BD490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSwap} disabled={isSwapDisabled() || !swapQuote?.hasLiquidity}>
                    {isSwapping ? "Swapping..." : swapQuote?.hasLiquidity ? "Swap" : "No Liquidity"}
                  </button>
                </div>
              </div>
            </div>

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
