import { SafetyCard } from "~components/custom-card";
import ProfileHeader from "~components/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { ROUTES } from "~lib/constant/routes";
import NeoButton from "~components/custom-button";
import { Wallet } from "lucide-react";
import { HistoryService } from "~service/historyService";
import { useAuth } from "~lib/context/authContext";

type ScanHistoryItem = {
  id: string;
  address: string;
  tokenType: string;
  isSafe: boolean;
  source: "ai" | "community";
  date: string;
  analysisResult: any;
};

function DetailHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { identity } = useAuth();
  const [historyItem, setHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistoryDetail = async () => {
      if (!id) {
        console.log('DetailHistory: No ID provided');
        setLoading(false);
        return;
      }

      if (!identity) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        console.log('DetailHistory: Loading history item with ID:', id);
        setLoading(true);
        setError(null);

        // Set identity for the service
        HistoryService.identity = identity;

        // Fetch all history from backend
        const result = await HistoryService.getAnalyzeHistory();

        if (result.success && result.data) {
          // Convert backend data to frontend format
          const frontendData = HistoryService.convertBackendHistoryToFrontend(result.data);

          // Find the specific item by ID
          const item = frontendData.find((d) => d.id === id) || null;

          console.log('DetailHistory: History item loaded:', item);

          if (item) {
            console.log('DetailHistory: Regular item details:', {
              source: item.source,
              address: item.address,
              isSafe: item.isSafe
            });
          }

          setHistoryItem(item);
        } else {
          setError(result.error || "Failed to load history details");
          // No dummy data fallback - show error state instead
          setHistoryItem(null);
        }
      } catch (err) {
        console.error('Error loading history detail:', err);
        setError("Failed to load history details");
      } finally {
        setLoading(false);
      }
    };

    loadHistoryDetail();
  }, [id, identity]);

  if (loading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md flex items-center justify-center">
        <div className="text-center">
          <div className="text-[16px] font-medium mb-2">Loading history details...</div>
          <div className="text-white/60 text-[14px]">Please wait while we fetch the details</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
        <ProfileHeader />
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

  if (!historyItem) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
        <ProfileHeader />
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">History Not Found</h1>
          <p className="text-white/50 mb-4">The requested history item could not be found.</p>
          <NeoButton
            icon={Wallet}
            onClick={() => navigate(ROUTES.SCAN_HISTORY)}
          >
            Back to Scan History
          </NeoButton>
        </div>
      </div>
    );
  }

  // Convert confidence percentage untuk SafetyCard
  const getConfidencePercentage = () => {
    if (historyItem.source === "ai" && historyItem.analysisResult.aiData) {
      return Math.round((historyItem.analysisResult.aiData.confidence_level === "HIGH" ? 95 : historyItem.analysisResult.aiData.confidence_level === "MEDIUM" ? 75 : 50));
    } else if (historyItem.source === "community" && historyItem.analysisResult.communityData) {
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
    return 50;
  };

  const confidencePercentage = getConfidencePercentage();

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">

      {/* Header Sections */}
      <ProfileHeader />

      {/* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Detail Scan History</h1>

        <SafetyCard
          confidence={confidencePercentage}
          title={"Address"}
          isSafe={historyItem.isSafe}
        />

        {/* Analysis Source Indicator */}
        <div className="mt-4 p-3 bg-white/5 rounded">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${historyItem.source === "community" ? "bg-blue-400" : "bg-purple-400"}`}></div>
            <span className="text-sm font-medium">
              Detected by {historyItem.source === "community" ? "Community Analysis" : "AI Analysis"}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-[20px] font-semibold mt-[20px]">Address</h1>
          <p className="text-[14px] font-regular text-white/50">{historyItem.address}</p>
        </div>
        
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Detail Scan History</h1>
        
        {/* Render different details based on analysis source */}
        {historyItem.source === "ai" && (historyItem.analysisResult.ai_data || historyItem.analysisResult.aiData) ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.ai_data?.confidence || historyItem.analysisResult.aiData?.confidence_level || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Confidence Level</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.ai_data?.risk_level || historyItem.analysisResult.risk_level || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Risk Level</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.final_status || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Analysis Status</p>
              </div>
            </div>
          </div>
        ) : historyItem.source === "community" && (historyItem.analysisResult.community_data || historyItem.analysisResult.communityData) ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.community_data?.report?.[0]?.voted_by?.length ||
                 historyItem.analysisResult.communityData?.report?.[0]?.voted_by?.length || "0"}
              </p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Total Voters</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.community_data?.report?.[0] ?
                  `${historyItem.analysisResult.community_data.report[0].votes_yes} Yes / ${historyItem.analysisResult.community_data.report[0].votes_no} No` :
                  historyItem.analysisResult.communityData?.report?.[0] ?
                  `${historyItem.analysisResult.communityData.report[0].votes_yes} Yes / ${historyItem.analysisResult.communityData.report[0].votes_no} No` :
                  "N/A"
                }
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Vote Results</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.final_status || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Analysis Status</p>
              </div>
            </div>
          </div>
        ) : (
          // Fallback for data with different structure
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult?.source || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Analysis Source</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult?.final_status || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Status</p>
              </div>
            </div>

            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult?.risk_level || "N/A"}
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Risk Level</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-4">
        <NeoButton onClick={() => navigate(ROUTES.HOME)}>
          Complete
        </NeoButton>
      </div>
    </div>
  );
}

export default DetailHistory;