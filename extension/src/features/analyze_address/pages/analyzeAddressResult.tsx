import { SafetyResultCard } from "~components/card";
import { ArrowLeftIcon, Wallet } from "lucide-react";
import NeoButton from "~components/custom-button";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ROUTES } from "~lib/constant/routes";
import { CDN } from "~lib/constant/cdn";
import type { AnalysisResult } from "~types/analyze_model.type";
import LocalStorageService from "~service/localStorageService";
import { SafetyCard } from "~components/custom-card";

function AnalyzeAdressResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as AnalysisResult;
  const address = location.state?.address as string;

  // Inisialisasi state dengan nilai yang benar langsung
  const [isAddressSafe, setIsAddressSafe] = useState<boolean>(() => {
    return result?.isSafe === true;
  });

  // Save analysis result to local storage when component mounts
  useEffect(() => {
    const saveToLocalStorage = () => {
      if (result && address) {
        try {
          // Find the existing analysis (should be in progress)
          const history = LocalStorageService.getHistory();
          const existingAnalysis = history.find(item =>
            item.address === address && item.status === 'in_progress'
          );

          if (existingAnalysis) {
            // Update existing analysis with results
            const updates = {
              isSafe: result.isSafe,
              source: result.source as 'ai' | 'community' | 'ai_and_community',
              status: 'completed' as const,
              date: new Date().toISOString(),
              analysisResult: {
                confidence: result.confidence,
                riskLevel: result.riskLevel,
                description: result.description,
                source: result.source,
                aiData: result.aiAnalysis,
                communityData: result.communityData
              }
            };

            LocalStorageService.updateAnalysis(existingAnalysis.id, updates);
            console.log('Analysis result updated in local storage successfully');
          } else {
            // If no existing analysis found, create new one
            const tokenType = LocalStorageService.detectTokenType(address);
            LocalStorageService.saveAnalysis({
              address,
              tokenType,
              isSafe: result.isSafe,
              source: result.source as 'ai' | 'community' | 'ai_and_community',
              status: 'completed',
              date: new Date().toISOString(),
              analysisResult: {
                confidence: result.confidence,
                riskLevel: result.riskLevel,
                description: result.description,
                source: result.source,
                aiData: result.aiAnalysis,
                communityData: result.communityData
              }
            });
            console.log('New analysis result saved to local storage successfully');
          }
        } catch (error) {
          console.error('Error saving analysis to local storage:', error);
        }
      }
    };

    saveToLocalStorage();
  }, [result, address]);


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

  // Helper functions for the new UI - using real data from analysis result
  const getTransactionCount = () => {
    // Priority: stats.transactions -> aiData.transactions_analyzed -> community report voters -> 0
    if (result.stats?.transactions !== undefined) {
      return result.stats.transactions.toString();
    } else if ((result.source === "ai" || result.source === "ai_and_community") && result.aiData) {
      return result.aiData.transactions_analyzed?.toString() || "0";
    } else if ((result.source === "community" || result.source === "ai_and_community") && result.communityData) {
      return result.communityData.report?.[0]?.voted_by?.length?.toString() || "0";
    }
    return "0";
  };

  // Get confidence level as readable text
  const getConfidenceLevel = () => {
    if ((result.source === "ai" || result.source === "ai_and_community") && result.aiData) {
      return result.aiData.confidence_level || "Unknown";
    } else if (result.confidence) {
      if (result.confidence >= 90) return "HIGH";
      if (result.confidence >= 70) return "MEDIUM";
      return "LOW";
    }
    return "Unknown";
  };

  // Get risk level as readable text
  const getRiskLevel = () => {
    if (result.riskLevel) {
      return result.riskLevel;
    } else if ((result.source === "ai" || result.source === "ai_and_community") && result.aiData) {
      const probability = result.aiData.ransomware_probability || 0;
      if (probability >= 0.8) return "HIGH";
      if (probability >= 0.5) return "MEDIUM";
      return "LOW";
    }
    return "Unknown";
  };

  // Get data source information
  const getDataSource = () => {
    switch (result.source) {
      case "ai":
        return "AI Analysis";
      case "community":
        return "Community Vote";
      case "ai_and_community":
        return "AI + Community";
      case "smartcontract":
        return "Smart Contract";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="w-[375px] flex flex-col items-start p-5 gap-7 text-white overflow-y-auto">
      {/* Header Section */}
      <div className="w-[335px] h-[24px] flex flex-row items-center gap-2 flex-none flex-grow-0">
        {/* Arrow Left - Hidden in design but keeping for navigation */}
        <button
          onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
          className="w-[24px] h-[24px] relative flex-none flex-grow-0"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>

        <h1 className="w-[161px] h-[24px] font-sans font-semibold text-[20px] leading-[120%] text-white flex-none flex-grow-0">
          Analyze Address
        </h1>
      </div>

      {/* Main Content */}
      <div className="w-[335px] flex flex-col items-start gap-5 flex-none flex-grow-0">
        {/* Safety Result Card */}
        <SafetyCard
          confidence={confidencePercentage}
          title="Address"
          isSafe={isAddressSafe}
        />

        {/* Address Details Section */}
        <div className="w-[335px] h-[179px] flex flex-col items-start gap-4 flex-none flex-grow-0">
          <div className="w-[122px] h-[19px] font-sans font-semibold text-[16px] leading-[120%] text-white flex-none flex-grow-0">
            Address Details
          </div>

          {/* Statistics Cards Grid */}
          <div className="w-[335px] h-[144px] flex flex-row flex-wrap items-start content-start gap-[10px] flex-none flex-grow-0">
            {/* Card 1 - Transactions */}
            <div className="w-[158px] h-[67px] flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px] flex-none flex-grow-0">
              <div className="w-[26px] h-[19px] font-sans font-medium text-[16px] leading-[120%] tracking-[-0.02em] text-white flex-none flex-grow-0">
                {getTransactionCount()}
              </div>
                <div className="w-[104px] h-[18px] flex flex-row items-center gap-[6px] flex-none flex-grow-0">
                  <img src={CDN.icons.transactions} alt="Transactions" className="w-[16px] h-[16px] flex-none flex-grow-0" />
                  <div className="w-[82px] h-[18px] font-sans font-normal text-[14px] leading-[130%] text-white/60 flex-none flex-grow-0">
                    Transactions
                  </div>
                </div>
            </div>

            {/* Card 2 - Confidence Level */}
            <div className="w-[159px] h-[67px] flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px] flex-none flex-grow-0">
              <div className={`w-[72px] h-[19px] font-sans font-medium text-[16px] leading-[120%] tracking-[-0.02em] flex-none flex-grow-0 ${
                getConfidenceLevel() === 'HIGH' ? 'text-green-400' :
                getConfidenceLevel() === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {getConfidenceLevel()}
              </div>
              <div className="w-[104px] h-[18px] flex flex-row items-center gap-[6px] flex-none flex-grow-0">
                <img src={CDN.icons.total} alt="Confidence" className="w-[16px] h-[16px] flex-none flex-grow-0" />
                <div className="w-[82px] h-[18px] font-sans font-normal text-[14px] leading-[130%] text-white/60 flex-none flex-grow-0">
                  Confidence
                </div>
              </div>
            </div>

            {/* Card 3 - Risk Level */}
            <div className="w-[158px] h-[67px] flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px] flex-none flex-grow-0">
              <div className={`w-[43px] h-[19px] font-sans font-medium text-[16px] leading-[120%] tracking-[-0.02em] flex-none flex-grow-0 ${
                getRiskLevel() === 'LOW' ? 'text-green-400' :
                getRiskLevel() === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {getRiskLevel()}
              </div>
              <div className="w-[89px] h-[18px] flex flex-row items-center gap-[6px] flex-none flex-grow-0">
                <img src={CDN.icons.riskScore} alt="Risk Level" className="w-[16px] h-[16px] flex-none flex-grow-0" />
                <div className="w-[67px] h-[18px] font-sans font-normal text-[14px] leading-[130%] text-white/60 flex-none flex-grow-0">
                  Risk Level
                </div>
              </div>
            </div>

            {/* Card 4 - Data Source */}
            <div className="w-[159px] h-[67px] flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px] flex-none flex-grow-0">
              <div className="w-[83px] h-[19px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.02em] text-white flex-none flex-grow-0">
                {getDataSource()}
              </div>
              <div className="w-[100px] h-[18px] flex flex-row items-center gap-[6px] flex-none flex-grow-0">
                <img src={CDN.icons.activity} alt="Data Source" className="w-[16px] h-[16px] flex-none flex-grow-0" />
                <div className="w-[78px] h-[18px] font-sans font-normal text-[12px] leading-[130%] text-white/60 flex-none flex-grow-0">
                  Data Source
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Checks Section */}
        <div className="w-[335px] h-[143px] flex flex-col items-start gap-4 flex-none flex-grow-0">
          <div className="w-[180px] h-[19px] font-sans font-semibold text-[16px] leading-[120%] text-white flex-none flex-grow-0">
            {isAddressSafe ? 'Security Checks Passed' : 'Security Warnings'}
          </div>

          {/* Security Check Card */}
          <div
            className="w-[335px] h-[108px] box-border flex flex-col items-start p-4 gap-[17px] rounded-[12px] flex-none flex-grow-0"
            style={{
              background: isAddressSafe
                ? 'radial-gradient(69.63% 230.37% at -11.33% 50%, #1A4A1B 0%, rgba(153, 227, 158, 0.21) 30.29%, rgba(255, 255, 255, 0.03) 100%)'
                : 'radial-gradient(69.63% 230.37% at -11.33% 50%, #4A1A1B 0%, rgba(227, 153, 158, 0.21) 30.29%, rgba(255, 255, 255, 0.03) 100%)',
              borderLeft: `1px solid ${isAddressSafe ? '#9BE4A0' : '#E3999E'}`
            }}
          >
            <div className="w-[303px] h-[76px] flex flex-col items-start gap-2 flex-none flex-grow-0">
              {checkItems.slice(0, 3).map((item, index) => (
                <div key={index} className="w-[303px] h-[20px] flex flex-row items-center gap-2 flex-none flex-grow-0">
                  <img
                    src={isAddressSafe ? CDN.icons.checkSafe : CDN.icons.checkDanger}
                    alt="Check"
                    className="w-[20px] h-[20px] flex-none flex-grow-0"
                  />
                  <div className="w-[218px] h-[18px] font-sans font-normal text-[14px] leading-[130%] text-white/60 flex-none flex-grow-0">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-none flex-grow-0 mt-4">
        <button
          onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
          className="w-[335px] h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] flex-none flex-grow-0"
        >
          <span className="w-[112px] h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent flex-none flex-grow-0">
            Go Analyze Other
          </span>
        </button>
      </div>
    </div>
  );
}

export default AnalyzeAdressResult;