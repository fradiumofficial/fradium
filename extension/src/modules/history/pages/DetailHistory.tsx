import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getHistoryItemById, getScanHistoryItemById, type HistoryItem, type ScanHistoryItem } from "@/lib/localStorage";
import type { ICPAnalysisResult, CommunityAnalysisResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
import type { Root as SmartContractAnalysisResult } from "@/modules/analyze_smartcontract/model/AnalyzeSmartContractModel";
import { ROUTES } from "@/constants/routes";
import NeoButton from "@/components/ui/custom-button";
import Wallet from "../../../assets/Wallet.svg";

function DetailHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyItem, setHistoryItem] = useState<HistoryItem | ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      console.log('DetailHistory: Loading history item with ID:', id);
      
      // Try to get from regular history first (for new analyze address results)
      let item: HistoryItem | ScanHistoryItem | null = getHistoryItemById(id);
      let isRegularHistory = true;
      
      // If not found, try scan history (for backward compatibility)
      if (!item) {
        item = getScanHistoryItemById(id);
        isRegularHistory = false;
      }
      
      console.log('DetailHistory: History item loaded:', item);
      console.log('DetailHistory: Is regular history:', isRegularHistory);

      if (item) {
        if (isRegularHistory) {
          const regularItem = item as HistoryItem;
          console.log('DetailHistory: Regular item details:', {
            analysisType: regularItem.analysisType,
            address: regularItem.address,
            isSafe: regularItem.isSafe,
            riskScore: regularItem.riskScore
          });
        } else {
          const scanItem = item as unknown as ScanHistoryItem;
          console.log('DetailHistory: Scan item details:', {
            source: scanItem.source,
            address: scanItem.address,
            isSafe: scanItem.isSafe
          });
        }
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

  // Helper function to check if item is regular HistoryItem
  const isRegularHistoryItem = (item: HistoryItem | ScanHistoryItem): item is HistoryItem => {
    return 'analysisType' in item;
  };

  // Helper function to check if item is ScanHistoryItem
  const isScanHistoryItem = (item: HistoryItem | ScanHistoryItem): item is ScanHistoryItem => {
    return 'source' in item;
  };

  // Convert confidence percentage untuk SafetyCard
  const getConfidencePercentage = () => {
    if (!historyItem) return 50;

    if (isRegularHistoryItem(historyItem)) {
      // Regular history item
      if (historyItem.analysisType === 'icp') {
        const icpResult = historyItem.result as ICPAnalysisResult;
        const confidenceLevel = icpResult.confidence_level || "LOW";
        return Math.round(confidenceLevel === "HIGH" ? 95 : confidenceLevel === "MEDIUM" ? 75 : 50);
      } else if (historyItem.analysisType === 'community') {
        const communityResult = historyItem.result as CommunityAnalysisResult;
        if (communityResult.report?.[0]) {
          const votesYes = Number(communityResult.report[0].votes_yes || 0);
          const votesNo = Number(communityResult.report[0].votes_no || 0);
          const totalVotes = votesYes + votesNo;
          return totalVotes > 0 ? Math.round((Math.max(votesYes, votesNo) / totalVotes) * 100) : 50;
        }
        return 50;
      } else if (historyItem.analysisType === 'smartcontract') {
        const riskScore = historyItem.riskScore || 0;
        return Math.round(100 - riskScore);
      }
    } else if (isScanHistoryItem(historyItem)) {
      // Scan history item
      if (historyItem.source === "ai" && historyItem.analysisResult.aiData) {
        return Math.round((historyItem.analysisResult.aiData.confidence_level === "HIGH" ? 95 : historyItem.analysisResult.aiData.confidence_level === "MEDIUM" ? 75 : 50));
      } else if (historyItem.source === "community" && historyItem.analysisResult.communityData) {
        const report = historyItem.analysisResult.communityData.report?.[0];
        if (report) {
          const totalVotes = Number(report.votes_yes) + Number(report.votes_no);
          if (totalVotes > 0) {
            return Math.round((Number(report.votes_yes) / totalVotes) * 100);
          }
        }
        return 50;
      }
    }
    
    return 50;
  };

  const getAnalysisDetails = () => {
    if (!historyItem) return [];

    if (isRegularHistoryItem(historyItem)) {
      // Handle regular HistoryItem
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
        // Community analysis
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
    } else if (isScanHistoryItem(historyItem)) {
      // Handle ScanHistoryItem (backward compatibility)
      if (historyItem.source === 'ai') {
        const icpResult = historyItem.analysisResult.aiData as ICPAnalysisResult;
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
      } else {
        // Community analysis from scan history
        const communityResult = historyItem.analysisResult.communityData as CommunityAnalysisResult;
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
    }

    return [];
  };

  const analysisDetails = getAnalysisDetails();

  // Safe determination of reporter based on analysis type
  const getReportedBy = () => {
    if (!historyItem) return "Fradium Analysis";

    if (isRegularHistoryItem(historyItem)) {
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
    } else if (isScanHistoryItem(historyItem)) {
      switch (historyItem.source) {
        case 'ai':
          return "Fradium AI";
        case 'community':
          return "Fradium Community Report";
        default:
          return "Fradium Analysis";
      }
    }

    return "Fradium Analysis";
  };

  // Get the address from either type of history item
  const getAddress = () => {
    if (!historyItem) return "";
    return historyItem.address;
  };

  // Get the date from either type of history item
  const getDate = () => {
    if (!historyItem) return "";
    
    if (isRegularHistoryItem(historyItem)) {
      return historyItem.date;
    } else if (isScanHistoryItem(historyItem)) {
      return historyItem.date;
    }
    
    return "";
  };

  // Get the analysis type display name
  const getAnalysisTypeDisplay = () => {
    if (!historyItem) return "Analysis";

    if (isRegularHistoryItem(historyItem)) {
      switch (historyItem.analysisType) {
        case 'icp':
          return 'AI Analysis';
        case 'smartcontract':
          return 'Smart Contract Analysis';
        case 'community':
          return 'Community Report';
        default:
          return 'Analysis';
      }
    } else if (isScanHistoryItem(historyItem)) {
      switch (historyItem.source) {
        case 'ai':
          return 'AI Analysis';
        case 'community':
          return 'Community Report';
        default:
          return 'Analysis';
      }
    }

    return "Analysis";
  };

  const reportedBy = getReportedBy();

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="font-semibold text-[20px] text-white mb-4">Detail Scan History</h1>

        <SafetyCard
          confidence={getConfidencePercentage()}
          title={"Address"}
          isSafe={historyItem.isSafe}
        />

        {/* Address Name */}
        <div className="flex flex-col mt-4">
          <h1 className="font-semibold text-[16px]">Address</h1>
          <p className="text-[14px] font-normal text-white/50 pt-[4px] break-all">
            {getAddress()}
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
              {getAnalysisTypeDisplay()}
            </p>
          </div>
          <div className="flex flex-row space-x-4 py-1">
            <p className="w-32 flex font-normal text-[14px] text-white/50">Analyzed Date</p>
            <p className="flex-1 text-white text-[14px] font-medium">{getDate()}</p>
          </div>
        </div>

        {/* Smart Contract Issues Detail */}
        {(isRegularHistoryItem(historyItem) && historyItem.analysisType === 'smartcontract') && (
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
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${(issue.severity || "").toLowerCase() === 'high' ? 'bg-red-500/20 text-red-300' :
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