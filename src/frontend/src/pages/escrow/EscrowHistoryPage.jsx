import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { backend } from "declarations/backend";
import { ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/core/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import EscrowCard from "@/core/components/cards/EscrowCard";

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

export default function EscrowHistoryPage() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    tokenFrom: "all",
    tokenTo: "all",
    state: "all",
  });

  const ITEMS_PER_PAGE = 10;

  // Helpers: normalize Candid variants and optionals from canister responses
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

  // Fetch completed escrows (Released, Rejected, Cancelled, Expired)
  const fetchCompletedEscrows = async (offset = 0, isLoadMore = false) => {
    console.log("Fetching completed escrows...");
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Fetch both sent and received escrows
      const [sentRes, receivedRes] = await Promise.all([backend.get_sent_escrows_paginated(offset, ITEMS_PER_PAGE), backend.get_received_escrows_paginated(offset, ITEMS_PER_PAGE)]);

      let allEscrows = [];

      // Process sent escrows (only completed/failed ones)
      if (sentRes && Array.isArray(sentRes.items)) {
        const sentNormalized = sentRes.items
          .filter((e) => {
            const state = normalizeState(e.state);
            return ["Released", "Rejected", "Cancelled", "Expired"].includes(state);
          })
          .map((e) => ({
            ...e,
            _token_from: normalizeToken(e.token_from),
            _token_to: normalizeToken(e.token_to),
            _state: normalizeState(e.state),
            _recipient: unwrapOpt(e.recipient),
            _description: unwrapOpt(e.description),
            _metadata: unwrapOpt(e.metadata),
            _type: "sent",
          }));
        allEscrows = [...allEscrows, ...sentNormalized];
      }

      // Process received escrows (only completed/failed ones)
      if (receivedRes && Array.isArray(receivedRes.items)) {
        const receivedNormalized = receivedRes.items
          .filter((e) => {
            const state = normalizeState(e.state);
            return ["Released", "Rejected", "Cancelled", "Expired"].includes(state);
          })
          .map((e) => ({
            ...e,
            _token_from: normalizeToken(e.token_from),
            _token_to: normalizeToken(e.token_to),
            _state: normalizeState(e.state),
            _recipient: unwrapOpt(e.recipient),
            _description: unwrapOpt(e.description),
            _metadata: unwrapOpt(e.metadata),
            _type: "received",
          }));
        allEscrows = [...allEscrows, ...receivedNormalized];
      }

      // Remove duplicates and sort by created_at desc
      const uniqueEscrows = allEscrows.filter((escrow, index, self) => index === self.findIndex((e) => e.escrow_id === escrow.escrow_id));
      uniqueEscrows.sort((a, b) => Number(b.created_at) - Number(a.created_at));

      if (isLoadMore) {
        setEscrows((prev) => [...prev, ...uniqueEscrows]);
      } else {
        setEscrows(uniqueEscrows);
      }

      const total = uniqueEscrows.length;
      setTotalCount(total);
      setCurrentOffset(offset + uniqueEscrows.length);
      setHasMore(offset + uniqueEscrows.length < total);

      console.log(`Fetched ${uniqueEscrows.length} completed escrows`);
    } catch (err) {
      console.error("Error fetching completed escrows:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompletedEscrows(0, false);
    }
  }, [isAuthenticated]);

  // Load more items
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCompletedEscrows(currentOffset, true);
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

  // Filter and search escrows
  const getFilteredEscrows = () => {
    return escrows.filter((escrow) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tokenFromSymbol = variantName(escrow.token_from ?? escrow._token_from);
        const tokenToSymbol = variantName(escrow.token_to ?? escrow._token_to);

        const tokenFromMatch = tokenFromSymbol.toLowerCase().includes(query);
        const tokenToMatch = tokenToSymbol.toLowerCase().includes(query);
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

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">Escrow History</h1>
        <p className="text-white/60 text-sm">Riwayat transaksi escrow yang sudah selesai</p>
      </motion.div>

      {/* History List Section */}
      <div className="w-full">
        <motion.div className="mb-4 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white text-base font-semibold">Completed Trades</h2>
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
                <input type="text" placeholder="Search by token, amount..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#4942AA] transition-colors" autoFocus />
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
                    <select value={filterOptions.tokenFrom} onChange={(e) => setFilterOptions((prev) => ({ ...prev, tokenFrom: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#4942AA]">
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
                    <select value={filterOptions.tokenTo} onChange={(e) => setFilterOptions((prev) => ({ ...prev, tokenTo: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#4942AA]">
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
                    <select value={filterOptions.state} onChange={(e) => setFilterOptions((prev) => ({ ...prev, state: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#4942AA]">
                      <option value="all">All Status</option>
                      <option value="Released">Completed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <div className="text-[#B0B6BE] text-sm">{getActiveFilterCount() > 0 && `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? "s" : ""} active`}</div>
                  <button onClick={clearFilters} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#4942AA] rounded-lg text-white text-sm transition-colors">
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
            <button onClick={() => fetchCompletedEscrows(0, false)} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#4942AA] rounded-lg text-white text-sm transition-colors">
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
            <div className="text-[#B0B6BE] text-sm text-center">No completed trades found</div>
            <div className="text-[#9BEB83] text-xs text-center">Your completed escrow trades will appear here</div>
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
            <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#4942AA] rounded-lg text-white text-sm transition-colors">
              Clear Filters
            </button>
          </div>
        )}

        {/* List */}
        {!loading && !error && escrows.length > 0 && (
          <div className="flex flex-col gap-2">
            {getFilteredEscrows().map((escrow, idx) => (
              <div key={escrow.escrow_id}>
                <EscrowCard escrow={escrow} index={idx} isExpanded={expandedItems.has(escrow.escrow_id)} onToggleExpanded={toggleExpanded} variant="history" identity={identity} showExternalLink={true} showJoinButton={false} />
                {idx !== getFilteredEscrows().length - 1 && <div className="h-px bg-white/10 mx-6 transition-colors group-hover:bg-white/15" />}
              </div>
            ))}

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
    </motion.div>
  );
}
