import React, { useState } from "react";
import CustomButton from "@/core/components/custom-button-a";
import AnalyzeProgressModal from "@/core/components/modals/AnalyzeProgressModal";
import { backend } from "declarations/backend";
import { ransomware_detector } from "declarations/ransomware_detector";
import { jsonStringify } from "../../core/lib/canisterUtils";
import { BitcoinService } from "../../core/services/tokens/implementations/BitcoinService";
import SidebarButton from "../../core/components/SidebarButton";
import { Dialog, DialogContent } from "../../core/components/ui/dialog";

const NETWORKS = [
  {
    key: "bitcoin",
    name: "Bitcoin",
    icon: "/assets/icons/bitcoin-grey.svg",
  },
  {
    key: "ethereum",
    name: "Ethereum",
    icon: "/assets/icons/eth-grey.svg",
  },
  {
    key: "fradium",
    name: "Fradium",
    icon: "/assets/icons/fum-grey.svg",
  },
];

export default function AnalyseAddressPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");

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

  // Auto-detect blockchain network from address (from create-report-page.jsx)
  const detectChain = (address) => {
    if (!address) return "Unknown";

    // Simple chain detection based on address format
    if (address.startsWith("0x") && address.length === 42) {
      return "Ethereum";
    } else if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) {
      return "Bitcoin";
    } else if (address.length === 44) {
      return "Solana";
    } else if (address.startsWith("cosmos")) {
      return "Cosmos";
    }
    return "Unknown";
  };

  // Convert chain name to token type variant
  const getTokenTypeVariant = (chainName) => {
    switch (chainName) {
      case "Bitcoin":
        return { Bitcoin: null };
      case "Ethereum":
        return { Ethereum: null };
      case "Solana":
        return { Solana: null };
      default:
        return { Unknown: null };
    }
  };

  // Handle analyze address
  const handleAnalyze = async () => {
    const error = validateAddress(address);
    if (error) {
      setAddressError(error);
      return;
    }

    setAddressError("");
    setIsAnalyzing(true);

    try {
      // Analyze address by community report
      const communityReport = await backend.analyze_address(address);

      if ("Ok" in communityReport) {
        if (communityReport.Ok.is_safe) {
          // If safe by community, use community result
          setIsAnalyzeAddressSafe(true);
          setAnalyzeAddressData(communityReport.Ok);
          setAnalysisSource("community");

          // Create analyze history for Community analysis (safe)
          try {
            await backend.create_analyze_history({
              address: address,
              is_safe: true,
              analyzed_type: { CommunityVote: null },
              metadata: jsonStringify(communityReport.Ok),
              token_type: getTokenTypeVariant(detectChain(address)),
            });
            console.log("Community analysis history (safe) saved successfully");
          } catch (historyError) {
            console.error("Failed to save community analysis history:", historyError);
          }

          // COMMENTED OUT: AI Analysis
          // // If safe by community, also check AI analysis
          // const ransomwareReport = await ransomware_detector.analyze_address(address);

          // if ("Ok" in ransomwareReport) {
          //   if (ransomwareReport.Ok.is_ransomware) {
          //     // AI detected as unsafe
          //     setIsAnalyzeAddressSafe(false);
          //     setAiAnalysisData(ransomwareReport.Ok);
          //     setAnalysisSource("ai");

          //     // Create analyze history for AI analysis (unsafe)
          //     try {
          //       await backend.create_analyze_history({
          //         address: address,
          //         is_safe: false,
          //         analyzed_type: { AIAnalysis: null },
          //         metadata: jsonStringify(ransomwareReport.Ok),
          //         token_type: getTokenTypeVariant(detectChain(address)),
          //       });
          //       console.log("AI analysis history (unsafe) saved successfully");
          //     } catch (historyError) {
          //       console.error("Failed to save AI analysis history:", historyError);
          //     }
          //   } else {
          //     // AI detected as safe, but use community result
          //     setIsAnalyzeAddressSafe(true);
          //     setAnalyzeAddressData(communityReport.Ok);
          //     setAnalysisSource("community");

          //     // Create analyze history for Community analysis (safe)
          //     try {
          //       await backend.create_analyze_history({
          //         address: address,
          //         is_safe: true,
          //         analyzed_type: { CommunityVote: null },
          //         metadata: jsonStringify(communityReport.Ok),
          //         token_type: getTokenTypeVariant(detectChain(address)),
          //       });
          //       console.log("Community analysis history (safe) saved successfully");
          //     } catch (historyError) {
          //       console.error("Failed to save community analysis history:", historyError);
          //     }
          //   }
          // }

          setMode("result");
        } else {
          // If not safe by community, use community result
          setIsAnalyzeAddressSafe(false);
          setAnalyzeAddressData(communityReport.Ok);
          setAnalysisSource("community");

          // Create analyze history for Community analysis (unsafe)
          try {
            await backend.create_analyze_history({
              address: address,
              is_safe: false,
              analyzed_type: { CommunityVote: null },
              metadata: jsonStringify(communityReport.Ok),
              token_type: getTokenTypeVariant(detectChain(address)),
            });
            console.log("Community analysis history (unsafe) saved successfully");
          } catch (historyError) {
            console.error("Failed to save community analysis history:", historyError);
          }

          setMode("result");
        }
      } else {
        // If no community report, show message that address is not in database
        alert("Address not found in community database. No reports available for this address.");

        // COMMENTED OUT: AI Analysis fallback
        // // If no community report, try AI analysis
        // const ransomwareReport = await ransomware_detector.analyze_address(address);
        // console.log("ransomwareReport", jsonStringify(ransomwareReport));

        // if ("Ok" in ransomwareReport) {
        //   const isSafe = !ransomwareReport.Ok.is_ransomware;
        //   setIsAnalyzeAddressSafe(isSafe);
        //   setAiAnalysisData(ransomwareReport.Ok);
        //   setAnalysisSource("ai");

        //   // Create analyze history for AI analysis
        //   try {
        //     await backend.create_analyze_history({
        //       address: address,
        //       is_safe: isSafe,
        //       analyzed_type: { AIAnalysis: null },
        //       metadata: jsonStringify(ransomwareReport.Ok),
        //       token_type: getTokenTypeVariant(detectChain(address)),
        //     });
        //     console.log(`AI analysis history (${isSafe ? "safe" : "unsafe"}) saved successfully`);
        //   } catch (historyError) {
        //     console.error("Failed to save AI analysis history:", historyError);
        //   }

        //   setMode("result");
        // } else {
        //   throw new Error("Failed to analyze address");
        // }
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
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
        <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden">
          {/* Pattern background - pattern-topside.png */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top" />

          {/* Konten utama */}
          {mode === "input" && (
            <>
              {/* Icon Container */}
              <div className="flex justify-center mb-2 relative z-10">
                <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-48 h-48" />
              </div>

              {/* Title */}
              <h1 className="text-white text-xl font-semibold mb-1 text-center relative z-10">Analyze Address</h1>

              {/* Description */}
              <p className="text-gray-400 max-w-sm text-sm font-normal text-center mb-6 mx-auto relative z-10">Scan a bitcoin address to detect suspicious activity and potential scams.</p>

              {/* Input Container */}
              <div className="w-full bg-[#0F1219] border border-[#2A2D35] rounded-sm p-4 mb-6 relative z-10">
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
                    }
                  }}
                />
              </div>
              {addressError && <div className="text-red-400 text-xs mb-4 relative z-10">{addressError}</div>}

              {/* Analyze Button - Full Width */}
              <div className="w-full relative z-10">
                <CustomButton icon="/assets/icons/analyze-address-light.svg" className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
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
            <div className="flex items-start gap-3 bg-[#FFFFFF] bg-opacity-5 relative px-4 py-3 border-l-2 border-[#9BEB83] overflow-hidden">
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
