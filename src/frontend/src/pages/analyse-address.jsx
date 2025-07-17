import React, { useState } from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";
import CustomButton from "../core/components/custom-button-a";
import AnalysisProgressModal from "../core/components/AnalysisProgressModal";

export default function AnalyseAddressPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("input"); // "input" | "result"
  const [result, setResult] = useState(null); // { type: "safe" | "danger", ... }

  // Simulasi hasil safe/danger setelah loading
  const handleAnalyze = (isDanger = false) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setMode("result");
      if (isDanger) {
        setResult({
          type: "danger",
          confidence: 96,
          transactions: 296,
          totalVolume: "89.98 BTC",
          riskScore: 87,
          lastActivity: "2 Days Ago",
          securityChecks: ["Linked to known scam addressed", "Suspicious transaction pattern detected", "Flagged by multiple sources", "High risk activity detected"],
        });
      } else {
        setResult({
          type: "safe",
          confidence: 96,
          transactions: 296,
          totalVolume: "89.98 BTC",
          riskScore: 17,
          lastActivity: "17 Days Ago",
          securityChecks: ["No links to known scam addressed", "No links to known scam addressed", "No links to known scam addressed", "No links to known scam addressed"],
        });
      }
    }, 2000);
  };

  return (
    <WalletLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
        {/* Card utama */}
        <div className="bg-[#181C22] border border-[#393E4B] rounded-lg shadow-lg px-8 py-8 w-full max-w-lg flex flex-col items-center relative overflow-hidden">
          {/* Pattern background kanan atas */}
          {/* Konten utama */}
          {mode === "input" && (
            <>
              <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-40 h-40 object-contain mb-4 select-none pointer-events-none relative z-10" draggable="false" />
              <div className="text-[#FFFFFF] text-2xl font-bold mb-1 text-center relative z-10">Analyze Address</div>
              <div className="text-[#B0B6BE] text-base mb-6 text-center relative z-10">Analyze address itu apa sih</div>
              <input type="text" placeholder="Input address here..." className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-3 text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#823EFD] mb-4 relative z-10" />
              <div className="w-full relative z-10 mb-2">
                <CustomButton icon={<img src="/assets/icons/analyze-address-light.svg" alt="Analyze" className="w-5 h-5" />} className="w-full" onClick={handleAnalyze}>
                  Analyse Address
                </CustomButton>
              </div>
            </>
          )}
          {mode === "result" && result?.type === "danger" && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Danger */}
              <div className="rounded-lg overflow-hidden mb-2 bg-[#FFFFFF0D] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FF6B6B]/15 via-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                    <img src="/assets/icons/danger.png" alt="Danger" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-bold text-lg leading-tight">ADDRESS IS NOT SAFE</div>
                      <div className="text-[#B0B6BE] text-sm">Confidence: {result.confidence}%</div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-xs font-normal">This bitcoin address appears to be flagged with suspicious activity detected in our comprehensive database</div>
                </div>
              </div>
              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#FFFFFF] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.transactions}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Transactions
                  </span>
                </div>
                <div className="bg-[#FFFFFF] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.totalVolume}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Total Volume" className="w-4 h-4" />
                    Total Volume
                  </span>
                </div>
                <div className="bg-[#FFFFFF] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-red-400 text-base font-medium">{result.riskScore}/100</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#FFFFFF] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.lastActivity}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Last Activity
                  </span>
                </div>
              </div>
              {/* Security Checks */}
              <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#FF6B6B] relative overflow-hidden bg-[#FFFFFF] bg-opacity-5">
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
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#99E39E] font-light flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setResult(null);
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
          {mode === "result" && result?.type === "safe" && (
            <div className="w-full flex flex-col gap-6 relative z-10">
              {/* Status Safe */}
              <div className="rounded-lg overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                {/* Bagian atas dengan gradient */}
                <div className="relative w-full">
                  <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#22C55E]/15 via-[#22C55E]/15 via-[#22C55E]/15 to-transparent z-0" />
                  <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                    <img src="/assets/icons/safe.png" alt="Safe" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[#FFFFFF] font-bold text-lg leading-tight">ADDRESS IS SAFE</div>
                      <div className="text-[#B0B6BE] text-sm">Confidence: {result.confidence}%</div>
                    </div>
                  </div>
                </div>
                {/* Bagian bawah deskripsi */}
                <div className="px-6 pb-4">
                  <div className="text-[#B0B6BE] text-xs font-normal">This bitcoin address appears to be clean with no suspicious activity detected in our comprehensive database</div>
                </div>
              </div>
              {/* Address Details */}
              <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-white text-base font-medium">{result.transactions}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Transactions
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.totalVolume}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Total Volume" className="w-4 h-4" />
                    Total Volume
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-green-400 text-base font-medium">{result.riskScore}/100</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 rounded-lg px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{result.lastActivity}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Last Activity
                  </span>
                </div>
              </div>
              {/* Security Checks */}
              <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#22C55E] relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5">
                <div className="absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r from-[#22C55E]/15 via-[#22C55E]/15 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-[#FFFFFF] font-bold mb-2">Security Checks Passed</div>
                  <ul className="flex flex-col gap-1">
                    {result.securityChecks.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#22C55E] text-sm">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#22C55E" />
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
                className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#4ADE80] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] transition"
                onClick={() => {
                  setMode("input");
                  setResult(null);
                }}>
                <img src="/assets/icons/construction.svg" alt="add others" className="w-18 h-18" />
                Analyze Other
              </button>
            </div>
          )}
        </div>
        {/* Info box */}
        {mode === "input" && (
          <div className="w-full max-w-xl mt-6">
            <div className="flex items-start gap-3 bg-[#FFFFFF] bg-opacity-5 relative px-4 py-3 border-l-2 border-[#9BEB83] overflow-hidden">
              {/* Gradient kiri */}
              <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#9BEB83]/30 to-transparent pointer-events-none" />
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mt-0.5 relative z-10">
                <circle cx="10" cy="10" r="10" fill="#9BEB83" />
                <text x="10" y="15" textAnchor="middle" fontSize="14" fill="#23272F" fontFamily="Arial, sans-serif">
                  i
                </text>
              </svg>
              <span className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">
                Paste a smart contract address or source code. You can usually find contract addresses on blockchain explorers like Etherscan or BscScan.
              </span>
            </div>
          </div>
        )}
        <AnalysisProgressModal open={isAnalyzing} onClose={() => setIsAnalyzing(false)} />
      </div>
    </WalletLayout>
  );
}
