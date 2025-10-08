// React
import React, { useState } from "react";
import { createPortal } from "react-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Components
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

// Helper function to get token info
function getTokenInfo(tokenType) {
  const tokenMap = {
    FRADIUM: { symbol: "FRADIUM", name: "Fradium", imageUrl: "/assets/images/coins/fradium.webp" },
    ICP: { symbol: "ICP", name: "Internet Computer", imageUrl: "/assets/images/coins/icp.webp" },
    ckBTC: { symbol: "ckBTC", name: "Chain Key Bitcoin", imageUrl: "/assets/images/coins/ckbtc.webp" },
    ckETH: { symbol: "ckETH", name: "Chain Key Ethereum", imageUrl: "/assets/images/coins/cketh.webp" },
    BTC: { symbol: "BTC", name: "Bitcoin", imageUrl: "/assets/images/coins/bitcoin.webp" },
    ETH: { symbol: "ETH", name: "Ethereum", imageUrl: "/assets/images/coins/ethereum.webp" },
    SOL: { symbol: "SOL", name: "Solana", imageUrl: "/assets/images/coins/solana.webp" },
  };

  return tokenMap[tokenType] || { symbol: tokenType, name: tokenType, imageUrl: "/assets/images/coins/bitcoin.webp" };
}

// Amount formatting helpers
const getDecimalsForToken = (symbol) => {
  switch (symbol) {
    case "ETH":
    case "ckETH":
      return 18;
    case "SOL":
      return 9;
    case "ICP":
    case "FRADIUM":
    case "BTC":
    case "ckBTC":
    default:
      return 8;
  }
};

const formatNatToDecimal = (nat, decimals) => {
  try {
    const n = BigInt(nat ?? 0);
    const d = Math.max(0, Number(decimals ?? 8));
    const base = BigInt(10) ** BigInt(d);
    const intPart = n / base;
    const fracPart = n % base;
    let fracStr = fracPart.toString().padStart(d, "0");
    fracStr = fracStr.replace(/0+$/, "");
    return fracStr.length ? `${intPart.toString()}.${fracStr}` : intPart.toString();
  } catch (_e) {
    return String(nat ?? 0);
  }
};

const formatEscrowAmount = (tokenSymbol, nat) => {
  const sym = tokenSymbol;
  const dec = getDecimalsForToken(sym);
  return `${formatNatToDecimal(nat, dec)} ${sym}`;
};

const JoinEscrowModal = ({ isOpen, onClose, escrow, onConfirm, isJoining }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen || !escrow) return null;

  const tokenFromSymbol = (escrow.token_from && Object.keys(escrow.token_from)[0]) || escrow._token_from;
  const tokenToSymbol = (escrow.token_to && Object.keys(escrow.token_to)[0]) || escrow._token_to;
  const tokenFromInfo = getTokenInfo(tokenFromSymbol);
  const tokenToInfo = getTokenInfo(tokenToSymbol);

  const handleConfirm = () => {
    setShowConfirmation(true);
    onConfirm();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10">
          {/* Close */}
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex flex-col items-center p-4 gap-4 h-auto">
            <div className="w-full text-center text-white text-lg font-medium">Join Trade</div>

            <AnimatePresence mode="wait">
              {!showConfirmation ? (
                <motion.div key="confirmation" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-4 w-full">
                  {/* Trade Summary */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="text-white/90 text-[13px] font-medium mb-3">Trade Details</div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</span>
                      </div>
                      <div className="text-white/50">→</div>
                      <div className="flex items-center gap-2">
                        <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</span>
                      </div>
                    </div>
                    <div className="text-[#B0B6BE] text-xs">
                      Escrow ID: <span className="text-white font-mono">{escrow.escrow_id.toString()}</span>
                    </div>
                  </motion.div>

                  {/* What you'll receive */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="text-white/90 text-[13px] font-medium mb-2">You'll Receive</div>
                    <div className="flex items-center gap-2">
                      <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-5 h-5 rounded-full" />
                      <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                    </div>
                    <div className="text-[#B0B6BE] text-xs mt-1">This amount will be transferred to your wallet</div>
                  </motion.div>

                  {/* What you'll send */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="text-white/90 text-[13px] font-medium mb-2">You'll Send</div>
                    <div className="flex items-center gap-2">
                      <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-5 h-5 rounded-full" />
                      <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                    </div>
                    <div className="text-[#B0B6BE] text-xs mt-1">This amount will be transferred from your wallet</div>
                  </motion.div>

                  {/* Important Notice */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-orange-500/10 border border-orange-500/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-orange-400 text-sm font-medium mb-2">Important Notice</h4>
                        <div className="text-orange-300/90 text-xs space-y-1">
                          <p>
                            • You will send <strong>{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</strong> to the trader
                          </p>
                          <p>
                            • You will receive <strong>{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</strong> from the trader
                          </p>
                          <p>• A small FRADIUM fee will be charged for the transaction</p>
                          <p>• This action cannot be undone</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div variants={itemVariants} className="w-full px-2 sm:px-3 pb-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={onClose} className="py-2.5 rounded-full border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors">
                        Cancel
                      </button>
                      <ButtonGreen fullWidth onClick={handleConfirm} disabled={isJoining} size="md" textSize="text-base" fontWeight="medium">
                        {isJoining ? "Joining..." : "Join Trade"}
                      </ButtonGreen>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="loading" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-4 w-full">
                  {/* Loading State */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#9BE4A0]/30 border-t-[#9BE4A0] rounded-full animate-spin"></div>
                    <div className="text-white text-lg font-medium mb-2">Joining Trade...</div>
                    <div className="text-[#B0B6BE] text-sm">Please wait while we process your request</div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JoinEscrowModal;
