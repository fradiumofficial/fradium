import React, { useState, useEffect } from "react";
import { useAuth } from "../../core/providers/AuthProvider";
import { backend } from "declarations/backend";

// Utilities
import { getAmountToken, getTokenImageURL, TokenType } from "../../core/lib/tokenUtils";

// ================= UTILITY FUNCTIONS =================

// Format timestamp to readable date
const formatTransactionDate = (timestamp) => {
  // Convert nanoseconds to milliseconds
  const date = new Date(Number(timestamp) / 1000000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

// Mapping functions using tokenUtils
const mapChainToIcon = (chain) => {
  return getTokenImageURL(chain);
};

const mapChainToCoin = (chain) => {
  // Map chain names to display names
  switch (chain) {
    case TokenType.BITCOIN:
      return "Bitcoin";
    case TokenType.ETHEREUM:
      return "Ethereum";
    case TokenType.SOLANA:
      return "Solana";
    case TokenType.FUM:
      return "Fradium";
    default:
      return "Unknown";
  }
};

const mapStatusToUI = (status) => {
  switch (status) {
    case "Success":
      return "Completed";
    case "Pending":
      return "Pending";
    case "Failed":
      return "Failed";
    default:
      return "Unknown";
  }
};

const formatTransactionTitle = (direction, details, chain) => {
  const address = "DUMMY"; // Since address details might not be complete

  if (direction === "Send") {
    switch (chain) {
      case TokenType.BITCOIN:
        return details.Bitcoin?.to_address ? `Transfer to ${details.Bitcoin.to_address.slice(0, 12)}..` : `Transfer to ${address}..`;
      case TokenType.ETHEREUM:
        return details.Ethereum?.to ? `Transfer to ${details.Ethereum.to.slice(0, 12)}..` : `Transfer to ${address}..`;
      case TokenType.SOLANA:
        return details.Solana?.recipient ? `Transfer to ${details.Solana.recipient.slice(0, 12)}..` : `Transfer to ${address}..`;
      case TokenType.FUM:
        return details.Fum?.to ? `Transfer to ${details.Fum.to.slice(0, 12)}..` : `Transfer to ${address}..`;
      default:
        return `Transfer to ${address}..`;
    }
  } else {
    switch (chain) {
      case TokenType.BITCOIN:
        return details.Bitcoin?.from_address ? `Received Bitcoin` : `Received from ${address}..`;
      case TokenType.ETHEREUM:
        return details.Ethereum?.from ? `Received Ethereum` : `Received from ${address}..`;
      case TokenType.SOLANA:
        return details.Solana?.sender ? `Received Solana` : `Received from ${address}..`;
      case TokenType.FUM:
        return details.Fum?.from ? `Received Fradium` : `Received from ${address}..`;
      default:
        return `Received from ${address}..`;
    }
  }
};

// ================= MAIN COMPONENT =================

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "all", // all, Completed, Pending, Failed
    direction: "all", // all, Send, Receive
    chain: "all", // all, Bitcoin, Ethereum, Solana
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactionHistory();
    }
  }, [isAuthenticated]);

  // Filter and search transactions
  useEffect(() => {
    let filtered = transactions;

    // Apply filters
    if (filters.status !== "all") {
      filtered = filtered.filter((tx) => tx.status === filters.status);
    }
    if (filters.direction !== "all") {
      filtered = filtered.filter((tx) => tx.type === (filters.direction === "Send" ? "transfer" : "received"));
    }
    if (filters.chain !== "all") {
      filtered = filtered.filter((tx) => tx.coin === filters.chain);
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((tx) => tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || tx.coin.toLowerCase().includes(searchQuery.toLowerCase()) || tx.status.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => {
      const timestampA = Number(a.rawData.timestamp);
      const timestampB = Number(b.rawData.timestamp);
      return timestampB - timestampA; // Descending order (newest first)
    });

    setFilteredTransactions(filtered);
  }, [transactions, filters, searchQuery]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await backend.get_transaction_history();

      if (result.Ok) {
        const formattedTransactions = await Promise.all(
          result.Ok.map(async (tx, index) => {
            const chain = Object.keys(tx.chain)[0]; // Extract chain name from variant
            const direction = Object.keys(tx.direction)[0]; // Extract direction from variant
            const rawAmount = Number(tx.amount);

            return {
              id: index + 1,
              type: direction === "Send" ? "transfer" : "received",
              title: formatTransactionTitle(direction, tx.details, chain),
              coin: mapChainToCoin(chain),
              icon: mapChainToIcon(chain),
              rawAmount: rawAmount, // Keep raw amount for formatting
              tokenType: chain,
              amount: direction === "Send" ? -rawAmount : rawAmount, // Use raw amount for display
              status: mapStatusToUI(Object.keys(tx.status)[0]),
              rawData: tx, // Keep original data for debugging
            };
          })
        );

        setTransactions(formattedTransactions);
      } else {
        setError(result.Err);
      }
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchToggle = () => {
    setShowSearchInput(!showSearchInput);
    if (showSearchInput) {
      setSearchQuery("");
    }
  };

  const handleFilterToggle = () => {
    setShowFilterModal(!showFilterModal);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      direction: "all",
      chain: "all",
    });
    setSearchQuery("");
    setShowSearchInput(false);
  };

  const activeFiltersCount = Object.values(filters).filter((value) => value !== "all").length + (searchQuery.trim() ? 1 : 0);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        <div className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#9BE4A0]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9BE4A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0v4m-4 8v-2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Connect Your Wallet</p>
              <p className="text-[#B0B6BE] text-sm mt-2">Access your complete transaction history and manage your crypto portfolio</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219] md:p-0 p-2">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-white md:text-2xl text-lg font-semibold">Transaction History</h1>
        <p className="text-[#B0B6BE] md:text-base text-sm font-normal">Track every move, stay in control. Your complete transaction timeline with real-time updates and intelligent status detection.</p>
      </div>

      {/* Transaction List Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-white md:text-lg text-base font-semibold">List of transactions</h2>
          <div className="flex gap-4">
            <div className="relative">
              <img src="/assets/icons/search.svg" alt="Search" className={`md:w-5 md:h-5 w-4 h-4 cursor-pointer transition-colors ${showSearchInput ? "opacity-100" : "opacity-70 hover:opacity-100"}`} onClick={handleSearchToggle} />
            </div>
            <div className="relative">
              <img src="/assets/icons/page_info.svg" alt="Filter" className={`md:w-5 md:h-5 w-4 h-4 cursor-pointer transition-colors ${activeFiltersCount > 0 ? "opacity-100" : "opacity-70 hover:opacity-100"}`} onClick={handleFilterToggle} />
              {activeFiltersCount > 0 && <span className="absolute -top-2 -right-2 bg-[#9BE4A0] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">{activeFiltersCount}</span>}
            </div>
          </div>
        </div>

        {/* Search Input */}
        {showSearchInput && (
          <div className="mb-4">
            <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg md:px-4 px-2 md:py-3 py-2 text-white placeholder-[#B0B6BE] text-sm outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[#B0B6BE] text-sm">Active filters:</span>
            {filters.status !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Status: {filters.status}
                <button onClick={() => handleFilterChange("status", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            {filters.direction !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Type: {filters.direction}
                <button onClick={() => handleFilterChange("direction", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            {filters.chain !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Chain: {filters.chain}
                <button onClick={() => handleFilterChange("chain", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[#B0B6BE] text-xs hover:text-white">
              Clear all
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9BE4A0]"></div>
              <div>
                <p className="text-white font-medium">Syncing your transactions...</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Fetching latest data from blockchain</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Unable to load transactions</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Something went wrong while fetching your data</p>
              </div>
              <button onClick={fetchTransactionHistory} className="mt-2 px-6 py-2 bg-[#9BE4A0] text-black rounded-lg hover:bg-[#8FD391] transition-colors font-medium">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">No transactions yet</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Start sending or receiving crypto to see your activity here</p>
              </div>
            </div>
          </div>
        )}

        {/* No Filtered Results */}
        {!loading && !error && transactions.length > 0 && filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">No transactions found</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Try adjusting your search or filter criteria</p>
              </div>
              <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#9BE4A0] text-black rounded-lg hover:bg-[#8FD391] transition-colors font-medium text-sm">
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        {!loading && !error && filteredTransactions.length > 0 && (
          <div className="flex flex-col">
            {filteredTransactions.map((transaction, index) => (
              <div key={transaction.id}>
                <div className="flex items-center justify-between md:py-4 py-2">
                  {/* Left Side - Icon and Details */}
                  <div className="flex items-center md:gap-4 gap-2">
                    <img src={transaction.icon} alt={transaction.coin} className="md:w-12 md:h-12 w-8 h-8" />
                    <div className="flex flex-col">
                      <div className="flex items-center md:gap-2 gap-1">
                        <span className="text-white md:text-base text-sm font-medium">{transaction.title}</span>
                        <div className={`px-2 py-0.5 rounded-lg text-xs font-medium ${transaction.status === "Completed" ? "text-[#9BE4A0] bg-[#9BE4A0] bg-opacity-20" : transaction.status === "Pending" ? "text-yellow-400 bg-yellow-400 bg-opacity-20" : "text-red-400 bg-red-400 bg-opacity-20"}`}>{transaction.status}</div>
                      </div>
                      <span className="text-[#B0B6BE] md:text-sm text-xs font-medium">{transaction.coin}</span>
                    </div>
                  </div>

                  {/* Right Side - Amount and Date */}
                  <div className="flex flex-col items-end gap-1">
                    <TransactionAmount amount={transaction.amount} rawAmount={transaction.rawAmount} tokenType={transaction.tokenType} />
                    <span className="text-[#B0B6BE] md:text-sm text-xs">{formatTransactionDate(transaction.rawData.timestamp)}</span>
                  </div>
                </div>
                {/* Divider */}
                {index < filteredTransactions.length - 1 && <div className="border-b border-[#23272F]"></div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative">
            <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={handleFilterToggle} aria-label="Close">
              ×
            </button>

            <div className="text-white text-xl font-semibold mb-6">Filter Transactions</div>

            <div className="flex flex-col gap-6">
              {/* Status Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Direction Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Transaction Type</label>
                <select value={filters.direction} onChange={(e) => handleFilterChange("direction", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Types</option>
                  <option value="Send">Sent</option>
                  <option value="Receive">Received</option>
                </select>
              </div>

              {/* Chain Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Blockchain</label>
                <select value={filters.chain} onChange={(e) => handleFilterChange("chain", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Chains</option>
                  <option value={TokenType.BITCOIN}>Bitcoin</option>
                  <option value={TokenType.ETHEREUM}>Ethereum</option>
                  <option value={TokenType.SOLANA}>Solana</option>
                  <option value={TokenType.FUM}>Fradium</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-8">
              <button onClick={clearFilters} className="flex-1 px-4 py-2 bg-[#393E4B] text-white rounded-lg hover:bg-[#4A515F] transition-colors">
                Clear All
              </button>
              <button onClick={handleFilterToggle} className="flex-1 px-4 py-2 bg-[#9BE4A0] text-black rounded-lg hover:bg-[#8FD391] transition-colors font-medium">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to handle token amount formatting
function TransactionAmount({ amount, rawAmount, tokenType }) {
  // Use tokenUtils for formatting
  const formattedAmount = getAmountToken(tokenType, Math.abs(rawAmount));

  return (
    <span className={`text-base font-medium ${amount > 0 ? "text-[#9BE4A0]" : "text-[#E49B9C]"}`}>
      {amount > 0 ? "+" : "-"}
      {formattedAmount} {mapChainToCoin(tokenType)}
    </span>
  );
}
