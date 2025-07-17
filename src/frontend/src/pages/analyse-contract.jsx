import React from "react";
import CustomButton from "../core/components/custom-button-a";

export default function AnalyseContractPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {/* Main Card Container */}
            <div className="w-full max-w-xl bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden">
                {/* Pattern Background */}
                <img
                    src="/assets/images/pattern-topside.png"
                    alt="Pattern"
                    className="absolute top-0 right-0 w-80 h-auto opacity-80 z-0 pointer-events-none select-none"
                    onError={(e) => {
                        e.target.src = "/assets/pattern-sidebar.svg";
                    }}
                />

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
                    >
                        Analyse Smart Contract
                    </CustomButton>
                </div>
            </div>

            {/* Info Box - Outside Card */}
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
        </div>
    );
} 