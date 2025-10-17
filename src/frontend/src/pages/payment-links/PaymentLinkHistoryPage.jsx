import React, { useEffect, useState } from "react";
import { backend } from "declarations/backend";
import toast from "react-hot-toast";
import { Copy, ExternalLink, X, Loader2, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig";
import { getTokenIconBySymbol, formatAmount as formatAmountDisplay } from "@/core/lib/tokenUtils";

const PaymentLinkHistoryPage = () => {
  const [myLinks, setMyLinks] = useState([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const tokenOptions = TOKENS_CONFIG.filter((token) => token.type !== "sns").map((token) => ({
    value: token.symbol === "BTC" ? "BTC" : token.symbol === "ETH" ? "ETH" : token.symbol === "SOL" ? "SOL" : token.symbol === "ICP" ? "ICP" : token.symbol === "FRADIUM" ? "Fradium" : token.symbol === "ckBTC" ? "ckBTC" : token.symbol === "ckETH" ? "ckETH" : token.symbol,
    label: token.name,
    symbol: token.symbol,
    decimals: token.decimals || 8,
    imageUrl: token.imageUrl,
  }));

  useEffect(() => {
    loadMyLinks();
  }, []);

  const loadMyLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const result = await backend.get_my_payment_links();
      if ("Ok" in result) {
        setMyLinks(result.Ok);
      } else {
        toast.error("Failed to load links: " + result.Err);
      }
    } catch (error) {
      toast.error("Error loading links: " + error.message);
    } finally {
      setIsLoadingLinks(false);
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

  const formatAmountPretty = (amountNat, token) => {
    const t = tokenOptions.find((opt) => opt.value === token);
    const decimals = t ? t.decimals : 8;
    const human = Number(amountNat) / 10 ** decimals;
    return formatAmountDisplay(human);
  };

  const formatDate = (nanos) => {
    const date = new Date(Number(nanos) / 1_000_000);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "text-[#FFE865] bg-[#FFE865]/10";
      case "Completed":
        return "text-blue-400 bg-blue-400/10";
      case "Expired":
        return "text-amber-400 bg-amber-400/10";
      case "Cancelled":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/70 bg-white/5";
    }
  };

  const getStatusText = (status) => {
    return Object.keys(status)[0];
  };

  const handleCancelLink = async (linkId) => {
    if (!confirm("Are you sure you want to cancel this payment link?")) {
      return;
    }
    try {
      const result = await backend.cancel_payment_link(linkId);
      if ("Ok" in result) {
        toast.success("Payment link cancelled");
        loadMyLinks();
      } else {
        toast.error("Failed to cancel: " + result.Err);
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const toggleExpanded = (linkId) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) {
        next.delete(linkId);
      } else {
        next.add(linkId);
      }
      return next;
    });
  };

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">Payment Link History</h1>
        <p className="text-white/60 text-sm">Riwayat link pembayaran yang sudah dibuat</p>
      </motion.div>

      {/* List Section */}
      <div className="w-full">
        {/* Loading State - Skeleton */}
        {isLoadingLinks && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between px-6 py-5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                    <div className="flex flex-col gap-2">
                      <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="w-16 h-6 bg-white/5 rounded-full animate-pulse" />
                  </div>
                </div>
                {idx !== 4 && <div className="h-px bg-white/10 mx-6" />}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingLinks && myLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <ArrowRightLeft className="w-8 h-8 text-white/50" />
            </div>
            <div className="text-[#B0B6BE] text-sm text-center">No payment links found</div>
          </div>
        )}

        {/* List */}
        {!isLoadingLinks && myLinks.length > 0 && (
          <AnimatePresence>
            {myLinks.map((link, index) => {
              const status = getStatusText(link.status);
              const linkUrl = `${window.location.origin}/paylink/${link.id}`;
              const tokenSymbol = Object.keys(link.token)[0];
              const tokenInfo = tokenOptions.find((t) => t.value === tokenSymbol || t.symbol === tokenSymbol);
              const tokenIcon = getTokenIconBySymbol(tokenInfo?.symbol || tokenSymbol);

              const isExpanded = expandedItems.has(link.id);

              return (
                <motion.div key={link.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + index * 0.06 }} className="group">
                  <div className="flex items-center justify-between px-6 py-5 rounded-xl transition-colors group-hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleExpanded(link.id)}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">{tokenIcon && <img src={tokenIcon} alt={tokenInfo?.symbol || tokenSymbol} className="w-8 h-8 rounded-full" />}</div>
                      <div className="flex flex-col">
                        <div className="text-white text-base font-medium leading-tight">
                          {formatAmountPretty(link.amount, tokenSymbol)} {getTokenLabel(tokenSymbol)}
                        </div>
                        <div className="text-white/60 text-sm flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{status}</span>
                          <span className="opacity-60">•</span>
                          <span>{formatDate(link.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "Active" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelLink(link.id);
                          }}
                          className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400"
                          title="Cancel"
                          aria-label="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(linkUrl);
                        }}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                        title="Copy link"
                        aria-label="Copy link">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a href={linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" title="Open" aria-label="Open">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/50">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <div className="px-6 pb-5 bg-white/[0.02] border-t border-white/10">
                      <div className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Link ID</div>
                            <div className="text-white text-sm font-mono break-all">{link.id}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Status</div>
                            <div className="inline-block">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>{status}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Amount</div>
                            <div className="flex items-center gap-2">
                              {tokenIcon && <img src={tokenIcon} alt={tokenInfo?.symbol || tokenSymbol} className="w-5 h-5 rounded-full" />}
                              <div className="text-white text-sm font-medium">
                                {formatAmountPretty(link.amount, tokenSymbol)} {getTokenLabel(tokenSymbol)}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Payment URL</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-white text-sm font-mono truncate">{linkUrl}</div>
                              <button onClick={() => copyToClipboard(linkUrl)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Copy URL">
                                <Copy size={16} className="text-white/70" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-white/50 text-xs">Created</div>
                            <div className="text-white text-sm">{formatDate(link.created_at)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-white/50 text-xs">Expires</div>
                            <div className="text-white text-sm">{formatDate(link.expires_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {index !== myLinks.length - 1 && <div className="h-px bg-white/10 mx-6" />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentLinkHistoryPage;
