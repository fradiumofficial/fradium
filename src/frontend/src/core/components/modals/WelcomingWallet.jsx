import React from "react";

export default function WelcomingWallet({ open, onClose, step = 1 }) {
    if (!open) return null;

    // Stepper data
    const steps = [
        {
            label: "Securing session with Internet Identity",
            status: "completed",
            desc: "Completed",
        },
        {
            label: "Retrieving your public keys for Bitcoin, Ethereum, and Fradium",
            status: "progress",
            desc: "In Progress",
        },
        {
            label: "Enjoy Fradium Wallet",
            status: "pending",
            desc: null,
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#23272F] shadow-lg w-full max-w-lg mx-auto overflow-hidden">
                {/* Illustration */}
                <div className="w-full h-56 bg-[#181C22] flex items-center justify-center">
                    <img
                        src="/assets/welcoming-wallet-card.png"
                        alt="Welcome Illustration"
                        className="object-cover w-full h-full"
                        style={{ objectPosition: "center" }}
                    />
                </div>
                {/* Content */}
                <div className="p-8">
                    <h2 className="text-white text-2xl font-semibold mb-6">Preparing your wallet...</h2>
                    <div className="flex flex-col gap-6">
                        {steps.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                {/* Step indicator */}
                                <div className="flex flex-col items-center">
                                    {item.status === "completed" ? (
                                        <span className="w-6 h-6 rounded-full bg-[#99E39E] flex items-center justify-center">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" fill="#99E39E" />
                                                <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.status === "progress" ? "border-[#99E39E] text-[#99E39E]" : "border-[#444] text-[#888]"}`}>
                                            <span className="font-semibold text-sm">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                        </span>
                                    )}
                                    {/* Vertical line except last */}
                                    {idx < steps.length - 1 && (
                                        <span className="w-px flex-1 bg-[#444] mx-auto" style={{ minHeight: 24 }} />
                                    )}
                                </div>
                                {/* Step content */}
                                <div className="flex-1">
                                    <div className={`text-base ${item.status === "completed" ? "text-[#99E39E]" : item.status === "progress" ? "text-white" : "text-[#888]"}`}>{item.label}</div>
                                    {item.desc && (
                                        <div className={`mt-2 inline-block px-3 py-1 rounded bg-[#23272F] text-xs font-medium ${item.status === "completed" ? "text-[#99E39E] bg-[#23272F] border border-[#99E39E]" : "text-white border border-[#444]"}`}>
                                            {item.desc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
