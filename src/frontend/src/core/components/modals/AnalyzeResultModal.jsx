import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Wallet, BarChart3, Gauge, Clock, ExternalLink } from "lucide-react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { getChainExplorer, getExplorerUrl } from "@/core/lib/chainExplorers.js";

export default function AnalyzeResultModal({ isOpen, onClose, analysisResult, variant = "analyze", onCancel, onConfirm }) {
  if (!isOpen) return null;

  // Pakai hasil analisis tanpa fallback; jika kosong, tampilkan error state
  const result = analysisResult?.result;
  if (!result) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 pl-4 pr-4 bg-black/50 backdrop-blur-md">
        <div className="w-full max-w-[500px] mx-auto">
          <div className="flex flex-col items-start p-4 gap-4 w-full h-auto bg-black rounded-3xl border border-white/10">
            <h2 className="text-white text-lg font-semibold">Terjadi kesalahan</h2>
            <p className="text-white/70 text-sm">Gagal memuat hasil analisis alamat. Silakan coba lagi.</p>
            <div className="w-full">
              <ButtonGreen fullWidth size="md" fontWeight="semibold" onClick={onClose}>
                Tutup
              </ButtonGreen>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const network = analysisResult?.network || "Bitcoin";
  const address = analysisResult?.address || "";
  const analysisType = analysisResult?.type || "ai";
  const analysisSource = analysisResult?.analysisSource || analysisType;
  const finalStatus = analysisResult?.finalStatus;
  const communityAnalysis = analysisResult?.communityAnalysis;
  const aiAnalysis = analysisResult?.aiAnalysis;
  const aiIsSafe = typeof aiAnalysis?.isSafe === "boolean" ? aiAnalysis.isSafe : result?.isSafe;
  const communityIsSafe = typeof communityAnalysis?.isSafe === "boolean" ? communityAnalysis.isSafe : result?.isSafe;

  // Get blockchain explorer info
  const explorer = getChainExplorer(network);
  const explorerUrl = getExplorerUrl(network, address);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 pl-4 pr-4 bg-black/50 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-[500px] mx-auto pb-8">
        <div className="flex flex-col items-start p-3 gap-3 w-full h-auto min-h-[670px] max-h-[90vh] bg-black rounded-3xl overflow-y-auto">
          {/* Content */}
          <div className="flex flex-col items-end p-0 gap-4 w-full h-auto">
            {/* Image Container */}
            <div className="w-full h-[150px] bg-white/[0.03] rounded-xl relative overflow-hidden">
              {/* Decorative Elements */}
              <div className={`absolute w-[395.53px] h-[62.9px] left-[151.76px] top-[-55.06px] blur-[81.5px] transform rotate-[2.2deg] ${result.isSafe ? "bg-[#99E39E]/60" : "bg-red-500/60"}`}></div>
              <div className="absolute -left-[118px] -top-[91px] w-[209.78px] h-[299.68px] opacity-[0.03] transform rotate-[18.24deg]">
                <div className="w-full h-full bg-white"></div>
              </div>

              {/* Main Content */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[128px] flex items-center">
                {/* Icon */}
                <div className="w-32 h-32 flex-shrink-0">
                  <img src={result.isSafe ? "/assets/images/analisis.png" : "/assets/images/ai-unsafe-result.webp"} alt="Analysis Result" className="w-32 h-32" />
                </div>

                {/* Title Section */}
                <div className="flex flex-col items-start p-0 gap-3 w-[316px] h-[88px] ml-4">
                  <div className="flex flex-col items-start p-0 gap-1 w-[316px] h-[44px]">
                    <h2 className={`text-xl font-semibold leading-[120%] text-white`}>Address is {result.isSafe ? "SAFE" : "RISKY"}</h2>
                    <div className="flex flex-row items-center gap-2">
                      <p className="text-white text-xs font-medium leading-[130%]">Confidence: {result.confidence}%</p>
                      <span className="text-white/40 text-xs">•</span>
                      <p className="text-white/60 text-xs">{finalStatus === "safe_by_both" ? "Analyzed by AI & COMMUNITY" : finalStatus === "unsafe_by_ai" ? "Analyzed by AI" : finalStatus === "unsafe_by_community" ? "Analyzed by COMMUNITY" : `Analyzed by ${analysisSource.toUpperCase()}`}</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-xs leading-[130%] tracking-[-0.01em] w-[316px]">{result.description}</p>
                </div>
              </div>
            </div>

            {/* Address Details Section */}
            <div className="flex flex-col items-start p-2 px-6 pb-6 gap-5 w-full h-auto">
              <div className="flex flex-row items-center justify-between w-full">
                <h3 className="text-white text-xl font-semibold leading-[120%]">Address Details</h3>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="flex flex-row items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors duration-200">
                  <span className="text-white/60 text-xs">{explorer.icon}</span>
                  <span className="text-white/60 text-xs">{explorer.name}</span>
                  <ExternalLink className="w-3 h-3 text-white/40" />
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {/* Transactions */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">{result.stats.transactions}</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Wallet className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Transactions</span>
                  </div>
                </div>

                {/* Risk Probability */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">{result.stats.totalVolume}</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <BarChart3 className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Risk Probability</span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-[#9BE4A0] text-base font-medium leading-[120%] tracking-[-0.02em]">{result.stats.riskScore}</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Gauge className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Risk Score</span>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">{result.stats.lastActivity}</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Clock className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Last Activity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Analysis Section - Show when both AI and Community analyzed */}
            {(finalStatus === "safe_by_both" || finalStatus === "unsafe_by_community") && (
              <div className="flex flex-col items-start p-2 px-6 pb-6 gap-5 w-full h-auto">
                <h3 className="text-white text-lg font-semibold leading-[120%]">{finalStatus === "safe_by_both" ? "✅ Dual Analysis Confirmed" : "⚠️ Analysis Conflict"}</h3>
                <div className="flex flex-col gap-4 w-full">
                  {/* AI Analysis */}
                  <div className="flex flex-col items-start p-3 gap-2 bg-white/[0.05] rounded-xl w-full">
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-white text-sm font-medium">AI Analysis</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${aiIsSafe ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"}`}>{aiIsSafe ? "SAFE" : "RISKY"}</span>
                    </div>
                    <p className="text-white text-xs">Confidence: {aiAnalysis?.confidence || result.confidence}%</p>
                    <p className="text-white text-xs">Risk Score: {aiAnalysis?.stats?.riskScore || result.stats.riskScore}</p>
                  </div>

                  {/* Community Analysis */}
                  <div className="flex flex-col items-start p-3 gap-2 bg-white/[0.05] rounded-xl w-full">
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-white text-sm font-medium">Community Analysis</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${communityIsSafe ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"}`}>{communityIsSafe ? "SAFE" : "RISKY"}</span>
                    </div>
                    <p className="text-white text-xs">Confidence: {communityAnalysis?.confidence || result.confidence}%</p>
                    <p className="text-white text-xs">Risk Score: {communityAnalysis?.stats?.riskScore || result.stats.riskScore}</p>
                  </div>
                </div>
                {finalStatus === "safe_by_both" && <p className="text-green-300 text-xs leading-[130%]">Both AI and Community analysis confirm this address is safe. Double verification provides higher confidence.</p>}
                {finalStatus === "unsafe_by_community" && <p className="text-yellow-300 text-xs leading-[130%]">AI analysis shows safe, but Community analysis indicates potential risk. Community reports take precedence for safety.</p>}
              </div>
            )}

            {/* Security Checks Section */}
            <div className="flex flex-col items-start p-2 px-6 pb-6 gap-5 w-full h-auto">
              <h3 className="text-white text-xl font-semibold leading-[120%]">{result.isSafe ? "Security Checks Passed" : "Security Issues Detected"}</h3>

              {/* Security Field */}
              <div
                className="flex flex-col items-start p-4 gap-4 w-full h-auto rounded-xl"
                style={{
                  background: result.isSafe ? "radial-gradient(69.63% 230.37% at -11.33% 50%, #1A4A1B 0%, rgba(153, 227, 158, 0.21) 30.29%, rgba(255, 255, 255, 0.03) 100%)" : "radial-gradient(69.63% 230.37% at -11.33% 50%, #4A1B1B 0%, rgba(239, 68, 68, 0.21) 30.29%, rgba(255, 255, 255, 0.03) 100%)",
                  borderLeft: result.isSafe ? "1px solid #9BE4A0" : "1px solid #ef4444",
                }}>
                <div className="flex flex-col items-start p-0 gap-2 w-full h-auto">
                  {result.securityChecks.map((check, index) => (
                    <div key={index} className="flex flex-row items-center p-0 gap-2 w-full h-5">
                      <CheckCircle className={`w-5 h-5 ${result.isSafe ? "text-[#9BE4A0]" : "text-red-400"}`} />
                      <span className="text-white/60 text-sm leading-[130%]">{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Area */}
              {variant === "send" ? (
                <div className="w-full flex items-center gap-3 mt-2">
                  <button type="button" onClick={onCancel || onClose} className="flex-1 h-10 rounded-full border border-white/15 text-white/90 hover:bg-white/[0.05] transition-colors">
                    Cancel
                  </button>
                  <div className="flex-1">
                    <ButtonGreen fullWidth size="md" fontWeight="semibold" onClick={onConfirm || onClose}>
                      Confirm Send
                    </ButtonGreen>
                  </div>
                </div>
              ) : (
                <ButtonGreen size="md" icon="/assets/icons/analyze-address-dark.svg" iconSize="w-5 h-5" className="w-full h-10" textSize="text-sm" fontWeight="medium" onClick={onClose}>
                  Go Analyze Other
                </ButtonGreen>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
