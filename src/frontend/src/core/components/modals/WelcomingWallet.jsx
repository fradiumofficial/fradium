import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WelcomingWalletModal({ isOpen }) {
  const [currentStep, setCurrentStep] = useState(0);

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

  // Effect untuk animasi step
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // Ganti step setiap 2 detik

    return () => clearInterval(stepInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#23272F] shadow-lg w-full max-w-lg mx-auto overflow-hidden">
        {/* Illustration */}
        <div className="w-full h-56 bg-[#181C22] flex items-center justify-center">
          <img src="/assets/welcoming-wallet-card.png" alt="Welcome Illustration" className="object-cover w-full h-full" style={{ objectPosition: "center" }} />
        </div>
        {/* Content */}
        <div className="p-8">
          <h2 className="text-white text-2xl font-semibold mb-6">Preparing your wallet...</h2>
          <div className="flex flex-col gap-6">
            {steps.map((item, idx) => (
              <motion.div key={idx} className="flex items-start gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.2 }}>
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {idx <= currentStep ? (
                      <motion.span key="active" className="w-6 h-6 rounded-full bg-[#99E39E] flex items-center justify-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="#99E39E" />
                          <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.span>
                    ) : (
                      <motion.span key="inactive" className="w-6 h-6 rounded-full border-2 border-[#444] flex items-center justify-center text-[#888]" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                        <span className="font-semibold text-sm">{String(idx + 1).padStart(2, "0")}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Vertical line except last */}
                  {idx < steps.length - 1 && <motion.span className="w-px flex-1 bg-[#444] mx-auto" style={{ minHeight: 24 }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: idx * 0.2 }} />}
                </div>
                {/* Step content */}
                <div className="flex-1">
                  <motion.div className={`text-base ${idx <= currentStep ? "text-[#99E39E]" : "text-[#888]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: idx * 0.2 }}>
                    {item.label}
                  </motion.div>
                  {item.desc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.2 + 0.3 }} className={`mt-2 inline-block px-3 py-1 rounded text-xs font-medium ${idx <= currentStep ? "text-[#99E39E] bg-[#23272F] border border-[#99E39E]" : "text-white border border-[#444]"}`}>
                      {item.desc}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
