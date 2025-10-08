import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { backend } from "declarations/backend";
import { Copy, Clock, User, ArrowRightLeft, ExternalLink, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { formatAmount } from "@/core/lib/tokenUtils";
import { formatDate } from "@/core/lib/dateUtils";
import { copyToClipboard } from "@/core/lib/clipboardUtils";
import { useAuth } from "@/core/providers/AuthProvider";
import JoinEscrowModal from "@/core/components/modals/JoinEscrowModal.jsx";
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

// Helper function to get escrow state color and text
function getEscrowStateInfo(state) {
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
        return <div className="w-5 h-5 border-2 border-[#9BE4A0] rounded-full animate-pulse" />;
      case "pending":
        return <div className="w-5 h-5 border-2 border-white/20 rounded-full" />;
      default:
        return <div className="w-5 h-5 border-2 border-white/20 rounded-full" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "current":
        return "text-[#9BE4A0]";
      case "pending":
        return "text-white/60";
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

      // Get all escrows and find the one with matching ID
      const res = await backend.get_all_escrows_paginated(0, 1000);

      if (res && Array.isArray(res.items)) {
        const targetEscrow = res.items.find((e) => e.escrow_id.toString() === escrowId);

        if (targetEscrow) {
          const normalized = {
            ...targetEscrow,
            _token_from: normalizeToken(targetEscrow.token_from),
            _token_to: normalizeToken(targetEscrow.token_to),
            _state: normalizeState(targetEscrow.state),
            _recipient: unwrapOpt(targetEscrow.recipient),
            _description: unwrapOpt(targetEscrow.description),
            _metadata: unwrapOpt(targetEscrow.metadata),
          };
          setEscrow(normalized);
        } else {
          setError("Escrow not found");
        }
      } else {
        setError("Failed to fetch escrow details");
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
          <button onClick={() => navigate("/escrow/p2p-trade")} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
            Back to P2P Trade
          </button>
        </div>
      </motion.div>
    );
  }

  const tokenFromSymbol = (escrow.token_from && Object.keys(escrow.token_from)[0]) || escrow._token_from;
  const tokenToSymbol = (escrow.token_to && Object.keys(escrow.token_to)[0]) || escrow._token_to;
  const tokenFromInfo = getTokenInfo(tokenFromSymbol);
  const tokenToInfo = getTokenInfo(tokenToSymbol);
  const stateInfo = getEscrowStateInfo((escrow.state && Object.keys(escrow.state)[0]) || escrow._state);

  const expiresAt = new Date(Number(escrow.expires_at) / 1000000);
  const timeLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  const myPrincipal = identity?.getPrincipal?.().toText?.();
  const senderText = escrow.sender?.toText?.() || escrow.sender?.toString?.();
  const isMine = !!(myPrincipal && senderText && myPrincipal === senderText);
  const expired = Date.now() >= expiresAt.getTime();
  const canJoin = stateInfo.text === "Open" && !isMine && !expired;

  // Determine milestone status
  const getMilestoneStatus = () => {
    const state = (escrow.state && Object.keys(escrow.state)[0]) || escrow._state;
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

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/escrow/p2p-trade")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-semibold">Trade Details</h1>
            <p className="text-white/60 text-sm">Escrow ID: {escrow.escrow_id.toString()}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${stateInfo.color}`}>
            <stateInfo.icon className="w-3 h-3" />
            {stateInfo.text}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Trade Info */}
        <div className="space-y-6">
          {/* Trade Overview */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Trade Overview</h2>

            <div className="space-y-4">
              {/* Trade Amounts */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-12 h-12 rounded-full" />
                  <div className="text-center">
                    <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                    <div className="text-white/60 text-xs">{tokenFromInfo.name}</div>
                  </div>
                </div>

                <ArrowRightLeft className="w-6 h-6 text-white/50" />

                <div className="flex flex-col items-center gap-2">
                  <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-12 h-12 rounded-full" />
                  <div className="text-center">
                    <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                    <div className="text-white/60 text-xs">{tokenToInfo.name}</div>
                  </div>
                </div>
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
                  <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow.sender.toString()}</div>
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
                        <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow.recipient.toString()}</div>
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
                        <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow._recipient.toString?.() || String(escrow._recipient)}</div>
                      </div>
                    </div>
                  )}
            </div>
          </motion.div>

          {/* Description */}
          {escrow.description && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
              <h2 className="text-white text-lg font-semibold mb-4">Description</h2>
              <div className="text-white text-sm bg-white/5 px-3 py-2 rounded-lg">{escrow.description}</div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6">
          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Timeline</h2>

            <div className="space-y-2">
              <MilestoneItem title="Trade Created" description={formatDate(escrow.created_at)} status={milestoneStatus.created} />
              <MilestoneItem title="Trade Accepted" description={escrow.accepted_at ? formatDate(escrow.accepted_at) : "Waiting for acceptance"} status={milestoneStatus.accepted} />
              <MilestoneItem title="Tokens Locked" description="Both parties' tokens are locked in escrow" status={milestoneStatus.locked} />
              <MilestoneItem title="Trade Completed" description={escrow.released_at ? formatDate(escrow.released_at) : "Waiting for completion"} status={milestoneStatus.completed} isLast={true} />
            </div>
          </motion.div>

          {/* Timing Info */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Timing</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Created</span>
                <span className="text-white text-sm">{formatDate(escrow.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Expires</span>
                <span className="text-white text-sm">{formatDate(escrow.expires_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Time Left</span>
                <span className={`text-sm font-medium ${expired ? "text-red-400" : "text-white"}`}>{expired ? "Expired" : hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="rounded-xl bg-white/[0.02] border border-white/10 p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Actions</h2>

            <div className="space-y-3">
              {canJoin ? (
                <ButtonGreen fullWidth onClick={() => setShowJoinModal(true)} size="md" textSize="text-base" fontWeight="medium">
                  Join Trade
                </ButtonGreen>
              ) : isMine ? (
                <div className="text-center py-3 text-white/60 text-sm">This is your trade</div>
              ) : expired ? (
                <div className="text-center py-3 text-red-400 text-sm">Trade has expired</div>
              ) : stateInfo.text !== "Open" ? (
                <div className="text-center py-3 text-white/60 text-sm">Trade is not available for joining</div>
              ) : null}

              <button onClick={() => navigate("/escrow/p2p-trade")} className="w-full py-3 rounded-lg font-medium transition-colors bg-white/10 text-white hover:bg-white/20">
                Back to P2P Trade
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Join Escrow Modal */}
      <JoinEscrowModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} escrow={escrow} onConfirm={handleJoinEscrow} isJoining={isJoining} />
    </motion.div>
  );
}
