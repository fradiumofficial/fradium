// React
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { backend } from "declarations/backend";
import { fradium_ledger } from "declarations/fradium_ledger";
import { icp_ledger } from "declarations/icp_ledger";
import { ckbtc_ledger } from "declarations/ckbtc_ledger";
import { cketh_ledger } from "declarations/cketh_ledger";
import { wallet } from "declarations/wallet";
import { Principal } from "@dfinity/principal";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { useAuth } from "@/core/providers/AuthProvider";
import { toast } from "react-toastify";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { formatAmount } from "@/core/lib/tokenUtils";
import { useWallet } from "@/core/providers/WalletProvider";

// Get backend canister ID from environment variable
const backendCanisterId = process.env.CANISTER_ID_BACKEND;

const CHOICE_MAP = [
  { idStr: "FRADIUM", configId: 5, isWrapped: true, ledger: fradium_ledger },
  { idStr: "ICP", configId: 4, isWrapped: true, ledger: icp_ledger },
  { idStr: "ckBTC", configId: 6, isWrapped: true, ledger: ckbtc_ledger },
  { idStr: "ckETH", configId: 7, isWrapped: true, ledger: cketh_ledger },
  { idStr: "BTC", configId: 1, isWrapped: false, ledger: null },
  { idStr: "ETH", configId: 2, isWrapped: false, ledger: null },
  { idStr: "SOL", configId: 3, isWrapped: false, ledger: null },
];

function toVariant(tokenId) {
  switch (tokenId) {
    case "FRADIUM":
      return { FRADIUM: null };
    case "ICP":
      return { ICP: null };
    case "ckBTC":
      return { ckBTC: null };
    case "ckETH":
      return { ckETH: null };
    case "BTC":
      return { BTC: null };
    case "ETH":
      return { ETH: null };
    case "SOL":
      return { SOL: null };
    default:
      return { FRADIUM: null };
  }
}

function parseAmountToBaseUnits(amountStr, decimals) {
  // Robust decimal to bigint conversion without floating point errors
  if (!amountStr) return 0n;
  const s = String(amountStr).trim();
  if (!s) return 0n;
  const neg = s.startsWith("-");
  const [intPartRaw, fracPartRaw = ""] = (neg ? s.slice(1) : s).split(".");
  const intPart = intPartRaw.replace(/[^0-9]/g, "") || "0";
  const fracDigits = (fracPartRaw.replace(/[^0-9]/g, "") || "").slice(0, decimals);
  const fracPadded = fracDigits.padEnd(decimals, "0");
  const full = (intPart === "" ? "0" : intPart) + (decimals > 0 ? fracPadded : "");
  let n = 0n;
  if (full.length > 0) {
    n = BigInt(full);
  }
  return neg ? -n : n;
}

export default function CreateEscrowPage() {
  const { identity, isAuthenticated, handleLogin } = useAuth();
  const { balances, balanceLoading, refreshAllBalances, usdPrices, usdPriceLoading } = useWallet();
  const navigate = useNavigate();

  // Form state
  const [recipient, setRecipient] = useState("");
  const [tokenId, setTokenId] = useState("FRADIUM"); // You Give
  const [amount, setAmount] = useState(""); // You Give amount
  const [decimals, setDecimals] = useState(8); // You Give decimals
  const [tokenToId, setTokenToId] = useState("ICP"); // You Receive
  const [amountTo, setAmountTo] = useState(""); // You Receive amount
  const [decimalsTo, setDecimalsTo] = useState(8); // You Receive decimals
  // Duration fixed by backend (15 minutes); no local state needed
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTradeTab, setActiveTradeTab] = useState("give");
  // Expire After (seconds), default 15 minutes; max 7 days
  const EXPIRE_OPTIONS = [
    { label: "15 Minutes", seconds: 15 * 60 },
    { label: "30 Minutes", seconds: 30 * 60 },
    { label: "1 Hour", seconds: 60 * 60 },
    { label: "6 Hours", seconds: 6 * 60 * 60 },
    { label: "12 Hours", seconds: 12 * 60 * 60 },
    { label: "1 Day", seconds: 24 * 60 * 60 },
    { label: "3 Days", seconds: 3 * 24 * 60 * 60 },
    { label: "7 Days (Max)", seconds: 7 * 24 * 60 * 60 },
  ];
  const MAX_EXPIRE_SECONDS = 7 * 24 * 60 * 60;
  const [expireAfter, setExpireAfter] = useState(EXPIRE_OPTIONS[0].seconds);

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [errors, setErrors] = useState({});

  // Balances are provided by WalletProvider (balances, balanceLoading)

  // Sanitize numeric input: remove leading zeros except for decimals like 0.x
  const sanitizeAmountInput = useCallback((raw) => {
    if (raw == null) return "";
    let s = String(raw).trim();
    if (s === "") return s;
    // Normalize starting with dot -> 0.
    if (s.startsWith(".")) s = "0" + s;
    // If starts with 0 and next char is not dot, strip leading zeros
    if (s.startsWith("0") && s.length > 1 && s[1] !== ".") {
      s = s.replace(/^0+/, "");
      if (s === "") s = "0";
    }
    // If multiple zeros before a dot, collapse to single 0
    s = s.replace(/^0+(?=\.)/, "0");
    return s;
  }, []);

  const tokenChoices = useMemo(() => {
    // Map CHOICE_MAP to enriched objects using TOKENS_CONFIG for icon/name/chain
    return CHOICE_MAP.map((c) => {
      const cfg = TOKENS_CONFIG.find((t) => t.id === c.configId);
      return {
        id: c.idStr,
        configId: c.configId,
        label: cfg ? `${cfg.name} (${cfg.symbol})` : c.idStr,
        imageUrl: cfg ? `/${cfg.imageUrl}` : "/assets/images/coins/bitcoin.webp",
        chain: cfg?.chain || "",
        isWrapped: c.isWrapped,
        ledger: c.ledger,
      };
    });
  }, []);

  const selected = useMemo(() => tokenChoices.find((t) => t.id === tokenId), [tokenId, tokenChoices]);
  const selectedTo = useMemo(() => tokenChoices.find((t) => t.id === tokenToId), [tokenToId, tokenChoices]);
  const isWrapped = !!selected?.isWrapped;

  // Ensure Give and Receive are not the same: auto-pick alternative receive when clashing
  useEffect(() => {
    if (tokenToId === tokenId) {
      const alternative = tokenChoices.find((t) => t.id !== tokenId);
      if (alternative) setTokenToId(alternative.id);
    }
  }, [tokenId, tokenToId, tokenChoices]);

  // Redirect to landing page if auth expired/not logged in (same behavior as wallet dashboard)
  useEffect(() => {
    if (typeof isAuthenticated === "boolean" && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Calculate USD value for a token
  const getTokenUSDValue = useCallback(
    (configId) => {
      const balance = balances[configId] || "0";
      const usdPrice = usdPrices[configId] || 0;
      const numericBalance = parseFloat(balance);
      if (isNaN(numericBalance) || numericBalance <= 0 || !usdPrice) return "0.00";
      return (numericBalance * usdPrice).toFixed(2);
    },
    [balances, usdPrices]
  );

  // Calculate USD value for input amount
  const getAmountUSDValue = useCallback(() => {
    if (!amount || !selected) return "0.00";
    const usdPrice = usdPrices[selected.configId] || 0;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || !usdPrice) return "0.00";
    return (numericAmount * usdPrice).toFixed(2);
  }, [amount, selected, usdPrices]);

  // Calculate USD value for receive amount
  const getAmountToUSDValue = useCallback(() => {
    if (!amountTo || !selectedTo) return "0.00";
    const usdPrice = usdPrices[selectedTo.configId] || 0;
    const numericAmount = parseFloat(amountTo);
    if (isNaN(numericAmount) || numericAmount <= 0 || !usdPrice) return "0.00";
    return (numericAmount * usdPrice).toFixed(2);
  }, [amountTo, selectedTo, usdPrices]);

  // Estimated receive amount based on USD parity
  const priceGive = selected ? usdPrices[selected.configId] || 0 : 0;
  const priceReceive = selectedTo ? usdPrices[selectedTo.configId] || 0 : 0;
  const estimatedReceive = useMemo(() => {
    const a = parseFloat(amount || "0");
    if (!selected || !selectedTo || !priceGive || !priceReceive || isNaN(a) || a <= 0) return null;
    const est = (a * priceGive) / priceReceive;
    if (!isFinite(est) || est <= 0) return null;
    return est;
  }, [amount, selected, selectedTo, priceGive, priceReceive]);

  // Domino animation variants for token list items
  const dominoItem = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.2, delay: i * 0.04 } }),
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  // Balance fetching is handled by WalletProvider

  // Steps configuration
  const steps = [
    { id: 1, title: "Token & Amount", description: "Select token and amount" },
    { id: 2, title: "Recipient", description: "Set recipient" },
    { id: 3, title: "Details & Review", description: "Add details and review" },
  ];

  // WalletProvider handles balance lifecycles; no extra effects needed here

  // Fetch decimals for wrapped token
  useEffect(() => {
    let active = true;
    async function fetchDecimals() {
      try {
        if (selected?.ledger && selected.isWrapped) {
          const d = await selected.ledger.icrc1_decimals();
          if (active) setDecimals(Number(d ?? 8));
        } else {
          // Default decimals for native info (user input in base units manually)
          setDecimals(8);
        }
      } catch (_e) {
        setDecimals(8);
      }
    }
    fetchDecimals();
    return () => {
      active = false;
    };
  }, [selected]);

  // Fetch decimals for target (You Receive) token
  useEffect(() => {
    let active = true;
    async function fetchDecimalsTo() {
      try {
        if (selectedTo?.ledger && selectedTo.isWrapped) {
          const d = await selectedTo.ledger.icrc1_decimals();
          if (active) setDecimalsTo(Number(d ?? 8));
        } else {
          // Defaults for native tokens
          switch (tokenToId) {
            case "ETH":
              setDecimalsTo(18);
              break;
            case "SOL":
              setDecimalsTo(9);
              break;
            case "BTC":
            default:
              setDecimalsTo(8);
          }
        }
      } catch (_e) {
        setDecimalsTo(8);
      }
    }
    fetchDecimalsTo();
    return () => {
      active = false;
    };
  }, [selectedTo, tokenToId]);

  // Step validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!amount || Number(amount) <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
      if (!amountTo || Number(amountTo) <= 0) {
        newErrors.amountTo = "Amount to receive must be greater than 0";
      }
    }
    if (step === 2) {
      // Recipient is optional - validate only if provided
      if (recipient.trim()) {
        try {
          Principal.fromText(recipient.trim());
        } catch (_e) {
          newErrors.recipient = "Invalid principal format";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const nextStep = () => {
    // Step 1 specific checks: amount vs balance & loading state
    if (currentStep === 1) {
      // Require token selected & amount validated first
      if (!validateStep(currentStep)) return;

      // No balance validation needed at create time
    } else if (!validateStep(currentStep)) {
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      setIsTransitioning(false);
    }, 200);
  };

  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setIsTransitioning(false);
    }, 200);
  };

  const onSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      await handleLogin?.();
      return;
    }
    if (!amount || Number(amount) <= 0) return toast.error("Amount must be greater than 0");
    if (!amountTo || Number(amountTo) <= 0) return toast.error("Amount to receive must be greater than 0");

    // Recipient is optional - convert to Principal if provided
    let recipientPrincipal = null;
    if (recipient.trim()) {
      try {
        recipientPrincipal = Principal.fromText(recipient.trim());
      } catch (_e) {
        return toast.error("Invalid recipient principal");
      }
    }

    setSubmitting(true);
    try {
      // No delegation needed at creation - tokens will be transferred when someone joins

      // Convert amounts to base units for both tokens
      let amountFromNat;
      if (isWrapped) {
        amountFromNat = parseAmountToBaseUnits(amount, decimals);
      } else {
        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat) || amountFloat <= 0) {
          setSubmitting(false);
          return toast.error("Invalid amount");
        }
        switch (tokenId) {
          case "BTC":
            amountFromNat = BigInt(Math.floor(amountFloat * 100_000_000));
            break;
          case "ETH":
            amountFromNat = BigInt(Math.floor(amountFloat * 1_000_000_000_000_000_000));
            break;
          case "SOL":
            amountFromNat = BigInt(Math.floor(amountFloat * 1_000_000_000));
            break;
          default:
            amountFromNat = BigInt(Math.floor(amountFloat * 100_000_000));
        }
      }

      // Convert target amount
      let amountToNat;
      if (selectedTo?.isWrapped && selectedTo?.ledger) {
        amountToNat = parseAmountToBaseUnits(amountTo, decimalsTo);
      } else {
        const amtToFloat = parseFloat(amountTo);
        if (isNaN(amtToFloat) || amtToFloat <= 0) {
          setSubmitting(false);
          return toast.error("Invalid receive amount");
        }
        switch (tokenToId) {
          case "BTC":
            amountToNat = BigInt(Math.floor(amtToFloat * 100_000_000));
            break;
          case "ETH":
            amountToNat = BigInt(Math.floor(amtToFloat * 1_000_000_000_000_000_000));
            break;
          case "SOL":
            amountToNat = BigInt(Math.floor(amtToFloat * 1_000_000_000));
            break;
          default:
            amountToNat = BigInt(Math.floor(amtToFloat * 100_000_000));
        }
      }

      if (amountFromNat <= 0n || amountToNat <= 0n) {
        setSubmitting(false);
        return toast.error("Amount must be greater than 0");
      }

      // Convert BigInt to Number for backend (to avoid serialization issues)
      const amountFromNumber = Number(amountFromNat);
      const amountToNumber = Number(amountToNat);

      // No approvals needed at creation - tokens will be transferred when someone joins
      const res = await backend.create_escrow({
        recipient: recipientPrincipal ? [recipientPrincipal] : [],
        token_from: toVariant(tokenId),
        amount_from: amountFromNumber,
        token_to: toVariant(tokenToId),
        amount_to: amountToNumber,
        duration_seconds: [Math.min(Number(expireAfter || 0), MAX_EXPIRE_SECONDS)],
        description: description ? [description] : [],
        metadata: [],
      });

      if (res?.Ok !== undefined) {
        toast.success(`Escrow created! ID: ${res.Ok}`);
        // Redirect to escrow detail page
        navigate(`/escrow/detail/${res.Ok}`);
      } else {
        toast.error(res?.Err || "Failed to create escrow");
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">You Give</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                  {tokenChoices.map((t, idx) => (
                    <motion.button key={t.id} custom={idx} variants={dominoItem} initial="hidden" animate="visible" exit="exit" type="button" onClick={() => setTokenId(t.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${tokenId === t.id ? "border-[#9BE4A0]/60 bg-white/10 ring-2 ring-[#9BE4A0]/20" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}>
                      <img src={t.imageUrl} alt={t.label} className="w-7 h-7" />
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-white text-sm font-medium leading-tight">{t.label.split("(")[0].trim()}</span>
                        <span className="text-[#B0B6BE] text-xs leading-tight">{t.chain || "Multi-chain"}</span>
                      </div>

                      {/* Selection highlight is handled by border/bg classes; no check icon */}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/90 text-sm font-medium">Amount</label>
              </div>

              <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(sanitizeAmountInput(e.target.value));
                      if (errors.amount) setErrors({ ...errors, amount: "" });
                    }}
                    className="flex-1 bg-transparent text-white text-sm outline-none font-mono placeholder:text-white/40"
                    placeholder="0.00"
                    step="any"
                    min="0"
                  />
                  {amount && (
                    <button type="button" className="text-xs font-medium text-[#9BE4A0] hover:text-white transition-colors" onClick={() => setAmount("")}>
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}

              {/* USD Value Display */}
              {amount && tokenId && !errors.amount && (
                <div className="mt-2 text-right">
                  <span className="text-[#B0B6BE] text-xs">≈ ${getAmountUSDValue()} USD</span>
                </div>
              )}
            </div>

            {/* You Receive (hidden until user inputs You Give) */}
            <AnimatePresence initial={false}>
              {amount && Number(amount) > 0 && (
                <motion.div key="you-receive-section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-3">You Receive</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <AnimatePresence initial={false}>
                        {tokenChoices
                          .filter((t) => t.id !== tokenId)
                          .map((t, idx) => (
                            <motion.button key={t.id} custom={idx} variants={dominoItem} initial="hidden" animate="visible" exit="exit" type="button" onClick={() => setTokenToId(t.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${tokenToId === t.id ? "border-[#9BE4A0]/60 bg-white/10 ring-2 ring-[#9BE4A0]/20" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}>
                              <img src={t.imageUrl} alt={t.label} className="w-7 h-7" />
                              <div className="flex flex-col items-start flex-1">
                                <span className="text-white text-sm font-medium leading-tight">{t.label.split("(")[0].trim()}</span>
                                <span className="text-[#B0B6BE] text-xs leading-tight">{t.chain || "Multi-chain"}</span>
                              </div>
                            </motion.button>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 mt-5">
                      <label className="block text-white/90 text-sm font-medium">Amount</label>
                      {/* Estimation and profitability */}
                      {estimatedReceive !== null && selectedTo && (
                        <div className="text-xs text-[#B0B6BE]">
                          Est. {selectedTo.label.split("(")[0].trim()}: <span className="text-white font-mono">{estimatedReceive.toFixed(6)}</span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={amountTo}
                          onChange={(e) => {
                            setAmountTo(sanitizeAmountInput(e.target.value));
                            if (errors.amountTo) setErrors({ ...errors, amountTo: "" });
                          }}
                          className="flex-1 bg-transparent text-white text-sm outline-none font-mono placeholder:text-white/40"
                          placeholder="0.00"
                          step="any"
                          min="0"
                        />
                        {amountTo && (
                          <button type="button" className="text-xs font-medium text-[#9BE4A0] hover:text-white transition-colors" onClick={() => setAmountTo("")}>
                            CLEAR
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.amountTo && <p className="text-red-400 text-xs mt-1">{errors.amountTo}</p>}

                    {/* Profitability info */}
                    {amountTo && selected && selectedTo && (
                      <div className="mt-2 text-right text-xs">
                        {(() => {
                          const giveUSD = parseFloat(getAmountUSDValue());
                          const recvUSD = parseFloat(getAmountToUSDValue());
                          if (!isFinite(giveUSD) || !isFinite(recvUSD) || giveUSD <= 0 || recvUSD <= 0) return null;
                          const diff = recvUSD - giveUSD;
                          const pct = (diff / giveUSD) * 100;
                          const positive = diff >= 0;
                          return (
                            <span className={positive ? "text-[#9BE4A0]" : "text-red-400"}>
                              {positive ? "+" : ""}
                              {diff.toFixed(2)} USD ({pct.toFixed(2)}%)
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Recipient Principal <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  if (errors.recipient) setErrors({ ...errors, recipient: "" });
                }}
                placeholder="aaaaa-aa... (Leave empty for open trade)"
                className={`w-full bg-white/5 border ${errors.recipient ? "border-red-400" : "border-white/10"} focus:bg-white/10 focus:border-[#9BE4A0] text-white rounded-xl px-4 py-3 outline-none placeholder:text-white/40 font-mono text-sm transition-colors`}
              />
              {errors.recipient && <p className="text-red-400 text-xs mt-1">{errors.recipient}</p>}
              <p className="text-[#B0B6BE] text-xs mt-2">{recipient.trim() ? "Escrow will wait for this specific user to accept" : "Escrow will be open for any user to accept"}</p>
            </div>

            {/* Recipient Address removed: we only need principal */}

            {/* Expire After (max 7 days) */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Expire After</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPIRE_OPTIONS.map((opt) => (
                  <button key={opt.seconds} type="button" onClick={() => setExpireAfter(opt.seconds)} className={`px-3 py-2 rounded-lg border text-xs transition-colors ${expireAfter === opt.seconds ? "bg-white/10 border-[#9BE4A0] text-white" : "bg-white/5 border-white/10 text-[#B0B6BE] hover:bg-white/10 hover:text-white"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[#B0B6BE] text-xs mt-2">Maximum 7 days. Default 15 minutes.</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#9BE4A0] text-white rounded-xl px-4 py-3 outline-none placeholder:text-white/40 resize-none transition-colors" placeholder="Add a note about this payment (e.g., Invoice #123, Payment for services)" />
              <p className="text-[#B0B6BE] text-xs mt-1">{description.length}/500 characters</p>
            </div>

            {/* Review Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Escrow Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">You Give:</span>
                  <span className="text-white font-medium flex items-center gap-2">
                    <img src={selected?.imageUrl} alt="" className="w-4 h-4" />
                    {amount || "0"} {tokenId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">You Receive:</span>
                  <span className="text-white font-medium flex items-center gap-2">
                    <img src={selectedTo?.imageUrl} alt="" className="w-4 h-4" />
                    {amountTo || "0"} {tokenToId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white font-mono text-xs">{recipient.trim() ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "Open trade (anyone can accept)"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-400">Expire After:</span>
                  <span className="text-white font-medium">{EXPIRE_OPTIONS.find((o) => o.seconds === expireAfter)?.label || "15 Minutes"}</span>
                </div>
              </div>
            </div>

            {/* Important Warning */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-orange-400 text-sm font-medium mb-2">Important: Token Transfer</h4>
                  <div className="text-orange-300/90 text-xs space-y-1">
                    <p>
                      •{" "}
                      <strong>
                        {amount || "0"} {selected?.label.split("(")[0].trim()}
                      </strong>{" "}
                      will be transferred from your wallet
                    </p>
                    <p>• Your token balance will decrease by this amount</p>
                    <p>• Tokens will be locked until recipient accepts or expires</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Create P2P Trade</h1>
        <p className="text-gray-400">Secure peer-to-peer trading with escrow protection</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep === step.id ? "bg-[#9BE4A0] text-black ring-4 ring-[#9BE4A0]/20" : currentStep > step.id ? "bg-[#9BE4A0]/50 text-white" : "bg-white/10 text-gray-400"}`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <div className={`text-xs font-medium ${currentStep >= step.id ? "text-white" : "text-gray-500"}`}>{step.title}</div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && <div className={`w-16 h-[2px] mx-4 transition-colors ${currentStep > step.id ? "bg-[#9BE4A0]" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Mobile step indicator */}
        <div className="sm:hidden text-center">
          <p className="text-sm text-gray-400">
            Step {currentStep} of {steps.length}: <span className="text-white font-medium">{steps[currentStep - 1].title}</span>
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-[#181C22] rounded-2xl border border-[#23272F] p-6 sm:p-8">
        {/* Step Content */}
        <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <div>
            {currentStep > 1 && (
              <button onClick={prevStep} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm hidden sm:inline">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < 3 ? (
              <ButtonGreen size="sm" fontWeight="medium" onClick={nextStep}>
                <span className="inline-flex items-center gap-2">
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </ButtonGreen>
            ) : !isAuthenticated ? (
              <ButtonGreen onClick={handleLogin} disabled={submitting}>
                Login to Submit
              </ButtonGreen>
            ) : (
              <ButtonGreen onClick={onSubmit} disabled={submitting || !amount || Number(amount) <= 0}>
                {submitting ? "Processing..." : "Create Escrow"}
              </ButtonGreen>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
