import React, { useState } from "react";
import CustomButton from "@/core/components/custom-button-a";
import AnalyzeProgressModal from "@/core/components/modals/AnalyzeProgressModal";
import { backend } from "declarations/backend";
import { ai } from "declarations/ai";
import { extractFeatures as extractFeaturesBTC } from "@/core/services/ai/bitcoinAnalyzeService";
import { extractFeatures as extractFeaturesETH, getTxCountFromFeatures as getTxCountFromFeaturesETH } from "@/core/services/ai/ethereumAnalyzeService";
import { jsonStringify } from "@/core/lib/canisterUtils";
import { detectTokenType, TokenType } from "@/core/lib/tokenUtils";

export default function AnalyseAddressPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  // Analyze Address Data States
  const [isAnalyzeAddressSafe, setIsAnalyzeAddressSafe] = useState(false);
  const [analyzeAddressData, setAnalyzeAddressData] = useState(null);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(""); // "community" | "ai"

  // Validation function
  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required";
    }
    return null;
  };

  // Convert chain name to token type variant
  const getTokenTypeVariant = (chainName) => {
    switch (chainName) {
      case TokenType.BITCOIN:
        return { Bitcoin: null };
      case TokenType.ETHEREUM:
        return { Ethereum: null };
      case TokenType.SOLANA:
        return { Solana: null };
      case TokenType.FUM:
        return { Fum: null };
      default:
        return { Unknown: null };
    }
  };

  // Helper function to save analyze history
  const saveAnalyzeHistory = async (address, isSafe, analyzedType, metadata) => {
    try {
      await backend.create_analyze_history({
        address: address,
        is_safe: isSafe,
        analyzed_type: analyzedType,
        metadata: jsonStringify(metadata),
        token_type: getTokenTypeVariant(detectTokenType(address)),
      });
    } catch (historyError) {
      console.error("Failed to save analyze history:", historyError);
    }
  };

  // Helper function to perform AI analysis
  const performAIAnalysis = async (address) => {
    try {
      let features;
      let ransomwareReport;

      const tokenType = detectTokenType(address);

      switch (tokenType) {
        case TokenType.BITCOIN:
          // Bitcoin AI Analysis - Implemented
          features = await extractFeaturesBTC(address);
          ransomwareReport = await ai.analyze_btc_address(features, address, features.length);

          if ("Ok" in ransomwareReport) {
            return {
              isSafe: !ransomwareReport.Ok.is_ransomware,
              data: ransomwareReport.Ok,
              source: "ai",
            };
          }
          throw new Error("Bitcoin AI analysis failed");

        case TokenType.ETHEREUM:
          // Ethereum AI Analysis - Implemented
          features = await extractFeaturesETH(address);
          const featuresPairs = Object.entries(features).map(([k, v]) => [k, Number(v)]);
          const txCount = getTxCountFromFeaturesETH(features);
          ransomwareReport = await ai.analyze_eth_address(featuresPairs, address, txCount);

          if ("Ok" in ransomwareReport) {
            return {
              isSafe: !ransomwareReport.Ok.is_ransomware,
              data: ransomwareReport.Ok,
              source: "ai",
            };
          }
          throw new Error("Ethereum AI analysis failed");

        case TokenType.SOLANA:
          // Solana AI Analysis - NOT IMPLEMENT
          console.warn("Solana AI analysis not implemented yet");
          return null;

        case TokenType.FUM:
          // Fradium AI Analysis - NOT IMPLEMENT
          console.warn("Fradium AI analysis not implemented yet");
          return null;

        default:
          // Unknown token type
          console.warn(`AI analysis not supported for token type: ${tokenType}`);
          return null;
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      return null;
    }
  };

  // Helper function to set analysis result
  const setAnalysisResult = (isSafe, data, source) => {
    setIsAnalyzeAddressSafe(isSafe);
    if (source === "community") {
      setAnalyzeAddressData(data);
    } else {
      setAiAnalysisData(data);
    }
    setAnalysisSource(source);
    setMode("result");
  };

  // Handle analyze address
  const handleAnalyze = async () => {
    const error = validateAddress(address);
    if (error) {
      setAddressError(error);
      return;
    }

    setAddressError("");
    setAnalysisError("");
    setIsAnalyzing(true);

    try {
      // Step 1: Try Community Analysis
      const communityReport = await backend.analyze_address(address);

      if ("Ok" in communityReport) {
        const communityIsSafe = communityReport.Ok.is_safe;

        // Save community analysis history
        await saveAnalyzeHistory(address, communityIsSafe, { CommunityVote: null }, communityReport.Ok);

        // Step 2: If community says safe, double-check with AI
        if (communityIsSafe) {
          const aiResult = await performAIAnalysis(address);

          if (aiResult && !aiResult.isSafe) {
            // AI detected as unsafe, override community result
            await saveAnalyzeHistory(address, false, { AIAnalysis: null }, aiResult.data);
            setAnalysisResult(false, aiResult.data, "ai");
          } else {
            // Use community result (safe)
            setAnalysisResult(true, communityReport.Ok, "community");
          }
        } else {
          // Community says unsafe, use community result
          setAnalysisResult(false, communityReport.Ok, "community");
        }
      } else {
        // Step 3: No community report, use AI analysis as fallback
        const aiResult = await performAIAnalysis(address);

        if (aiResult) {
          await saveAnalyzeHistory(address, aiResult.isSafe, { AIAnalysis: null }, aiResult.data);
          setAnalysisResult(aiResult.isSafe, aiResult.data, "ai");
        } else {
          // Both community and AI failed
          setAnalysisError("Failed to analyze address. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
      setAnalysisError("Failed to analyze address. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to calculate time ago from timestamp
  const getTimeAgo = (timestamp) => {
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
  const calculateRiskScore = (votesYes, votesNo) => {
    const totalVotes = Number(votesYes) + Number(votesNo);
    if (totalVotes === 0) return "0/100";

    const yesPercentage = (Number(votesYes) / totalVotes) * 100;
    return `${Math.round(yesPercentage)}/100`;
  };

  const getStatusConfig = () => {
    const isCommunitySource = analysisSource === "community";
    const isAiSource = analysisSource === "ai";

    return {
      safe: {
        gradientColor: "from-[#4A834C]",
        borderColor: "border-[#4ADE80]",
        icon: "/assets/icons/safe.png",
        title: "ADDRESS IS SAFE",
        description: isCommunitySource ? (analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? "This address has been analyzed by the community and found to be safe" : "This address appears to be clean with no suspicious activity detected in our comprehensive database") : "This address has been analyzed by our AI system and appears to be safe with no ransomware activity detected",
        securityTitle: "Security Checks Passed",
        checkItems: isCommunitySource ? ["No links to known scam addresses", "No suspicious transaction pattern detected"] : ["No ransomware activity detected", "Passed AI security analysis"],
        riskScoreColor: "text-green-400",
        detectedBy: isCommunitySource ? "Detected By Community" : "Detected By AI Analysis",
      },
      danger: {
        gradientColor: "from-[#F87171]",
        borderColor: "border-[#F87171]",
        icon: "/assets/icons/danger.png",
        title: "ADDRESS IS NOT SAFE",
        description: isCommunitySource ? (analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? "This address has been flagged by the community as potentially unsafe" : "This address appears to be flagged with suspicious activity detected in our comprehensive database") : "This address has been flagged by our AI system as potential ransomware with high confidence",
        securityTitle: "Security Checks Not Passed",
        checkItems: isCommunitySource ? ["Links to known scam addresses detected", "Suspicious transaction pattern detected"] : ["Ransomware activity detected", "Failed AI security analysis"],
        riskScoreColor: "text-red-400",
        detectedBy: isCommunitySource ? "Detected By Community" : "Detected By AI Analysis",
      },
    };
  };

  const config = getStatusConfig()[isAnalyzeAddressSafe ? "safe" : "danger"];

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card utama - styling sesuai analyse-address.jsx */}
        <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md md:p-8 p-4 relative overflow-hidden">
          {/* Pattern background - pattern-topside.png */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 md:w-80 md:h-80 w-40 h-40 z-0 pointer-events-none select-none object-cover object-right-top" />

          {/* Konten utama */}
          {mode === "input" && (
            <>
              {/* Icon Container */}
              <div className="flex justify-center mb-2 relative z-10">
                <img src="/assets/images/analisis.png" alt="Analyze Address" className="md:w-48 md:h-48 w-24 h-24" />
              </div>

              {/* Title */}
              <h1 className="text-white text-xl font-semibold mb-1 text-center relative z-10">Analyze Address</h1>

              {/* Description */}
              <p className="text-gray-400 max-w-sm text-sm font-normal text-center md:mb-6 mb-3 mx-auto relative z-10">Scan a bitcoin address to detect suspicious activity and potential scams.</p>

              {/* Input Container */}
              <div className="w-full bg-[#0F1219] border border-[#2A2D35] rounded-sm md:p-4 p-2 md:mb-6 mb-3 relative z-10">
                <input
                  type="text"
                  placeholder="Input address here..."
                  className={`w-full bg-transparent text-gray-400 text-base outline-none placeholder-gray-500 ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
                  value={address}
                  disabled={isAnalyzing}
                  onChange={(e) => {
                    if (!isAnalyzing) {
                      setAddress(e.target.value);
                      if (addressError) {
                        setAddressError("");
                      }
                      if (analysisError) {
                        setAnalysisError("");
                      }
                    }
                  }}
                />
              </div>
              {addressError && <div className="text-red-400 text-xs mb-4 relative z-10">{addressError}</div>}
              {analysisError && <div className="text-red-400 text-xs mb-4 relative z-10">{analysisError}</div>}

              {/* Analyze Button - Full Width */}
              <div className="w-full relative z-10">
                <CustomButton icon="/assets/icons/analyze-address-light.svg" className="w-full text-base" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyse Address"}
                </CustomButton>
              </div>
            </>
          )}
          {mode === "result" && !isAnalyzeAddressSafe && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Danger */}
              <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Address</span>
              <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FF6B6B]/15 via-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                    <img src={config.icon} alt="Danger" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">{config.title}</div>
                      <div className="text-[#B0B6BE] text-xs">{config.detectedBy}</div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-sm font-normal">{config.description}</div>
                </div>
              </div>

              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {analysisSource === "community" ? (
                  <>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? analyzeAddressData.report[0].voted_by.length : "0"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                        Total Voters
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? `${analyzeAddressData.report[0].votes_yes} Yes / ${analyzeAddressData.report[0].votes_no} No` : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-4 h-4" />
                        Vote Results
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-red-400 text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? calculateRiskScore(analyzeAddressData.report[0].votes_yes, analyzeAddressData.report[0].votes_no) : "0/100"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                        Risk Score
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? getTimeAgo(analyzeAddressData.report[0].created_at) : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                        Report Created
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">{aiAnalysisData?.transactions_analyzed || "0"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/total-volume.svg" alt="Transactions" className="w-4 h-4" />
                        Transactions Analyzed
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData?.confidence_level || "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Confidence" className="w-4 h-4" />
                        Confidence Level
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-red-400 text-base font-medium">{aiAnalysisData ? `${Math.round(aiAnalysisData.ransomware_probability * 100)}/100` : "0/100"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                        Ransomware Probability
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData ? aiAnalysisData.threshold_used.toFixed(2) : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/last-activity.svg" alt="Threshold" className="w-4 h-4" />
                        AI Threshold
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Security Checks */}
              <div className="px-6 py-5 mb-2 border-l-2 border-[#FF6B6B] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
                <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-[#FFFFFF] font-bold mb-2">{config.securityTitle}</div>
                  <ul className="flex flex-col gap-1">
                    {config.checkItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#FF6B6B" />
                          <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[#FFFFFF]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Report Details - Only show if there's a community report */}
              {analysisSource === "community" && analyzeAddressData?.report && analyzeAddressData.report.length > 0 && (
                <div className="px-6 py-5 mb-2 bg-[#FFFFFF0D] bg-opacity-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-[#FFFFFF] font-bold mb-3">Report Details</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[#B0B6BE] text-sm mb-1">Category</div>
                        <div className="text-white text-base font-medium capitalize">{analyzeAddressData.report[0].category}</div>
                      </div>
                      <div>
                        <a href={`/reports/${analyzeAddressData.report[0].report_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#9BEB83] text-sm font-medium hover:text-white transition-colors">
                          <span>View Full Report</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Button Analyze Other */}
              <button
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalyzeAddressData(null);
                  setAiAnalysisData(null);
                  setAnalysisSource("");
                  setAddress("");
                  setAddressError("");
                  setAnalysisError("");
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
          {mode === "result" && isAnalyzeAddressSafe && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Safe */}
              <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Address</span>
              <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#22C55E]/15 via-[#22C55E]/15 via-[#22C55E]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                    <img src={config.icon} alt="Safe" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">{config.title}</div>
                      <div className="text-[#B0B6BE] text-xs">{config.detectedBy}</div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-sm font-normal">{config.description}</div>
                </div>
              </div>

              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {analysisSource === "community" ? (
                  <>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? analyzeAddressData.report[0].voted_by.length : "0"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                        Total Voters
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? `${analyzeAddressData.report[0].votes_yes} Yes / ${analyzeAddressData.report[0].votes_no} No` : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-4 h-4" />
                        Vote Results
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#9BE4A0] text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? calculateRiskScore(analyzeAddressData.report[0].votes_yes, analyzeAddressData.report[0].votes_no) : "0/100"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                        Risk Score
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? getTimeAgo(analyzeAddressData.report[0].created_at) : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                        Report Created
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">{aiAnalysisData?.transactions_analyzed || "0"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/total-volume.svg" alt="Transactions" className="w-4 h-4" />
                        Transactions Analyzed
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData?.confidence_level || "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Confidence" className="w-4 h-4" />
                        Confidence Level
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#9BE4A0] text-base font-medium">{aiAnalysisData ? `${Math.round(aiAnalysisData.ransomware_probability * 100)}/100` : "0/100"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                        Ransomware Probability
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                      <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData ? aiAnalysisData.threshold_used.toFixed(2) : "N/A"}</span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img src="/assets/icons/last-activity.svg" alt="Threshold" className="w-4 h-4" />
                        AI Threshold
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Security Checks */}
              <div className="px-6 py-5 mb-2 border-l-2 border-[#9BE4A0] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
                <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#22C55E]/15 via-[#22C55E]/15 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-[#FFFFFF] font-bold mb-2">{config.securityTitle}</div>
                  <ul className="flex flex-col gap-1">
                    {config.checkItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#22C55E] text-sm">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#9BE4A0" />
                          <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[#FFFFFF]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Report Details - Only show if there's a community report */}
              {analysisSource === "community" && analyzeAddressData?.report && analyzeAddressData.report.length > 0 && (
                <div className="px-6 py-5 mb-2 bg-[#FFFFFF0D] bg-opacity-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-[#FFFFFF] font-bold mb-3">Report Details</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[#B0B6BE] text-sm mb-1">Category</div>
                        <div className="text-white text-base font-medium capitalize">{analyzeAddressData.report[0].category}</div>
                      </div>
                      <div>
                        <a href={`/reports/${analyzeAddressData.report[0].report_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#9BEB83] text-sm font-medium hover:text-white transition-colors">
                          <span>View Full Report</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Button Analyze Other */}
              <button
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalyzeAddressData(null);
                  setAiAnalysisData(null);
                  setAnalysisSource("");
                  setAddress("");
                  setAddressError("");
                  setAnalysisError("");
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
        </div>
        {/* Info box - sesuai analyse-address.jsx */}
        {mode === "input" && (
          <div className="w-full">
            <div className="flex items-start gap-3 bg-[#FFFFFF] bg-opacity-5 relative md:px-4 px-2 md:py-3 py-2 border-l-2 border-[#9BEB83] overflow-hidden">
              {/* Gradient kiri */}
              <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#9BEB83]/30 to-transparent pointer-events-none" />
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mt-0.5 relative z-10">
                <circle cx="10" cy="10" r="10" fill="#9BEB83" />
                <text x="10" y="15" textAnchor="middle" fontSize="14" fill="#23272F" fontFamily="Arial, sans-serif">
                  i
                </text>
              </svg>
              <span className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">Enter a Bitcoin, Ethereum or other cryptocurrency address. You can find wallet addresses in your crypto exchange or wallet app.</span>
            </div>
          </div>
        )}
        <AnalyzeProgressModal isOpen={isAnalyzing} />
      </div>
    </>
  );
}
