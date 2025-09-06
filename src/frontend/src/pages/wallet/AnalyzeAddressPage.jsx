import React from "react";

export default function AnalyseAddressPage() {
  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card utama - styling sesuai analyse-address.jsx */}
        <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md md:p-8 p-4 relative overflow-hidden">
          {/* Pattern background - pattern-topside.png */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 md:w-80 md:h-80 w-40 h-40 z-0 pointer-events-none select-none object-cover object-right-top" />

          {/* Konten utama - Static Input Mode */}
          <>
            {/* Icon Container */}
            <div className="flex justify-center mb-2 relative z-10">
              <img src="/assets/images/analisis.png" alt="Analyze Address" className="md:w-48 md:h-48 w-24 h-24" />
            </div>

            {/* Title */}
            <h1 className="text-white text-xl font-semibold mb-1 text-center relative z-10">Analyze Address</h1>

            {/* Description */}
            <p className="text-gray-400 max-w-sm text-sm font-normal text-center md:mb-6 mb-3 mx-auto relative z-10">Scan a bitcoin address to detect suspicious activity and potential scams.</p>

            {/* Input Container */}
            <div className="w-full bg-[#0F1219] border border-[#2A2D35] rounded-sm md:p-4 p-2 md:mb-6 mb-3 relative z-10">
              <input type="text" placeholder="Input address here..." className="w-full bg-transparent text-gray-400 text-base outline-none placeholder-gray-500" />
            </div>

            {/* Analyze Button - Full Width */}
            <div className="w-full relative z-10">
              <button className="w-full py-3 rounded-lg bg-[#9BEB83] text-[#23272F] font-semibold flex items-center justify-center gap-2">
                <img src="/assets/icons/analyze-address-light.svg" alt="Analyze" className="w-5 h-5" />
                Analyse Address
              </button>
            </div>
          </>
        </div>

        {/* Info box - sesuai analyse-address.jsx */}
        <div className="w-full">
          <div className="flex items-start gap-3 bg-[#FFFFFF] bg-opacity-5 relative md:px-4 px-2 md:py-3 py-2 border-l-2 border-[#9BEB83] overflow-hidden">
            {/* Gradient kiri */}
            <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#9BEB83]/30 to-transparent pointer-events-none" />
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mt-0.5 relative z-10">
              <circle cx="10" cy="10" r="10" fill="#9BEB83" />
              <text x="10" y="15" textAnchor="middle" fontSize="14" fill="#23272F" fontFamily="Arial, sans-serif">
                i
              </text>
            </svg>
            <span className="text-[#FFFFFF] text-sm leading-relaxed relative z-10">Enter a Bitcoin, Ethereum or other cryptocurrency address. You can find wallet addresses in your crypto exchange or wallet app.</span>
          </div>
        </div>
      </div>
    </>
  );
}
