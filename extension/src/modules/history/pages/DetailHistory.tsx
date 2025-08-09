import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getHistoryItemById, type HistoryItem } from "@/lib/localStorage";
import type { ICPAnalysisResult, CommunityAnalysisResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
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
      console.log('DetailHistory: Loading history item with ID:', id);
      const item = getHistoryItemById(id);
      console.log('DetailHistory: History item loaded:', item);
      
      if (item) {
        console.log('DetailHistory: Item details:', {
          analysisType: item.analysisType,
          result: item.result,
          riskScore: item.riskScore,
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

  // Validate required properties
  if (!historyItem.result || !historyItem.analysisType) {
    console.error('DetailHistory: Invalid history item structure:', historyItem);
    return (
      <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
        <ProfileHeader />
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">Invalid Data</h1>
          <p className="text-white/50 mb-4">The history item data is corrupted or invalid.</p>
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
      const confidenceLevel = icpResult.confidence_level || "LOW";
      return Math.round(confidenceLevel === "HIGH" ? 95 : confidenceLevel === "MEDIUM" ? 75 : 50);
    } else if (historyItem.analysisType === 'smartcontract') {
      // Untuk smart contract, confidence berdasarkan kebalikan dari risk score
      const riskScore = historyItem.riskScore || 0;
      return Math.round(100 - riskScore);
    } else {
      // Untuk community, gunakan vote ratio sebagai confidence
      const communityResult = historyItem.result as CommunityAnalysisResult;
      if (communityResult.report?.[0]) {
        const votesYes = Number(communityResult.report[0].votes_yes || 0);
        const votesNo = Number(communityResult.report[0].votes_no || 0);
        const totalVotes = votesYes + votesNo;
        return totalVotes > 0 ? Math.round((Math.max(votesYes, votesNo) / totalVotes) * 100) : 50;
      }
      return 50;
    }
  };

  const getAnalysisDetails = () => {
    if (historyItem.analysisType === 'icp') {
      const icpResult = historyItem.result as ICPAnalysisResult;
      return [
        { 
          label: "Ransomware Probability", 
          value: `${((icpResult.ransomware_probability || 0) * 100).toFixed(2)}%`, 
          color: (icpResult.ransomware_probability || 0) > 0.5 ? "#E49B9C" : "#4A834C" 
        },
        { 
          label: "Confidence Level", 
          value: icpResult.confidence_level || "UNKNOWN", 
          color: "white" 
        },
        { 
          label: "Transactions Analyzed", 
          value: (icpResult.transactions_analyzed || 0).toString(), 
          color: "white" 
        },
        { 
          label: "Threshold Used", 
          value: (icpResult.threshold_used || 0).toString().substring(0, 6), 
          color: "white" 
        },
      ];
    } else if (historyItem.analysisType === 'smartcontract') {
      const smartContractResult = historyItem.result as SmartContractAnalysisResult;
      // Safely handle issues array
      const issues = smartContractResult.issues || [];
      const summary = {
        total_issues: issues.length,
        high: issues.filter(issue => issue.severity?.toLowerCase() === 'high').length,
        medium: issues.filter(issue => issue.severity?.toLowerCase() === 'medium').length,
        low: issues.filter(issue => issue.severity?.toLowerCase() === 'low').length,
      };

      return [
        { 
          label: "Total Issues", 
          value: summary.total_issues.toString(), 
          color: summary.total_issues > 0 ? "#E49B9C" : "#4A834C" 
        },
        { 
          label: "High Severity", 
          value: summary.high.toString(), 
          color: summary.high > 0 ? "#E49B9C" : "#4A834C" 
        },
        { 
          label: "Medium Severity", 
          value: summary.medium.toString(), 
          color: summary.medium > 0 ? "#FFA500" : "#4A834C" 
        },
        { 
          label: "Low Severity", 
          value: summary.low.toString(), 
          color: summary.low > 0 ? "#FFFF00" : "#4A834C" 
        },
        { 
          label: "Risk Score", 
          value: `${(historyItem.riskScore || 0).toFixed(1)}%`, 
          color: (historyItem.riskScore || 0) > 50 ? "#E49B9C" : "#4A834C" 
        },
      ];
    } else {
      const communityResult = historyItem.result as CommunityAnalysisResult;
      const details = [
        { 
          label: "Community Status", 
          value: communityResult.is_safe ? "Safe" : "Risky", 
          color: communityResult.is_safe ? "#4A834C" : "#E49B9C" 
        },
      ];
      
      if (communityResult.report && communityResult.report.length > 0) {
        details.push(
          { 
            label: "Report Category", 
            value: communityResult.report[0].category || "Unknown", 
            color: "white"
          },
          { 
            label: "Votes Yes", 
            value: (communityResult.report[0].votes_yes || 0).toString(), 
            color: "#4A834C" 
          },
          { 
            label: "Votes No", 
            value: (communityResult.report[0].votes_no || 0).toString(), 
            color: "#E49B9C" 
          },
        );
      }
      
      return details;
    }
  };

  const analysisDetails = getAnalysisDetails();
  
  // Safe determination of reporter based on analysis type
  const getReportedBy = () => {
    switch (historyItem.analysisType) {
      case 'icp':
        return "Fradium AI";
      case 'smartcontract':
        return "Fradium Smart Contract Analysis";
      case 'community':
        return "Fradium Community Report";
      default:
        return "Fradium Analysis";
    }
  };
  
  const reportedBy = getReportedBy();

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
              const issues = smartContractResult.issues || [];
              
              if (issues.length === 0) {
                return (
                  <p className="text-green-300 text-[14px]">✅ No security issues detected</p>
                );
              }
              
              return (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          (issue.severity || "").toLowerCase() === 'high' ? 'bg-red-500/20 text-red-300' :
                          (issue.severity || "").toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {issue.severity || "Unknown"}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{issue.title || "Unknown Issue"}</h3>
                      <p className="text-xs text-white/60">Function: {issue.function || "N/A"}</p>
                    </div>
                  ))}
                  {issues.length > 3 && (
                    <p className="text-xs text-white/50 text-center">
                      +{issues.length - 3} more issues
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