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

export default function MyEscrowPage() {
  const { isAuthenticated, identity } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("my-trades"); // "my-trades" or "pending-trades"

  // My Trades data
  const [myTradesEscrows, setMyTradesEscrows] = useState([]);
  const [myTradesLoading, setMyTradesLoading] = useState(false);
  const [myTradesLoadingMore, setMyTradesLoadingMore] = useState(false);
  const [myTradesHasMore, setMyTradesHasMore] = useState(true);
  const [myTradesCurrentOffset, setMyTradesCurrentOffset] = useState(0);
  const [myTradesTotalCount, setMyTradesTotalCount] = useState(0);

  // Pending Trades data
  const [pendingTradesEscrows, setPendingTradesEscrows] = useState([]);
  const [pendingTradesLoading, setPendingTradesLoading] = useState(false);
  const [pendingTradesLoadingMore, setPendingTradesLoadingMore] = useState(false);
  const [pendingTradesHasMore, setPendingTradesHasMore] = useState(true);
  const [pendingTradesCurrentOffset, setPendingTradesCurrentOffset] = useState(0);
  const [pendingTradesTotalCount, setPendingTradesTotalCount] = useState(0);

  // Common states
  const [error, setError] = useState(null);
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

  // Fetch My Trades (escrows that are accepted/completed)
  const fetchMyTrades = async (offset = 0, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setMyTradesLoadingMore(true);
      } else {
        setMyTradesLoading(true);
        setError(null);
      }

      console.log(`Fetching my trades - offset: ${offset}, limit: ${ITEMS_PER_PAGE}`);

      // Fetch both sent and received escrows
      const [sentRes, receivedRes] = await Promise.all([backend.get_sent_escrows_paginated(offset, ITEMS_PER_PAGE), backend.get_received_escrows_paginated(offset, ITEMS_PER_PAGE)]);

      let allEscrows = [];

      // Process sent escrows (only active ones - exclude completed/failed)
      if (sentRes && Array.isArray(sentRes.items)) {
        const sentNormalized = sentRes.items
          .filter((e) => {
            const state = normalizeState(e.state);
            return ["AwaitingAccept", "Pending", "Locked"].includes(state);
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

      // Process received escrows (only active ones - exclude completed/failed and pending invitations)
      if (receivedRes && Array.isArray(receivedRes.items)) {
        const receivedNormalized = receivedRes.items
          .filter((e) => {
            const state = normalizeState(e.state);
            return ["Pending", "Locked"].includes(state); // Only show accepted active trades
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

      // Remove duplicates and sort
      const uniqueEscrows = allEscrows.filter((escrow, index, self) => index === self.findIndex((e) => e.escrow_id === escrow.escrow_id));
      uniqueEscrows.sort((a, b) => Number(b.created_at) - Number(a.created_at));

      if (isLoadMore) {
        setMyTradesEscrows((prev) => [...prev, ...uniqueEscrows]);
      } else {
        setMyTradesEscrows(uniqueEscrows);
      }

      const total = uniqueEscrows.length;
      setMyTradesTotalCount(total);
      setMyTradesCurrentOffset(offset + uniqueEscrows.length);
      setMyTradesHasMore(offset + uniqueEscrows.length < total);

      console.log(`Fetched ${uniqueEscrows.length} my trades, total: ${total}`);
    } catch (err) {
      console.error("Error fetching my trades:", err);
      setError(err.message);
    } finally {
      setMyTradesLoading(false);
      setMyTradesLoadingMore(false);
    }
  };

  // Fetch Pending Trades (escrows that are AwaitingAccept and received from others)
  const fetchPendingTrades = async (offset = 0, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setPendingTradesLoadingMore(true);
      } else {
        setPendingTradesLoading(true);
        setError(null);
      }

      console.log(`Fetching pending trades - offset: ${offset}, limit: ${ITEMS_PER_PAGE}`);

      // Only fetch received escrows that are AwaitingAccept (invitations from others)
      const receivedRes = await backend.get_received_escrows_paginated(offset, ITEMS_PER_PAGE);

      let pendingEscrows = [];

      if (receivedRes && Array.isArray(receivedRes.items)) {
        const pendingNormalized = receivedRes.items
          .filter((e) => {
            const state = normalizeState(e.state);
            const expiresAt = new Date(Number(e.expires_at) / 1000000);
            const isExpired = Date.now() >= expiresAt.getTime();
            return state === "AwaitingAccept" && !isExpired; // Only pending invitations that haven't expired
          })
          .map((e) => ({
            ...e,
            _token_from: normalizeToken(e.token_from),
            _token_to: normalizeToken(e.token_to),
            _state: normalizeState(e.state),
            _recipient: unwrapOpt(e.recipient),
            _description: unwrapOpt(e.description),
            _metadata: unwrapOpt(e.metadata),
            _type: "pending",
          }));
        pendingEscrows = [...pendingEscrows, ...pendingNormalized];
      }

      // Sort by created_at desc
      pendingEscrows.sort((a, b) => Number(b.created_at) - Number(a.created_at));

      if (isLoadMore) {
        setPendingTradesEscrows((prev) => [...prev, ...pendingEscrows]);
      } else {
        setPendingTradesEscrows(pendingEscrows);
      }

      const total = pendingEscrows.length;
      setPendingTradesTotalCount(total);
      setPendingTradesCurrentOffset(offset + pendingEscrows.length);
      setPendingTradesHasMore(offset + pendingEscrows.length < total);

      console.log(`Fetched ${pendingEscrows.length} pending trades, total: ${total}`);
    } catch (err) {
      console.error("Error fetching pending trades:", err);
      setError(err.message);
    } finally {
      setPendingTradesLoading(false);
      setPendingTradesLoadingMore(false);
    }
  };

  // Load more items
  const handleLoadMore = () => {
    if (activeTab === "my-trades") {
      if (!myTradesLoadingMore && myTradesHasMore) {
        fetchMyTrades(myTradesCurrentOffset, true);
      }
    } else if (activeTab === "pending-trades") {
      if (!pendingTradesLoadingMore && pendingTradesHasMore) {
        fetchPendingTrades(pendingTradesCurrentOffset, true);
      }
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
  const getFilteredEscrows = (escrowsList) => {
    return escrowsList.filter((escrow) => {
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

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "my-trades") {
        fetchMyTrades(0, false);
      } else if (activeTab === "pending-trades") {
        fetchPendingTrades(0, false);
      }
    }
  }, [isAuthenticated, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedItems(new Set()); // Clear expanded items when switching tabs
    setSearchQuery(""); // Clear search when switching tabs
    setFilterOptions({ tokenFrom: "all", tokenTo: "all", state: "all" }); // Clear filters
  };

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">My Escrows</h1>
        <p className="text-white/60 text-sm">Manage your active trades and invitations</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div className="flex bg-[#23272F] border border-[#393E4B] rounded-xl p-1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
        <button onClick={() => handleTabChange("my-trades")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "my-trades" ? "bg-[#7C72FE] text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
          My Trades
        </button>
        <button onClick={() => handleTabChange("pending-trades")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "pending-trades" ? "bg-[#7C72FE] text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
          Pending Trade
        </button>
      </motion.div>

      {/* Escrow List Section */}
      <div className="w-full">
        <motion.div className="mb-4 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white text-base font-semibold">{activeTab === "my-trades" ? "My Trades" : "Pending Trade"}</h2>
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
                  <button onClick={clearFilters} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#7C72FE] rounded-lg text-white text-sm transition-colors">
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State - Skeleton */}
        {((activeTab === "my-trades" && myTradesLoading && !myTradesLoadingMore) || (activeTab === "pending-trades" && pendingTradesLoading && !pendingTradesLoadingMore)) && <SkeletonList count={5} />}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="text-red-400 text-sm text-center">{error}</div>
            <button
              onClick={() => {
                if (activeTab === "my-trades") {
                  fetchMyTrades(0, false);
                } else if (activeTab === "pending-trades") {
                  fetchPendingTrades(0, false);
                }
              }}
              className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#7C72FE] rounded-lg text-white text-sm transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {(() => {
          const currentEscrows = activeTab === "my-trades" ? myTradesEscrows : pendingTradesEscrows;
          const isLoading = activeTab === "my-trades" ? myTradesLoading : pendingTradesLoading;

          if (!isLoading && !error && currentEscrows.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <ArrowRightLeft className="w-8 h-8 text-white/50" />
                </div>
                <div className="text-[#B0B6BE] text-sm text-center">{activeTab === "my-trades" ? "No active trades found" : "No pending invitations"}</div>
                <div className="text-[#9BEB83] text-xs text-center">{activeTab === "my-trades" ? "Create your first trade or check history for completed trades" : "You have no pending trade invitations"}</div>
              </div>
            );
          }
          return null;
        })()}

        {/* No Results State */}
        {(() => {
          const currentEscrows = activeTab === "my-trades" ? myTradesEscrows : pendingTradesEscrows;
          const isLoading = activeTab === "my-trades" ? myTradesLoading : pendingTradesLoading;
          const filteredEscrows = getFilteredEscrows(currentEscrows);

          if (!isLoading && !error && currentEscrows.length > 0 && filteredEscrows.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <img src="/assets/icons/search.svg" alt="No results" className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-[#B0B6BE] text-sm text-center">No results found</div>
                <div className="text-[#9BEB83] text-xs text-center">Try adjusting your search or filter criteria</div>
                <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#7C72FE] rounded-lg text-white text-sm transition-colors">
                  Clear Filters
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* List */}
        {(() => {
          const currentEscrows = activeTab === "my-trades" ? myTradesEscrows : pendingTradesEscrows;
          const isLoading = activeTab === "my-trades" ? myTradesLoading : pendingTradesLoading;
          const filteredEscrows = getFilteredEscrows(currentEscrows);

          if (!isLoading && !error && currentEscrows.length > 0) {
            return (
              <div className="flex flex-col gap-2">
                {filteredEscrows.map((escrow, idx) => (
                  <div key={escrow.escrow_id}>
                    <EscrowCard escrow={escrow} index={idx} isExpanded={expandedItems.has(escrow.escrow_id)} onToggleExpanded={toggleExpanded} variant={activeTab} identity={identity} showExternalLink={true} showJoinButton={false} />
                    {idx !== filteredEscrows.length - 1 && <div className="h-px bg-white/10 mx-6 transition-colors group-hover:bg-white/15" />}
                  </div>
                ))}

                {/* Load More Button */}
                {(() => {
                  const currentEscrows = activeTab === "my-trades" ? myTradesEscrows : pendingTradesEscrows;
                  const isLoadingMore = activeTab === "my-trades" ? myTradesLoadingMore : pendingTradesLoadingMore;
                  const hasMore = activeTab === "my-trades" ? myTradesHasMore : pendingTradesHasMore;
                  const totalCount = activeTab === "my-trades" ? myTradesTotalCount : pendingTradesTotalCount;

                  if (hasMore) {
                    return (
                      <motion.div className="flex justify-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <button onClick={handleLoadMore} disabled={isLoadingMore} className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors flex items-center gap-2">
                          {isLoadingMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Loading...
                            </>
                          ) : (
                            <>Load More ({Number(totalCount) - currentEscrows.length} remaining)</>
                          )}
                        </button>
                      </motion.div>
                    );
                  }
                  return null;
                })()}

                {/* End of list indicator */}
                {(() => {
                  const currentEscrows = activeTab === "my-trades" ? myTradesEscrows : pendingTradesEscrows;
                  const hasMore = activeTab === "my-trades" ? myTradesHasMore : pendingTradesHasMore;
                  const totalCount = activeTab === "my-trades" ? myTradesTotalCount : pendingTradesTotalCount;
                  const filteredEscrows = getFilteredEscrows(currentEscrows);

                  if (!hasMore && currentEscrows.length > 0) {
                    return (
                      <div className="text-center py-4 text-white/40 text-xs">
                        {filteredEscrows.length === currentEscrows.length ? (
                          <>
                            Showing all {Number(totalCount)} trade{Number(totalCount) !== 1 ? "s" : ""}
                          </>
                        ) : (
                          <>
                            Showing {filteredEscrows.length} of {Number(totalCount)} trade{Number(totalCount) !== 1 ? "s" : ""}
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            );
          }
          return null;
        })()}
      </div>
    </motion.div>
  );
}
