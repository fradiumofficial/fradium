import React, { useState } from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";
import CustomButton from "../core/components/custom-button-a";
import AnalysisProgressModal from "../core/components/AnalysisProgressModal";

// Clean Architecture Imports
import { useTokenOperations } from "../core/hooks/useTokenOperations";
import { TokenServiceFactory } from "../core/services/tokens/TokenServiceFactory";
import { ANALYSIS_SOURCES } from "../core/types/token.types";
import { backend } from "declarations/backend";
import { jsonStringify } from "../core/lib/canisterUtils";

export default function AnalyseAddressPage() {
  // Clean Architecture Hooks
  const { analyzeAddress, detectTokenType, validateAddress: validateTokenAddress } = useTokenOperations();

  // Component State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  // Validate address input
  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required";
    }

    const detectedType = detectTokenType(address);
    if (detectedType === "Unknown") {
      return "Address format not recognized";
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
      // Detect token type
      const tokenType = detectTokenType(address);

      if (!TokenServiceFactory.isSupported(tokenType)) {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }

      // Analyze address using service
      const result = await analyzeAddress(tokenType, address);

      // Also save to backend history
      try {
        await backend.create_analyze_history({
          address: address,
          is_safe: result.isSafe,
          analyzed_type: result.source === ANALYSIS_SOURCES.COMMUNITY ? { CommunityVote: null } : { AIAnalysis: null },
          metadata: jsonStringify(result.data),
          token_type: { [tokenType]: null },
        });
      } catch (historyError) {
        console.error("Failed to save analysis history:", historyError);
      }

      setAnalysisResult(result);
      setMode("result");
    } catch (error) {
      console.error("Error analyzing address:", error);
      setAddressError(error.message || "Failed to analyze address");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <WalletLayout>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card utama - styling sesuai analyse-contract.jsx */}
        <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden">
          {/* Pattern background - sesuai analyse-contract.jsx */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 w-full h-32 opacity-30 z-0 pointer-events-none select-none object-cover object-right-top" />

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
              <div className="w-full bg-[#0F1219] border border-[#2A2D35] rounded-sm p-6 mb-6 relative z-10">
                <input
                  type="text"
                  placeholder="Input address here..."
                  className="w-full bg-transparent text-gray-400 text-base outline-none placeholder-gray-500"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (addressError) setAddressError("");
                  }}
                />
                {addressError && <div className="text-red-400 text-sm mt-2">{addressError}</div>}
              </div>

              {/* Analyze Button - Full Width */}
              <div className="w-full relative z-10">
                <CustomButton icon="/assets/icons/analyze-address-light.svg" className="w-full" onClick={handleAnalyze} disabled={!address.trim() || isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyse Address"}
                </CustomButton>
              </div>
            </>
          )}
          {mode === "result" && analysisResult && !analysisResult.isSafe && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Danger */}
              <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Address</span>
              <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FF6B6B]/15 via-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                    <img src="/assets/icons/danger.png" alt="Danger" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">ADDRESS IS NOT SAFE</div>
                      <div className="text-[#B0B6BE] text-xs">
                        {analysisResult.source === ANALYSIS_SOURCES.COMMUNITY ? "Community Report" : "AI Analysis"}
                        {analysisResult.confidence > 0 && ` • Confidence: ${analysisResult.confidence}%`}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-sm font-normal">This bitcoin address appears to be flagged with suspicious activity detected in our comprehensive database</div>
                </div>
              </div>

              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-white text-base font-medium">{result.transactions}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Transactions
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.totalVolume}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Total Volume" className="w-4 h-4" />
                    Total Volume
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-red-400 text-base font-medium">{result.riskScore}/100</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.lastActivity}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Last Activity
                  </span>
                </div>
              </div>

              {/* Security Checks */}
              <div className="px-6 py-5 mb-2 border-l-2 border-[#FF6B6B] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
                <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-[#FFFFFF] font-bold mb-2">Security Checks Failed</div>
                  <ul className="flex flex-col gap-1">
                    {result.securityChecks.map((item, idx) => (
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

              {/* Button Analyze Other */}
              <button
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalysisResult(null);
                  setAddress("");
                  setAddressError("");
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
          {mode === "result" && analysisResult && analysisResult.isSafe && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Safe */}
              <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Address</span>
              <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#22C55E]/15 via-[#22C55E]/15 via-[#22C55E]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                    <img src="/assets/icons/safe.png" alt="Safe" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">ADDRESS IS SAFE</div>
                      <div className="text-[#B0B6BE] text-xs">
                        {analysisResult.source === ANALYSIS_SOURCES.COMMUNITY ? "Community Report" : "AI Analysis"}
                        {analysisResult.confidence > 0 && ` • Confidence: ${analysisResult.confidence}%`}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-sm font-normal">This bitcoin address appears to be clean with no suspicious activity detected in our comprehensive database</div>
                </div>
              </div>

              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-white text-base font-medium">{result.transactions}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Transactions
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.totalVolume}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Total Volume" className="w-4 h-4" />
                    Total Volume
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#9BE4A0] text-base font-medium">{result.riskScore}/100</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.lastActivity}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Last Activity
                  </span>
                </div>
              </div>

              {/* Security Checks */}
              <div className="px-6 py-5 mb-2 border-l-2 border-[#9BE4A0] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
                <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#22C55E]/15 via-[#22C55E]/15 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-[#FFFFFF] font-bold mb-2">Security Checks Passed</div>
                  <ul className="flex flex-col gap-1">
                    {result.securityChecks.map((item, idx) => (
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

              {/* Button Analyze Other */}
              <button
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setAnalysisResult(null);
                  setAddress("");
                  setAddressError("");
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
              <span className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">Paste a bitcoin address or wallet address. You can usually find addresses on blockchain explorers like Blockchain.info or Blockchair.</span>
            </div>
          </div>
        )}
        <AnalysisProgressModal open={isAnalyzing} onClose={() => setIsAnalyzing(false)} />
      </div>
    </WalletLayout>
  );
}
