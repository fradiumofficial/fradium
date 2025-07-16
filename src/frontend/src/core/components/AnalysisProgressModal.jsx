import React, { useEffect } from "react";
import { motion } from "framer-motion";

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
      <div className="bg-[#23272F] px-4 py-12 w-full max-w-md flex flex-col items-center shadow-lg relative overflow-hidden">
        {/* Animated circles background - centered */}
        <div className="mb-8 flex items-center justify-center w-full h-48 z-10 mx-auto relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {/* Ripple circles - perfectly synchronized with background */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute border-2 border-[#99E39E]/50 rounded-full bg-[#99E39E]/10"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{
                  scale: [0.5, 1.3, 2],
                  opacity: [1, 0.6, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut",
                }}
                style={{
                  width: "180px",
                  height: "180px",
                  left: "-90px",
                  top: "-90px",
                }}
              />
            ))}

            {/* Middle steady circle with background */}
            <motion.div
              className="absolute border-2 border-[#99E39E]/70 rounded-full bg-[#99E39E]/15"
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "120px",
                height: "120px",
                left: "-60px",
                top: "-60px",
              }}
            />

            {/* Inner core circle - bigger with background */}
            <motion.div
              className="absolute border-2 border-[#99E39E]/90 rounded-full bg-[#99E39E]/25"
              animate={{
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "90px",
                height: "90px",
                left: "-45px",
                top: "-45px",
              }}
            />

            {/* Search icon - perfectly centered */}
            <motion.div
              className="absolute z-20 flex items-center justify-center"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "96px",
                height: "96px",
                left: "-48px",
                top: "-48px",
              }}>
              <img src="/assets/images/analisis-progres.png" alt="Analysis in Progress" className="w-24 h-24 object-contain" draggable="false" />
            </motion.div>
          </div>
        </div>

        <div className="text-[#B0B6BE] text-xs mb-2 text-center tracking-wide uppercase z-10">TYPICALLY TAKES 2 MINS, HANG ON</div>
        <div className="text-[#99E39E] text-lg font-bold mb-4 text-center z-10">ADDRESS ANALYSIS IS IN PROGRESS...</div>
        <div className="text-[#B0B6BE] text-sm text-center space-y-1 z-10">
          <div className="opacity-70">Check if this address Already Flagged...</div>
          <div className="opacity-60">Analyzing Address with AI...</div>
          <div className="opacity-50">Analyzing Transaction Patterns...</div>
          <div className="opacity-40">Checking Transaction History...</div>
          <div className="opacity-30">Cross-referencing with Known Threats</div>
        </div>
      </div>
    </div>
  );
}
