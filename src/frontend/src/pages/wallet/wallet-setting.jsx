import React, { useState } from "react";

export default function WalletSettingPage() {
    const [sessionDuration, setSessionDuration] = useState(54);

    return (
        <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-white text-xl font-semibold mb-2">Setting</h1>
                <p className="text-[#9CA3AF] text-sm font-normal">Adjust wallet, security, and extension preferences</p>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6">
                {/* General Section */}
                <div className="bg-[#1F2028] border border-[#2A2D35] rounded-xs p-6">
                    <h2 className="text-white text-base font-semibold mb-6">General</h2>
                    {/* Your Principal */}
                    <div className="mb-6 flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-white text-base font-normal">Your Principal</span>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-base font-normal font-mono">wrfnv0wsn3...sf....qwe</span>
                            <button className="p-1 hover:bg-[#23272F] rounded transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {/* Session Duration */}
                    <div>
                        <h3 className="text-white text-base font-normal mb-1">Session Duration</h3>
                        <p className="text-[#9CA3AF] text-base font-normal">Expires in {sessionDuration} minutes</p>
                    </div>
                </div>

                {/* List of scan activity Section */}
                <div className="bg-[#1F2028] border border-[#2A2D35] rounded-xs p-6">
                    <h2 className="text-white text-xl font-semibold mb-6">List of scan activity</h2>
                    {/* Active Networks */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-white text-base font-medium">Active Networks</span>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Network Icons */}
                            <div className="flex items-center gap-3">
                                <img src="/assets/icons/bitcoin-grey.svg" alt="Bitcoin" className="w-6 h-6" />
                                <img src="/assets/icons/eth-grey.svg" alt="Ethereum" className="w-6 h-6" />
                                <img src="/assets/icons/fum-grey.svg" alt="Fradium" className="w-6 h-6" />
                            </div>
                            {/* Edit Button */}
                            <button className="flex items-center gap-2 text-[#9BE4A0] text-sm font-medium hover:text-white transition-colors">
                                <span>Edit</span>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
