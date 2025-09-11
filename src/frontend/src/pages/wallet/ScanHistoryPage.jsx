import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { backend } from "declarations/backend";
import { Copy, ExternalLink } from "lucide-react";
import { getChainFromTokenType, getIconByChain, detectAddressNetwork } from "@/core/lib/tokenUtils";
import { getExplorerUrl } from "@/core/lib/chainExplorers";
import { formatDate } from "@/core/lib/dateUtils";
import { formatAddress } from "@/core/lib/stringUtils";
import { copyToClipboard } from "@/core/lib/clipboardUtils";
import { getAnalysisTypeLabel } from "@/core/lib/labelUtils";

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
      <div className="w-16 h-3 bg-white/5 rounded animate-pulse"></div>
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

export default function ScanHistoryPage() {
  const [items, setItems] = useState([]);
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
    chain: "all", // all, bitcoin, ethereum, solana
    analysisType: "all", // all, ai, community
    safetyStatus: "all", // all, safe, unsafe
  });

  const ITEMS_PER_PAGE = 10;

  // Fetch scan history data
  const fetchScanHistory = async (offset = 0, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      console.log(`Fetching scan history - offset: ${offset}, limit: ${ITEMS_PER_PAGE}`);

      const [historyResult, countResult] = await Promise.all([backend.get_analyze_history(offset, ITEMS_PER_PAGE), backend.get_analyze_history_count()]);

      console.log("historyResult", historyResult);
      console.log("countResult", countResult);

      if (historyResult.Err) {
        throw new Error(`Failed to fetch scan history: ${historyResult.Err}`);
      }

      if (countResult.Err) {
        throw new Error(`Failed to fetch total count: ${countResult.Err}`);
      }

      const newItems = historyResult.Ok.map((item, index) => {
        // Try to get chain from token_type first, fallback to address detection
        let chain = getChainFromTokenType(item.token_type);
        if (chain === "Unknown") {
          chain = detectAddressNetwork(item.address);
          console.log(`Fallback detection for address ${item.address}: ${chain}`);
        }

        return {
          id: `${item.address}-${item.created_at}-${index}`,
          chain: chain,
          address: item.address,
          label: getAnalysisTypeLabel(item.analyzed_type, item.is_safe),
          date: formatDate(item.created_at),
          isSafe: item.is_safe,
          metadata: item.metadata,
          rawItem: item,
          timestamp: Number(item.created_at), // Convert BigInt to Number for sorting
        };
      }).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)

      if (isLoadMore) {
        // When loading more, merge and sort all items to maintain chronological order
        setItems((prev) => {
          const allItems = [...prev, ...newItems].sort((a, b) => b.timestamp - a.timestamp);
          return allItems;
        });
      } else {
        setItems(newItems);
      }

      setTotalCount(countResult.Ok);
      setCurrentOffset(offset + ITEMS_PER_PAGE);
      setHasMore(offset + ITEMS_PER_PAGE < Number(countResult.Ok));

      console.log(`Fetched ${newItems.length} items, total: ${Number(countResult.Ok)}, hasMore: ${offset + ITEMS_PER_PAGE < Number(countResult.Ok)}`);
    } catch (err) {
      console.error("Error fetching scan history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more items
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchScanHistory(currentOffset, true);
    }
  };

  // Toggle expand/collapse
  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Parse metadata
  const parseMetadata = (metadata) => {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      console.error("Error parsing metadata:", error);
      return null;
    }
  };

  // Handle copy address
  const handleCopyAddress = (address) => {
    copyToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Filter and search items
  const getFilteredItems = () => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const addressMatch = item.address.toLowerCase().includes(query);
        const chainMatch = item.chain.toLowerCase().includes(query);
        const labelMatch = item.label.toLowerCase().includes(query);

        if (!addressMatch && !chainMatch && !labelMatch) {
          return false;
        }
      }

      // Chain filter
      if (filterOptions.chain !== "all") {
        if (item.chain.toLowerCase() !== filterOptions.chain.toLowerCase()) {
          return false;
        }
      }

      // Analysis type filter
      if (filterOptions.analysisType !== "all") {
        const isAI = item.label.toLowerCase().includes("ai");
        const isCommunity = item.label.toLowerCase().includes("community");

        if (filterOptions.analysisType === "ai" && !isAI) {
          return false;
        }
        if (filterOptions.analysisType === "community" && !isCommunity) {
          return false;
        }
      }

      // Safety status filter
      if (filterOptions.safetyStatus !== "all") {
        if (filterOptions.safetyStatus === "safe" && !item.isSafe) {
          return false;
        }
        if (filterOptions.safetyStatus === "unsafe" && item.isSafe) {
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
      chain: "all",
      analysisType: "all",
      safetyStatus: "all",
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterOptions.chain !== "all") count++;
    if (filterOptions.analysisType !== "all") count++;
    if (filterOptions.safetyStatus !== "all") count++;
    return count;
  };

  // Initial load
  useEffect(() => {
    fetchScanHistory(0, false);
  }, []);

  return (
    <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">Scan History</h1>
        <p className="text-white/60 text-sm">List of previously scanned addresses and smart contracts</p>
      </motion.div>

      {/* Scan Activity List Section */}
      <div className="w-full">
        <motion.div className="mb-4 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white text-base font-semibold">List of scan activity</h2>
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
                <input type="text" placeholder="Search by address, chain, or analysis type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
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
                  {/* Chain Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Chain</label>
                    <select value={filterOptions.chain} onChange={(e) => setFilterOptions((prev) => ({ ...prev, chain: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Chains</option>
                      <option value="bitcoin">Bitcoin</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="solana">Solana</option>
                    </select>
                  </div>

                  {/* Analysis Type Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Analysis Type</label>
                    <select value={filterOptions.analysisType} onChange={(e) => setFilterOptions((prev) => ({ ...prev, analysisType: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Types</option>
                      <option value="ai">AI Analysis</option>
                      <option value="community">Community Analysis</option>
                    </select>
                  </div>

                  {/* Safety Status Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Safety Status</label>
                    <select value={filterOptions.safetyStatus} onChange={(e) => setFilterOptions((prev) => ({ ...prev, safetyStatus: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Status</option>
                      <option value="safe">Safe</option>
                      <option value="unsafe">Unsafe</option>
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

        {/* Loading State - Skeleton (only for initial load, not load more) */}
        {loading && !loadingMore && <SkeletonList count={5} />}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="text-red-400 text-sm text-center">{error}</div>
            <button onClick={() => fetchScanHistory(0, false)} className="px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <img src="/assets/icons/search.svg" alt="No data" className="w-8 h-8 opacity-50" />
            </div>
            <div className="text-[#B0B6BE] text-sm text-center">No scan history found</div>
            <div className="text-[#9BEB83] text-xs text-center">Start by analyzing an address</div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && items.length > 0 && getFilteredItems().length === 0 && (
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

        {/* List - no borders, larger items */}
        {!loading && !error && items.length > 0 && (
          <div className="flex flex-col gap-2">
            {getFilteredItems().map((item, idx) => {
              const isExpanded = expandedItems.has(item.id);
              const metadata = parseMetadata(item.metadata);

              return (
                <motion.div key={item.id} className="group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + idx * 0.06 }}>
                  <div className="flex items-center justify-between px-6 py-5 rounded-xl transition-colors group-hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                    <div className="flex items-center gap-4">
                      <img src={getIconByChain(item.chain)} alt={item.chain} className="w-10 h-10 rounded-full" />
                      <div className="flex flex-col">
                        <div className="text-white text-base font-medium leading-tight max-w-[300px] truncate">{formatAddress(item.address)}</div>
                        <div className={`text-sm ${item.isSafe ? "text-green-400" : "text-red-400"}`}>{item.label}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-white/70 text-sm">{item.date}</div>
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
                        {/* Analysis Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Analysis Type</div>
                            <div className="text-white text-sm font-medium">{item.label}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Network</div>
                            <div className="text-white text-sm font-medium">{item.chain}</div>
                          </div>
                        </div>

                        {/* Metadata Details */}
                        {metadata && (
                          <div className="space-y-3">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Analysis Details</div>
                            <div className="grid grid-cols-2 gap-4">
                              {metadata.confidence && (
                                <div className="space-y-1">
                                  <div className="text-white/50 text-xs">Confidence</div>
                                  <div className="text-white text-sm">{metadata.confidence}%</div>
                                </div>
                              )}
                              {metadata.riskLevel && (
                                <div className="space-y-1">
                                  <div className="text-white/50 text-xs">Risk Level</div>
                                  <div className={`text-sm font-medium ${metadata.riskLevel === "LOW" ? "text-green-400" : metadata.riskLevel === "MEDIUM" ? "text-yellow-400" : "text-red-400"}`}>{metadata.riskLevel}</div>
                                </div>
                              )}
                              {metadata.riskScore && (
                                <div className="space-y-1">
                                  <div className="text-white/50 text-xs">Risk Score</div>
                                  <div className="text-white text-sm">{metadata.riskScore}</div>
                                </div>
                              )}
                              {metadata.transactions && (
                                <div className="space-y-1">
                                  <div className="text-white/50 text-xs">Transactions</div>
                                  <div className="text-white text-sm">{metadata.transactions}</div>
                                </div>
                              )}
                            </div>

                            {/* Additional metadata */}
                            {metadata.analysisType && (
                              <div className="space-y-1">
                                <div className="text-white/50 text-xs">Analysis Method</div>
                                <div className="text-white text-sm capitalize">{metadata.analysisType}</div>
                              </div>
                            )}

                            {metadata.timestamp && (
                              <div className="space-y-1">
                                <div className="text-white/50 text-xs">Analysis Time</div>
                                <div className="text-white text-sm">{new Date(metadata.timestamp).toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Raw Address */}
                        <div className="space-y-2">
                          <div className="text-white/60 text-xs uppercase tracking-wide">Full Address</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{item.address}</div>
                            <div className="flex gap-1">
                              {/* Copy Button */}
                              <button onClick={() => handleCopyAddress(item.address)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group" title="Copy address">
                                {copiedAddress === item.address ? (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </motion.div>
                                ) : (
                                  <Copy size={16} className="text-white/70 group-hover:text-white transition-colors" />
                                )}
                              </button>

                              {/* Blockscan Button */}
                              <a href={getExplorerUrl(item.chain, item.address)} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group" title={`View on ${item.chain} explorer`}>
                                <ExternalLink size={16} className="text-white/70 group-hover:text-white transition-colors" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {idx !== items.length - 1 && <div className="h-px bg-white/10 mx-6 transition-colors group-hover:bg-white/15" />}
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
                    <>Load More ({Number(totalCount) - items.length} remaining)</>
                  )}
                </button>
              </motion.div>
            )}

            {/* End of list indicator */}
            {!hasMore && items.length > 0 && (
              <div className="text-center py-4 text-white/40 text-xs">
                {getFilteredItems().length === items.length ? (
                  <>
                    Showing all {Number(totalCount)} scan{Number(totalCount) !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    Showing {getFilteredItems().length} of {Number(totalCount)} scan{Number(totalCount) !== 1 ? "s" : ""}
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
