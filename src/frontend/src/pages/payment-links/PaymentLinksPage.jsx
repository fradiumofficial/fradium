import React, { useState, useEffect, useRef } from "react";
import { backend } from "declarations/backend";
import toast from "react-hot-toast";
import { Copy, Info, X, ChevronDown } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/core/components/ui/Tooltip";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig";
import ButtonYellow from "@/core/components/ButtonYellow";

const PaymentLinksPage = () => {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("24");
  const [tokenType, setTokenType] = useState("Fradium");
  const [customId, setCustomId] = useState("");
  const [useCustomId, setUseCustomId] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkId, setLinkId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const qrRef = useRef(null);
  const qrCode = useRef(null);

  // Map TOKENS_CONFIG to payment link format (exclude SNS tokens - not supported by backend variant)
  const tokenOptions = TOKENS_CONFIG.filter((token) => token.type !== "sns").map((token) => ({
    value: token.symbol === "BTC" ? "BTC" : token.symbol === "ETH" ? "ETH" : token.symbol === "SOL" ? "SOL" : token.symbol === "ICP" ? "ICP" : token.symbol === "FRADIUM" ? "Fradium" : token.symbol === "ckBTC" ? "ckBTC" : token.symbol === "ckETH" ? "ckETH" : token.symbol,
    label: token.name,
    symbol: token.symbol,
    decimals: token.decimals || 8,
    imageUrl: token.imageUrl,
  }));

  const durationOptions = [
    { value: "1", label: "1 hour" },
    { value: "6", label: "6 hours" },
    { value: "12", label: "12 hours" },
    { value: "24", label: "24 hours" },
    { value: "48", label: "48 hours" },
    { value: "168", label: "7 days" },
  ];

  useEffect(() => {
    if (generatedLink && qrRef.current && showSuccessModal) {
      qrCode.current = new QRCodeStyling({
        width: 240,
        height: 240,
        data: generatedLink,
        margin: 4,
        dotsOptions: {
          color: "#000000",
          type: "square", // makes the QR blocks square
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          color: "#000000",
          type: "square", // square corners
        },
        cornersDotOptions: {
          color: "#000000",
          type: "square", // square dots inside corner squares
        },
      });

      qrRef.current.innerHTML = "";
      qrCode.current.append(qrRef.current);
    }
  }, [generatedLink, showSuccessModal]);

  const getTokenDecimals = () => {
    const token = tokenOptions.find((t) => t.value === tokenType);
    return token ? token.decimals : 8;
  };

  const generateRandomSuffix = (length = 7) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateCustomId = (id) => {
    if (id.length < 8 || id.length > 32) {
      return "Custom ID must be 8-32 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return "Custom ID can only contain letters, numbers, dashes, and underscores";
    }
    return null;
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (useCustomId) {
      const error = validateCustomId(customId);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Safety guard: only allow tokens supported by backend variant
      const supportedTokens = new Set(["BTC", "ETH", "SOL", "ICP", "Fradium", "ckBTC", "ckETH"]);
      if (!supportedTokens.has(tokenType)) {
        toast.error("Selected token is not supported for payment links.");
        setIsLoading(false);
        return;
      }

      const decimals = getTokenDecimals();
      const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
      const durationHours = BigInt(duration);
      const duration_nanos = durationHours * 60n * 60n * 1_000_000_000n;

      let finalId;
      if (useCustomId && customId) {
        const suffix = generateRandomSuffix();
        finalId = `${customId}-${suffix}`;
      }

      const result = await backend.create_payment_link({
        amount: amountInSmallestUnit,
        duration_nanos: duration_nanos,
        token: { [tokenType]: null },
        custom_id: finalId ? [finalId] : [],
      });

      if ("Ok" in result) {
        const id = result.Ok;
        const fullLink = `${window.location.origin}/paylink/${id}`;
        setLinkId(id);
        setGeneratedLink(fullLink);
        setShowSuccessModal(true);
        toast.success("Payment link created successfully!");
      } else if ("Err" in result) {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("Full error:", error);
      toast.error(`Failed: ${error.message || error.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setGeneratedLink("");
    setLinkId("");
    setAmount("");
    setCustomId("");
    setUseCustomId(false);
  };

  const handleCreateNewLink = () => {
    setShowSuccessModal(false);
    setGeneratedLink("");
    setLinkId("");
    setAmount("");
    setCustomId("");
    setUseCustomId(false);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Link",
          text: `Pay ${amount} ${getTokenLabel(tokenType)}`,
          url: generatedLink,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          copyToClipboard(generatedLink);
        }
      }
    } else {
      copyToClipboard(generatedLink);
    }
  };

  const copyToClipboard = (text, label = "Link") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getTokenLabel = (token) => {
    const t = tokenOptions.find((opt) => opt.value === token);
    return t ? t.label : token;
  };

  const getTokenSymbol = (token) => {
    const t = tokenOptions.find((opt) => opt.value === token);
    return t ? t.symbol : token;
  };

  const selectedToken = tokenOptions.find((t) => t.value === tokenType);
  const selectedDurationLabel = durationOptions.find((d) => d.value === duration)?.label || duration;

  return (
    <TooltipProvider>
      <div className="relative flex flex-col max-w-[44rem] gap-8 mx-auto w-full bg-transparent px-4">
        {/* Header */}
        <div className="relative z-10">
          <h1 className="text-[2rem] font-semibold text-white mb-2">Create Payment Link</h1>
          <p className="text-white/60 text-base">Generate a secure payment link to receive crypto tokens</p>
        </div>

        {/* Content Section */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
              {/* Form Card */}
              <div className="bg-[#0A0D14] border border-white/10 rounded-3xl p-8">
                <div className="space-y-6">
                  {/* Token Type Dropdown */}
                  <div>
                    <label className="block text-base font-medium text-white mb-3">Token Type</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={isLoading} className="w-full px-5 py-4 bg-transparent border border-white/10 rounded-2xl text-white text-left focus:outline-none focus:border-[#FFE865] disabled:opacity-50 transition-all flex items-center justify-between hover:border-white/20">
                          <div className="flex items-center gap-3">
                            <img src={selectedToken?.imageUrl} alt={selectedToken?.label} className="w-7 h-7 rounded-full" />
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{selectedToken?.label}</span>
                              <span className="text-white/50 text-sm">{selectedToken?.symbol}</span>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-white/50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto" align="start">
                        {tokenOptions.map((token) => (
                          <DropdownMenuItem key={token.value} onClick={() => setTokenType(token.value)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                            <div className="flex items-center gap-3">
                              <img src={token.imageUrl} alt={token.label} className="w-8 h-8 rounded-full" />
                              <div className="flex flex-col">
                                <span className="font-medium">{token.label}</span>
                                <span className="text-white/50 text-xs">{token.symbol}</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-base font-medium text-white mb-3">Amount</label>
                    <div className="relative">
                      <input type="number" step="0.00000001" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" disabled={isLoading} className="w-full px-5 py-4 bg-transparent border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFE865] disabled:opacity-50 transition-all pr-20" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-medium">{selectedToken?.symbol}</span>
                    </div>
                    <p className="text-sm text-white/50 mt-2">Enter the amount you want to receive</p>
                  </div>

                  {/* Expiration Duration Dropdown */}
                  <div>
                    <label className="block text-base font-medium text-white mb-3">Expiration Duration</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={isLoading} className="w-full px-5 py-4 bg-transparent border border-white/10 rounded-2xl text-white text-left focus:outline-none focus:border-[#FFE865] disabled:opacity-50 transition-all flex items-center justify-between hover:border-white/20">
                          <span className="text-white/70">{selectedDurationLabel}</span>
                          <ChevronDown className="w-5 h-5 text-white/50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto" align="start">
                        {durationOptions.map((option) => (
                          <DropdownMenuItem key={option.value} onClick={() => setDuration(option.value)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="text-sm text-white/50 mt-2">Link will expire after this duration</p>
                  </div>

                  {/* Custom ID */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 text-base font-medium text-white cursor-pointer">
                        <Checkbox checked={useCustomId} onCheckedChange={setUseCustomId} disabled={isLoading} className="w-5 h-5" />
                        Use Custom ID
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-5 h-5 text-white/50 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] bg-[#161B22] border-white/10 text-white rounded-lg p-3 text-sm shadow-lg">
                          <p>Create a memorable link ID. A random suffix is added automatically for security.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <AnimatePresence>
                      {useCustomId && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                          <input type="text" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="my-store" disabled={isLoading} className="w-full px-5 py-4 bg-transparent border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFE865]" minLength={8} maxLength={32} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!useCustomId && <p className="text-sm text-white/50 mt-2">A random secure ID will be generated automatically</p>}
                  </div>

                  {/* Generate Button - Using ButtonYellow */}
                  <ButtonYellow
                    onClick={handleCreateLink}
                    disabled={isLoading}
                    loading={isLoading}
                    fullWidth
                    size="lg"
                    className="mt-8"
                    icon={
                      !isLoading && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
                        </svg>
                      )
                    }>
                    Generate Payment Link
                  </ButtonYellow>
                </div>
              </div>

              {/* Info Card */}
              <div className="flex items-start gap-4 rounded-2xl border border-[#EAD8A9]/40 bg-[#171408] p-5">
                <Info className="w-5 h-5 text-[#EAD8A9] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-base font-medium text-[#EAD8A9] mb-1">Rate Limiting</p>
                  <p className="text-sm text-[#EAD8A9]/80">You can create up to 10 payment links per hour. Links cannot be modified after creation.</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#23272F] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Payment Link Created!</h2>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center w-full">
                      <div className="bg-white p-2 rounded-xl shadow-lg mb-4">
                        <div ref={qrRef} className="w-[240px] h-[240px]" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Payment link for {amount} {getTokenSymbol(tokenType)}
                      </h3>
                      <p className="text-sm text-white/70">Scan or share to receive payment</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Link for Payment</label>
                    <div className="relative flex items-center">
                      <input type="text" readOnly value={generatedLink} className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white text-sm font-mono truncate" />
                      <button onClick={() => copyToClipboard(generatedLink)} className="absolute right-1 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                        <Copy className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleShareLink}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold 
               py-3 px-6 rounded-full transition-all duration-200 ease-out 
               flex items-center justify-center gap-2 shadow-[inset_0_-2px_6px_rgba(255,255,255,0.1)] 
               hover:shadow-[inset_0_-3px_8px_rgba(255,255,255,0.15)]">
                      Share Link
                    </button>

                    <ButtonYellow onClick={handleCreateNewLink} className="flex-1">
                      Create New Link
                    </ButtonYellow>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default PaymentLinksPage;
