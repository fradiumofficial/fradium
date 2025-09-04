import React, { useState, useEffect } from "react";
import { useAuth } from "../../core/providers/AuthProvider";
import { backend } from "declarations/backend";
import { getTokenImageURL, TokenType } from "../../core/lib/tokenUtils";

// Format timestamp to readable date with time
const formatScanDate = (timestamp) => {
  // Convert nanoseconds to milliseconds
  const date = new Date(Number(timestamp) / 1000000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const mapTokenTypeToCoin = (tokenType) => {
  const tokenKey = Object.keys(tokenType)[0];
  switch (tokenKey) {
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

const mapAnalysisTypeToSource = (analysisType) => {
  const typeKey = Object.keys(analysisType)[0];
  switch (typeKey) {
    case "CommunityVote":
      return "Community";
    case "AIAnalysis":
      return "AI";
    default:
      return "Unknown";
  }
};

const formatAnalysisType = (isSafe, analysisSource) => {
  if (isSafe) {
    return `Safe - ${analysisSource}`;
  } else {
    // Try to extract more specific type from metadata if available
    return `Unsafe - ${analysisSource}`;
  }
};

const formatScanTitle = (isSafe, analysisSource) => {
  if (isSafe) {
    return `Verified safe by ${analysisSource}`;
  } else {
    return `Flagged unsafe by ${analysisSource}`;
  }
};

const formatAddress = (address) => {
  if (!address) return "";
  if (address.length <= 15) {
    return address;
  }
  // Format: 6 karakter awal ... 6 karakter akhir
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export default function ScanHistoryPage() {
  const [scanHistory, setScanHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(8);
  const [filters, setFilters] = useState({
    safety: "all", // all, safe, unsafe
    source: "all", // all, Community, AI
    token: "all", // all, Bitcoin, Ethereum, Solana
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchScanHistory();
    }
  }, [isAuthenticated]);

  // Filter and search scan history
  useEffect(() => {
    let filtered = scanHistory;

    // Apply filters
    if (filters.safety !== "all") {
      filtered = filtered.filter((scan) => {
        if (filters.safety === "safe") return scan.isSafe;
        if (filters.safety === "unsafe") return !scan.isSafe;
        return true;
      });
    }
    if (filters.source !== "all") {
      filtered = filtered.filter((scan) => scan.source === filters.source);
    }
    if (filters.token !== "all") {
      filtered = filtered.filter((scan) => {
        const tokenKey = Object.keys(scan.rawData.token_type)[0];
        return tokenKey === filters.token;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((scan) => scan.fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) || scan.title.toLowerCase().includes(searchQuery.toLowerCase()) || scan.coin.toLowerCase().includes(searchQuery.toLowerCase()) || scan.source.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => {
      const timestampA = Number(a.rawData.created_at);
      const timestampB = Number(b.rawData.created_at);
      return timestampB - timestampA; // Descending order (newest first)
    });

    setFilteredHistory(filtered);
    // Reset items to show when filters change
    setItemsToShow(8);
  }, [scanHistory, filters, searchQuery]);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await backend.get_analyze_history();
      console.log("Scan history result:", result);

      if (result.Ok) {
        const formattedHistory = result.Ok.map((scan, index) => {
          const source = mapAnalysisTypeToSource(scan.analyzed_type);
          const tokenKey = Object.keys(scan.token_type)[0];
          const coin = mapTokenTypeToCoin(scan.token_type);

          return {
            id: index + 1,
            address: formatAddress(scan.address),
            fullAddress: scan.address,
            title: formatScanTitle(scan.is_safe, source),
            type: formatAnalysisType(scan.is_safe, source),
            coin: coin,
            icon: getTokenImageURL(tokenKey), // Use tokenKey for proper mapping
            isSafe: scan.is_safe,
            source: source,
            date: formatScanDate(scan.created_at),
            rawData: scan, // Keep original data for debugging
          };
        });

        setScanHistory(formattedHistory);
      } else {
        setError(result.Err);
      }
    } catch (err) {
      console.error("Error fetching scan history:", err);
      setError("Failed to fetch scan history");
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
      safety: "all",
      source: "all",
      token: "all",
    });
    setSearchQuery("");
    setShowSearchInput(false);
  };

  const loadMore = () => {
    setItemsToShow((prev) => prev + 8);
  };

  const activeFiltersCount = Object.values(filters).filter((value) => value !== "all").length + (searchQuery.trim() ? 1 : 0);

  // Copy address function
  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      // You could add a toast notification here
      console.log("Address copied to clipboard:", address);
    } catch (err) {
      console.error("Failed to copy address:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        console.log("Address copied to clipboard (fallback):", address);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

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
              <p className="text-[#B0B6BE] text-sm mt-2">Access your complete scan history and security analysis records</p>
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
        <h1 className="text-white md:text-2xl text-lg font-semibold">Scan History</h1>
        <p className="text-[#B0B6BE] md:text-base text-sm font-normal">Your complete address analysis history with community reports and AI-powered security scans.</p>
      </div>

      {/* Scan Activity List Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-white md:text-lg text-base font-semibold">List of scan activity</h2>
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
            <input type="text" placeholder="Search scan history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg md:px-4 px-2 md:py-3 py-2 text-white placeholder-[#B0B6BE] text-sm outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[#B0B6BE] text-sm">Active filters:</span>
            {filters.safety !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Safety: {filters.safety}
                <button onClick={() => handleFilterChange("safety", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            {filters.source !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Source: {filters.source}
                <button onClick={() => handleFilterChange("source", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
                  ×
                </button>
              </span>
            )}
            {filters.token !== "all" && (
              <span className="px-2 py-1 bg-[#9BE4A0]/20 text-[#9BE4A0] text-xs rounded-lg flex items-center gap-1">
                Token: {filters.token}
                <button onClick={() => handleFilterChange("token", "all")} className="hover:bg-[#9BE4A0]/30 rounded">
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
                <p className="text-white font-medium">Loading scan history...</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Fetching your security analysis records</p>
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
                <p className="text-white font-medium">Unable to load scan history</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Something went wrong while fetching your data</p>
              </div>
              <button onClick={fetchScanHistory} className="mt-2 px-6 py-2 bg-[#9BE4A0] text-black rounded-lg hover:bg-[#8FD391] transition-colors font-medium">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && scanHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">No scan history yet</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Start analyzing addresses to see your security scan records here</p>
              </div>
            </div>
          </div>
        )}

        {/* No Filtered Results */}
        {!loading && !error && scanHistory.length > 0 && filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">No scans found</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Try adjusting your search or filter criteria</p>
              </div>
              <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-[#9BE4A0] text-black rounded-lg hover:bg-[#8FD391] transition-colors font-medium text-sm">
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Scan Activities */}
        {!loading && !error && filteredHistory.length > 0 && (
          <>
            <div className="flex flex-col">
              {filteredHistory.slice(0, itemsToShow).map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between md:py-4 py-2">
                    {/* Left Side - Icon and Details */}
                    <div className="flex items-start md:gap-4 gap-2 flex-1">
                      <img src={activity.icon} alt={activity.coin} className="md:w-12 md:h-12 w-8 h-8 mt-1" />
                      <div className="flex flex-col flex-1">
                        <span className="text-white md:text-base text-sm font-medium leading-tight md:mb-2 mb-1">{activity.title}</span>
                        <div className="flex items-center md:gap-2 gap-1">
                          <span className="text-[#B0B6BE] md:text-sm text-xs font-medium font-mono">{activity.address}</span>
                          <button onClick={() => copyToClipboard(activity.fullAddress)} className="text-[#B0B6BE] hover:text-[#9BE4A0] transition-colors" title="Copy address">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Status and Date */}
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded-lg text-xs font-medium ${activity.isSafe ? "text-[#9BE4A0] bg-[#9BE4A0] bg-opacity-20" : "text-red-400 bg-red-400 bg-opacity-20"}`}>{activity.isSafe ? "Safe" : "Unsafe"}</div>
                      <span className="text-[#B0B6BE] md:text-sm text-xs font-medium">{activity.date}</span>
                    </div>
                  </div>
                  {/* Divider */}
                  {index < filteredHistory.slice(0, itemsToShow).length - 1 && <div className="border-b border-[#23272F]"></div>}
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {itemsToShow < filteredHistory.length && (
              <div className="flex justify-center mt-6">
                <button onClick={loadMore} className="px-4 py-2 text-[#B0B6BE] font-medium text-sm rounded-lg hover:text-white transition flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14m-7-7l7 7 7-7" />
                  </svg>
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative">
            <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={handleFilterToggle} aria-label="Close">
              ×
            </button>

            <div className="text-white text-xl font-semibold mb-6">Filter Scan History</div>

            <div className="flex flex-col gap-6">
              {/* Safety Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Safety Status</label>
                <select value={filters.safety} onChange={(e) => handleFilterChange("safety", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Status</option>
                  <option value="safe">Safe</option>
                  <option value="unsafe">Unsafe</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Analysis Source</label>
                <select value={filters.source} onChange={(e) => handleFilterChange("source", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Sources</option>
                  <option value="Community">Community</option>
                  <option value="AI">AI Analysis</option>
                </select>
              </div>

              {/* Token Filter */}
              <div>
                <label className="text-[#B0B6BE] text-sm mb-2 block">Token Type</label>
                <select value={filters.token} onChange={(e) => handleFilterChange("token", e.target.value)} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#9BE4A0]">
                  <option value="all">All Tokens</option>
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
