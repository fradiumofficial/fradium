import React, { useState } from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";
import CustomButton from "../core/components/custom-button-a";
import AnalysisProgressModal from "../core/components/AnalysisProgressModal";

export default function AnalyseAddressPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    return (
        <WalletLayout>
            <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
                {/* Card utama */}
                <div className="bg-[#181C22] rounded-2xl shadow-lg px-8 py-8 w-full max-w-md flex flex-col items-center relative overflow-hidden">
                    {/* Pattern background */}
                    <img src="/assets/pattern-sidebar.svg" alt="Pattern" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none" draggable="false" />
                    {/* Konten utama */}
                    <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-32 h-32 object-contain mb-4 select-none pointer-events-none relative z-10" draggable="false" />
                    <div className="text-white text-2xl font-bold mb-1 text-center relative z-10">Analyze Address</div>
                    <div className="text-[#B0B6BE] text-base mb-6 text-center relative z-10">Analyze address itu apa sih</div>
                    <input
                        type="text"
                        placeholder="Input address here..."
                        className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#823EFD] mb-4 relative z-10"
                    />
                    <div className="w-full relative z-10 mb-2">
                        <CustomButton
                            icon={<img src="/assets/icons/analyze-address-light.svg" alt="Analyze" className="w-5 h-5" />}
                            className="w-full"
                            onClick={() => setIsAnalyzing(true)}
                        >
                            Analyse Address
                        </CustomButton>
                    </div>
                </div>
                {/* Info box */}
                <div className="w-full max-w-md mt-6">
                    <div className="flex items-start gap-3 bg-[#181C22] relative rounded-lg px-4 py-3 border-l-2 border-[#9BEB83] overflow-hidden">
                        {/* Gradient kiri */}
                        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#9BEB83]/40 to-transparent pointer-events-none rounded-l-lg" />
                        <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mt-0.5 relative z-10"><circle cx="10" cy="10" r="10" fill="#9BEB83" /><text x="10" y="15" textAnchor="middle" fontSize="14" fill="#23272F" fontFamily="Arial, sans-serif">i</text></svg>
                        <span className="text-white text-sm leading-relaxed relative z-10">Sebuah informasi atau himbauan kepada user untuk memasukkan address sesuai dengan bla bla</span>
                    </div>
                </div>
            </div>
            <AnalysisProgressModal open={isAnalyzing} onClose={() => setIsAnalyzing(false)} />
        </WalletLayout>
    );
} 