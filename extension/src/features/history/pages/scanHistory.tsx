import { Search, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useState, useEffect } from "react";
import { CDN } from "~lib/constant/cdn";
import LocalStorageService, { type LocalAnalysisHistory } from "~service/localStorageService";

function ScanHistory() {
  const navigate = useNavigate();
  const [scanItems, setScanItems] = useState<LocalAnalysisHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<LocalAnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load scan history on component mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch history from local storage
        const history = LocalStorageService.getHistory();
        setScanItems(history);
      } catch (err) {
        console.error("Error loading scan history:", err);
        setError("Failed to load scan history");
        setScanItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems(scanItems);
    } else {
      const filtered = LocalStorageService.searchHistory(searchTerm);
      setFilteredItems(filtered);
    }
  }, [scanItems, searchTerm]);

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Format date in custom format: DD/MM/YY, HH.MM
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day}/${month}/${year}, ${hours}.${minutes}`;
    } catch (error) {
      // Fallback if date parsing fails
      return 'Invalid Date';
    }
  };

  // Get subtitle based on analysis result
  const getSubtitle = (item: LocalAnalysisHistory) => {
    const riskStatus = item.isSafe ? "Safe" : "Risk Detected";
    const source = item.source === "ai" ? "AI" :
                  item.source === "ai_and_community" ? "AI + Community" : "Community";
    const status = item.status === "completed" ? "" : `(${item.status})`;
    return `${riskStatus} - ${source} ${status}`.trim();
  };

  // Handle item click to navigate to detail
  const handleItemClick = (item: LocalAnalysisHistory) => {
    console.log('Analysis item clicked:', item);
    navigate(ROUTES.DETAIL_HISTORY.replace(":id", item.id));
  };

  const SHOW_EMPTY = filteredItems.length === 0;

  return (
    <div
      className={`w-[375px] space-y-4 text-white shadow-md overflow-y-auto`}
    >
      {/* Content wrapper fills remaining height */}
      <div
        className={`relative flex-1 ${
          SHOW_EMPTY ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        <div className="px-4 pb-4 h-full flex flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between pt-3 select-none">
            <button
              type="button"
              className="flex-1 text-center text-white/60 text-[14px] font-semibold"
              onClick={() => navigate(ROUTES.HISTORY)}
            >
              Transaction
            </button>
            <div className="flex-1 text-center text-white text-[14px] font-semibold">
              Scan History
            </div>
          </div>
          {/* underline line with active segment at right */}
          <div className="relative mt-2 h-[2px] w-full bg-white/10">
            <div className="absolute right-0 w-[170px] h-[2px] bg-white" />
          </div>

          {/* Search row */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-12 bg-[#2C2D33] border border-white/10 rounded-md flex items-center px-3 text-white/70">
              <Search className="w-5 h-5 mr-2 text-white/60" />
              <input
                type="text"
                placeholder="Search by token or address"
                className="bg-transparent outline-none placeholder:text-white/60 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="h-12 w-12 rounded-md bg-[#3A3B41] border border-white/10 flex items-center justify-center"
            >
              <Settings2 className="text-white/80" />
            </button>
          </div>

          {/* List or Empty State area fills remaining height */}
          <div className="relative flex-1 mt-6">
            {isLoading ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                <div>
                  <div className="text-[16px] font-medium mb-2">Loading history...</div>
                  <div className="text-white/60 text-[14px]">Please wait while we fetch your scan history</div>
                </div>
              </div>
            ) : error ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                <div>
                  <img
                    src={CDN.icons.empty}
                    alt="error"
                    className="w-16 h-16 mb-6 mx-auto"
                  />
                  <div className="text-[18px] font-medium mb-2">Error loading history</div>
                  <div className="text-red-400 text-[14px] font-normal leading-relaxed max-w-[320px] mx-auto mb-4">
                    {error}
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-[#3A3B41] text-white px-4 py-2 rounded-md text-sm hover:bg-[#4A4B51] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : SHOW_EMPTY ? (
              <>
                <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                  <div>
                    <img
                      src={CDN.icons.empty}
                      alt="empty"
                      className="w-16 h-16 mb-6 mx-auto"
                    />
                    <div className="text-[18px] font-medium mb-2">
                      No scan history here...
                    </div>
                    <div className="text-white/60 text-[14px] font-normal leading-relaxed max-w-[320px] mx-auto">
                      Use your fradium AI analyzer to analyze address and smart
                      contract, your activity will appear here
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-1 space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <img
                          src={CDN.tokens[item.tokenType.toLowerCase() as keyof typeof CDN.tokens]}
                          alt={item.tokenType}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              CDN.tokens.unknown;
                          }}
                        />
                        <div className="ml-3">
                          <div className="text-[14px] font-normal leading-6">
                            {formatAddress(item.address)}
                          </div>
                          <div
                            className={`text-[12px] mt-1 ${
                              item.status === "in_progress"
                                ? "text-yellow-400"
                                : item.isSafe
                                  ? "text-green-400"
                                  : "text-red-400"
                            }`}
                          >
                            {getSubtitle(item)}
                          </div>
                        </div>
                      </div>
                      <div className="text-white/60 text-[14px] mt-1">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="mt-4 h-px w-full bg-white/10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanHistory;
