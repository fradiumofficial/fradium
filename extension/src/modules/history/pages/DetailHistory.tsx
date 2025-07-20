import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getHistoryItemById, type HistoryItem } from "@/lib/localStorage";
import type { ICPAnalysisResult, ICPAnalysisCommunityResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
import { ROUTES } from "@/constants/routes";
import NeoButton from "@/components/ui/custom-button";
import Wallet from "../../../assets/Wallet.svg";

function DetailHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const item = getHistoryItemById(id);
      setHistoryItem(item);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!historyItem) {
    return (
      <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
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
    if (historyItem.analysisType === 'icp') {
      const icpResult = historyItem.result as ICPAnalysisResult;
      return Math.round((icpResult.confidence_level === "HIGH" ? 95 : icpResult.confidence_level === "MEDIUM" ? 75 : 50));
    } else {
      // Untuk community, gunakan vote ratio sebagai confidence
      const communityResult = historyItem.result as ICPAnalysisCommunityResult;
      if (communityResult.report) {
        const totalVotes = communityResult.report.votes_yes + communityResult.report.votes_no;
        return totalVotes > 0 ? Math.round((Math.max(communityResult.report.votes_yes, communityResult.report.votes_no) / totalVotes) * 100) : 50;
      }
      return 50;
    }
  };

  const getAnalysisDetails = () => {
    if (historyItem.analysisType === 'icp') {
      const icpResult = historyItem.result as ICPAnalysisResult;
      return [
        { label: "Ransomware Probability", value: `${(icpResult.ransomware_probability * 100).toFixed(2)}%`, color: icpResult.ransomware_probability > 0.5 ? "#E49B9C" : "#4A834C" },
        { label: "Confidence Level", value: icpResult.confidence_level, color: "white" },
        { label: "Transactions Analyzed", value: icpResult.transactions_analyzed.toString(), color: "white" },
        { label: "Threshold Used", value: icpResult.threshold_used.toString().substring(0, 6), color: "white" },
      ];
    } else {
      const communityResult = historyItem.result as ICPAnalysisCommunityResult;
      const details = [
        { label: "Community Status", value: communityResult.is_safe ? "Safe" : "Risky", color: communityResult.is_safe ? "#4A834C" : "#E49B9C" },
      ];
      
      if (communityResult.report) {
        details.push(
          { label: "Report Category", value: communityResult.report.category, color: "white" },
          { label: "Votes Yes", value: communityResult.report.votes_yes.toString(), color: "#4A834C" },
          { label: "Votes No", value: communityResult.report.votes_no.toString(), color: "#E49B9C" },
        );
      }
      
      return details;
    }
  };

  const analysisDetails = getAnalysisDetails();
  const reportedBy = historyItem.analysisType === 'icp' ? "Fradium AI" : "Community Report";

  return (
    <div className="w-[400px] h-full space-y-4 bg-[#25262B] text-white shadow-md">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="font-semibold text-[20px] text-white mb-4">Detail History</h1>
        
        <SafetyCard 
          confidence={getConfidencePercentage()} 
          title={"Address"} 
          isSafe={historyItem.isSafe} 
        />

        {/* Address Name */}
        <div className="flex flex-col mt-4">
          <h1 className="font-semibold text-[16px]">Address</h1>
          <p className="text-[14px] font-normal text-white/50 pt-[4px] break-all">
            {historyItem.address}
          </p>
        </div>

        {/* Address Detail */}
        <div className="flex flex-col mt-4">
          <h1 className="font-semibold text-[16px] pb-[4px]">Analysis Details</h1>
          {analysisDetails.map((detail, index) => (
            <div key={index} className="flex flex-row space-x-4 py-1">
              <p className="w-32 flex font-normal text-[14px] text-white/50">{detail.label}</p>
              <p className="flex-1 text-[14px] font-medium" style={{ color: detail.color }}>
                {detail.value}
              </p>
            </div>
          ))}
        </div>

        {/* Analysis Type & Date */}
        <div className="flex flex-col mt-4">
          <div className="flex flex-row space-x-4 py-1">
            <p className="w-32 flex font-normal text-[14px] text-white/50">Analysis Type</p>
            <p className="flex-1 text-white text-[14px] font-medium">
              {historyItem.analysisType === 'icp' ? 'AI Analysis' : 'Community Report'}
            </p>
          </div>
          <div className="flex flex-row space-x-4 py-1">
            <p className="w-32 flex font-normal text-[14px] text-white/50">Analyzed Date</p>
            <p className="flex-1 text-white text-[14px] font-medium">{historyItem.date}</p>
          </div>
        </div>

        <div className="w-full flex items-end mt-6">
          <h1 className="text-white/50 font-medium text-[14px]">Reported By: {reportedBy}</h1>
        </div>

        {/* Action Button */}
        <div className="mt-6 p-4">
          <NeoButton 
            icon={Wallet} 
            onClick={() => navigate(ROUTES.HISTORY)}
          >
            Back to History
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

export default DetailHistory;