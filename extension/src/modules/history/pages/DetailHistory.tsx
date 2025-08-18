import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getScanHistoryItemById, type ScanHistoryItem } from "@/lib/localStorage";
import { ROUTES } from "@/constants/routes";
import NeoButton from "@/components/ui/custom-button";
import Wallet from "../../../assets/Wallet.svg";

function DetailHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyItem, setHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      console.log('DetailHistory: Loading history item with ID:', id);
      
      const item = getScanHistoryItemById(id);
      
      console.log('DetailHistory: History item loaded:', item);

      if (item) {
        console.log('DetailHistory: Regular item details:', {
          source: item.source,
          address: item.address,
          isSafe: item.isSafe
        });
      }

      setHistoryItem(item);
      setLoading(false);
    } else {
      console.log('DetailHistory: No ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md flex items-center justify-center">
        <p>Loading...</p>
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
            onClick={() => navigate(ROUTES.HISTORY)}
          >
            Back to History
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
        {historyItem.source === "ai" && historyItem.analysisResult.aiData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{(historyItem.analysisResult.aiData.ransomware_probability * 100).toFixed(2)}%</p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Ransomware Probability</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{historyItem.analysisResult.aiData.confidence_level}</p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Confidence Level</p>
              </div>
            </div>
          </div>
        ) : historyItem.source === "community" && historyItem.analysisResult.communityData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.communityData.report?.[0]?.voted_by?.length || "0"}
              </p>
              <div className="flex flex-row">
                <img src={Wallet} alt="Voters" className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Total Voters</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {historyItem.analysisResult.communityData.report?.[0] ? 
                  `${historyItem.analysisResult.communityData.report[0].votes_yes} Yes / ${historyItem.analysisResult.communityData.report[0].votes_no} No` : 
                  "N/A"
                }
              </p>
              <div className="flex flex-row">
                <p className="font-normal text-[14px] text-white/60 ps-1">Confidence Level</p>
              </div>
            </div>
          </div>
        ) : null}
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