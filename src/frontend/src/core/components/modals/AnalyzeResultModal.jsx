import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Wallet, BarChart3, Gauge, Clock } from "lucide-react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

export default function AnalyzeResultModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 pl-4 pr-4 bg-black/50 backdrop-blur-md">
      <div className="w-full max-w-[500px] mx-auto">
        <div className="flex flex-col items-start p-3 gap-3 w-full h-auto min-h-[670px] bg-black rounded-3xl">
          {/* Content */}
          <div className="flex flex-col items-end p-0 gap-4 w-full h-auto min-h-[646px]">
            {/* Image Container */}
            <div className="w-full h-[150px] bg-white/[0.03] rounded-xl relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute w-[395.53px] h-[62.9px] left-[151.76px] top-[-55.06px] bg-[#99E39E]/60 blur-[81.5px] transform rotate-[2.2deg]"></div>
              <div className="absolute -left-[118px] -top-[91px] w-[209.78px] h-[299.68px] opacity-[0.03] transform rotate-[18.24deg]">
                <div className="w-full h-full bg-white"></div>
              </div>

              {/* Main Content */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[128px] flex items-center">
                {/* Icon */}
                <div className="w-32 h-32 flex-shrink-0">
                  <img src="/assets/images/analisis.png" alt="Analysis Result" className="w-32 h-32" />
                </div>

                {/* Title Section */}
                <div className="flex flex-col items-start p-0 gap-3 w-[316px] h-[88px] ml-4">
                  <div className="flex flex-col items-start p-0 gap-1 w-[316px] h-[44px]">
                    <h2 className="text-white text-xl font-semibold leading-[120%]">Address is SAFE</h2>
                    <p className="text-[#9BE4A0] text-xs font-medium leading-[130%]">Confidence: 96%</p>
                  </div>
                  <p className="text-white/80 text-xs leading-[130%] tracking-[-0.01em] w-[316px]">This bitcoin address appears to be clean with no suspicious activity detected in our comprehensive database</p>
                </div>
              </div>
            </div>

            {/* Address Details Section */}
            <div className="flex flex-col items-start p-2 px-6 pb-6 gap-5 w-full h-auto min-h-[220px]">
              <h3 className="text-white text-xl font-semibold leading-[120%]">Address Details</h3>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {/* Transactions */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">296</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Wallet className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Transactions</span>
                  </div>
                </div>

                {/* Total Volume */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">89.98 BTC</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <BarChart3 className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Total Volume</span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-[#9BE4A0] text-base font-medium leading-[120%] tracking-[-0.02em]">17/100</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Gauge className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Risk Score</span>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex flex-col justify-center items-start p-3 px-4 gap-1.5 bg-white/[0.05] rounded-xl">
                  <span className="text-white text-base font-medium leading-[120%] tracking-[-0.02em]">17 Days Ago</span>
                  <div className="flex flex-row items-center p-0 gap-1.5">
                    <Clock className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <span className="text-white/60 text-sm leading-[130%] whitespace-nowrap">Last Activity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Checks Section */}
            <div className="flex flex-col items-start p-2 px-6 pb-6 gap-5 w-full h-auto min-h-[244px]">
              <h3 className="text-white text-xl font-semibold leading-[120%]">Security Checks Passed</h3>

              {/* Security Field */}
              <div
                className="flex flex-col items-start p-4 gap-4 w-full h-auto min-h-[108px] rounded-xl"
                style={{
                  background: "radial-gradient(69.63% 230.37% at -11.33% 50%, #1A4A1B 0%, rgba(153, 227, 158, 0.21) 30.29%, rgba(255, 255, 255, 0.03) 100%)",
                  borderLeft: "1px solid #9BE4A0",
                }}>
                <div className="flex flex-col items-start p-0 gap-2 w-full h-auto min-h-[76px]">
                  {/* Check 1 */}
                  <div className="flex flex-row items-center p-0 gap-2 w-full h-5">
                    <CheckCircle className="w-5 h-5 text-[#9BE4A0]" />
                    <span className="text-white/60 text-sm leading-[130%]">No links to known scam addressed</span>
                  </div>

                  {/* Check 2 */}
                  <div className="flex flex-row items-center p-0 gap-2 w-full h-5">
                    <CheckCircle className="w-5 h-5 text-[#9BE4A0]" />
                    <span className="text-white/60 text-sm leading-[130%]">No links to known scam addressed</span>
                  </div>

                  {/* Check 3 */}
                  <div className="flex flex-row items-center p-0 gap-2 w-full h-5">
                    <CheckCircle className="w-5 h-5 text-[#9BE4A0]" />
                    <span className="text-white/60 text-sm leading-[130%]">No links to known scam addressed</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <ButtonGreen size="md" icon="/assets/icons/analyze-address-dark.svg" iconSize="w-5 h-5" className="w-full h-10" textSize="text-sm" fontWeight="medium" onClick={onClose}>
                Go Analyze Other
              </ButtonGreen>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
