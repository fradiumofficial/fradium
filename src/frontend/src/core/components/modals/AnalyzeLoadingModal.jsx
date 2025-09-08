import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

export default function AnalyzeLoadingModal({ isOpen, onCancel }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="w-[375px] h-[495px] bg-[rgba(23,26,28,0.8)] backdrop-blur-[18px] rounded-3xl flex flex-col items-center p-9 gap-8">
        {/* Animated Icon Container */}
        <div className="relative w-[212px] h-[212px] flex items-center justify-center">
          {/* Ellipse 40 - Outer Ring */}
          <motion.div
            className="absolute w-[212px] h-[212px] left-0.5 top-0.5 bg-gradient-to-b from-[rgba(153,227,158,0.15)] to-[rgba(153,227,158,0.08)] rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Ellipse 39 - Middle Ring */}
          <motion.div
            className="absolute w-[172px] h-[172px] left-[20.5px] top-[20.5px] bg-gradient-to-b from-[rgba(153,227,158,0.2)] to-[rgba(153,227,158,0.1)] rounded-full"
            style={{ transform: "rotate(-90deg)" }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />

          {/* Ellipse 38 - Inner Ring */}
          <motion.div
            className="absolute w-[134px] h-[134px] left-[39.5px] top-[39.5px] bg-gradient-to-b from-[rgba(153,227,158,0.25)] to-[rgba(153,227,158,0.15)] rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.25, 0.35, 0.25],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
          />

          {/* Magnifying Glass Icon */}
          <motion.div
            className="absolute w-[100px] h-[100px] left-[56.5px] top-[56px]"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}>
            <img src="/assets/images/analisis.png" alt="Analyzing" className="w-[100px] h-[100px] drop-shadow-[-5px_5px_20px_rgba(0,0,0,0.25)]" />
          </motion.div>
        </div>

        {/* Text Section */}
        <div className="flex flex-col items-center gap-3 w-[327px] h-auto">
          {/* Subtitle */}
          <p className="w-[327px] h-[17px] text-white/60 text-xs font-normal leading-[140%] text-center tracking-[0.08em]">TYPICALLY TAKES 30-120 SECS, HANG ON</p>

          {/* Main Title */}
          <h2 className="w-[327px] h-[22px] text-[#99E39E] text-base font-semibold leading-[140%] text-center uppercase" style={{ textShadow: "0px 8px 20px rgba(0, 0, 0, 0.8)" }}>
            ADDRESS ANALYSIS IS IN PROGRESS...
          </h2>

          {/* Progress Steps */}
          <div className="flex flex-col items-start gap-1 w-[327px] h-[116px]">
            {/* Step 1 */}
            <motion.p className="w-[327px] h-5 text-white/60 text-sm font-normal leading-[140%] text-center opacity-80" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>
              Check if this address Already Flagged...
            </motion.p>

            {/* Step 2 */}
            <motion.p className="w-[327px] h-5 text-white/60 text-sm font-normal leading-[140%] text-center opacity-60" animate={{ opacity: [0.6, 0.8, 0.6] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>
              Analyzing Address with AI...
            </motion.p>

            {/* Step 3 */}
            <motion.p className="w-[327px] h-5 text-white/60 text-sm font-normal leading-[140%] text-center opacity-40" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>
              Analyzing Transaction Patterns...
            </motion.p>

            {/* Step 4 */}
            <motion.p className="w-[327px] h-5 text-white/60 text-sm font-normal leading-[140%] text-center opacity-20" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}>
              Checking Transaction History...
            </motion.p>

            {/* Step 5 */}
            <motion.p className="w-[327px] h-5 text-white/60 text-sm font-normal leading-[140%] text-center opacity-10" animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.8 }}>
              Cross-referencing with Known Threats
            </motion.p>
          </div>

          {/* Cancel Button */}
          <ButtonGreen size="sm" className="w-full h-10 !bg-red-600 hover:!bg-red-700 active:!bg-red-800 !border-red-600 hover:!border-red-700 active:!border-red-800 !from-red-600 !to-red-700 hover:!from-red-700 hover:!to-red-800 active:!from-red-800 active:!to-red-900 !transition-all !duration-200 !ease-out" textSize="text-sm" fontWeight="medium" textClassName="!text-white hover:!text-red-50" onClick={onCancel}>
            Cancel Analysis
          </ButtonGreen>
        </div>
      </div>
    </div>,
    document.body
  );
}
