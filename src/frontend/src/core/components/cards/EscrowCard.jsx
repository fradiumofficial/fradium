import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Clock, User, ArrowRightLeft } from "lucide-react";
import { formatDate } from "@/core/lib/dateUtils";
import { copyToClipboard } from "@/core/lib/clipboardUtils";
import { useNavigate } from "react-router-dom";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { getTokenIconBySymbol } from "@/core/lib/tokenUtils.js";

// Helper function to get token info
function getTokenInfo(tokenType) {
  // Normalize token symbol
  const normalizedSymbol = typeof tokenType === "string" ? tokenType.toUpperCase() : tokenType;

  // Find token in configuration
  const token = TOKENS_CONFIG.find((t) => t.symbol === normalizedSymbol || t.symbol?.toUpperCase() === normalizedSymbol || t.name?.toLowerCase() === tokenType?.toLowerCase());

  if (token) {
    return {
      symbol: token.symbol,
      name: token.name,
      imageUrl: getTokenIconBySymbol(token.symbol),
      type: token.type,
    };
  }

  // Fallback for unknown tokens using getTokenIconBySymbol
  return {
    symbol: normalizedSymbol,
    name: normalizedSymbol,
    imageUrl: getTokenIconBySymbol(normalizedSymbol),
    type: "unknown",
  };
}

// Helper function to get escrow state color and text
function getEscrowStateInfo(state, escrow = null) {
  // Check if escrow is expired (no one accepted/joined)
  const isEscrowExpired = state === "AwaitingAccept" && escrow && Date.now() >= new Date(Number(escrow.expires_at) / 1000000).getTime();

  // Check if deposit is expired for Pending state
  const isDepositExpired = state === "Pending" && escrow && escrow.deposit_expires_at && Date.now() >= new Date(Number(escrow.deposit_expires_at) / 1000000).getTime();

  if (isEscrowExpired) {
    return { color: "bg-orange-500/20 text-orange-400", text: "Expired" };
  }

  if (isDepositExpired) {
    return { color: "bg-red-500/20 text-red-400", text: "Deposit Expired" };
  }

  switch (state) {
    case "AwaitingAccept":
      return { color: "bg-blue-500/20 text-blue-400", text: "Open" };
    case "Pending":
      return { color: "bg-yellow-500/20 text-yellow-400", text: "Pending" };
    case "Locked":
      return { color: "bg-purple-500/20 text-purple-400", text: "Locked" };
    case "Released":
      return { color: "bg-green-500/20 text-green-400", text: "Completed" };
    case "Rejected":
      return { color: "bg-red-500/20 text-red-400", text: "Rejected" };
    case "Cancelled":
      return { color: "bg-gray-500/20 text-gray-400", text: "Cancelled" };
    case "Expired":
      return { color: "bg-orange-500/20 text-orange-400", text: "Expired" };
    case "Suspended":
      return { color: "bg-red-500/20 text-red-400", text: "Suspended" };
    default:
      return { color: "bg-gray-500/20 text-gray-400", text: "Unknown" };
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

export default function EscrowCard({
  escrow,
  index,
  isExpanded,
  onToggleExpanded,
  variant = "default", // "default", "my-trades", "pending-trades", "history"
  identity,
  showExternalLink = false,
  showJoinButton = false,
  onJoinTrade = null,
  canJoin = false,
}) {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Helpers: normalize Candid variants and optionals
  const variantName = (v) => (v && typeof v === "object" ? Object.keys(v)[0] : v);
  const unwrapOpt = (opt) => (Array.isArray(opt) ? opt[0] ?? null : opt ?? null);

  // Handle copy address
  const handleCopyAddress = (address) => {
    copyToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Shorten address function
  const shortenAddress = (address) => {
    if (!address || address.length <= 10) return address;
    const start = address.substring(0, 7);
    const end = address.substring(address.length - 2);
    return `${start}...${end}`;
  };

  // Extract escrow data
  const tokenFromSymbol = variantName(escrow.token_from ?? escrow._token_from);
  const tokenToSymbol = variantName(escrow.token_to ?? escrow._token_to);
  const tokenFromInfo = getTokenInfo(tokenFromSymbol);
  const tokenToInfo = getTokenInfo(tokenToSymbol);
  const stateInfo = getEscrowStateInfo(variantName(escrow.state ?? escrow._state), escrow);

  const expiresAt = new Date(Number(escrow.expires_at) / 1000000);
  const timeLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  // Determine if this is user's escrow
  const myPrincipal = identity?.getPrincipal?.().toText?.();
  const senderText = escrow.sender?.toText?.() || escrow.sender?.toString?.();
  const isMine = !!(myPrincipal && senderText && myPrincipal === senderText);

  // Get display text based on variant
  const getDisplayText = () => {
    switch (variant) {
      case "pending-trades":
        return "Pending";
      case "my-trades":
        return escrow._type === "sent" ? "Created by you" : "Joined by you";
      case "history":
        return escrow._type === "sent" ? "Created by you" : "Joined by you";
      default:
        return "Open Trade";
    }
  };

  // Get action buttons based on variant
  const getActionButtons = () => {
    if (variant === "pending-trades") {
      return (
        <div className="flex gap-2">
          <ButtonGreen fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
            Accept Trade
          </ButtonGreen>
          <ButtonPurple fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
            View Details
          </ButtonPurple>
        </div>
      );
    } else if (variant === "my-trades") {
      return (
        <ButtonPurple fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
          View Details
        </ButtonPurple>
      );
    } else if (variant === "history") {
      return (
        <ButtonPurple fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
          View Details
        </ButtonPurple>
      );
    } else {
      // Default variant (P2P Trade)
      const expired = Date.now() >= new Date(Number(escrow.expires_at) / 1000000).getTime();
      const canJoinTrade = stateInfo.text === "Open" && !isMine && !expired;

      if (showJoinButton) {
        return (
          <div className="flex gap-2">
            <ButtonGreen
              fullWidth
              disabled={!canJoinTrade}
              onClick={() => {
                if (canJoinTrade && onJoinTrade) {
                  onJoinTrade(escrow);
                }
              }}
              size="sm"
              textSize="text-xs"
              fontWeight="medium">
              {isMine ? "You cannot join your own trade" : expired ? "Expired" : stateInfo.text === "Open" ? "Join Trade" : "Not Joinable"}
            </ButtonGreen>
            <ButtonPurple fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
              View Details
            </ButtonPurple>
          </div>
        );
      } else {
        return (
          <ButtonPurple fullWidth onClick={() => navigate(`/escrow/detail/${escrow.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
            View Details
          </ButtonPurple>
        );
      }
    }
  };

  return (
    <motion.div className="group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + index * 0.06 }}>
      <div className="flex items-center justify-between px-6 py-5 rounded-xl transition-colors group-hover:bg-white/[0.04] cursor-pointer" onClick={() => onToggleExpanded(escrow.escrow_id)}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-8 h-8 rounded-full" />
            <ArrowRightLeft className="w-4 h-4 text-white/50" />
            <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-8 h-8 rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="text-white text-base font-medium leading-tight">
              {formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)} → {formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}
            </div>
            <div className="text-white/60 text-sm flex items-center gap-2">
              <User className="w-3 h-3" />
              {getDisplayText()}
              <Clock className="w-3 h-3 ml-2" />
              {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${minutesLeft}m left`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showExternalLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/escrow/detail/${escrow.escrow_id}`);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Open details"
              aria-label="Open details">
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
        <div className="px-6 pb-5 bg-white/[0.02] border-t border-white/10">
          <div className="pt-4 space-y-4">
            {/* Trade Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-white/60 text-xs uppercase tracking-wide">Escrow ID</div>
                <div className="text-white text-sm font-mono">{escrow.escrow_id.toString()}</div>
              </div>
              <div className="space-y-2">
                <div className="text-white/60 text-xs uppercase tracking-wide">Status</div>
                <div className="inline-block">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${stateInfo.color}`}>{stateInfo.text}</div>
                </div>
              </div>
            </div>

            {/* Trade Amounts */}
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                if (isMine) {
                  // Jika user adalah pembuat escrow, dia memberikan token_from dan menerima token_to
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="text-white/60 text-xs uppercase tracking-wide">You Give</div>
                        <div className="flex items-center gap-2">
                          <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-5 h-5 rounded-full" />
                          <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-white/60 text-xs uppercase tracking-wide">You Receive</div>
                        <div className="flex items-center gap-2">
                          <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-5 h-5 rounded-full" />
                          <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                        </div>
                      </div>
                    </>
                  );
                } else {
                  // Jika user bukan pembuat escrow, dia memberikan token_to dan menerima token_from
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="text-white/60 text-xs uppercase tracking-wide">You Give</div>
                        <div className="flex items-center gap-2">
                          <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-5 h-5 rounded-full" />
                          <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenToInfo.symbol, escrow.amount_to)}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-white/60 text-xs uppercase tracking-wide">You Receive</div>
                        <div className="flex items-center gap-2">
                          <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-5 h-5 rounded-full" />
                          <div className="text-white text-sm font-medium">{formatEscrowAmount(tokenFromInfo.symbol, escrow.amount_from)}</div>
                        </div>
                      </div>
                    </>
                  );
                }
              })()}
            </div>

            {/* Recipient (if specified) */}
            {Array.isArray(escrow.recipient)
              ? escrow.recipient[0] && (
                  <div className="space-y-2">
                    <div className="text-white/60 text-xs uppercase tracking-wide">Recipient</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-white text-sm font-mono">{shortenAddress(escrow.recipient.toString())}</div>
                      <div className="flex gap-1">
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
                  </div>
                )
              : escrow._recipient && (
                  <div className="space-y-2">
                    <div className="text-white/60 text-xs uppercase tracking-wide">Recipient</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-white text-sm font-mono">{shortenAddress(escrow._recipient.toString?.() || String(escrow._recipient))}</div>
                    </div>
                  </div>
                )}

            {/* Sender Address */}
            <div className="space-y-2">
              <div className="text-white/60 text-xs uppercase tracking-wide">Trader</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-white text-sm font-mono">{shortenAddress(escrow.sender.toString())}</div>
                <div className="flex gap-1">
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
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-white/50 text-xs">Created</div>
                <div className="text-white text-sm">{formatDate(escrow.created_at)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-white/50 text-xs">Expires</div>
                <div className="text-white text-sm">{formatDate(escrow.expires_at)}</div>
              </div>
            </div>

            {/* Description */}
            {escrow.description && (
              <div className="space-y-2">
                <div className="text-white/60 text-xs uppercase tracking-wide">Description</div>
                <div className="text-white text-sm">{escrow.description}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">{getActionButtons()}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
