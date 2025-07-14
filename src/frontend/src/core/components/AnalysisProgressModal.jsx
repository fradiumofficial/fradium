import React, { useEffect } from "react";
import Lottie from "lottie-react";
import searchingAnimation from "./Searching.json";

export default function AnalysisProgressModal({ open, onClose }) {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#23272F] px-4 py-10 w-full max-w-sm flex flex-col items-center shadow-lg relative overflow-hidden">
                {/* Lottie animasi searching */}
                <div className="mb-6 flex items-center justify-center w-32 h-32 z-10 mx-auto">
                    <Lottie animationData={searchingAnimation} loop autoplay style={{ width: 128, height: 128 }} />
                </div>
                <div className="text-[#B0B6BE] text-xs mb-2 text-center tracking-wide uppercase z-10">TYPICALLY TAKES 2 MINS, HANG ON</div>
                <div className="text-green-400 text-lg font-bold mb-4 text-center z-10">ADDRESS ANALYSIS IS IN PROGRESS...</div>
                <div className="text-[#B0B6BE] text-sm text-center space-y-1 z-10">
                    <div className="opacity-70">Check if this address Already Flagged...</div>
                    <div className="opacity-60">Analyzing Address with AI...</div>
                    <div className="opacity-50">Analyzing Transaction Patterns...</div>
                    <div className="opacity-40" >Checking Transaction History...</div>
                    <div className="opacity-30">Cross-referencing with Known Threats</div>
                </div>
            </div>
        </div>
    );
} 