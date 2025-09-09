import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ScanningModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const progressSteps = [
        "Check if this address Already Flagged...",
        "Analyzing Address with AI...",
        "Analyzing Transaction Patterns...",
        "Checking Transaction History...",
        "Cross-referencing with Known Threats"
    ];

    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < progressSteps.length - 1) {
                    return prev + 1;
                } else {
                    // All steps completed, navigate to scan history
                    setTimeout(() => {
                        navigate('/wallet/scan-history');
                        onClose();
                    }, 1000);
                    return prev;
                }
            });
        }, 2000); // 2 seconds per step

        return () => clearInterval(timer);
    }, [isOpen, navigate, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 backdrop-blur-md">
            <div className="relative w-[360px] sm:w-[420px] mx-4 rounded-[24px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]" style={{ background: "linear-gradient(180deg, rgba(9,14,20,0.98) 0%, rgba(10,14,23,0.98) 100%)" }}>
                {/* subtle inner glow top */}
                <div className="pointer-events-none absolute -inset-x-8 -top-8 h-20 bg-[#A6F3AE]/15 blur-3xl opacity-25 rounded-full" />
                <div className="p-8">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Main Content */}
                    <div className="flex flex-col items-center text-center space-y-8 fade-in-up">
                        {/* Icon + Rings */}
                        <div className="relative w-44 h-44">
                            {/* concentric rings */}
                            <div className="absolute inset-0 rounded-full border border-[#A6F3AE]/25" />
                            <div className="absolute inset-3 rounded-full border border-[#A6F3AE]/18" />
                            <div className="absolute inset-6 rounded-full border border-[#A6F3AE]/12" />

                            {/* horizontal soft glow */}
                            <div className="absolute inset-x-[-40px] top-1/2 -translate-y-1/2 h-12 bg-[#A6F3AE]/20 blur-2xl opacity-40 rounded-full" />

                            {/* center disc */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-b from-[#A6F3AE]/22 to-[#A6F3AE]/8 shadow-[inset_0_0_0_2px_rgba(166,243,174,0.15)]" />

                            {/* rotating sweep */}
                            <div className="absolute inset-4 rounded-full overflow-hidden">
                                <div className="absolute inset-0 rounded-full scan-sweep" />
                            </div>

                            {/* magnifying icon (animated) */}
                            <div className="relative z-10 flex items-center justify-center w-full h-full">
                                <img
                                    src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/analyze-address/motion-search.webp"
                                    alt="searching"
                                    className="w-20 h-20 object-contain drop-shadow-[0_6px_24px_rgba(166,243,174,0.35)]"
                                />
                            </div>
                        </div>

                        {/* Header Text */}
                        <div className="space-y-2">
                            <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em]">TYPICALLY TAKES 2 MINS, HANG ON</p>
                            <h2 className="text-[#A6F3AE] text-sm sm:text-base font-semibold uppercase tracking-wide">ADDRESS ANALYSIS IS IN PROGRESS...</h2>
                        </div>

                        {/* Progress Steps (text only) */}
                        <div className="w-full space-y-2.5">
                            {progressSteps.map((step, index) => {
                                const colorClass = index === currentStep
                                    ? 'text-[#A6F3AE]'
                                    : index < currentStep
                                        ? 'text-white/70'
                                        : 'text-white/40';
                                return (
                                    <p key={index} className={`text-[13px] ${colorClass}`}>{step}</p>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanningModal;
