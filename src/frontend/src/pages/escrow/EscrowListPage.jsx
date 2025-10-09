import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { backend } from "declarations/backend";
import { Copy, ExternalLink, Clock, User, ArrowRightLeft } from "lucide-react";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { formatAmount } from "@/core/lib/tokenUtils";
import { formatDate } from "@/core/lib/dateUtils";
import { formatAddress } from "@/core/lib/stringUtils";
import { copyToClipboard } from "@/core/lib/clipboardUtils";
import { useAuth } from "@/core/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { jsonStringify } from "@/core/lib/canisterUtils";
import JoinEscrowModal from "@/core/components/modals/JoinEscrowModal.jsx";

// Skeleton Loading Component
function SkeletonItem() {
  return (
    <div className="flex items-center justify-between px-6 py-5 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
        <div className="flex flex-col gap-2">
          <div className="w-32 h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="w-24 h-3 bg-white/5 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="w-20 h-4 bg-white/10 rounded animate-pulse"></div>
        <div className="w-16 h-6 bg-white/5 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

function SkeletonList({ count = 5 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx}>
          <SkeletonItem />
          {idx !== count - 1 && <div className="h-px bg-white/10 mx-6" />}
        </div>
      ))}
    </div>
  );
}

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

export default function EscrowListPage() {
  const { isAuthenticated, identity } = useAuth();
  const navigate = useNavigate();

  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    tokenFrom: "all",
    tokenTo: "all",
    state: "all",
  });
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Helpers: normalize Candid variants and optionals from canister responses
  const variantName = (v) => (v && typeof v === "object" ? Object.keys(v)[0] : v);
  const normalizeToken = (tok) => variantName(tok);
  const normalizeState = (st) => variantName(st);
  const unwrapOpt = (opt) => (Array.isArray(opt) ? opt[0] ?? null : opt ?? null);

  // Amount formatting helpers (base units -> human friendly like AssetPage)
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
      // trim trailing zeros
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

  // Redirect to landing page if auth expired/not logged in
  useEffect(() => {
    if (typeof isAuthenticated === "boolean" && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch open escrows (server-side pagination)
  const fetchOpenEscrows = async (offset = 0, isLoadMore = false) => {
    console.log("Fetching open escrows...");
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const res = await backend.get_open_escrows_paginated(offset, ITEMS_PER_PAGE);
      console.log("Open escrows response:", res);

      if (res && Array.isArray(res.items)) {
        const normalized = res.items.map((e) => ({
          ...e,
          _token_from: normalizeToken(e.token_from),
          _token_to: normalizeToken(e.token_to),
          _state: normalizeState(e.state),
          _recipient: unwrapOpt(e.recipient),
          _description: unwrapOpt(e.description),
          _metadata: unwrapOpt(e.metadata),
        }));

        if (isLoadMore) {
          setEscrows((prev) => [...prev, ...normalized]);
        } else {
          setEscrows(normalized);
        }

        const total = Number(res.total ?? 0);
        const pageLen = res.items?.length || 0;
        setTotalCount(total);
        setCurrentOffset(offset + pageLen);
        setHasMore(offset + pageLen < total);

        console.log(`Fetched ${normalized.length} open escrows`);
      } else {
        setEscrows([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching open escrows:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchOpenEscrows(0, false);
    }
  }, [isAuthenticated]);

  // Load more items
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOpenEscrows(currentOffset, true);
    }
  };

  // Toggle expand/collapse
  const toggleExpanded = (escrowId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(escrowId)) {
        newSet.delete(escrowId);
      } else {
        newSet.add(escrowId);
      }
      return newSet;
    });
  };

  // Handle copy address
  const handleCopyAddress = (address) => {
    copyToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Filter and search escrows
  const getFilteredEscrows = () => {
    return escrows.filter((escrow) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tokenFromInfo = getTokenInfo(variantName(escrow.token_from ?? escrow._token_from));
        const tokenToInfo = getTokenInfo(variantName(escrow.token_to ?? escrow._token_to));

        const tokenFromMatch = tokenFromInfo.symbol.toLowerCase().includes(query) || tokenFromInfo.name.toLowerCase().includes(query);
        const tokenToMatch = tokenToInfo.symbol.toLowerCase().includes(query) || tokenToInfo.name.toLowerCase().includes(query);
        const amountMatch = escrow.amount_from.toString().includes(query) || escrow.amount_to.toString().includes(query);

        if (!tokenFromMatch && !tokenToMatch && !amountMatch) {
          return false;
        }
      }

      // Token From filter
      if (filterOptions.tokenFrom !== "all") {
        const escTokFrom = variantName(escrow.token_from ?? escrow._token_from);
        if (escTokFrom !== filterOptions.tokenFrom) {
          return false;
        }
      }

      // Token To filter
      if (filterOptions.tokenTo !== "all") {
        const escTokTo = variantName(escrow.token_to ?? escrow._token_to);
        if (escTokTo !== filterOptions.tokenTo) {
          return false;
        }
      }

      // State filter
      if (filterOptions.state !== "all") {
        const escState = variantName(escrow.state ?? escrow._state);
        if (escState !== filterOptions.state) {
          return false;
        }
      }

      return true;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterOptions({
      tokenFrom: "all",
      tokenTo: "all",
      state: "all",
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterOptions.tokenFrom !== "all") count++;
    if (filterOptions.tokenTo !== "all") count++;
    if (filterOptions.state !== "all") count++;
    return count;
  };

  // Handle join escrow
  const handleJoinEscrow = async () => {
    try {
      setIsJoining(true);
      const res = await backend.join_escrow({ escrow_id: selectedEscrow.escrow_id });

      if (res?.Ok !== undefined) {
        // Success - close modal and redirect to detail page
        setShowJoinModal(false);
        navigate(`/escrow/detail/${selectedEscrow.escrow_id}`);
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

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">P2P Trade</h1>
        <p className="text-white/60 text-sm">Browse and join open peer-to-peer trades</p>
      </motion.div>

      {/* Trade List Section */}
      <div className="w-full">
        <motion.div className="mb-4 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white text-base font-semibold">Open Trades</h2>
          <div className="flex gap-4">
            <button onClick={() => setShowSearch(!showSearch)} className="relative p-1 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5" />
              {searchQuery && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>}
            </button>
            <button onClick={() => setShowFilter(!showFilter)} className="relative p-1 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/icons/page_info.svg" alt="Filter" className="w-5 h-5" />
              {getActiveFilterCount() > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>}
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden mb-4">
              <div className="relative">
                <input type="text" placeholder="Search by token, amount..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
                {searchQuery && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B0B6BE] hover:text-white transition-colors" onClick={() => setSearchQuery("")}>
                    ×
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden mb-4">
              <div className="rounded-[20px] bg-white/[0.03] border border-white/5 p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Token From Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Token From</label>
                    <select value={filterOptions.tokenFrom} onChange={(e) => setFilterOptions((prev) => ({ ...prev, tokenFrom: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Tokens</option>
                      <option value="FRADIUM">FRADIUM</option>
                      <option value="ICP">ICP</option>
                      <option value="ckBTC">ckBTC</option>
                      <option value="ckETH">ckETH</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="SOL">SOL</option>
                    </select>
                  </div>

                  {/* Token To Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Token To</label>
                    <select value={filterOptions.tokenTo} onChange={(e) => setFilterOptions((prev) => ({ ...prev, tokenTo: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Tokens</option>
                      <option value="FRADIUM">FRADIUM</option>
                      <option value="ICP">ICP</option>
                      <option value="ckBTC">ckBTC</option>
                      <option value="ckETH">ckETH</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="SOL">SOL</option>
                    </select>
                  </div>

                  {/* State Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Status</label>
                    <select value={filterOptions.state} onChange={(e) => setFilterOptions((prev) => ({ ...prev, state: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Status</option>
                      <option value="AwaitingAccept">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Locked">Locked</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <div className="text-[#B0B6BE] text-sm">{getActiveFilterCount() > 0 && `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? "s" : ""} active`}</div>
                  <button onClick={clearFilters} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State - Skeleton */}
        {loading && !loadingMore && <SkeletonList count={5} />}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="text-red-400 text-sm text-center">{error}</div>
            <button onClick={() => fetchOpenEscrows(0, false)} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && escrows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <ArrowRightLeft className="w-8 h-8 text-white/50" />
            </div>
            <div className="text-[#B0B6BE] text-sm text-center">No open trades found</div>
            <div className="text-[#9BEB83] text-xs text-center">Be the first to create a trade</div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && escrows.length > 0 && getFilteredEscrows().length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <img src="/assets/icons/search.svg" alt="No results" className="w-8 h-8 opacity-50" />
            </div>
            <div className="text-[#B0B6BE] text-sm text-center">No results found</div>
            <div className="text-[#9BEB83] text-xs text-center">Try adjusting your search or filter criteria</div>
            <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
              Clear Filters
            </button>
          </div>
        )}

        {/* List */}
        {!loading && !error && escrows.length > 0 && (
          <div className="flex flex-col gap-2">
            {getFilteredEscrows().map((escrow, idx) => {
              const isExpanded = expandedItems.has(escrow.escrow_id);
              const tokenFromSymbol = (escrow.token_from && Object.keys(escrow.token_from)[0]) || escrow._token_from;
              const tokenToSymbol = (escrow.token_to && Object.keys(escrow.token_to)[0]) || escrow._token_to;
              const tokenFromInfo = getTokenInfo(tokenFromSymbol);
              const tokenToInfo = getTokenInfo(tokenToSymbol);
              const stateInfo = getEscrowStateInfo((escrow.state && Object.keys(escrow.state)[0]) || escrow._state);
              const expiresAt = new Date(Number(escrow.expires_at) / 1000000);
              const timeLeft = expiresAt.getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
              const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

              return (
                <motion.div key={escrow.escrow_id} className="group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + idx * 0.06 }}>
                  <div className="flex items-center justify-between px-6 py-5 rounded-xl transition-colors group-hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleExpanded(escrow.escrow_id)}>
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
                          {Array.isArray(escrow.recipient) ? (escrow.recipient[0] ? "Invited Trade" : "Open Trade") : escrow._recipient ? "Invited Trade" : "Open Trade"}
                          <Clock className="w-3 h-3 ml-2" />
                          {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${minutesLeft}m left`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs ${stateInfo.color}`}>{stateInfo.text}</div>
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
                            <div className={`text-sm font-medium ${stateInfo.color}`}>{stateInfo.text}</div>
                          </div>
                        </div>

                        {/* Trade Amounts */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Sender Address */}
                        <div className="space-y-2">
                          <div className="text-white/60 text-xs uppercase tracking-wide">Trader</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow.sender.toString()}</div>
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

                        {/* Recipient (if specified) */}
                        {Array.isArray(escrow.recipient)
                          ? escrow.recipient[0] && (
                              <div className="space-y-2">
                                <div className="text-white/60 text-xs uppercase tracking-wide">Recipient</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow.recipient.toString()}</div>
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
                                  <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{escrow._recipient.toString?.() || String(escrow._recipient)}</div>
                                </div>
                              </div>
                            )}

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
                            <div className="text-white text-sm bg-white/5 px-3 py-2 rounded-lg">{escrow.description}</div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          {(() => {
                            const myPrincipal = identity?.getPrincipal?.().toText?.();
                            const senderText = escrow.sender?.toText?.() || escrow.sender?.toString?.();
                            const isMine = !!(myPrincipal && senderText && myPrincipal === senderText);
                            const expired = Date.now() >= new Date(Number(escrow.expires_at) / 1000000).getTime();
                            const canJoin = stateInfo.text === "Open" && !isMine && !expired;
                            return (
                              <button
                                disabled={!canJoin}
                                onClick={() => {
                                  if (canJoin) {
                                    setSelectedEscrow(escrow);
                                    setShowJoinModal(true);
                                  }
                                }}
                                className={`w-full py-3 rounded-lg font-medium transition-colors ${canJoin ? "bg-[#9BE4A0] text-black hover:bg-[#8BD490]" : "bg-white/10 text-white/50 cursor-not-allowed"}`}>
                                {isMine ? "You cannot join your own trade" : expired ? "Expired" : stateInfo.text === "Open" ? "Join Trade" : "Not Joinable"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {idx !== escrows.length - 1 && <div className="h-px bg-white/10 mx-6 transition-colors group-hover:bg-white/15" />}
                </motion.div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <motion.div className="flex justify-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <button onClick={handleLoadMore} disabled={loadingMore} className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors flex items-center gap-2">
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>Load More ({Number(totalCount) - escrows.length} remaining)</>
                  )}
                </button>
              </motion.div>
            )}

            {/* End of list indicator */}
            {!hasMore && escrows.length > 0 && (
              <div className="text-center py-4 text-white/40 text-xs">
                {getFilteredEscrows().length === escrows.length ? (
                  <>
                    Showing all {Number(totalCount)} trade{Number(totalCount) !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    Showing {getFilteredEscrows().length} of {Number(totalCount)} trade{Number(totalCount) !== 1 ? "s" : ""}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Escrow Modal */}
      <JoinEscrowModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} escrow={selectedEscrow} onConfirm={handleJoinEscrow} isJoining={isJoining} />
    </motion.div>
  );
}
