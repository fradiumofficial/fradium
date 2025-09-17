import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { getChainExplorer, getExplorerUrl } from "@/core/lib/chainExplorers.js";

export default function SendConfirmationModal({ isOpen, onClose, onConfirm, onBack, selectedToken, destination, amount, usdValue, analysisResult, isConfirming = false }) {
  if (!isOpen) return null;

  const network = analysisResult?.network || "Bitcoin";
  const explorer = getChainExplorer(network);
  const explorerUrl = getExplorerUrl(network, destination);

  // Calculate fee info (you can customize this based on your fee calculation logic)
  const getFeeInfo = () => {
    if (!selectedToken) return "Network fee will be calculated";

    switch (selectedToken.chain.toLowerCase()) {
      case "bitcoin":
        return "~0.00001 BTC (estimated)";
      case "ethereum":
        return "~0.001 ETH (estimated)";
      case "solana":
        return "~0.000005 SOL (estimated)";
      default:
        return "Network fee will be calculated";
    }
  };

  const feeInfo = getFeeInfo();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-md p-4">
      <motion.div className="relative w-full max-w-[480px] bg-[#171A1C] rounded-[24px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
        <div className="pointer-events-none absolute -inset-x-8 -top-8 h-20 bg-[#A6F3AE]/10 blur-3xl opacity-25 rounded-full" />
        <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-5 sm:p-6">
          <div className="text-white text-[16px] pl-4 sm:text-[16px] font-medium leading-tight mb-6">Confirm Transaction</div>
          {/* Token Info */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="rounded-[20px] bg-white/[0.03] border border-white/5 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <img src={`/${selectedToken?.imageUrl}`} alt={selectedToken?.name} className="w-10 h-10" />
                <div className="flex-1">
                  <div className="text-white font-medium">{selectedToken?.name}</div>
                  <div className="text-[#B0B6BE] text-sm">
                    {selectedToken?.symbol} • {selectedToken?.chain}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction Details */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="rounded-[20px] bg-white/[0.03] border border-white/5 p-4 sm:p-5">
              <div className="space-y-5">
                {/* Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm font-medium">Amount</span>
                  <div className="text-right">
                    <div className="text-white font-mono text-sm">
                      {amount} {selectedToken?.symbol}
                    </div>
                    {usdValue > 0 && <div className="text-[#B0B6BE] text-xs">≈ ${usdValue.toFixed(2)}</div>}
                  </div>
                </div>

                {/* Destination */}
                <div className="flex justify-between items-start">
                  <span className="text-white/90 text-sm font-medium">To</span>
                  <div className="text-right flex-1 ml-4">
                    <div className="text-white font-mono text-sm break-all">{destination}</div>
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[#9BE4A0] text-xs hover:underline inline-block mt-1">
                        View on {explorer.name}
                      </a>
                    )}
                  </div>
                </div>

                {/* Network Fee */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm font-medium">Network Fee</span>
                  <div className="text-white font-mono text-sm">{feeInfo}</div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">Total</span>
                    <div className="text-right">
                      <div className="text-white font-mono text-sm">
                        {amount} {selectedToken?.symbol}
                      </div>
                      {usdValue > 0 && <div className="text-[#B0B6BE] text-xs">≈ ${usdValue.toFixed(2)}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Analysis Result Summary */}
          {analysisResult && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className={`rounded-[20px] p-4 sm:p-5 border ${analysisResult.result?.isSafe ? "bg-[rgba(155,228,160,0.06)] border-[rgba(155,228,160,0.3)]" : "bg-[rgba(241,153,155,0.06)] border-[rgba(241,153,155,0.28)]"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${analysisResult.result?.isSafe ? "bg-[#9BE4A0]" : "bg-[#F1999B]"}`}></div>
                  <span className="text-white text-sm font-medium">Address Analysis: {analysisResult.result?.isSafe ? "SAFE" : "RISKY"}</span>
                </div>
                <div className={`text-xs ${analysisResult.result?.isSafe ? "text-[#B0B6BE]" : "text-[#F1999B]"}`}>
                  Confidence: {analysisResult.result?.confidence}% •{analysisResult.finalStatus === "safe_by_both" ? " AI & Community" : analysisResult.finalStatus === "unsafe_by_ai" ? " AI Analysis" : analysisResult.finalStatus === "unsafe_by_community" ? " Community" : " Community Analysis"}
                </div>
              </div>
            </motion.div>
          )}

          {/* Warning for risky addresses */}
          {analysisResult && !analysisResult.result?.isSafe && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className="rounded-[20px] p-4 sm:p-5 bg-[rgba(241,153,155,0.06)] border border-[rgba(241,153,155,0.28)]">
                <div className="text-[#F1999B] text-sm font-medium mb-1">⚠️ Warning</div>
                <div className="text-[#F1999B] text-xs">This address has been flagged as potentially risky. Please double-check the address before proceeding.</div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="mt-6">
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-full border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={onBack} disabled={isConfirming}>
                Back
              </button>
              <ButtonGreen fullWidth className="flex-1" onClick={onConfirm} disabled={isConfirming} size="md" textSize="text-base" fontWeight="medium">
                {isConfirming ? "Confirming..." : "Confirm Send"}
              </ButtonGreen>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
