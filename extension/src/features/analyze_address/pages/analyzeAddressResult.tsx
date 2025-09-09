import { SafetyCard } from "~components/custom-card";
import ProfileHeader from "~components/header";
import { Wallet } from "lucide-react";
import NeoButton from "~components/custom-button";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ROUTES } from "~lib/constant/routes";
import type { AnalysisResult } from "~types/analyze_model.type";

function AnalyzeAdressResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as AnalysisResult;
  const address = location.state?.address as string;

  // Inisialisasi state dengan nilai yang benar langsung
  const [isAddressSafe, setIsAddressSafe] = useState<boolean>(() => {
    return result?.isSafe === true;
  });

  // Use useEffect to update state if result changes
  useEffect(() => {
    if (result) {
      setIsAddressSafe(result.isSafe === true);
    }
  }, [result]);

  // Function to calculate time ago from timestamp
  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const timeDiff = now - Number(timestamp) / 1000000; // Convert nanoseconds to milliseconds
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  // Function to calculate risk score based on votes
  const calculateRiskScore = (votesYes: string, votesNo: string) => {
    const totalVotes = Number(votesYes) + Number(votesNo);
    if (totalVotes === 0) return "0/100";

    const yesPercentage = (Number(votesYes) / totalVotes) * 100;
    return `${Math.round(yesPercentage)}/100`;
  };

  const getSecurityCheckItems = () => {
    const isCommunitySource = result?.source === "community";
    
    if (isAddressSafe) {
      return [
        "No suspicious transaction patterns detected",
        "Transaction volume within normal range",
        "No connections to known malicious addresses",
        "Address activity appears legitimate"
      ];
    } else {
      return isCommunitySource ? [
        "Links to known scam addresses detected",
        "Suspicious transaction pattern detected",
        "Community flagged as unsafe",
        "Exercise extreme caution"
      ] : [
        "Ransomware activity detected",
        "Failed AI security analysis",
        "High-risk transaction patterns",
        "Exercise extreme caution"
      ];
    }
  };

  const checkItems = getSecurityCheckItems();

  // Component for checkmark/warning icon (SVG)
  const CheckIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 ${isAddressSafe ? 'text-green-400' : 'text-red-400'}`}
    >
      {isAddressSafe ? (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );

  // Guard clause to handle case when result is not available
  if (!result) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center overflow-y-auto pb-20">
        <p>No analysis result found</p>
      </div>
    );
  }

  // Convert confidence level to percentage for display
  const getConfidencePercentage = () => {
    if ((result.source === "ai" || result.source === "ai_and_community") && result.aiData) {
      return Math.round((result.aiData.confidence_level === "HIGH" ? 95 : result.aiData.confidence_level === "MEDIUM" ? 75 : 50));
    } else if ((result.source === "community" || result.source === "ai_and_community") && result.communityData) {
      // For community, calculate based on vote ratio
      const report = result.communityData.report?.[0];
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
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        {/* Display analyzed address */}
        <div className="mt-4 bg-white/5 p-3  rounded">
          <p className="text-sm font-mono break-all">{address}</p>
        </div>

        <SafetyCard
          confidence={confidencePercentage}
          title={"Address"}
          isSafe={isAddressSafe}
        />

        {/* Analysis Source Indicator */}
        <div className="mt-4 p-3 bg-white/5 rounded">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${result.source === "community" ? "bg-blue-400" : result.source === "ai_and_community" ? "bg-green-400" : "bg-purple-400"}`}></div>
            <span className="text-sm font-medium">
              Detected by {result.source === "community" ? "Community Analysis" : result.source === "ai_and_community" ? "AI + Community Analysis" : "AI Analysis"}
            </span>
          </div>
        </div>
        
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Analysis Details</h1>
        
        {/* Render different details based on analysis source */}
        {(result.source === "ai" || result.source === "ai_and_community") && result.aiData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{result.aiData.transactions_analyzed}</p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Transactions</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{(result.aiData.ransomware_probability * 100).toFixed(2)}%</p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Risk Score</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{result.aiData.confidence_level}</p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Confidence</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{result.aiData.threshold_used.toString().substring(0, 4)}</p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Threshold</p>
              </div>
            </div>
          </div>
        ) : (result.source === "community" || result.source === "ai_and_community") && result.communityData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {result.communityData.report?.[0]?.voted_by?.length || "0"}
              </p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Total Voters</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {result.communityData.report?.[0] ? 
                  `${result.communityData.report[0].votes_yes} Yes / ${result.communityData.report[0].votes_no} No` : 
                  "N/A"
                }
              </p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Vote Results</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className={`font-medium text-[18px] pb-2 ${isAddressSafe ? 'text-green-400' : 'text-red-400'}`}>
                {result.communityData.report?.[0] ? 
                  calculateRiskScore(result.communityData.report[0].votes_yes, result.communityData.report[0].votes_no) : 
                  "0/100"
                }
              </p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Risk Score</p>
              </div>
            </div>
            
            <div className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">
                {result.communityData.report?.[0] ? 
                  getTimeAgo(result.communityData.report[0].created_at) : 
                  "N/A"
                }
              </p>
              <div className="flex flex-row">
                <Wallet className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Report Created</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Security Checks */}
      <div className="m-4">
        <div className={`w-full max-w-md ps-[2px] ${isAddressSafe ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className={`bg-gradient-to-r ${isAddressSafe ? 'from-[#4A834C] to-[#35373E]' : 'from-[#8B4A4C] to-[#3E3537]'} bg-slate-800 p-6 mt-[20px]`}>
            <h2 className="text-[20px] font-semibold mb-4">
              {isAddressSafe ? 'Security Checks Passed' : 'Security Warnings'}
            </h2>
            <ul className="list-disc space-y-2">
              {checkItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Report Details - Only show if there's a community report */}
      {(result.source === "community" || result.source === "ai_and_community") && result.communityData?.report?.[0] && (
        <div className="m-4">
          <div className="bg-white/5 p-4 rounded">
            <h3 className="text-[18px] font-semibold mb-3">Report Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 text-sm">Category: </span>
                <span className="text-white capitalize">{result.communityData.report[0].category}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Report ID: </span>
                <span className="text-white">{result.communityData.report[0].report_id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-4">
        <NeoButton icon={Wallet} onClick={() => navigate(ROUTES.HOME)}>
          Complete
        </NeoButton>
      </div>
    </div>
  );
}

export default AnalyzeAdressResult;