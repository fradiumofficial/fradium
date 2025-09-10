import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TOKENS_CONFIG } from "@/core/lib/tokenUtils";
import { getETHTransactionHistory, getSolanaTransactionHistory, getBitcoinTransactionHistory, getTransactionHistory } from "@/core/services/historyTransactionService";
import { useWallet } from "@/core/providers/WalletProvider";
import { getExplorerUrl } from "@/core/lib/chainExplorers";
import { Copy, ExternalLink } from "lucide-react";
import { copyToClipboard } from "@/core/lib/clipboardUtils";

function getIconByChain(chain) {
  const token = TOKENS_CONFIG.find((t) => t.chain.toLowerCase() === chain.toLowerCase());
  return token ? `/${token.imageUrl}` : "/assets/images/coins/bitcoin.webp";
}

export default function TransactionHistoryPage() {
  const { addresses } = useWallet();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForWallet, setIsWaitingForWallet] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    chain: "all", // all, bitcoin, ethereum, solana
    status: "all", // all, completed, pending, failed
    type: "all", // all, sent, received
  });

  const ITEMS_PER_PAGE = 10;

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) setSearchQuery("");
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Toggle expand/collapse
  const toggleExpanded = (txHash) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(txHash)) {
        newSet.delete(txHash);
      } else {
        newSet.add(txHash);
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

  // Load more items
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadTransactionHistory(currentOffset, true);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterOptions({
      chain: "all",
      status: "all",
      type: "all",
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterOptions.chain !== "all") count++;
    if (filterOptions.status !== "all") count++;
    if (filterOptions.type !== "all") count++;
    return count;
  };

  // Load transaction history on component mount
  useEffect(() => {
    console.log("TransactionHistoryPage useEffect triggered");
    console.log("addresses:", addresses);
    console.log("ethereum address:", addresses?.ethereum);
    console.log("isWaitingForWallet:", isWaitingForWallet);
    console.log("isLoading:", isLoading);

    const loadTransactionHistory = async (offset = 0, isLoadMore = false) => {
      const ethereumAddress = addresses?.ethereum;
      const solanaAddress = addresses?.solana;
      const bitcoinAddress = addresses?.bitcoin;

      if (!ethereumAddress && !solanaAddress && !bitcoinAddress) {
        console.log("No wallet addresses found, setting waiting state");
        setIsWaitingForWallet(true);
        setIsLoading(false);
        return;
      }

      console.log("Wallet addresses found, starting to load transactions");
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setIsWaitingForWallet(false);
          setIsLoading(true);
          setError(null);
        }

        // Load transactions for all supported networks
        console.log(`Loading transactions for all networks - offset: ${offset}, limit: ${ITEMS_PER_PAGE}`);

        const allTransactions = [];

        // Load ETH transactions
        if (addresses?.ethereum) {
          console.log("Loading ETH transactions...");
          const ethTransactions = await getETHTransactionHistory(addresses.ethereum, "sepolia", ITEMS_PER_PAGE);
          allTransactions.push(...ethTransactions);
        }

        // Load Solana transactions
        if (addresses?.solana) {
          console.log("Loading Solana transactions...");
          const solTransactions = await getSolanaTransactionHistory(addresses.solana, "devnet", ITEMS_PER_PAGE);
          allTransactions.push(...solTransactions);
        }

        // Load Bitcoin transactions
        if (addresses?.bitcoin) {
          console.log("Loading Bitcoin transactions...");
          const btcTransactions = await getBitcoinTransactionHistory(addresses.bitcoin, "testnet", ITEMS_PER_PAGE);
          allTransactions.push(...btcTransactions);
        }

        // Sort all transactions by timestamp (newest first)
        const sortedTransactions = allTransactions.sort((a, b) => b.timestamp - a.timestamp);

        // Apply pagination to sorted transactions
        const startIndex = offset;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

        if (isLoadMore) {
          // When loading more, merge and sort all items to maintain chronological order
          setTransactions((prev) => {
            const allItems = [...prev, ...paginatedTransactions].sort((a, b) => b.timestamp - a.timestamp);
            return allItems;
          });
        } else {
          setTransactions(paginatedTransactions);
        }

        // Update pagination state
        setTotalCount(sortedTransactions.length);
        setCurrentOffset(offset + ITEMS_PER_PAGE);
        setHasMore(offset + ITEMS_PER_PAGE < sortedTransactions.length);

        console.log(`Fetched ${paginatedTransactions.length} transactions, total: ${sortedTransactions.length}, hasMore: ${offset + ITEMS_PER_PAGE < sortedTransactions.length}`);
      } catch (err) {
        console.error("Error loading transaction history:", err);
        setError("Failed to load transaction history");
        setTransactions([]);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    };

    loadTransactionHistory();
  }, [addresses]);

  // Filter transactions based on search query and filters
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = tx.title.toLowerCase().includes(query);
      const chainMatch = tx.chain.toLowerCase().includes(query);
      const statusMatch = tx.status.toLowerCase().includes(query);
      const fromMatch = tx.from && tx.from.toLowerCase().includes(query);
      const toMatch = tx.to && tx.to.toLowerCase().includes(query);
      const hashMatch = tx.hash && tx.hash.toLowerCase().includes(query);

      if (!titleMatch && !chainMatch && !statusMatch && !fromMatch && !toMatch && !hashMatch) {
        return false;
      }
    }

    // Chain filter
    if (filterOptions.chain !== "all") {
      if (tx.chain.toLowerCase() !== filterOptions.chain.toLowerCase()) {
        return false;
      }
    }

    // Status filter
    if (filterOptions.status !== "all") {
      if (tx.status.toLowerCase() !== filterOptions.status.toLowerCase()) {
        return false;
      }
    }

    // Type filter (sent/received)
    if (filterOptions.type !== "all") {
      const isSent = tx.amount < 0;
      const isReceived = tx.amount > 0;

      if (filterOptions.type === "sent" && !isSent) {
        return false;
      }
      if (filterOptions.type === "received" && !isReceived) {
        return false;
      }
    }

    return true;
  });

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="flex flex-col">
      {[...Array(5)].map((_, idx) => (
        <motion.div key={idx} className="group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + idx * 0.06 }}>
          <div className="flex items-center justify-between px-3 sm:px-4 py-4 sm:py-5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#B0B6BE]/20 rounded-full animate-pulse"></div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 bg-[#B0B6BE]/20 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-[#B0B6BE]/20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-4 w-20 bg-[#B0B6BE]/20 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-[#B0B6BE]/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          {idx !== 4 && <div className="h-px bg-white/10 mx-4" />}
        </motion.div>
      ))}
    </div>
  );

  return (
    <motion.div className="flex flex-col gap-8 max-w-xl mx-auto w-full md:p-0 p-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Header Section */}
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white md:text-2xl text-lg font-semibold">Transaction History</h1>
        <p className="text-[#B0B6BE] md:text-base text-sm font-normal">Track every move, stay in control. Your complete transaction timeline with real-time updates and intelligent status detection.</p>
      </motion.div>

      {/* Transaction List Section */}
      <div>
        <motion.div className="mb-6 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white md:text-lg text-base font-semibold">List of transactions</h2>
          <div className="flex gap-4">
            <button onClick={handleSearchToggle} className="relative p-1 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4" />
              {searchQuery && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>}
            </button>
            <button onClick={() => setShowFilter(!showFilter)} className="relative p-1 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4" />
              {getActiveFilterCount() > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>}
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden mb-4">
              <div className="relative">
                <input type="text" placeholder="Search by address, chain, status, or transaction hash..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
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

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Status</label>
                    <select value={filterOptions.status} onChange={(e) => setFilterOptions((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-[13px] font-medium">Type</label>
                    <select value={filterOptions.type} onChange={(e) => setFilterOptions((prev) => ({ ...prev, type: e.target.value }))} className="w-full px-3 py-2.5 bg-[#23272F] border border-[#393E4B] rounded-lg text-white text-sm focus:outline-none transition-colors hover:cursor-pointer hover:bg-[#2A2F37] hover:border-[#9BE4A0]">
                      <option value="all">All Types</option>
                      <option value="sent">Sent</option>
                      <option value="received">Received</option>
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

        {isWaitingForWallet ? (
          /* Waiting for Wallet Address */
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-white font-medium">Connecting to wallet...</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Please wait while we connect to your wallet</p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading Transactions with Skeleton */
          <LoadingSkeleton />
        ) : error ? (
          /* Error State */
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#F1999B]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F1999B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Failed to load transactions</p>
                <p className="text-[#B0B6BE] text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">{searchQuery || getActiveFilterCount() > 0 ? "No transactions found" : "No transactions yet"}</p>
                <p className="text-[#B0B6BE] text-sm mt-1">{searchQuery || getActiveFilterCount() > 0 ? "Try adjusting your search or filter criteria" : "Start sending or receiving crypto to see your activity here"}</p>
                {(searchQuery || getActiveFilterCount() > 0) && (
                  <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#23272F] border border-[#393E4B] hover:bg-[#2A2F37] hover:border-[#9BE4A0] rounded-lg text-white text-sm transition-colors">
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List items */
          <div className="flex flex-col">
            {filteredTransactions.map((tx, idx) => {
              const isExpanded = expandedItems.has(tx.hash);

              return (
                <motion.div key={tx.hash || idx} className="group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + idx * 0.06 }}>
                  <div className="flex items-center justify-between px-3 sm:px-4 py-4 sm:py-5 rounded-xl transition-colors group-hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleExpanded(tx.hash)}>
                    <div className="flex items-center gap-4">
                      <img src={getIconByChain(tx.chain)} alt={tx.chain} className="w-10 h-10 rounded-full" />
                      <div className="flex flex-col">
                        <div className="text-white text-base font-medium leading-tight max-w-[360px] truncate">{tx.title}</div>
                        <div className="text-white/60 text-sm">
                          {tx.chain} •{" "}
                          {tx.timestamp
                            ? new Date(tx.timestamp).toLocaleString("id-ID", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "Unknown date"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-base font-semibold ${tx.amount < 0 ? "text-[#F1999B]" : "text-[#9BE4A0]"}`}>
                          {tx.amount < 0 ? "- " : "+ "}
                          {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {tx.chain === "Solana" ? "SOL" : tx.chain === "Bitcoin" ? "BTC" : "ETH"}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs ${tx.status === "Completed" ? "bg-[#1C2A22] text-[#9BE4A0]" : "bg-[#2A2A2A] text-white/80"}`}>{tx.status}</div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/50">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <div className="px-3 sm:px-4 pb-4 bg-white/[0.02] border-t border-white/10">
                      <div className="pt-4 space-y-4">
                        {/* Transaction Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Transaction Hash</div>
                            <div className="text-white text-sm font-mono break-all">{tx.hash}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Network</div>
                            <div className="text-white text-sm font-medium">{tx.chain}</div>
                          </div>
                        </div>

                        {/* From/To Addresses */}
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">From Address</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{tx.from}</div>
                              <div className="flex gap-1">
                                {/* Copy Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAddress(tx.from);
                                  }}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                  title="Copy address">
                                  {copiedAddress === tx.from ? (
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

                          <div className="space-y-2">
                            <div className="text-white/60 text-xs uppercase tracking-wide">To Address</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{tx.to}</div>
                              <div className="flex gap-1">
                                {/* Copy Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAddress(tx.to);
                                  }}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                  title="Copy address">
                                  {copiedAddress === tx.to ? (
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
                        </div>

                        {/* Transaction Hash with Explorer Link */}
                        <div className="space-y-2">
                          <div className="text-white/60 text-xs uppercase tracking-wide">Transaction Hash</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-white text-sm font-mono bg-white/5 px-3 py-2 rounded-lg break-all">{tx.hash}</div>
                            <div className="flex gap-1">
                              {/* Copy Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAddress(tx.hash);
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                title="Copy transaction hash">
                                {copiedAddress === tx.hash ? (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </motion.div>
                                ) : (
                                  <Copy size={16} className="text-white/70 group-hover:text-white transition-colors" />
                                )}
                              </button>

                              {/* Explorer Button */}
                              <a href={getExplorerUrl(tx.chain, tx.hash)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group" title={`View on ${tx.chain} explorer`}>
                                <ExternalLink size={16} className="text-white/70 group-hover:text-white transition-colors" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-white/50 text-xs">Amount</div>
                            <div className="text-white text-sm font-medium">
                              {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {tx.chain === "Solana" ? "SOL" : tx.chain === "Bitcoin" ? "BTC" : "ETH"}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-white/50 text-xs">Fee</div>
                            <div className="text-white text-sm font-medium">{tx.fee ? `${tx.fee.toFixed(6)} ${tx.chain === "Solana" ? "SOL" : tx.chain === "Bitcoin" ? "BTC" : "ETH"}` : "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {idx !== filteredTransactions.length - 1 && <div className="h-px bg-white/10 mx-4 transition-colors group-hover:bg-white/15" />}
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
                    <>Load More ({Number(totalCount) - transactions.length} remaining)</>
                  )}
                </button>
              </motion.div>
            )}

            {/* End of list indicator */}
            {!hasMore && transactions.length > 0 && (
              <div className="text-center py-4 text-white/40 text-xs">
                {filteredTransactions.length === transactions.length ? (
                  <>
                    Showing all {Number(totalCount)} transaction{Number(totalCount) !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    Showing {filteredTransactions.length} of {Number(totalCount)} transaction{Number(totalCount) !== 1 ? "s" : ""}
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
