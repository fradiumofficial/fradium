import React, { useState } from "react";
import CustomButton from "../../core/components/custom-button-a";
import AnalyzeProgressModal from "../../core/components/modals/AnalyzeProgressModal";

export default function AnalyseContractPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [result, setResult] = useState(null); // { type: "safe" | "danger", ... }
  const [contractAddress, setContractAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  // Validation function for contract address
  const validateContractAddress = (address) => {
    if (!address.trim()) {
      setAddressError("Please enter an Ethereum contract address");
      return false;
    }

    // Basic Ethereum address validation (starts with 0x and 42 characters total)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAddressError("Please enter a valid Ethereum address (0x followed by 40 hex characters)");
      return false;
    }

    setAddressError("");
    return true;
  };

  // Handle input change with real-time validation
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setContractAddress(value);

    // Clear error when user starts typing
    if (addressError) {
      setAddressError("");
    }
  };

  // Simulasi hasil safe/danger setelah loading
  const handleAnalyze = async () => {
    if (!validateContractAddress(contractAddress)) {
      return;
    }

    console.log(import.meta.env.VITE_MYTHRIL_API_URL);

    setIsAnalyzing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_MYTHRIL_API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: contractAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const data = await response.json();
      console.log("Analysis result:", JSON.stringify(data));

      setIsAnalyzing(false);

      // Process the analysis result
      const analysisResult = {
        success: data.success,
        message: data.message,
        issues: data.issues || [],
        contractAddress: contractAddress,
        hasIssues: data.issues && data.issues.length > 0,
        highSeverityCount: data.issues ? data.issues.filter((issue) => issue.severity === "High").length : 0,
        mediumSeverityCount: data.issues ? data.issues.filter((issue) => issue.severity === "Medium").length : 0,
        lowSeverityCount: data.issues ? data.issues.filter((issue) => issue.severity === "Low").length : 0,
        totalIssues: data.issues ? data.issues.length : 0,
      };

      setResult(analysisResult);
      setMode("result");
    } catch (error) {
      console.error("Analysis error:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
      {/* Main Card Container */}
      <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden">
        {/* Pattern background - pattern-topside.png */}
        <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top" />

        {mode === "input" && (
          <>
            {/* Icon Container */}
            <div className="flex justify-center mb-2 relative z-10">
              <img src="/assets/images/analyse-contract.png" alt="Analyze Smart Contract" className="w-48 h-48" />
            </div>

            {/* Title */}
            <h1 className="text-white text-xl font-semibold mb-1 text-center relative z-10">Analyze Ethereum Contract</h1>

            {/* Description */}
            <p className="text-gray-400 max-w-sm text-sm font-normal text-center mb-4 mx-auto relative z-10">Enter an Ethereum smart contract address to analyze security risks and detect potential vulnerabilities.</p>

            {/* Ethereum Only Notice */}
            <div className="w-full max-w-sm mx-auto mb-6 relative z-10">
              <div className="flex items-center justify-center gap-2 bg-[#1A1D23] border border-[#2A2D35] rounded-sm px-4 py-2">
                <img src="/assets/eth.svg" alt="Ethereum" className="w-5 h-5" />
                <span className="text-[#9BE4A0] text-sm font-medium">Ethereum Network Only</span>
              </div>
            </div>

            {/* Address Input Container */}
            <div className="w-full mb-6 relative z-10">
              <div className={`w-full bg-[#0F1219] border rounded-sm p-4 ${addressError ? "border-red-500" : "border-[#2A2D35]"}`}>
                <input type="text" className="w-full bg-transparent text-gray-400 text-base outline-none placeholder-gray-500" placeholder="Enter Ethereum contract address (e.g., 0x1234...abcd)" value={contractAddress} onChange={handleAddressChange} />
              </div>
              {addressError && <div className="text-red-400 text-sm mt-2 relative z-10">{addressError}</div>}
            </div>

            {/* Analyze Button - Full Width */}
            <div className="w-full relative z-10">
              <CustomButton icon="/assets/icons/analyze-contract-light.svg" className={`w-full ${!contractAddress.trim() ? "opacity-50 cursor-not-allowed" : ""}`} onClick={handleAnalyze} disabled={!contractAddress.trim()}>
                Analyse Ethereum Contract
              </CustomButton>
            </div>
          </>
        )}

        {mode === "result" && result?.hasIssues && (
          <div className="w-full flex flex-col gap-6 relative z-10">
            {/* Status Danger */}
            <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Ethereum Contract</span>

            {/* Contract Address Display */}
            <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg p-4">
              <div className="text-[#B0B6BE] text-xs mb-1">Contract Address</div>
              <div className="text-[#FFFFFF] text-sm font-mono break-all">{result.contractAddress}</div>
            </div>

            <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
              {/* Bagian atas dengan gradient */}
              <div className="relative w-full">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FF6B6B]/15 via-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent z-0" />
                <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                  <img src="/assets/icons/danger.png" alt="Danger" className="w-12 h-12 object-contain" />
                  <div>
                    <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">SECURITY ISSUES DETECTED</div>
                    <div className="text-[#B0B6BE] text-xs">{result.message}</div>
                  </div>
                </div>
              </div>
              {/* Bagian bawah deskripsi */}
              <div className="px-6 pb-4">
                <div className="text-[#B0B6BE] text-sm font-normal">
                  This Ethereum smart contract has {result.totalIssues} security issue{result.totalIssues !== 1 ? "s" : ""} that require attention
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <p className="text-[#FFFFFF] font-semibold text-lg">Contract Details</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-white text-base font-medium">{result.totalIssues}</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                  Issues Found
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">{result.highSeverityCount}</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="High Severity" className="w-4 h-4" />
                  High Severity
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">{result.mediumSeverityCount}</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="Medium Severity" className="w-4 h-4" />
                  Medium Severity
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">{result.lowSeverityCount}</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="Low Severity" className="w-4 h-4" />
                  Low Severity
                </span>
              </div>
            </div>

            {/* Security Checks */}
            <div className="px-6 py-5 mb-2 border-l-2 border-[#FF6B6B] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
              <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="text-[#FFFFFF] font-bold mb-2">Security Issues Detected</div>
                <div className="text-[#B0B6BE] text-sm mb-3">
                  {result.totalIssues} issue{result.totalIssues !== 1 ? "s" : ""} found during analysis
                </div>
              </div>
            </div>

            {/* Detailed Issues */}
            <div className="w-full">
              <div className="text-[#FFFFFF] font-semibold text-lg mb-4">Issue Details</div>
              <div className="space-y-4">
                {result.issues.map((issue, idx) => (
                  <div key={idx} className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg p-4 border-l-4 border-red-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#FFFFFF] font-semibold text-sm">{issue.title}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${issue.severity === "High" ? "bg-red-500/20 text-red-400" : issue.severity === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>{issue.severity}</span>
                        </div>
                        {issue.function && <div className="text-[#9BE4A0] text-xs mb-2 font-mono">Function: {issue.function}</div>}
                        <div className="text-[#B0B6BE] text-sm leading-relaxed">{issue.description}</div>
                      </div>
                    </div>
                    {issue["swc-url"] && (
                      <div className="mt-3 pt-3 border-t border-[#2A2D35]">
                        <a href={issue["swc-url"]} target="_blank" rel="noopener noreferrer" className="text-[#9BE4A0] hover:text-white transition-colors text-xs underline">
                          Learn more about SWC-{issue["swc-id"]} →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Button Analyze Other */}
            <button
              className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
              onClick={() => {
                setMode("input");
                setResult(null);
                setContractAddress("");
                setAddressError("");
              }}>
              <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
              Analyze Other
            </button>
          </div>
        )}

        {mode === "result" && !result?.hasIssues && (
          <div className="w-full flex flex-col gap-6 relative z-10">
            {/* Status Safe */}
            <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Ethereum Contract</span>

            {/* Contract Address Display */}
            <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg p-4">
              <div className="text-[#B0B6BE] text-xs mb-1">Contract Address</div>
              <div className="text-[#FFFFFF] text-sm font-mono break-all">{result.contractAddress}</div>
            </div>

            <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
              {/* Bagian atas dengan gradient */}
              <div className="relative w-full">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#22C55E]/15 via-[#22C55E]/15 via-[#22C55E]/15 to-transparent z-0" />
                <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                  <img src="/assets/icons/safe.png" alt="Safe" className="w-12 h-12 object-contain" />
                  <div>
                    <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">NO SECURITY ISSUES DETECTED</div>
                    <div className="text-[#B0B6BE] text-xs">{result.message}</div>
                  </div>
                </div>
              </div>
              {/* Bagian bawah deskripsi */}
              <div className="px-6 pb-4">
                <div className="text-[#B0B6BE] text-sm font-normal">This Ethereum smart contract appears to be clean with no security issues detected in our analysis</div>
              </div>
            </div>

            {/* Contract Details */}
            <p className="text-[#FFFFFF] font-semibold text-lg">Contract Details</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-white text-base font-medium">0</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                  Issues Found
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">0</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="High Severity" className="w-4 h-4" />
                  High Severity
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">0</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="Medium Severity" className="w-4 h-4" />
                  Medium Severity
                </span>
              </div>
              <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                <span className="text-[#FFFFFF] text-base font-medium">0</span>
                <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                  <img src="/assets/icons/risk-score.svg" alt="Low Severity" className="w-4 h-4" />
                  Low Severity
                </span>
              </div>
            </div>

            {/* Security Checks */}
            <div className="px-6 py-5 mb-2 border-l-2 border-[#9BE4A0] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
              <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#22C55E]/15 via-[#22C55E]/15 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="text-[#FFFFFF] font-bold mb-2">Analysis Complete</div>
                <div className="text-[#B0B6BE] text-sm mb-3">No security vulnerabilities detected</div>
                <div className="flex items-center gap-2 text-[#22C55E] text-sm">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#9BE4A0" />
                    <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[#FFFFFF]">Contract analysis completed successfully. No security issues were found.</span>
                </div>
              </div>
            </div>

            {/* Button Analyze Other */}
            <button
              className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
              onClick={() => {
                setMode("input");
                setResult(null);
                setContractAddress("");
                setAddressError("");
              }}>
              <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
              Analyze Other
            </button>
          </div>
        )}
      </div>

      {/* Info Box - Outside Card */}
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
            <div className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">
              <p className="mb-2">Enter an Ethereum smart contract address to analyze its security. This tool only supports Ethereum network contracts.</p>
              <p>
                You can find verified contracts on{" "}
                <a href="https://etherscan.io/contractsverified" target="_blank" rel="noopener noreferrer" className="text-[#9BE4A0] hover:text-white transition-colors underline">
                  Etherscan Verified Contracts
                </a>{" "}
                or search for any contract address on{" "}
                <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer" className="text-[#9BE4A0] hover:text-white transition-colors underline">
                  Etherscan.io
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress Modal */}
      <AnalyzeProgressModal isOpen={isAnalyzing} />
    </div>
  );
}
