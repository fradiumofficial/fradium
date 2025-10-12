import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { backend } from "declarations/backend";
import { Copy, Clock, User, ArrowRightLeft, ExternalLink, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { formatAmount, sendIcrcToAccountRaw } from "@/core/lib/tokenUtils";
import { formatDate } from "@/core/lib/dateUtils";
import { copyToClipboard } from "@/core/lib/clipboardUtils";
import { useAuth } from "@/core/providers/AuthProvider";
import JoinEscrowModal from "@/core/components/modals/JoinEscrowModal.jsx";
import DepositConfirmationModal from "@/core/components/modals/DepositConfirmationModal.jsx";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";
import toast from "react-hot-toast";

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

// Helper function to get escrow state color and text
function getEscrowStateInfo(state, escrow = null) {
  // Check if escrow is expired (no one accepted/joined)
  const isEscrowExpired = state === "AwaitingAccept" && escrow && Date.now() >= new Date(Number(escrow.expires_at) / 1000000).getTime();

  if (isEscrowExpired) {
    return { color: "bg-orange-500/20 text-orange-400", text: "Expired", icon: AlertCircle };
  }

  switch (state) {
    case "AwaitingAccept":
      return { color: "bg-blue-500/20 text-blue-400", text: "Open", icon: AlertCircle };
    case "Pending":
      return { color: "bg-yellow-500/20 text-yellow-400", text: "Pending", icon: Clock };
    case "Locked":
      return { color: "bg-purple-500/20 text-purple-400", text: "Locked", icon: CheckCircle };
    case "Released":
      return { color: "bg-green-500/20 text-green-400", text: "Completed", icon: CheckCircle };
    case "Rejected":
      return { color: "bg-red-500/20 text-red-400", text: "Rejected", icon: XCircle };
    case "Cancelled":
      return { color: "bg-gray-500/20 text-gray-400", text: "Cancelled", icon: XCircle };
    case "Expired":
      return { color: "bg-orange-500/20 text-orange-400", text: "Expired", icon: AlertCircle };
    case "Suspended":
      return { color: "bg-red-500/20 text-red-400", text: "Suspended", icon: XCircle };
    default:
      return { color: "bg-gray-500/20 text-gray-400", text: "Unknown", icon: AlertCircle };
  }
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

// Milestone Component
const MilestoneItem = ({ title, description, status, isLast = false }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "current":
        return <div className="w-5 h-5 border-2 border-[#7C72FE] rounded-full animate-pulse" />;
      case "pending":
        return <div className="w-5 h-5 border-2 border-white/20 rounded-full" />;
      case "expired":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 border-2 border-white/20 rounded-full" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "current":
        return "text-[#7C72FE]";
      case "pending":
        return "text-white/60";
      case "expired":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        {getStatusIcon()}
        {!isLast && <div className="w-px h-8 bg-white/10 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <div className={`text-sm font-medium ${getStatusColor()}`}>{title}</div>
        <div className="text-xs text-white/60 mt-1">{description}</div>
      </div>
    </div>
  );
};

export default function EscrowDetailPage() {
  const { escrowId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, identity } = useAuth();

  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isDepositing, setIsDepositing] = useState(false);
  const [showDepositConfirmation, setShowDepositConfirmation] = useState(false);
  const [depositData, setDepositData] = useState(null);

  // Helpers: normalize Candid variants and optionals
  const variantName = (v) => (v && typeof v === "object" ? Object.keys(v)[0] : v);
  const normalizeToken = (tok) => variantName(tok);
  const normalizeState = (st) => variantName(st);
  const unwrapOpt = (opt) => (Array.isArray(opt) ? opt[0] ?? null : opt ?? null);

  // Redirect to landing page if auth expired/not logged in
  useEffect(() => {
    if (typeof isAuthenticated === "boolean" && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch escrow details
  const fetchEscrowDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const idNum = Number(escrowId);
      const res = await backend.get_escrow(idNum);

      if (res && res.Ok) {
        const e = res.Ok;
        const normalized = {
          ...e,
          _token_from: normalizeToken(e.token_from),
          _token_to: normalizeToken(e.token_to),
          _state: normalizeState(e.state),
          _recipient: unwrapOpt(e.recipient),
          _description: unwrapOpt(e.description),
          _metadata: unwrapOpt(e.metadata),
        };
        setEscrow(normalized);
      } else {
        setError(res?.Err || "Escrow not found");
      }
    } catch (err) {
      console.error("Error fetching escrow details:", err);
      setError(err.message || "Failed to load escrow details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (escrowId && isAuthenticated) {
      fetchEscrowDetails();
    }
  }, [escrowId, isAuthenticated]);

  // Update time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle copy address
  const handleCopyAddress = (address) => {
    copyToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Handle join escrow
  const handleJoinEscrow = async () => {
    try {
      setIsJoining(true);
      const res = await backend.join_escrow({ escrow_id: escrow.escrow_id });

      if (res?.Ok !== undefined) {
        // Success - refresh escrow details
        await fetchEscrowDetails();
        setShowJoinModal(false);
        // Could show success toast here
      } else {
        console.error("Join escrow failed:", res?.Err);
        // Could show error toast here
      }
    } catch (err) {
      console.error("Join escrow error:", err);
      // Could show error toast here
    } finally {
      setIsJoining(false);
    }
  };

  // Handle deposit confirmation
  const handleConfirmDeposit = async () => {
    if (!depositData) return;

    try {
      setIsDepositing(true);

      // Step 1: Get deposit account
      const res = await backend.get_deposit_account(escrow.escrow_id, depositData.side);
      const ownerText = res.owner.toText ? res.owner.toText() : String(res.owner);
      const sub = Array.isArray(res.sub) && res.sub.length > 0 ? res.sub[0] : undefined;

      // Step 2: Send deposit amount to escrow
      await sendIcrcToAccountRaw(depositData.tokenInfo.symbol, ownerText, sub, depositData.amount);

      // Step 3: Approve FRADIUM fee allowance for escrow canister
      const { fradium_ledger } = await import("declarations/fradium_ledger");
      const { Principal } = await import("@dfinity/principal");

      // Get escrow canister principal from the deposit account response
      const escrowPrincipal = res.owner;

      // Compute required allowance = escrow fee (10_000) + FRADIUM transfer fee
      let fradiumTransferFee = 0n;
      try {
        if (typeof fradium_ledger.icrc1_fee === "function") {
          const f = await fradium_ledger.icrc1_fee();
          fradiumTransferFee = typeof f === "bigint" ? f : BigInt(f);
        }
      } catch (_e) {
        fradiumTransferFee = 0n;
      }

      const escrowFee = 10000n; // 0.0001 FRADIUM in e8s
      const approveAmount = escrowFee + fradiumTransferFee;

      const approveResult = await fradium_ledger.icrc2_approve({
        from_subaccount: [],
        spender: { owner: escrowPrincipal, subaccount: [] },
        amount: approveAmount,
        expires_at: [],
        expected_allowance: [],
        fee: [],
        memo: [],
        created_at_time: [],
      });

      if (approveResult.Err) {
        throw new Error(`Failed to approve FRADIUM fee: ${JSON.stringify(approveResult.Err)}`);
      }

      // Step 4: Mark deposit (this will collect the fee)
      const md = await backend.mark_deposit(escrow.escrow_id);
      if (md?.Err) {
        console.error("mark_deposit error:", md.Err);
        throw new Error(md.Err);
      }

      // Success feedback
      toast.success("Deposit successful! Your tokens have been locked in escrow.");

      await fetchEscrowDetails();
      setShowDepositConfirmation(false);
      setDepositData(null);
    } catch (e) {
      console.error("Deposit failed:", e);

      // Parse error message and show appropriate toast
      const errorMessage = e.message || e.toString();

      if (errorMessage.includes("InsufficientFunds")) {
        if (errorMessage.includes("balance")) {
          toast.error(`Insufficient ${depositData.tokenInfo.symbol} balance. Please check your wallet.`);
        } else {
          toast.error("Insufficient funds for deposit. Please check your balance.");
        }
      } else if (errorMessage.includes("InsufficientAllowance")) {
        toast.error("Insufficient FRADIUM allowance for fee. Please approve more FRADIUM.");
      } else if (errorMessage.includes("Failed to approve FRADIUM fee")) {
        toast.error("Failed to approve FRADIUM fee. Please ensure you have enough FRADIUM balance.");
      } else if (errorMessage.includes("Deposit window expired")) {
        toast.error("Deposit window has expired. Please create a new escrow.");
      } else if (errorMessage.includes("Escrow is not in deposit phase")) {
        toast.error("Escrow is not in deposit phase. Please check the escrow status.");
      } else if (errorMessage.includes("Deposit not detected")) {
        toast.error("Deposit not detected. Please ensure the transfer was successful.");
      } else if (errorMessage.includes("Failed to collect escrow fee")) {
        toast.error("Failed to collect escrow fee. Please ensure you have enough FRADIUM balance and allowance.");
      } else if (errorMessage.includes("ICRC transfer failed")) {
        toast.error("Token transfer failed. Please check your balance and try again.");
      } else if (errorMessage.includes("Network error") || errorMessage.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(`Deposit failed: ${errorMessage}`);
      }
    } finally {
      setIsDepositing(false);
    }
  };

  if (loading) {
    return (
      <motion.div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="flex flex-col gap-2">
            <div className="w-48 h-6 bg-white/10 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="w-full h-64 bg-white/5 rounded-xl animate-pulse"></div>
            <div className="w-full h-32 bg-white/5 rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="w-full h-48 bg-white/5 rounded-xl animate-pulse"></div>
            <div className="w-full h-32 bg-white/5 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !escrow) {
    return (
      <motion.div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-red-400 text-lg font-medium">{error || "Escrow not found"}</div>
          <ButtonPurple onClick={() => navigate("/escrow/list")} size="sm" textSize="text-sm" fontWeight="medium">
            Back to P2P Trade
          </ButtonPurple>
        </div>
      </motion.div>
    );
  }

  const tokenFromSymbol = (escrow.token_from && Object.keys(escrow.token_from)[0]) || escrow._token_from;
  const tokenToSymbol = (escrow.token_to && Object.keys(escrow.token_to)[0]) || escrow._token_to;
  const tokenFromInfo = getTokenInfo(tokenFromSymbol);
  const tokenToInfo = getTokenInfo(tokenToSymbol);
  const stateInfo = getEscrowStateInfo((escrow.state && Object.keys(escrow.state)[0]) || escrow._state, escrow);

  // Use deposit_expires_at for Pending state, otherwise use expires_at
  const depositExpiresAt = escrow.deposit_expires_at ? new Date(Number(escrow.deposit_expires_at) / 1000000) : null;
  const expiresAt = new Date(Number(escrow.expires_at) / 1000000);

  // For Pending state, use deposit expiration time, otherwise use escrow expiration
  const targetTime = stateInfo.text === "Pending" && depositExpiresAt ? depositExpiresAt : expiresAt;
  const timeLeft = targetTime.getTime() - currentTime;
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
  const secondsLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));

  const myPrincipal = identity?.getPrincipal?.().toText?.();
  const senderText = escrow.sender?.toText?.() || escrow.sender?.toString?.();
  const isMine = !!(myPrincipal && senderText && myPrincipal === senderText);
  const expired = currentTime >= targetTime.getTime();
  const canJoin = stateInfo.text === "Open" && !isMine && !expired;
  const inDepositPhase = stateInfo.text === "Pending";

  // Determine milestone status
  const getMilestoneStatus = () => {
    const state = (escrow.state && Object.keys(escrow.state)[0]) || escrow._state;
    const isDepositExpired = stateInfo.text === "Pending" && expired;

    if (isDepositExpired) {
      return { created: "completed", accepted: "completed", locked: "pending", completed: "expired" };
    }

    switch (state) {
      case "AwaitingAccept":
        return { created: "completed", accepted: "current", locked: "pending", completed: "pending" };
      case "Pending":
        return { created: "completed", accepted: "completed", locked: "current", completed: "pending" };
      case "Locked":
        return { created: "completed", accepted: "completed", locked: "completed", completed: "current" };
      case "Released":
        return { created: "completed", accepted: "completed", locked: "completed", completed: "completed" };
      default:
        return { created: "completed", accepted: "pending", locked: "pending", completed: "pending" };
    }
  };

  const milestoneStatus = getMilestoneStatus();

  // Format time left for display
  const formatTimeLeft = () => {
    if (expired) return "Expired";
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
    } else if (minutesLeft > 0) {
      return `${minutesLeft}m ${secondsLeft}s`;
    } else {
      return `${secondsLeft}s`;
    }
  };

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/escrow/list")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-semibold">Trade Details</h1>
            <p className="text-white/60 text-sm">Escrow ID: {escrow.escrow_id.toString()}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${stateInfo.color}`}>
              <stateInfo.icon className="w-3 h-3" />
              {stateInfo.text}
            </div>

            {/* Actions Button */}
            {canJoin ? (
              <ButtonGreen onClick={() => setShowJoinModal(true)} size="sm" textSize="text-sm" fontWeight="medium">
                Join Trade
              </ButtonGreen>
            ) : isMine ? (
              <div className="text-center py-2 px-3 text-white/60 text-sm">Your Trade</div>
            ) : expired ? (
              <div className="text-center py-2 px-3 text-red-400 text-sm">{stateInfo.text === "Pending" ? "Deposit Expired" : "Expired"}</div>
            ) : stateInfo.text !== "Open" ? (
              <div className="text-center py-2 px-3 text-white/60 text-sm">Not Available</div>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Time Left / Deposit Alert */}
      {!expired && (stateInfo.text === "Open" || stateInfo.text === "Pending") && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3 h-3 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="text-yellow-400 text-sm font-medium">
                {stateInfo.text === "Pending" ? "Both parties must deposit within " : "Trade must be completed within "}
                {formatTimeLeft()}
              </div>
              <div className="text-yellow-300/80 text-xs mt-1">{stateInfo.text === "Pending" ? "Please deposit the required amount to escrow. After both deposits, escrow will auto-release." : "This trade will expire automatically if not completed in time"}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column - Trade Info */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Trade Overview */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Trade Overview</h2>

            <div className="space-y-4">
              {/* Trade Amounts */}
              <div className="flex items-center justify-center gap-4 py-4">
                {(() => {
                  if (isMine) {
                    // Jika user adalah pembuat escrow, dia memberikan token_from dan menerima token_to
                    return (
                      <>
                        <div className="flex flex-col items-center gap-2">
                          <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-12 h-12 rounded-full" />
                          <div className="text-center">
                            <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                            <div className="text-white/60 text-xs">{tokenFromInfo.name}</div>
                            <div className="text-[#7C72FE] text-xs font-medium">You Give</div>
                          </div>
                        </div>

                        <ArrowRightLeft className="w-6 h-6 text-white/50" />

                        <div className="flex flex-col items-center gap-2">
                          <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-12 h-12 rounded-full" />
                          <div className="text-center">
                            <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                            <div className="text-white/60 text-xs">{tokenToInfo.name}</div>
                            <div className="text-[#7C72FE] text-xs font-medium">You Receive</div>
                          </div>
                        </div>
                      </>
                    );
                  } else {
                    // Jika user bukan pembuat escrow, dia memberikan token_to dan menerima token_from
                    return (
                      <>
                        <div className="flex flex-col items-center gap-2">
                          <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-12 h-12 rounded-full" />
                          <div className="text-center">
                            <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                            <div className="text-white/60 text-xs">{tokenToInfo.name}</div>
                            <div className="text-[#7C72FE] text-xs font-medium">You Give</div>
                          </div>
                        </div>

                        <ArrowRightLeft className="w-6 h-6 text-white/50" />

                        <div className="flex flex-col items-center gap-2">
                          <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-12 h-12 rounded-full" />
                          <div className="text-center">
                            <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                            <div className="text-white/60 text-xs">{tokenFromInfo.name}</div>
                            <div className="text-[#7C72FE] text-xs font-medium">You Receive</div>
                          </div>
                        </div>
                      </>
                    );
                  }
                })()}
              </div>

              {/* Trade Type */}
              <div className="text-center">
                <div className="text-white/60 text-xs uppercase tracking-wide">Trade Type</div>
                <div className="text-white text-sm font-medium">{Array.isArray(escrow.recipient) ? (escrow.recipient[0] ? "Invited Trade" : "Open Trade") : escrow._recipient ? "Invited Trade" : "Open Trade"}</div>
              </div>
            </div>
          </motion.div>

          {/* Participants */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Participants</h2>

            <div className="space-y-4">
              {/* Trader */}
              <div className="space-y-2">
                <div className="text-white/60 text-xs uppercase tracking-wide">Trader</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-white text-sm font-mono break-all">{escrow.sender.toString()}</div>
                  <button onClick={() => handleCopyAddress(escrow.sender.toString())} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group" title="Copy address">
                    {copiedAddress === escrow.sender.toString() ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </motion.div>
                    ) : (
                      <Copy size={16} className="text-white/70 group-hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recipient (if specified) */}
              {Array.isArray(escrow.recipient)
                ? escrow.recipient[0] && (
                    <div className="space-y-2">
                      <div className="text-white/60 text-xs uppercase tracking-wide">Recipient</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-white text-sm font-mono break-all">{escrow.recipient.toString()}</div>
                        <button onClick={() => handleCopyAddress(escrow.recipient.toString())} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group" title="Copy address">
                          {copiedAddress === escrow.recipient.toString() ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12"></polyline>
                              </svg>
                            </motion.div>
                          ) : (
                            <Copy size={16} className="text-white/70 group-hover:text-white transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                : escrow._recipient && (
                    <div className="space-y-2">
                      <div className="text-white/60 text-xs uppercase tracking-wide">Recipient</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-white text-sm font-mono break-all">{escrow._recipient.toString?.() || String(escrow._recipient)}</div>
                      </div>
                    </div>
                  )}
            </div>
          </motion.div>

          {/* Description */}
          {escrow.description ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6 flex-grow">
              <h2 className="text-white text-lg font-semibold mb-4">Description</h2>
              <div className="text-white text-sm">{escrow.description}</div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6 flex-grow">
              <h2 className="text-white text-lg font-semibold mb-4">Description</h2>
              <div className="text-white/60 text-sm">No description provided</div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Timeline</h2>

            <div className="space-y-2">
              <MilestoneItem title="Trade Created" description={formatDate(escrow.created_at)} status={milestoneStatus.created} />
              <MilestoneItem title="Trade Accepted" description={escrow.accepted_at ? formatDate(escrow.accepted_at) : "Waiting for acceptance"} status={milestoneStatus.accepted} />
              <MilestoneItem title="Tokens Locked" description="Both parties' tokens are locked in escrow" status={milestoneStatus.locked} />
              <MilestoneItem title={milestoneStatus.completed === "expired" ? "Escrow Failed" : "Trade Completed"} description={milestoneStatus.completed === "expired" ? "Escrow not fulfilled due to expired deposit window" : escrow.released_at ? formatDate(escrow.released_at) : "Waiting for completion"} status={milestoneStatus.completed} isLast={true} />
            </div>
          </motion.div>

          {/* Timing Info */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6 flex-grow">
            <h2 className="text-white text-lg font-semibold mb-4">Timing</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Created</span>
                <span className="text-white text-sm">{formatDate(escrow.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Expires</span>
                <span className="text-white text-sm">{formatDate(targetTime.getTime() * 1000000)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Time Left</span>
                <span className={`text-sm font-medium ${expired ? "text-red-400" : "text-white"}`}>{formatTimeLeft()}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Actions</h2>

            <div className="space-y-3">
              {(() => {
                const isDepositExpired = stateInfo.text === "Pending" && expired;

                if (isDepositExpired) {
                  return <div className="text-center py-3 text-red-400 text-sm">Deposit window has expired. Escrow not fulfilled.</div>;
                }

                if (canJoin) {
                  return (
                    <ButtonGreen fullWidth onClick={() => setShowJoinModal(true)} size="md" textSize="text-base" fontWeight="medium">
                      Join Trade
                    </ButtonGreen>
                  );
                } else if (inDepositPhase) {
                  const side = isMine ? "from" : "to";
                  const sym = isMine ? tokenFromInfo.symbol : tokenToInfo.symbol;
                  const amt = isMine ? escrow.amount_from : escrow.amount_to;
                  // Check if current user has already deposited
                  const userAlreadyDeposited = isMine ? escrow.deposit_from_done : escrow.deposit_to_done;
                  const counterpartyDeposited = isMine ? escrow.deposit_to_done : escrow.deposit_from_done;

                  return (
                    <div className="space-y-3">
                      <div className="text-white/70 text-sm">{userAlreadyDeposited ? "You have deposited. Waiting for counterparty to deposit." : `Please deposit ${formatEscrowAmount(sym, amt)} to the escrow canister.`}</div>
                      {!userAlreadyDeposited && (
                        <ButtonGreen
                          fullWidth
                          disabled={isDepositing}
                          onClick={() => {
                            const tokenInfo = isMine ? tokenFromInfo : tokenToInfo;
                            setDepositData({
                              tokenInfo,
                              amount: amt,
                              escrowId: escrow.escrow_id,
                              side,
                            });
                            setShowDepositConfirmation(true);
                          }}
                          size="md"
                          textSize="text-base"
                          fontWeight="medium">
                          {isDepositing ? "Processing..." : "Deposit Now"}
                        </ButtonGreen>
                      )}
                    </div>
                  );
                } else if (isMine) {
                  return <div className="text-center py-3 text-white/60 text-sm">This is your trade</div>;
                } else if (expired) {
                  return <div className="text-center py-3 text-red-400 text-sm">Trade has expired</div>;
                } else if (stateInfo.text !== "Open") {
                  return <div className="text-center py-3 text-white/60 text-sm">Trade is not available for joining</div>;
                }
                return null;
              })()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Join Escrow Modal */}
      <JoinEscrowModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} escrow={escrow} onConfirm={handleJoinEscrow} isJoining={isJoining} />

      {/* Deposit Confirmation Modal */}
      <DepositConfirmationModal
        isOpen={showDepositConfirmation}
        onClose={() => {
          setShowDepositConfirmation(false);
          setDepositData(null);
        }}
        onConfirm={handleConfirmDeposit}
        tokenInfo={depositData?.tokenInfo}
        amount={depositData?.amount}
        escrowId={depositData?.escrowId}
        isDepositing={isDepositing}
      />
    </motion.div>
  );
}
