import React, { useState } from "react";
import CustomButton from "../core/components/custom-button-a";
import AnalysisProgressModal from "../core/components/AnalysisProgressModal";

export default function AnalyseContractPage() {
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
                    confidence: 85,
                    transactions: 142,
                    totalVolume: "45.67 ETH",
                    riskScore: 78,
                    lastActivity: "3 Days Ago",
                    securityChecks: [
                        "Malicious functions detected",
                        "Suspicious transfer patterns found",
                        "Potential backdoor identified",
                        "Unverified contract source"
                    ],
                });
            } else {
                setResult({
                    type: "safe",
                    confidence: 96,
                    transactions: 1847,
                    totalVolume: "234.56 ETH",
                    riskScore: 12,
                    lastActivity: "2 Hours Ago",
                    securityChecks: [
                        "No malicious functions detected",
                        "Contract source verified",
                        "No suspicious patterns found",
                        "Follows security best practices"
                    ],
                });
            }
        }, 3000);
    };

    return (
        <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
            {/* Main Card Container */}
            <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden">

                {/* Pattern background - pattern-topside.png */}
                <img
                    src="/assets/images/pattern-topside.png"
                    alt="Pattern"
                    className="absolute top-0 right-0 w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top"
                />

                {mode === "input" && (
                    <>
                        {/* Icon Container */}
                        <div className="flex justify-center mb-2 relative z-10">
                            <img
                                src="/assets/images/analyse-contract.png"
                                alt="Analyze Smart Contract"
                                className="w-48 h-48"
                            />
                        </div>

                        {/* Title */}
                        <h1 className="text-white text-xl font-semibold mb-1 text-center relative z-10">
                            Analyze Smart Contract
                        </h1>

                        {/* Description */}
                        <p className="text-gray-400 max-w-sm text-sm font-normal text-center mb-6 mx-auto relative z-10">
                            Scan a smart contract to detect common security vulnerabilities and potential backdoors.
                        </p>

                        {/* Code Input Container */}
                        <div className="w-full bg-[#0F1219] border border-[#2A2D35] rounded-sm p-6 mb-6 relative z-10">
                            <textarea
                                className="w-full h-40 bg-transparent text-gray-400 text-base resize-none outline-none placeholder-gray-500"
                                placeholder="Input code here..."
                            />
                        </div>

                        {/* Analyze Button - Full Width */}
                        <div className="w-full relative z-10">
                            <CustomButton
                                icon="/assets/icons/analyze-contract-light.svg"
                                className="w-full"
                                onClick={() => handleAnalyze(Math.random() > 0.5)}
                            >
                                Analyse Smart Contract
                            </CustomButton>
                        </div>
                    </>
                )}

                {mode === "result" && result?.type === "danger" && (
                    <div className="w-full flex flex-col gap-6 relative z-10">
                        {/* Status Danger */}
                        <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Smart Contract</span>
                        <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                            {/* Bagian atas dengan gradient */}
                            <div className="relative w-full">
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#FF6B6B]/15 via-[#FF6B6B]/15 via-[#FF6B6B]/15 to-transparent z-0" />
                                <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                                    <img src="/assets/icons/danger.png" alt="Danger" className="w-12 h-12 object-contain" />
                                    <div>
                                        <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">SMART CONTRACT IS NOT SAFE</div>
                                        <div className="text-[#B0B6BE] text-xs">Confidence: {result.confidence}%</div>
                                    </div>
                                </div>
                            </div>
                            {/* Bagian bawah deskripsi */}
                            <div className="px-6 pb-4">
                                <div className="text-[#B0B6BE] text-sm font-normal">This smart contract appears to be flagged with suspicious activity detected in our comprehensive database</div>
                            </div>
                        </div>

                        {/* Contract Details */}
                        <p className="text-[#FFFFFF] font-semibold text-lg">Contract Details</p>
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
                        <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Smart Contract</span>
                        <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
                            {/* Bagian atas dengan gradient */}
                            <div className="relative w-full">
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#22C55E]/15 via-[#22C55E]/15 via-[#22C55E]/15 to-transparent z-0" />
                                <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                                    <img src="/assets/icons/safe.png" alt="Safe" className="w-12 h-12 object-contain" />
                                    <div>
                                        <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">SMART CONTRACT IS SAFE</div>
                                        <div className="text-[#B0B6BE] text-xs">Confidence: {result.confidence}%</div>
                                    </div>
                                </div>
                            </div>
                            {/* Bagian bawah deskripsi */}
                            <div className="px-6 pb-4">
                                <div className="text-[#B0B6BE] text-sm font-normal">This smart contract appears to be clean with no suspicious activity detected in our comprehensive database</div>
                            </div>
                        </div>

                        {/* Contract Details */}
                        <p className="text-[#FFFFFF] font-semibold text-lg">Contract Details</p>
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
                                setResult(null);
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
                        <span className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">
                            Paste a smart contract address or source code. You can usually find contract addresses on blockchain explorers like Etherscan or BscScan.
                        </span>
                    </div>
                </div>
            )}

            {/* Analysis Progress Modal */}
            <AnalysisProgressModal open={isAnalyzing} onClose={() => setIsAnalyzing(false)} />
        </div>
    );
} 