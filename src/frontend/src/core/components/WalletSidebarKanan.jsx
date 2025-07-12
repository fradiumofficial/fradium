import React from "react";

export default function WalletSidebarKanan() {
    return (
        <aside className="relative w-300 min-h-screen bg-[#0F1219] flex flex-col items-end pt-8 pr-6 pb-4 pl-2 overflow-hidden">
            {/* Pattern background */}
            <img src="/assets/pattern-sidebar.svg" alt="Pattern" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[320px] h-auto opacity-30 z-0 pointer-events-none select-none" />
            {/* Top action buttons */}
            <div className="flex flex-col items-end gap-4 w-full z-10">
                <div className="flex gap-3 w-full justify-end">
                    <button className="flex items-center gap-2 bg-[#23272F] px-5 py-2 rounded-md text-white font-light text-base min-w-[140px] shadow hover:bg-[#23282f] transition">
                        <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
                        <span className="text-white">All Networks</span>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-2">
                            <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className="flex items-center justify-center bg-[#23272F] w-12 h-12 rounded-md hover:bg-[#23282f] transition">
                        <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </aside>
    );
} 