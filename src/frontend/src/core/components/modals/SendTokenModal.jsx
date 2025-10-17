// React
import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Token utils
import { getSupportedTokensForAddress, getFeeInfo, sendTokenToBackend } from "@/core/lib/tokenUtils";

// Providers & Components
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import SendConfirmationModal from "@/core/components/modals/SendConfirmationModal.jsx";
import AnalyzeLoadingModal from "@/core/components/modals/AnalyzeLoadingModal.jsx";
import AnalyzeResultModal from "@/core/components/modals/AnalyzeResultModal.jsx";
import AIAnalyzeService from "@/core/services/ai/aiAnalyze.js";
import SuccesSendModal from "@/core/components/modals/SuccesSendModal.jsx";

const SendTokenModal = ({ isOpen, onClose }) => {
  const [destination, setDestination] = useState("");
  const [selectedToken, setSelectedToken] = useState(null);
  const [amount, setAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAnalyzeLoading, setShowAnalyzeLoading] = useState(false);
  const [showAnalyzeResult, setShowAnalyzeResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const { balances, balanceLoading, usdPrices, usdPriceLoading, refreshAllBalances } = useWallet();
  const { identity } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setDestination("");
      setSelectedToken(null);
      setAmount("");
      setShowConfirmation(false);
    }
    // stop camera if exists
    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch (_e) {}
  }, [isOpen]);

  // Disable page scroll when modal is open (match ReceiveAddressModal behavior)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  // Detect BarcodeDetector support (QR)
  useEffect(() => {
    let mounted = true;
    async function checkSupport() {
      try {
        if (window && window.BarcodeDetector) {
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          if (mounted) setScannerSupported(Array.isArray(formats) ? formats.includes("qr_code") : true);
        } else {
          if (mounted) setScannerSupported(false);
        }
      } catch (_e) {
        if (mounted) setScannerSupported(false);
      }
    }
    checkSupport();
    return () => {
      mounted = false;
    };
  }, []);

  // Start/stop scanner
  useEffect(() => {
    let detectInterval;
    async function start() {
      if (!showScanner) return;
      setScannerError("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = window && window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
        if (!detector) {
          setScannerError("Scanner tidak didukung di browser ini");
          return;
        }
        detectInterval = setInterval(async () => {
          try {
            const videoEl = videoRef.current;
            if (!videoEl) return;
            const codes = await detector.detect(videoEl);
            if (codes && codes.length > 0) {
              const value = codes[0]?.rawValue || "";
              if (value) {
                setDestination(value.trim());
                setShowScanner(false);
              }
            }
          } catch (_e) {}
        }, 350);
      } catch (_err) {
        setScannerError("Gagal mengakses kamera. Izinkan akses kamera.");
      }
    }
    start();
    return () => {
      if (detectInterval) clearInterval(detectInterval);
      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
      } catch (_e) {}
    };
  }, [showScanner]);

  const supportedTokens = useMemo(() => {
    if (!destination.trim()) return [];
    const principal = identity?.getPrincipal?.();
    return getSupportedTokensForAddress(destination.trim(), principal);
  }, [destination, identity]);

  const currentBalance = useMemo(() => {
    if (!selectedToken) return 0;
    return parseFloat(balances[selectedToken.id] || 0);
  }, [selectedToken, balances]);

  const isBalanceLoading = useMemo(() => {
    if (!selectedToken) return false;
    return balanceLoading[selectedToken.id] || false;
  }, [selectedToken, balanceLoading]);

  const currentUsdPrice = useMemo(() => {
    if (!selectedToken) return 0;
    return usdPrices[selectedToken.id] || 0;
  }, [selectedToken, usdPrices]);

  const isUsdPriceLoading = useMemo(() => {
    if (!selectedToken) return false;
    return usdPriceLoading[selectedToken.id] || false;
  }, [selectedToken, usdPriceLoading]);

  const amountUsdValue = useMemo(() => {
    if (!amount || !currentUsdPrice) return 0;
    const n = parseFloat(amount);
    if (isNaN(n)) return 0;
    return n * currentUsdPrice;
  }, [amount, currentUsdPrice]);

  // Handle Continue: analyze address first
  const handleContinue = async () => {
    if (!destination.trim() || !selectedToken || !amount || parseFloat(amount) <= 0) return;
    try {
      setShowAnalyzeLoading(true);
      setSendError("");
      const res = await AIAnalyzeService.analyzeAddress(destination.trim());
      setAnalysisResult(res);
      setShowAnalyzeLoading(false);
      setShowAnalyzeResult(true);
    } catch (err) {
      console.error("Analysis error:", err);
      setShowAnalyzeLoading(false);
      // Fallback ke confirmation jika analisis gagal
      setAnalysisResult(null);
      setShowConfirmation(true);
    }
  };

  // After user confirms from AnalyzeResultModal
  const handleAfterAnalyzeConfirm = () => {
    setShowAnalyzeResult(false);
    setShowConfirmation(true);
  };

  // Confirm send from confirmation modal
  const handleConfirmSend = async () => {
    if (!selectedToken) return;
    try {
      setIsSending(true);
      setSendError("");
      const principal = identity?.getPrincipal?.();
      const normalizedAmount = Number(amount);
      await sendTokenToBackend(selectedToken.id, destination.trim(), normalizedAmount, principal);
      // Tampilkan success segera dan tutup modal sebelumnya
      setShowConfirmation(false);
      setShowSuccess(true);
      setIsSending(false);
      // Refresh balance di background (tanpa await agar tidak menunda success)
      try {
        Promise.resolve(refreshAllBalances());
      } catch (_e) {}
    } catch (err) {
      console.error("Send error:", err);
      setIsSending(false);
      setSendError(err?.message || "Failed to send token");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  if (!isOpen) return null;

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
            <div className="w-full text-center text-white text-lg font-medium">Send to</div>

            <AnimatePresence mode="wait">
              {!selectedToken ? (
                <motion.div key="step-address" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-4 w-full">
                  {/* Destination Input */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="text-white/90 text-[13px] font-medium mb-2">Destination address</div>
                    <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <input ref={inputRef} type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter public address or name" className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none font-mono" />
                        <button type="button" className="grid place-items-center w-9 h-9 rounded-lg hover:bg-white/[0.06] disabled:opacity-50" aria-label="Scan" onClick={() => setShowScanner(true)} disabled={!scannerSupported} title={scannerSupported ? "Scan QR" : "Scan tidak didukung di browser ini"}>
                          <img src="/assets/icons/qr_code.svg" alt="Scan" className="w-5 h-5 opacity-80" />
                        </button>
                      </div>
                    </div>
                    {/* Animated helper hint */}
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="flex items-center gap-2 mt-3 text-xs text-[#B0B6BE]">
                      <motion.span animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="grid place-items-center w-5 h-5 rounded-full bg-white/5 border border-white/10" aria-hidden="true">
                        <svg className="w-3.5 h-3.5 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h3M7 4v3m10 10h3m-3 3v-3M4 17h3m0 3v-3M17 4v3m3 0h-3M9 12h6" />
                        </svg>
                      </motion.span>
                      <span>Tip: Paste address or tap scan to autofill</span>
                    </motion.div>
                  </motion.div>

                  {/* Supported tokens */}
                  {destination.trim() && (
                    <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                      <div className="text-[#B0B6BE] text-sm mb-2">Supported tokens</div>
                      <div className="flex flex-col gap-2">
                        {supportedTokens.length === 0 ? (
                          <div className="rounded-lg p-4 text-center bg-[#1D222B] border border-[#2F3541] text-[#B0B6BE] text-xs">No supported tokens detected for this address</div>
                        ) : (
                          supportedTokens.map((token) => (
                            <button key={token.id} className="flex items-center gap-3 bg-[#1D222B] hover:bg-[#242A34] border border-[#2F3541] rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 hover:border-[#9BE4A0]/30" onClick={() => setSelectedToken(token)}>
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
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="step-amount" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-4 w-full">
                  {/* Selected token card */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="flex items-center gap-3">
                      <img src={`/${selectedToken.imageUrl}`} alt={selectedToken.name} className="w-7 h-7" />
                      <div className="flex-1">
                        <div className="text-white font-medium">{selectedToken.name}</div>
                        <div className="text-[#B0B6BE] text-xs">
                          {selectedToken.symbol} • {selectedToken.chain}
                        </div>
                      </div>
                      <button className="text-xs text-[#9BEB83] hover:text-white px-3 py-1 border border-[#9BEB83]/30 rounded hover:bg-[#9BEB83]/10 transition-colors" onClick={() => setSelectedToken(null)}>
                        Change
                      </button>
                    </div>
                  </motion.div>

                  {/* Amount */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-white/90 text-[13px] font-medium">Amount</div>
                      <div className="text-[#B0B6BE] text-xs">{isBalanceLoading ? <span className="inline-block w-16 h-3 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></span> : `Balance: ${currentBalance.toFixed(6)} ${selectedToken?.symbol || ""}`}</div>
                    </div>
                    <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-transparent text-white text-sm outline-none font-mono" placeholder="0.00" />
                        {amount && (
                          <button type="button" className="text-xs font-medium text-[#9BEB83] hover:text-white transition-colors" onClick={() => setAmount("")}>
                            CLEAR
                          </button>
                        )}
                        <button type="button" className="text-xs font-medium text-[#9BE4A0] hover:text-white transition-colors px-2 py-1 border border-[#9BE4A0]/30 rounded-full hover:bg-[#9BE4A0]/10" onClick={() => currentBalance > 0 && setAmount(currentBalance.toString())} disabled={currentBalance <= 0}>
                          MAX
                        </button>
                      </div>
                    </div>
                    {amount && (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[#B0B6BE] text-xs">USD Value:</span>
                        {isUsdPriceLoading ? <span className="inline-block w-12 h-3 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></span> : <span className="text-[#9BE4A0] text-xs font-mono">${amountUsdValue.toFixed(2)}</span>}
                      </div>
                    )}
                  </motion.div>

                  {/* Fee */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-white text-sm font-medium">Network Fee</span>
                    </div>
                    <div className="text-[#B0B6BE] text-xs">{getFeeInfo(selectedToken)}</div>
                  </motion.div>

                  {/* Continue */}
                  <motion.div variants={itemVariants} className="w-full px-2 sm:px-3 pb-2">
                    <ButtonGreen fullWidth disabled={!destination.trim() || !selectedToken || !amount || parseFloat(amount) <= 0} fontWeight="semibold" onClick={handleContinue}>
                      Continue
                    </ButtonGreen>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Loading */}
            <AnalyzeLoadingModal isOpen={showAnalyzeLoading} onCancel={() => setShowAnalyzeLoading(false)} />

            {/* Analyze Result (variant send) */}
            <AnalyzeResultModal isOpen={showAnalyzeResult} onClose={() => setShowAnalyzeResult(false)} analysisResult={analysisResult} variant="send" onCancel={() => setShowAnalyzeResult(false)} onConfirm={handleAfterAnalyzeConfirm} />

            {/* Confirmation */}
            <SendConfirmationModal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} onConfirm={handleConfirmSend} onBack={() => setShowConfirmation(false)} selectedToken={selectedToken} destination={destination} amount={amount} usdValue={amountUsdValue} analysisResult={analysisResult} isConfirming={isSending} />

            {sendError && <div className="w-full px-4 text-center text-red-400 text-xs">{sendError}</div>}

            {/* Success Modal */}
            <SuccesSendModal
              isOpen={showSuccess}
              onClose={() => {
                setShowSuccess(false);
                onClose?.();
              }}
            />

            {/* Scanner Overlay */}
            <AnimatePresence>
              {showScanner && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#0F1214] overflow-hidden">
                    <div className="absolute top-3 right-3 z-10">
                      <button className="text-white/80 hover:text-white" onClick={() => setShowScanner(false)} aria-label="Close scanner">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 pb-2 text-center text-white text-sm">Scan QR Address</div>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                      {/* Corner guides */}
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-8 border-2 border-[#9BE4A0]/70 rounded-xl animate-pulse"></div>
                        {/* Corner indicators */}
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-[#9BE4A0] rounded-tl-lg"></div>
                        <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-[#9BE4A0] rounded-tr-lg"></div>
                        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-[#9BE4A0] rounded-bl-lg"></div>
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-[#9BE4A0] rounded-br-lg"></div>
                      </div>
                      {/* Camera preview overlay */}
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1 text-white text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>LIVE</span>
                        </div>
                      </div>
                    </div>
                    {scannerError && <div className="p-3 text-center text-xs text-red-400">{scannerError}</div>}
                    <div className="p-3">
                      <ButtonGreen fullWidth onClick={() => setShowScanner(false)} size="md" textSize="text-base" fontWeight="medium">
                        Cancel
                      </ButtonGreen>
                    </div>
                  </div>
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

export default SendTokenModal;
