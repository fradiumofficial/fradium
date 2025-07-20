import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getHistoryItemById, type HistoryItem } from "@/lib/localStorage";
import type { ICPAnalysisResult, ICPAnalysisCommunityResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
import type { Root as SmartContractAnalysisResult } from "@/modules/analyze_smartcontract/model/AnalyzeSmartContractModel";
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
    } else if (historyItem.analysisType === 'smartcontract') {
      // Untuk smart contract, confidence berdasarkan kebalikan dari risk score
      return Math.round(100 - historyItem.riskScore);
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
    } else if (historyItem.analysisType === 'smartcontract') {
      const smartContractResult = historyItem.result as SmartContractAnalysisResult;
      const summary = {
        total_issues: smartContractResult.issues.length,
        high: smartContractResult.issues.filter(issue => issue.severity.toLowerCase() === 'high').length,
        medium: smartContractResult.issues.filter(issue => issue.severity.toLowerCase() === 'medium').length,
        low: smartContractResult.issues.filter(issue => issue.severity.toLowerCase() === 'low').length,
      };

      return [
        { label: "Total Issues", value: summary.total_issues.toString(), color: summary.total_issues > 0 ? "#E49B9C" : "#4A834C" },
        { label: "High Severity", value: summary.high.toString(), color: summary.high > 0 ? "#E49B9C" : "#4A834C" },
        { label: "Medium Severity", value: summary.medium.toString(), color: summary.medium > 0 ? "#FFA500" : "#4A834C" },
        { label: "Low Severity", value: summary.low.toString(), color: summary.low > 0 ? "#FFFF00" : "#4A834C" },
        { label: "Risk Score", value: `${historyItem.riskScore.toFixed(1)}%`, color: historyItem.riskScore > 50 ? "#E49B9C" : "#4A834C" },
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
  const reportedBy = historyItem.analysisType === 'icp' && 'smartcontract' ? "Fradium AI" : "Fradium Community Report";

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
              {historyItem.analysisType === 'icp' ? 'AI Analysis' : 
               historyItem.analysisType === 'smartcontract' ? 'Smart Contract Analysis' : 
               'Community Report'}
            </p>
          </div>
          <div className="flex flex-row space-x-4 py-1">
            <p className="w-32 flex font-normal text-[14px] text-white/50">Analyzed Date</p>
            <p className="flex-1 text-white text-[14px] font-medium">{historyItem.date}</p>
          </div>
        </div>

        {/* Smart Contract Issues Detail */}
        {historyItem.analysisType === 'smartcontract' && (
          <div className="flex flex-col mt-4">
            <h1 className="font-semibold text-[16px] pb-[4px]">Security Issues</h1>
            {(() => {
              const smartContractResult = historyItem.result as SmartContractAnalysisResult;
              if (smartContractResult.issues.length === 0) {
                return (
                  <p className="text-green-300 text-[14px]">✅ No security issues detected</p>
                );
              }
              
              return (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {smartContractResult.issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          issue.severity.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-300' :
                          issue.severity.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{issue.title}</h3>
                      <p className="text-xs text-white/60">Function: {issue.function}</p>
                    </div>
                  ))}
                  {smartContractResult.issues.length > 3 && (
                    <p className="text-xs text-white/50 text-center">
                      +{smartContractResult.issues.length - 3} more issues
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

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