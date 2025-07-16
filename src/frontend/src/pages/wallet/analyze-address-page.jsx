import React, { useState } from "react";
import CustomButton from "../../core/components/custom-button-a";
import AnalysisProgressModal from "../../core/components/AnalysisProgressModal";
import { backend } from "declarations/backend";
import { isValidBitcoinAddress } from "../../core/lib/bitcoinUtils";

export default function AnalyseAddressPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  // Analyze Address Data States
  const [isAnalyzeAddressSafe, setIsAnalyzeAddressSafe] = useState(false);
  const [analyzeAddressData, setAnalyzeAddressData] = useState(null);

  // Validation function
  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required";
    }
    if (!isValidBitcoinAddress(address)) {
      return "Invalid Bitcoin address format";
    }
    return null;
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
      console.log("communityReport", communityReport);

      if ("Ok" in communityReport) {
        console.log("communityReport.Ok", communityReport.Ok);
        setIsAnalyzeAddressSafe(communityReport.Ok.is_safe);
        setAnalyzeAddressData(communityReport.Ok);
        setMode("result");
      } else {
        // Handle error response
        console.error("Error response from backend:", communityReport);
        throw new Error("Failed to analyze address");
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
      // Fallback to simulation for demo purposes
      setTimeout(() => {
        // Set fallback data for demo
        setIsAnalyzeAddressSafe(false);
        setAnalyzeAddressData({
          is_safe: false,
          report: [],
        });
        setMode("result");
      }, 2000);
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

  const statusConfig = {
    safe: {
      gradientColor: "from-[#4A834C]",
      borderColor: "border-[#4ADE80]",
      icon: "/assets/icons/safe.png",
      title: "ADDRESS IS SAFE",
      description: analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? "This address has been analyzed by the community and found to be safe" : "This address appears to be clean with no suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Passed",
      checkItems: ["No links to known scam addresses", "No suspicious transaction pattern detected"],
      riskScoreColor: "text-green-400",
    },
    danger: {
      gradientColor: "from-[#F87171]",
      borderColor: "border-[#F87171]",
      icon: "/assets/icons/danger.png",
      title: "ADDRESS IS NOT SAFE",
      description: analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? "This address has been flagged by the community as potentially unsafe" : "This address appears to be flagged with suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Not Passed",
      checkItems: ["Links to known scam addresses detected", "Suspicious transaction pattern detected"],
      riskScoreColor: "text-red-400",
    },
  };

  const config = statusConfig[isAnalyzeAddressSafe ? "safe" : "danger"];

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        {/* Card utama */}
        <div className="bg-[#181C22] border border-[#393E4B] rounded-lg shadow-lg px-8 py-8 w-full max-w-lg flex flex-col items-center relative overflow-hidden">
          {/* Pattern background kanan atas */}
          <img src="/assets/pattern-sidebar.png" alt="Pattern" className="absolute top-0 right-0 w-[420px] h-auto opacity-70 z-0 pointer-events-none select-none" draggable="false" />
          {/* Konten utama */}
          {mode === "input" && (
            <>
              <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-40 h-40 object-contain mb-4 select-none pointer-events-none relative z-10" draggable="false" />
              <div className="text-white text-2xl font-bold mb-1 text-center relative z-10">Analyze Address</div>
              <div className="text-[#B0B6BE] text-base mb-6 text-center relative z-10">Analyze address itu apa sih</div>
              <input
                type="text"
                placeholder="Input address here..."
                className={`w-full bg-[#23272F] border rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#823EFD] mb-4 relative z-10 ${addressError ? "border-red-500" : "border-[#393E4B]"} ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {addressError && <div className="text-red-400 text-xs mb-4 relative z-10">{addressError}</div>}
              <div className="w-full relative z-10 mb-2">
                <CustomButton icon={<img src="/assets/icons/analyze-address-light.svg" alt="Analyze" className="w-5 h-5" />} className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyse Address"}
                </CustomButton>
              </div>
            </>
          )}
          {mode === "result" && !isAnalyzeAddressSafe && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Danger */}
              <div className="rounded-lg px-0 py-0 flex flex-col gap-0 mb-2 overflow-hidden">
                {/* Gradient overlay atas */}
                <div className="relative w-full h-full">
                  <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#F87171] via-transparent to-transparent opacity-80 z-0" />
                  <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                    <img src={config.icon} alt="Danger" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-white font-bold text-lg leading-tight">{config.title}</div>
                      <div className="text-[#B0B6BE] text-sm">Detected By Community</div>
                      <div className="text-[#B0B6BE] text-xs mt-1">{config.description}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Address Details */}
              <p className="text-white font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? analyzeAddressData.report[0].voted_by.length : "0"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Total Voters
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? `${analyzeAddressData.report[0].votes_yes} Yes / ${analyzeAddressData.report[0].votes_no} No` : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-4 h-4" />
                    Vote Results
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-red-400 text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? calculateRiskScore(analyzeAddressData.report[0].votes_yes, analyzeAddressData.report[0].votes_no) : "0/100"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? getTimeAgo(analyzeAddressData.report[0].created_at) : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Report Created
                  </span>
                </div>
              </div>
              {/* Security Checks */}
              <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#F87171] relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#F87171]/30 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-white font-bold mb-2">{config.securityTitle}</div>
                  <ul className="flex flex-col gap-1">
                    {config.checkItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#F87171] text-sm">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#F87171" />
                          <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Report Details - Only show if there's a report */}
              {analyzeAddressData?.report && analyzeAddressData.report.length > 0 && (
                <div className="rounded-lg px-6 py-5 mb-2 bg-[#23272F] relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-white font-bold mb-3">Report Details</div>
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
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#99E39E] font-light flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalyzeAddressData(null);
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
              <div className="rounded-lg px-0 py-0 flex flex-col gap-0 mb-2 overflow-hidden">
                {/* Gradient overlay atas */}
                <div className="relative w-full h-full">
                  <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#4A834C] via-transparent to-transparent opacity-80 z-0" />
                  <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                    <img src={config.icon} alt="Safe" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-white font-bold text-lg leading-tight">{config.title}</div>
                      <div className="text-[#B0B6BE] text-sm">Detected By Community</div>
                      <div className="text-[#B0B6BE] text-xs mt-1">{config.description}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Address Details */}
              <p className="text-white font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? analyzeAddressData.report[0].voted_by.length : "0"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Total Voters
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? `${analyzeAddressData.report[0].votes_yes} Yes / ${analyzeAddressData.report[0].votes_no} No` : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-4 h-4" />
                    Vote Results
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-green-400 text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? calculateRiskScore(analyzeAddressData.report[0].votes_yes, analyzeAddressData.report[0].votes_no) : "0/100"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#23272F] rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-xl font-bold">{analyzeAddressData?.report && analyzeAddressData.report.length > 0 ? getTimeAgo(analyzeAddressData.report[0].created_at) : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Report Created
                  </span>
                </div>
              </div>
              {/* Security Checks */}
              <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#4ADE80] relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#4A834C]/30 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-white font-bold mb-2">{config.securityTitle}</div>
                  <ul className="flex flex-col gap-1">
                    {config.checkItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#9BEB83] text-sm">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#9BEB83" />
                          <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Report Details - Only show if there's a report */}
              {analyzeAddressData?.report && analyzeAddressData.report.length > 0 && (
                <div className="rounded-lg px-6 py-5 mb-2 bg-[#23272F] relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-white font-bold mb-3">Report Details</div>
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
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#4ADE80] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalyzeAddressData(null);
                  setAddress("");
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
        </div>
        {/* Info box */}
        {mode === "input" && (
          <div className="w-full max-w-lg mt-6">
            <div className="flex items-start gap-3 bg-[#181C22] relative rounded-lg px-4 py-3 border-l-2 border-[#9BEB83] overflow-hidden">
              {/* Gradient kiri */}
              <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#9BEB83]/40 to-transparent pointer-events-none rounded-l-lg" />
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mt-0.5 relative z-10">
                <circle cx="10" cy="10" r="10" fill="#9BEB83" />
                <text x="10" y="15" textAnchor="middle" fontSize="14" fill="#23272F" fontFamily="Arial, sans-serif">
                  i
                </text>
              </svg>
              <span className="text-white text-sm leading-relaxed relative z-10">Sebuah informasi atau himbauan kepada user untuk memasukkan address sesuai dengan bla bla</span>
            </div>
          </div>
        )}
        <AnalysisProgressModal open={isAnalyzing} onClose={() => setIsAnalyzing(false)} />
      </div>
    </>
  );
}
