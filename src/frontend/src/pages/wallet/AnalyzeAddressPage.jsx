import React, { useState, useEffect } from "react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import AnalyzeResultModal from "@/core/components/modals/AnalyzeResultModal.jsx";
import AnalyzeLoadingModal from "@/core/components/modals/AnalyzeLoadingModal.jsx";

export default function AnalyseAddressPage() {
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [address, setAddress] = useState("");

  const handleAnalyze = () => {
    if (address.trim()) {
      setShowLoadingModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
  };

  const handleCancelAnalysis = () => {
    setShowLoadingModal(false);
  };

  // Handle loading to result modal transition
  useEffect(() => {
    if (showLoadingModal) {
      const timer = setTimeout(() => {
        setShowLoadingModal(false);
        setShowResultModal(true);
      }, 10000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [showLoadingModal]);

  return (
    <motion.div className="flex flex-col items-start p-0 gap-5 m-auto w-full max-w-[500px] min-h-[442px] px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* Analysis Card */}
      <div className="flex flex-col items-start p-3 gap-3 w-full h-auto min-h-[354px] bg-white/[0.02] backdrop-blur-[14.5px] rounded-3xl">
        {/* Content */}
        <motion.div className="flex flex-col items-start p-0 gap-4 w-full h-auto min-h-[330px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          {/* Image Container */}
          <motion.div className="w-full h-[150px] bg-white/[0.03] rounded-xl relative overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            {/* Decorative F Pattern */}
            <div className="absolute -left-[118px] -top-[91px] w-[209.78px] h-[299.68px] opacity-[0.03] transform rotate-[18.24deg]">
              <div className="w-full h-full bg-white"></div>
            </div>

            {/* Main Analysis Icons */}
            <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.5, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-32 h-32" />
            </motion.div>
          </motion.div>

          {/* Title Section */}
          <motion.div className="flex flex-col justify-end items-start p-3 gap-7 w-full h-auto min-h-[164px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            {/* Title */}
            <motion.div className="flex flex-col items-center p-0 gap-2 w-full h-auto min-h-[68px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <h2 className="text-white text-xl font-semibold leading-[120%]">Analyze Address</h2>
              <p className="text-white/80 text-sm leading-[130%] text-center tracking-[-0.01em] w-full">Check the risk level of a wallet address based on its transaction history and known fraud reports</p>
            </motion.div>

            {/* Input Section */}
            <motion.div className="flex flex-col sm:flex-row items-center p-0 gap-2 w-full h-auto" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              {/* Input Field */}
              <motion.div className="flex flex-col items-start p-3 px-5 gap-4 w-full sm:w-[327px] h-11 bg-white/[0.05] border border-white/10 rounded-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <input type="text" placeholder="Input address here..." value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-5 text-white/60 text-sm leading-[140%] bg-transparent outline-none placeholder-white/60" />
              </motion.div>

              {/* Analyze Button */}
              <motion.div className="w-full sm:w-auto" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <ButtonGreen size="sm" icon="/assets/icons/analyze-address-dark.svg" iconSize="w-5 h-5" className="w-full h-10" textSize="text-sm" fontWeight="medium" onClick={handleAnalyze}>
                  Analyze
                </ButtonGreen>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div
        className="flex flex-col items-start p-4 gap-3 w-full h-auto min-h-[68px] border-l border-[#99E39E] backdrop-blur-[14.5px] rounded-2xl"
        style={{
          background: "radial-gradient(107.65% 196.43% at -22.63% 50%, #4A834C 0%, #080E17 51.21%, #080E17 100%)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>
        {/* Text */}
        <div className="flex flex-col items-start p-0 gap-1.5 w-full h-auto min-h-9">
          <div className="flex flex-row items-start p-0 gap-2 w-full h-auto">
            {/* Info Icon */}
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <Info className="w-5 h-5 text-white flex-shrink-0" />
            </motion.div>
            <motion.p className="text-white/70 text-sm leading-[130%] w-full" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              Please enter a valid blockchain wallet address and make sure you input the correct format to receive an accurate analysis.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Loading Modal */}
      <AnalyzeLoadingModal isOpen={showLoadingModal} onCancel={handleCancelAnalysis} />

      {/* Result Modal */}
      <AnalyzeResultModal isOpen={showResultModal} onClose={handleCloseModal} />
    </motion.div>
  );
}
