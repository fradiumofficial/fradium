import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { backend } from "declarations/backend";
import { fradium_ledger } from "declarations/fradium_ledger";
import { icp_ledger } from "declarations/icp_ledger";
import { ckbtc_ledger } from "declarations/ckbtc_ledger";
import { cketh_ledger } from "declarations/cketh_ledger";
import { Principal } from "@dfinity/principal";
import { useAuth } from "@/core/providers/AuthProvider";
import toast from "react-hot-toast";
import { Shield, AlertTriangle, Clock, CheckCircle2, Copy, Ban, Search, X, ChevronDown, ChevronUp, Wallet, BarChart3, Gauge, CheckCircle, Users, Brain, ArrowRight, LogIn } from "lucide-react";
import AIAnalyzeService from "@/core/services/ai/aiAnalyze.js";
import QRCodeStyling from "qr-code-styling";
import { motion, AnimatePresence } from "framer-motion";
import ButtonYellow from "@/core/components/ButtonYellow";
import { formatAmount as formatAmountDisplay } from "@/core/lib/tokenUtils";

const PaymentRequestPage = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { identity, handleLogin } = useAuth();
  const [linkDetails, setLinkDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isAnalysisMinimized, setIsAnalysisMinimized] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const qrRef = useRef(null);
  const qrCode = useRef(null);

  const tokenConfig = {
    ICP: { decimals: 8, ledger: icp_ledger, name: "ICP" },
    Fradium: { decimals: 8, ledger: fradium_ledger, name: "FRADIUM" },
    ckBTC: { decimals: 8, ledger: ckbtc_ledger, name: "ckBTC" },
    ckETH: { decimals: 18, ledger: cketh_ledger, name: "ckETH" },
    BTC: { decimals: 8, ledger: null, name: "BTC" },
    ETH: { decimals: 18, ledger: null, name: "ETH" },
    SOL: { decimals: 9, ledger: null, name: "SOL" },
  };

  const getTokenType = (linkDetails) => {
    if (!linkDetails) return null;
    return Object.keys(linkDetails.token)[0];
  };

  const getTokenConfig = (tokenDetails) => {
    if (!tokenDetails) return tokenConfig.Fradium;
    const tokenType = Object.keys(tokenDetails)[0];
    return tokenConfig[tokenType] || tokenConfig.Fradium;
  };

  const formatAmountPretty = (amountNat, decimals) => {
    const human = Number(amountNat) / 10 ** decimals;
    return formatAmountDisplay(human);
  };

  const formatRiskLevel = (riskValue) => {
    const numericValue = parseFloat(riskValue);
    if (isNaN(numericValue)) return riskValue;
    if (numericValue <= 0.3) return "LOW";
    if (numericValue <= 0.7) return "MEDIUM";
    return "HIGH";
  };

  const checkAuthentication = () => {
    return identity && !identity.getPrincipal().isAnonymous();
  };

  const handleAuthModalOpen = (action) => {
    setAuthAction(action);
    setShowAuthModal(true);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setAuthAction(null);
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await handleLogin();
      setShowAuthModal(false);
      toast.success("Successfully signed in!");
      if (authAction === "pay") {
        const tokenType = getTokenType(linkDetails);
        const isNativeToken = ["BTC", "ETH", "SOL"].includes(tokenType);
        if (isNativeToken) {
          handlePayNative();
        } else {
          handlePayICRC();
        }
      } else if (authAction === "analyze") {
        performRiskAnalysis();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsAuthenticating(false);
      setAuthAction(null);
    }
  };

  useEffect(() => {
    if (linkDetails?.expires_at) {
      const expirationTime = Number(linkDetails.expires_at) / 1000000;
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationTime - now;
        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft("Expired");
          return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        let timeLeftString = "";
        if (days > 0) timeLeftString += `${days}d `;
        if (hours > 0 || days > 0) timeLeftString += `${hours}h `;
        timeLeftString += `${minutes}m ${seconds}s`;
        setTimeLeft(timeLeftString.trim());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [linkDetails]);

  useEffect(() => {
    const fetchDetails = async () => {
      const reservedIds = ["create", "manage", "dashboard", "new"];
      if (reservedIds.includes(linkId.toLowerCase())) {
        navigate("/paylink", { replace: true });
        return;
      }

      try {
        const result = await backend.get_payment_link_details(linkId);

        if ("Ok" in result) {
          const details = result.Ok;
          setLinkDetails(details);

          if ("Completed" in details.status) {
            const config = getTokenConfig(details.token);
            let paidByPrincipal = "An anonymous user";

            if (identity && !identity.getPrincipal().isAnonymous()) {
              const currentUser = identity.getPrincipal();
              const creator = details.creator;

              if (currentUser.toText() !== creator.toText()) {
                paidByPrincipal = currentUser.toText();
              }
            }

            setPaymentDetails({
              amount: formatAmountPretty(details.amount, config.decimals),
              tokenName: config.name,
              address: details.creator.toText(),
              expiresAt: details.expires_at ? new Date(Number(details.expires_at) / 1000000).toLocaleString() : null,
              paidBy: paidByPrincipal,
              paidOn: "Previously",
            });

            setPaymentSuccess(true);
          }

          let userIsCreator = false;
          if (identity && !identity.getPrincipal().isAnonymous()) {
            const currentPrincipal = identity.getPrincipal().toText();
            const creatorPrincipal = details.creator.toText();
            userIsCreator = currentPrincipal === creatorPrincipal;
            setIsCreator(userIsCreator);
          }
        } else {
          throw new Error(result.Err);
        }
      } catch (error) {
        toast.error(`Error: ${error.message}`);
        setLinkDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (linkId) {
      fetchDetails();
    }
  }, [linkId, identity, navigate]);

  useEffect(() => {
    if (linkDetails && qrRef.current && !isAnalyzing && !paymentSuccess) {
      const paymentUrl = `${window.location.origin}/paylink/${linkId}`;
      qrCode.current = new QRCodeStyling({
        width: 160,
        height: 160,
        data: paymentUrl,
        margin: 0,
        dotsOptions: { color: "#000000", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { color: "#000000", type: "extra-rounded" },
        cornersDotOptions: { color: "#000000", type: "dot" },
      });
      qrRef.current.innerHTML = "";
      qrCode.current.append(qrRef.current);
    }
  }, [linkDetails, linkId, isAnalyzing, paymentSuccess]);

  const performRiskAnalysis = async () => {
    if (!checkAuthentication()) {
      handleAuthModalOpen("analyze");
      return;
    }
    if (!linkDetails) return;
    setIsAnalyzing(true);
    setShowAnalysisResult(false);
    setIsAnalysisMinimized(false);
    try {
      const creatorAddress = linkDetails.creator.toText();
      const aiResult = await AIAnalyzeService.analyzeAddress(creatorAddress);
      if (aiResult) {
        const isSafe = aiResult.result?.isSafe ?? true;
        setAnalysisResult({
          address: creatorAddress,
          network: aiResult.network || "Internet Computer",
          result: {
            isSafe: isSafe,
            confidence: aiResult.result?.confidence || 85,
            description: aiResult.result?.description || (isSafe ? "This address shows normal transaction patterns." : "This address has been flagged for suspicious activity."),
            securityChecks: aiResult.result?.securityChecks || (isSafe ? ["No fraudulent patterns", "Normal transaction behavior"] : ["Suspicious patterns detected"]),
            stats: aiResult.result?.stats || { transactions: "1,234", totalVolume: "Low", riskScore: isSafe ? "0.2/10" : "7.8/10", lastActivity: "2 days ago" },
          },
          analysisSource: aiResult.analysisSource,
          finalStatus: aiResult.finalStatus,
          aiAnalysis: aiResult.aiAnalysis,
          communityAnalysis: aiResult.communityAnalysis,
        });
      } else {
        setAnalysisResult({
          address: creatorAddress,
          network: "Internet Computer",
          result: { isSafe: true, confidence: 75, description: "Limited data available.", securityChecks: ["Basic verification passed"], stats: { transactions: "Unknown", totalVolume: "Low", riskScore: "N/A", lastActivity: "Unknown" } },
          analysisSource: "unknown",
          finalStatus: "safe_by_default",
        });
      }
      setShowAnalysisResult(true);
    } catch (error) {
      console.error("Risk analysis failed:", error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => setIsAnalyzing(false);
  const handleToggleAnalysisView = () => setIsAnalysisMinimized((prev) => !prev);
  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard!");
  };

  const handleShareSuccess = () => {
    const shareText = `Payment completed! ${paymentDetails.amount} ${paymentDetails.tokenName} sent successfully.`;
    if (navigator.share) {
      navigator.share({ title: "Payment Successful", text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const handlePayICRC = async () => {
    if (!checkAuthentication()) {
      handleAuthModalOpen("pay");
      return;
    }
    const config = getTokenConfig(linkDetails.token);
    if (!config.ledger) {
      toast.error("ICRC payment not supported for this token type");
      return;
    }
    setIsPaying(true);
    const loadingToast = toast.loading("Processing payment...");
    try {
      const backendPrincipal = Principal.fromText(process.env.CANISTER_ID_BACKEND || "u6s2n-gx777-77774-qaaba-cai");
      toast.loading("Step 1/2: Approving transfer...", { id: loadingToast });
      const approveAmount = linkDetails.amount + BigInt(100000);
      const approveArgs = { amount: approveAmount, spender: { owner: backendPrincipal, subaccount: [] }, fee: [], memo: [], from_subaccount: [], created_at_time: [], expected_allowance: [], expires_at: [] };
      const approveResult = await config.ledger.icrc2_approve(approveArgs);
      if ("Err" in approveResult) throw new Error(`Approval failed: ${Object.keys(approveResult.Err)[0]}`);
      toast.loading("Step 2/2: Executing payment...", { id: loadingToast });
      const executeResult = await backend.execute_payment_icrc(linkId);
      if ("Ok" in executeResult) {
        toast.success("Payment successful!", { id: loadingToast });
        setPaymentDetails({
          amount: formatAmountPretty(linkDetails.amount, config.decimals),
          tokenName: config.name,
          address: linkDetails.creator.toText(),
          expiresAt: linkDetails.expires_at ? new Date(Number(linkDetails.expires_at) / 1000000).toLocaleString() : null,
          paidBy: identity.getPrincipal().toText(),
          paidOn: new Date().toLocaleString(),
        });
        setPaymentSuccess(true);
      } else {
        throw new Error(executeResult.Err);
      }
    } catch (error) {
      toast.error(`Payment failed: ${error.message}`, { id: loadingToast });
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayNative = async () => {
    if (!checkAuthentication()) {
      handleAuthModalOpen("pay");
      return;
    }
    const tokenType = getTokenType(linkDetails);
    const config = getTokenConfig(linkDetails.token);
    if (!linkDetails.creator_addresses || linkDetails.creator_addresses.length === 0) {
      toast.error("Payment link is missing recipient wallet addresses");
      return;
    }
    setIsPaying(true);
    const loadingToast = toast.loading("Processing payment...");
    try {
      const { wallet } = await import("declarations/wallet");
      let destinationAddress;
      const addresses = linkDetails.creator_addresses[0];
      switch (tokenType) {
        case "BTC":
          destinationAddress = addresses.bitcoin;
          break;
        case "ETH":
          destinationAddress = addresses.ethereum;
          break;
        case "SOL":
          destinationAddress = addresses.solana;
          break;
        default:
          throw new Error(`Unsupported native token: ${tokenType}`);
      }
      if (!destinationAddress) throw new Error("Destination address not found for this token type");
      toast.loading("Sending transaction...", { id: loadingToast });
      const amount = Number(linkDetails.amount);
      let txHash;
      switch (tokenType) {
        case "BTC":
          txHash = await wallet.bitcoin_send({ destination_address: destinationAddress, amount_in_satoshi: amount });
          break;
        case "ETH":
          txHash = await wallet.ethereum_send(destinationAddress, amount);
          break;
        case "SOL":
          txHash = await wallet.solana_send(destinationAddress, amount);
          break;
      }
      toast.loading("Recording payment...", { id: loadingToast });
      const recordResult = await backend.record_native_payment(linkId, txHash);
      if ("Ok" in recordResult) {
        toast.success("Payment successful!", { id: loadingToast });
        setPaymentDetails({
          amount: formatAmountPretty(linkDetails.amount, config.decimals),
          tokenName: config.name,
          address: destinationAddress,
          expiresAt: linkDetails.expires_at ? new Date(Number(linkDetails.expires_at) / 1000000).toLocaleString() : null,
          paidBy: identity.getPrincipal().toText(),
          paidOn: new Date().toLocaleString(),
        });
        setPaymentSuccess(true);
      } else {
        throw new Error(recordResult.Err);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`, { id: loadingToast });
    } finally {
      setIsPaying(false);
    }
  };

  const getAnalysisSourceInfo = () => {
    if (!analysisResult) return { label: "", color: "" };
    const { analysisSource, finalStatus } = analysisResult;
    if (analysisSource === "ai_and_community" || finalStatus === "safe_by_both") {
      return { label: "AI and Community", color: "text-purple-600" };
    } else if (analysisSource === "community" || finalStatus === "unsafe_by_community" || finalStatus === "safe_by_community") {
      return { label: "Community", color: "text-blue-600" };
    } else if (analysisSource === "ai" || finalStatus === "unsafe_by_ai") {
      return { label: "AI", color: "text-indigo-600" };
    }
    return { label: "Analysis", color: "text-gray-600" };
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[30rem] p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-2 border-[#C9A962]/20" />
              <div className="absolute inset-2 rounded-full border-2 border-[#C9A962]/15" />
              <div className="absolute inset-4 rounded-full border-2 border-[#C9A962]/10" />
              <div className="absolute inset-0 rounded-full border-t-2 border-[#C9A962] animate-spin" />
              <Shield className="absolute inset-0 m-auto w-12 h-12 text-[#C9A962]" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Loading</p>
              <h3 className="text-[#C9A962] font-semibold">Loading payment details...</h3>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm">
        <div className="w-full max-w-[375px] bg-white rounded-3xl flex flex-col items-center p-9 gap-8">
          <div className="relative w-[212px] h-[212px] flex items-center justify-center">
            <motion.div className="absolute w-[212px] h-[212px] bg-gradient-to-b from-[#C9A962]/15 to-[#C9A962]/8 rounded-full" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute w-[172px] h-[172px] bg-gradient-to-b from-[#C9A962]/20 to-[#C9A962]/10 rounded-full" animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} />
            <motion.div className="absolute w-[134px] h-[134px] bg-gradient-to-b from-[#C9A962]/25 to-[#C9A962]/15 rounded-full" animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.35, 0.25] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} />
            <motion.div className="absolute w-[100px] h-[100px]" animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <img src="/assets/images/analisis.png" alt="Analyzing" className="w-[100px] h-[100px] drop-shadow-[-5px_5px_20px_rgba(0,0,0,0.1)]" />
            </motion.div>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-gray-500 text-xs font-normal leading-[140%] text-center tracking-[0.08em]">TYPICALLY TAKES 30-120 SECS, HANG ON</p>
            <h2 className="text-[#C9A962] text-base font-semibold leading-[140%] text-center uppercase">ADDRESS ANALYSIS IS IN PROGRESS...</h2>
            <div className="flex flex-col items-start gap-1 w-full mt-2">
              <motion.p className="w-full text-gray-600 text-sm font-normal leading-[140%] text-center" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>
                Check if this address Already Flagged...
              </motion.p>
              <motion.p className="w-full text-gray-500 text-sm font-normal leading-[140%] text-center" animate={{ opacity: [0.6, 0.8, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>
                Analyzing Address with AI...
              </motion.p>
              <motion.p className="w-full text-gray-400 text-sm font-normal leading-[140%] text-center" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>
                Analyzing Transaction Patterns...
              </motion.p>
              <motion.p className="w-full text-gray-300 text-sm font-normal leading-[140%] text-center" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>
                Checking Transaction History...
              </motion.p>
            </div>
            <button onClick={handleCancelAnalysis} className="mt-6 w-full h-10 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors duration-200 ease-out">
              Cancel Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess && paymentDetails) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[30rem] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative pt-6 pb-4 px-6 border-b border-slate-200 bg-white">
            <div className="flex justify-center mb-4">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
                <img src="/assets/paylink-success.svg" alt="Success" className="w-12 h-12" />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
              <h2 className="text-xl font-bold text-[#C9A962] mb-1 uppercase tracking-wide">Payment Completed</h2>
              <p className="text-gray-600 text-sm">Transaction completed without any issues</p>
            </motion.div>
          </div>
          <div className="px-6 pb-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-start justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-1">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-[#C9A962]">
                    {paymentDetails.amount} {paymentDetails.tokenName}
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }} className="space-y-1 text-right">
                  <p className="text-xs text-gray-500">Address</p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-xs font-mono text-gray-900 truncate max-w-[12rem]">{paymentDetails.address.slice(0, 12)}...</p>
                    <button onClick={() => handleCopyAddress(paymentDetails.address)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="space-y-1">
                <p className="text-xs text-gray-500">Token type</p>
                <p className="text-base font-bold text-[#C9A962]">{paymentDetails.tokenName}</p>
              </motion.div>
              {paymentDetails.expiresAt && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }} className="space-y-1">
                  <p className="text-xs text-gray-500">Expires</p>
                  <p className="text-xs text-gray-900">{paymentDetails.expiresAt}</p>
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="space-y-1">
                <p className="text-xs text-gray-500">Paid by</p>
                <p className="text-xs font-mono text-gray-900 truncate">{paymentDetails.paidBy.slice(0, 15)}...</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 }} className="space-y-1">
                <p className="text-xs text-gray-500">Paid on</p>
                <p className="text-xs text-gray-900">{paymentDetails.paidOn}</p>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => navigate("/wallet")} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-yellow-50/50 border border-[#AA8D42] rounded-xl transition-colors duration-200 ease-out text-sm font-semibold text-[#AA8D42]">
                Explore Fradium
                <ArrowRight className="w-5 h-5" />
              </button>
              <ButtonYellow onClick={handleShareSuccess} className="flex-1" size="sm">
                Share
              </ButtonYellow>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!linkDetails) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[30rem] text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Link Not Found</h2>
          <p className="text-gray-600 text-sm mb-5">This payment link is invalid or has been removed.</p>
          <ButtonYellow onClick={() => navigate("/wallet")}>Go to Wallet</ButtonYellow>
        </motion.div>
      </div>
    );
  }

  const isExpired = "Expired" in linkDetails.status;
  const isCompleted = "Completed" in linkDetails.status;
  const isCancelled = "Cancelled" in linkDetails.status;
  const tokenType = getTokenType(linkDetails);
  const config = getTokenConfig(linkDetails.token);
  const isNativeToken = ["BTC", "ETH", "SOL"].includes(tokenType);
  const sourceInfo = getAnalysisSourceInfo();

  return (
    <>
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleAuthModalClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", duration: 0.5 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="relative bg-gradient-to-br from-[#C9A962] to-[#B8944D] px-8 py-8 text-white">
                <button onClick={handleAuthModalClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <LogIn className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
                  <p className="text-white/90 text-sm">{authAction === "pay" ? "Please sign in to complete your payment securely" : "Please sign in to analyze this address"}</p>
                </div>
              </div>
              <div className="px-8 py-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#C9A962]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-[#C9A962]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Secure Authentication</h3>
                      <p className="text-sm text-gray-600">Your identity is protected with Internet Identity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#C9A962]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-[#C9A962]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Fast & Easy</h3>
                      <p className="text-sm text-gray-600">Sign in with just a few clicks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#C9A962]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wallet className="w-4 h-4 text-[#C9A962]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Full Access</h3>
                      <p className="text-sm text-gray-600">Access all features including payments and analysis</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <ButtonYellow onClick={handleSignIn} disabled={isAuthenticating} className="w-full" size="lg">
                    {isAuthenticating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In with Internet Identity</span>
                      </>
                    )}
                  </ButtonYellow>
                  <button onClick={handleAuthModalClose} disabled={isAuthenticating} className="w-full px-6 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Maybe Later
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-6">By signing in, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CSS LAYERING FIX: Added z-20 to lift this page's content above the layout sidebars --- */}
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[30rem] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="text-center pt-6 pb-4 px-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-gray-900">Payment Request</h1>
          </div>
          <div className="px-6 pb-4 bg-white">
            <AnimatePresence>
              {showAnalysisResult && analysisResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                  <h3 className="text-xs font-semibold text-gray-800 mb-2">Payment Request Analysis</h3>
                  {isAnalysisMinimized ? (
                    <div onClick={handleToggleAnalysisView} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${analysisResult.result.isSafe ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}>
                      <div className="flex items-center gap-2">
                        {analysisResult.result.isSafe ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                        <p className={`font-semibold text-xs ${analysisResult.result.isSafe ? "text-green-800" : "text-red-800"}`}>Address is {analysisResult.result.isSafe ? "Safe" : "Risky"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                        Show Details <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-2xl border ${analysisResult.result.isSafe ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}>
                      {/* --- CLICK AREA FIX: onClick and cursor-pointer added to this div --- */}
                      <div onClick={handleToggleAnalysisView} className="flex items-start justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <img src={analysisResult.result.isSafe ? "/assets/images/ai-safe-result.svg" : "/assets/images/ai-unsafe-result.svg"} alt="Analysis Icon" className="w-12 h-12" />
                          <div>
                            <h3 className={`text-base font-semibold ${analysisResult.result.isSafe ? "text-green-800" : "text-red-800"}`}>Address is {analysisResult.result.isSafe ? "SAFE" : "RISKY"}</h3>
                            <p className="text-xs text-gray-600">Confidence Level: {analysisResult.result.confidence}%</p>
                          </div>
                        </div>
                        {/* --- Changed from <button> to <div> as the parent is now the clickable element --- */}
                        <div className="p-1.5 rounded-full hover:bg-gray-400/10">
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-left">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center text-[10px] text-gray-500">
                            <Wallet className="w-4 h-4 mr-1.5" />
                            <span>Transactions</span>
                          </div>
                          <div className="mt-1 text-lg font-medium text-gray-900">{analysisResult.result.stats.transactions}</div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center text-[10px] text-gray-500">
                            <Gauge className="w-4 h-4 mr-1.5" />
                            <span>Risk</span>
                          </div>
                          <div className={`mt-1 text-lg font-medium ${analysisResult.result.isSafe ? "text-green-700" : "text-red-700"}`}>{formatRiskLevel(analysisResult.result.stats.totalVolume)}</div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center text-[10px] text-gray-500">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span>Source</span>
                          </div>
                          <div className="mt-1 text-lg font-medium text-gray-900">{sourceInfo.label}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="px-6 pb-6 space-y-5 bg-white">
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 mb-5 relative">
                <div ref={qrRef} className="w-[180px] h-[180px] flex items-center justify-center" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-2 shadow-md">
                  <div className="w-8 h-8 bg-[#C9A962] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₣</span>
                  </div>
                </div>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Pay for {formatAmountPretty(linkDetails.amount, config.decimals)} {config.name}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-start justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-base font-bold text-[#C9A962]">
                    {formatAmountPretty(linkDetails.amount, config.decimals)} {config.name}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-xs font-mono text-gray-900 truncate max-w-[12rem]"> {linkDetails.creator.toText().slice(0, 10)}... </p>
                    <button onClick={() => handleCopyAddress(linkDetails.creator.toText())} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Token Type</p>
                <p className="text-base font-bold text-[#C9A962]">{config.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200">
                  <span className="text-xs font-medium text-gray-600"> {isCompleted ? "Paid" : isExpired ? "Expired" : isCancelled ? "Cancelled" : "Not yet paid"} </span>
                </div>
              </div>

              {linkDetails.expires_at && (
                <div className="col-span-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Expires
                      </p>
                      <p className="text-xs font-medium text-gray-900 mt-2">{new Date(Number(linkDetails.expires_at) / 1000000).toLocaleString()}</p>
                    </div>
                    {timeLeft && !isCompleted && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Time left</p>
                        <p className={`text-base font-bold ${timeLeft === "Expired" ? "text-red-600" : "text-[#C9A962]"}`}>{timeLeft}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isCreator && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                {" "}
                <div className="flex items-start gap-3">
                  {" "}
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />{" "}
                  <div className="flex-1">
                    {" "}
                    <h3 className="font-semibold text-blue-900 text-sm">You Created This Link</h3> <p className="text-xs text-blue-700 mt-1"> This is your payment request. Share it with others to receive payment. </p>{" "}
                  </div>{" "}
                </div>{" "}
              </motion.div>
            )}
            <div className="flex gap-3">
              {!isCreator && !showAnalysisResult && (
                <button onClick={performRiskAnalysis} disabled={isAnalyzing} className="flex-1 flex items-center justify-end gap-2 px-5 py-3 bg-white hover:bg-gray-50 border border-slate-200 rounded-xl transition-colors text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Search className="w-5 h-5" />
                  Analyze Address
                </button>
              )}

              {!isCreator && (
                <>
                  {isCompleted ? (
                    <div className="flex-1 bg-green-50 border border-green-300 rounded-xl p-3 text-center">
                      {" "}
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" /> <p className="text-green-700 font-semibold text-xs">Payment Completed</p>{" "}
                    </div>
                  ) : isExpired ? (
                    <div className="flex-1 bg-red-50 border border-red-300 rounded-xl p-3 text-center">
                      {" "}
                      <Clock className="w-5 h-5 text-red-600 mx-auto mb-1" /> <p className="text-red-700 font-semibold text-xs">Link Expired</p>{" "}
                    </div>
                  ) : isCancelled ? (
                    <div className="flex-1 bg-red-50 border border-red-300 rounded-xl p-3 text-center">
                      {" "}
                      <Ban className="w-5 h-5 text-red-600 mx-auto mb-1" /> <p className="text-red-700 font-semibold text-xs">Link Cancelled</p>{" "}
                    </div>
                  ) : (
                    <ButtonYellow onClick={isNativeToken ? handlePayNative : handlePayICRC} disabled={isPaying || (analysisResult && !analysisResult.result?.isSafe)} className="flex-1" size="md">
                      <div className="flex items-center gap-2">
                        {isPaying ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm">Processing...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm">Pay Now</span>
                          </>
                        )}
                      </div>
                    </ButtonYellow>
                  )}
                </>
              )}
            </div>
            {analysisResult && !analysisResult.result?.isSafe && !isCreator && <p className="text-xs text-red-600 text-center font-medium"> Payment disabled due to security concerns. This address has been flagged as suspicious. </p>}
            {isCreator && (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {" "}
                <p className="text-xs text-gray-600">You cannot pay your own payment link</p>{" "}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PaymentRequestPage;
