// React
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Token Configuration
import { TOKENS_CONFIG, getSupportedTokensForAddress, getFeeInfo, detectAddressNetwork } from "@/core/lib/tokenUtils";

// Wallet Provider
import { useWallet } from "@/core/providers/WalletProvider";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import AnalyzeResultModal from "@/core/components/modals/AnalyzeResultModal.jsx";
import AnalyzeLoadingModal from "@/core/components/modals/AnalyzeLoadingModal.jsx";
import SuccesSendModal from "@/core/components/modals/SuccesSendModal.jsx";

const SendTokenModal = ({ isOpen, onClose }) => {
  const [destination, setDestination] = useState("");
  const [selectedToken, setSelectedToken] = useState(null);
  const [amount, setAmount] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessSend, setShowSuccessSend] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Wallet Provider for balance and USD prices
  const { balances, usdPrices, balanceLoading, usdPriceLoading } = useWallet();

  // Reset state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setDestination("");
      setSelectedToken(null);
      setAmount("");
      setAnalysisResult(null);
      setShowResultModal(false);
      setShowLoadingModal(false);
      setShowSuccessSend(false);
    }
  }, [isOpen]);

  // Auto focus input when modal opens
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const supportedTokens = useMemo(() => {
    if (!destination.trim()) return [];
    return getSupportedTokensForAddress(destination.trim());
  }, [destination]);

  const detectedNetwork = useMemo(() => {
    if (!destination.trim()) return null;
    return detectAddressNetwork(destination.trim());
  }, [destination]);

  const isNetworkKnown = useMemo(() => {
    if (!destination.trim()) return false;
    return detectedNetwork && detectedNetwork !== "Unknown";
  }, [destination, detectedNetwork]);

  // Get current balance and USD price for selected token
  const currentBalance = useMemo(() => {
    if (!selectedToken) return 0;
    return parseFloat(balances[selectedToken.id] || 0);
  }, [selectedToken, balances]);

  const currentUsdPrice = useMemo(() => {
    if (!selectedToken) return 0;
    return usdPrices[selectedToken.id] || 0;
  }, [selectedToken, usdPrices]);

  const isBalanceLoading = useMemo(() => {
    if (!selectedToken) return false;
    return balanceLoading[selectedToken.id] || false;
  }, [selectedToken, balanceLoading]);

  const isUsdPriceLoading = useMemo(() => {
    if (!selectedToken) return false;
    return usdPriceLoading[selectedToken.id] || false;
  }, [selectedToken, usdPriceLoading]);

  // Calculate USD value of entered amount
  const amountUsdValue = useMemo(() => {
    if (!amount || !currentUsdPrice) return 0;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    return numericAmount * currentUsdPrice;
  }, [amount, currentUsdPrice]);

  // Validation states
  const isAmountEmpty = !amount || amount.trim() === "";
  const isAmountExceedsBalance = amount && parseFloat(amount) > currentBalance;
  const isAmountInvalid = amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0);

  // Button state and label
  const getButtonState = () => {
    if (isAmountEmpty) {
      return { disabled: true, label: "Enter amount to continue" };
    }
    if (isAmountInvalid) {
      return { disabled: true, label: "Enter valid amount" };
    }
    if (isAmountExceedsBalance) {
      return { disabled: true, label: "Amount exceeds your balance" };
    }
    return { disabled: false, label: "Analyze Destination Address" };
  };

  const buttonState = getButtonState();

  const handleAnalyzeClick = async () => {
    if (buttonState.disabled) return;
    if (!destination.trim()) return;

    setShowLoadingModal(true);

    try {
      // Import AI Analyze Service
      const { default: AIAnalyzeService } = await import("@/core/services/ai/aiAnalyze.js");

      // Perform analysis
      const result = await AIAnalyzeService.analyzeAddress(destination);

      // Store the result
      setAnalysisResult(result);

      // Show result modal after 1 second delay
      setTimeout(() => {
        setShowLoadingModal(false);
        setShowResultModal(true);
      }, 1000);
    } catch (error) {
      console.error("Analysis failed:", error);
      setShowLoadingModal(false);
      // You could show an error message here
    }
  };

  // Handle Max button click
  const handleMaxClick = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance.toString());
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-start bg-black/70 backdrop-blur-sm pt-16 pl-4 pr-4">
      <div className="bg-[#23272F] px-6 py-8 w-full max-w-md rounded-lg shadow-lg relative flex flex-col gap-6 mx-auto">
        <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="text-white text-xl font-semibold mb-2">Send Token</div>

        <AnimatePresence mode="wait">
          {!selectedToken ? (
            // Step 1: Destination Address
            <motion.div key="step1" className="flex flex-col gap-4" initial="hidden" animate="visible" variants={containerVariants}>
              {/* Empty State - First Time Opening */}
              {!destination.trim() && (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-12 px-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                      delay: 0.2,
                    }}
                    className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#9BE4A0] to-[#7C72FE] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-[#9BE4A0] rounded-full flex items-center justify-center"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </motion.div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="text-center">
                    <h3 className="text-white text-lg font-semibold mb-2">Send Tokens</h3>
                    <p className="text-[#B0B6BE] text-sm mb-4 max-w-xs">Paste the destination address below to see supported tokens and start your transfer</p>
                  </motion.div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <div className="text-[#B0B6BE] text-sm mb-1">Destination address</div>
                <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4">
                  <input ref={inputRef} type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Paste destination address" className="w-full bg-transparent text-[#B0B6BE] text-sm outline-none font-mono" />
                </div>
              </motion.div>

              {/* Network Detection Info */}
              {destination.trim() && detectedNetwork && (
                <motion.div variants={itemVariants} className={`rounded-lg p-4 border ${isNetworkKnown ? "bg-[rgba(155,228,160,0.06)] border-[rgba(155,228,160,0.3)]" : "bg-[rgba(241,153,155,0.06)] border-[rgba(241,153,155,0.28)]"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isNetworkKnown ? "bg-[#9BE4A0]" : "bg-[#F1999B]"}`}></div>
                    <span className="text-white text-sm font-medium">Network Detected</span>
                  </div>
                  <div className={`text-xs ${isNetworkKnown ? "text-[#B0B6BE]" : "text-[#F1999B]"}`}>{detectedNetwork === "Unknown" ? "Unable to identify network type. Please check the address format." : `This address belongs to the ${detectedNetwork} network.`}</div>
                </motion.div>
              )}

              {/* Supported tokens list */}
              {destination.trim() && (
                <motion.div variants={itemVariants}>
                  <div className="text-[#B0B6BE] text-sm mb-2">Supported tokens for this address</div>
                  <div className="flex flex-col gap-2">
                    {supportedTokens.length === 0 ? (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-lg p-4 text-center border ${isNetworkKnown ? "bg-[#1D222B] border-[#2F3541]" : "bg-[rgba(241,153,155,0.06)] border-[rgba(241,153,155,0.28)]"}`}>
                        <div className={`text-xs mb-1 ${isNetworkKnown ? "text-[#B0B6BE]" : "text-[#F1999B]"}`}>No supported tokens detected</div>
                        <div className={`${isNetworkKnown ? "text-[#9BEB83]" : "text-[#F1999B]"} text-xs`}>{isNetworkKnown ? "This address format is not supported" : "Invalid or unsupported address format"}</div>
                      </motion.div>
                    ) : (
                      supportedTokens.map((token, index) => (
                        <motion.button key={token.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-3 bg-[#1D222B] hover:bg-[#242A34] border border-[#2F3541] rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 hover:border-[#9BE4A0]/30" onClick={() => setSelectedToken(token)}>
                          <img src={`/${token.imageUrl}`} alt={token.name} className="w-6 h-6" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{token.name}</div>
                            <div className="text-[#B0B6BE] text-xs">
                              {token.symbol} • {token.chain}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Step 2: Amount and Fee
            <motion.div key="step2" className="flex flex-col gap-4" initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="flex items-center gap-3 bg-[#1D222B] border border-[#2F3541] rounded-lg p-4">
                <img src={`/${selectedToken.imageUrl}`} alt={selectedToken.name} className="w-8 h-8" />
                <div className="flex-1">
                  <div className="text-white font-medium">{selectedToken.name}</div>
                  <div className="text-[#B0B6BE] text-xs">
                    {selectedToken.symbol} • {selectedToken.chain}
                  </div>
                </div>
                <button className="text-xs text-[#9BEB83] hover:text-white px-3 py-1 border border-[#9BEB83]/30 rounded hover:bg-[#9BEB83]/10 transition-colors" onClick={() => setSelectedToken(null)}>
                  Change
                </button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[#B0B6BE] text-sm">Amount</div>
                  <div className="text-[#B0B6BE] text-xs">{isBalanceLoading ? <span className="inline-block w-16 h-3 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></span> : `Balance: ${currentBalance.toFixed(6)} ${selectedToken?.symbol || ""}`}</div>
                </div>
                <div className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4">
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-[#B0B6BE] text-sm outline-none font-mono pr-20" placeholder="0.00" />
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {amount && (
                        <button type="button" className="text-xs font-medium text-[#9BEB83] hover:text-white transition-colors" onClick={() => setAmount("")}>
                          CLEAR
                        </button>
                      )}
                      <button type="button" className="text-xs font-medium text-[#9BE4A0] hover:text-white transition-colors px-2 py-1 border border-[#9BE4A0]/30 rounded hover:bg-[#9BE4A0]/10" onClick={handleMaxClick} disabled={currentBalance <= 0}>
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* USD Value Display */}
                  {amount && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 pt-2 border-t border-[#393E4B]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#B0B6BE] text-xs">USD Value:</span>
                        {isUsdPriceLoading ? <span className="inline-block w-12 h-3 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></span> : <span className="text-[#9BE4A0] text-xs font-mono">${amountUsdValue.toFixed(2)}</span>}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-[#1D222B] border border-[#2F3541] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Network Fee</span>
                </div>
                <div className="text-[#B0B6BE] text-xs">{getFeeInfo(selectedToken)}</div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <ButtonGreen fullWidth disabled={buttonState.disabled} fontWeight="semibold" onClick={handleAnalyzeClick}>
                  {buttonState.label}
                </ButtonGreen>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Analyze modals to mirror AnalyzeAddressPage */}
        <AnalyzeLoadingModal isOpen={showLoadingModal} onCancel={() => setShowLoadingModal(false)} />
        <AnalyzeResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          analysisResult={analysisResult}
          variant="send"
          onCancel={() => setShowResultModal(false)}
          onConfirm={() => {
            setShowResultModal(false);
            setShowSuccessSend(true);
          }}
        />
        <SuccesSendModal isOpen={showSuccessSend} onClose={() => setShowSuccessSend(false)} />
      </div>
    </div>,
    document.body
  );
};

export default SendTokenModal;
