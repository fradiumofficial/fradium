import { SafetyCard } from "~components/custom-card";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { ROUTES } from "~lib/constant/routes";
import { ArrowLeft } from "lucide-react";
import LocalStorageService, { type LocalAnalysisHistory } from "~service/localStorageService";
import { CDN } from "~lib/constant/cdn";
import NeoButton from "~components/custom-button";

type ScanHistoryItem = LocalAnalysisHistory;

function DetailHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyItem, setHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistoryDetail = () => {
      if (!id) {
        console.log('DetailHistory: No ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('DetailHistory: Loading history item with ID:', id);
        setLoading(true);
        setError(null);

        // Fetch all history from local storage
        const historyData = LocalStorageService.getHistory();

        // Find the specific item by ID
        const item = historyData.find((d) => d.id === id) || null;

        console.log('DetailHistory: History item loaded:', item);

        if (item) {
          console.log('DetailHistory: Item details:', {
            source: item.source,
            address: item.address,
            isSafe: item.isSafe,
            status: item.status,
            tokenType: item.tokenType
          });
        }

        setHistoryItem(item);
      } catch (err) {
        console.error('Error loading history detail:', err);
        setError("Failed to load history details");
      } finally {
        setLoading(false);
      }
    };

    loadHistoryDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="w-[375px] text-white shadow-md flex items-center justify-center">
        <div className="text-center">
          <div className="text-[16px] font-medium mb-2">Loading history details...</div>
          <div className="text-white/60 text-[14px]">Please wait while we fetch the details</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[375px] text-white shadow-md overflow-y-auto">
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">Error Loading History</h1>
          <p className="text-red-400 text-[14px] mb-4">{error}</p>
          <div className="space-y-3">
            <NeoButton
              onClick={() => window.location.reload()}
            >
              Try Again
            </NeoButton>
            <div>
              <button
                onClick={() => navigate(ROUTES.SCAN_HISTORY)}
                className="text-white/60 text-sm underline hover:text-white"
              >
                Back to Scan History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert confidence percentage untuk SafetyCard
  const getConfidencePercentage = () => {
    if (!historyItem?.analysisResult) return 50;

    // If we have direct confidence value from local storage
    if (historyItem.analysisResult.confidence) {
      return Math.round(historyItem.analysisResult.confidence);
    }

    // Fallback for AI data
    if (historyItem.source === "ai" && historyItem.analysisResult.aiData) {
      return Math.round((historyItem.analysisResult.aiData.confidence_level === "HIGH" ? 95 :
                        historyItem.analysisResult.aiData.confidence_level === "MEDIUM" ? 75 : 50));
    }

    // Fallback for community data
    if (historyItem.source === "community" && historyItem.analysisResult.communityData) {
      // For community, calculate based on vote ratio
      const report = historyItem.analysisResult.communityData.report?.[0];
      if (report) {
        const totalVotes = Number(report.votes_yes) + Number(report.votes_no);
        if (totalVotes > 0) {
          return Math.round((Number(report.votes_yes) / totalVotes) * 100);
        }
      }
      return 50; // Default for community
    }

    return 50; // Default fallback
  };

  const confidencePercentage = getConfidencePercentage();

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto relative">

      {/* Analyze Address Section */}
      <div className="m-4">
        <div className="flex items-center gap-3">
          {/* Back Arrow Icon */}
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-[20px] font-semibold">Detail Scan History</h1>
        </div>

        <SafetyCard
          confidence={confidencePercentage}
          title={"Address"}
          isSafe={historyItem.isSafe}
        />

        <div className="flex flex-col items-start p-[0px_8px] gap-4 mt-[14px] flex-none order-2 self-stretch flex-grow-0">
          <div className="w-[122px] font-['General Sans'] font-semibold text-[16px] leading-[120%] text-white flex-none order-0 flex-grow-0">
            Address Details
          </div>
          <div className="text-[14px] font-extralight text-white/50 mb-[10px]">
            {historyItem.address}
          </div>
        </div>

        {/* Address Details Section */}
        <div className="flex flex-col items-start p-[0px_8px] gap-4 mt-[14px] h-[102px] flex-none order-2 self-stretch flex-grow-0">
          {/* Address Details Title */}
          <div className="w-[122px] h-[19px] font-['General Sans'] font-semibold text-[16px] leading-[120%] text-white flex-none order-0 flex-grow-0">
            Address Details
          </div>

          {/* Cards Container */}
          <div className="flex flex-row flex-wrap items-center content-start p-0 gap-[10px] h-[67px] flex-none order-1 self-stretch flex-grow-0">
            {/* Ransomware Card */}
            <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] h-[67px] bg-white/5 backdrop-blur-[5px] rounded-[12px] flex-none order-0 flex-grow-1">
              {/* Ransomware Probability Value */}
              <div className="w-[74px] h-[19px] font-['General Sans'] font-medium text-[16px] leading-[120%] tracking-[-0.02em] text-[#E49B9C] flex-none order-0 flex-grow-0">
                {getConfidencePercentage()}%
              </div>

              {/* Ransomware Label with Icon */}
              <div className="flex flex-row items-center p-0 gap-[6px] h-[18px] flex-none order-1 flex-grow-0">
                {/* Speedometer Icon Container */}
                <img src={CDN.icons.riskScore} alt="Ransomware" />
                <div className="w-[91px] h-[18px] font-['General Sans'] font-normal text-[14px] leading-[130%] text-white/60 flex-none order-1 flex-grow-0">
                  Ransomware
                </div>
              </div>
            </div>

            {/* Confidence Level Card */}
            <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 backdrop-blur-[5px] rounded-[12px]">
              {/* Confidence Level Value */}
              <div className="w-[40px] h-[19px] font-['General Sans'] font-medium text-[16px] leading-[120%] tracking-[-0.02em] text-white flex-none order-0 flex-grow-0">
                {historyItem.analysisResult.aiData?.confidence_level || "N/A"}
              </div>

              {/* Confidence Level Label with Icon */}
              <div className="flex flex-row items-center p-0 gap-[6px] h-[18px] flex-none order-1 flex-grow-0">
                {/* Align Bottom Icon Container */}
                <img src={CDN.icons.total} alt="Confidence Level" />
                <div className="w-[110px] h-[18px] font-['General Sans'] font-extralight text-[14px] leading-[130%] text-white/60 flex-none order-1 flex">
                  Confidence Level
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailHistory;