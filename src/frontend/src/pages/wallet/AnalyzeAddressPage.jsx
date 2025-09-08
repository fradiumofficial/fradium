import React, { useState } from "react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { Info } from "lucide-react";
import ScanningModal from "@/components/ScanningModal.jsx";

export default function AnalyseAddressPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnalyse = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-start p-0 gap-5 m-auto w-full max-w-[500px] min-h-[442px] px-4">
      {/* Analysis Card */}
      <div className="flex flex-col items-start p-3 gap-3 w-full h-auto min-h-[354px] bg-white/[0.02] backdrop-blur-[14.5px] rounded-3xl">
        {/* Content */}
        <div className="flex flex-col items-start p-0 gap-4 w-full h-auto min-h-[330px]">
          {/* Image Container */}
          <div className="w-full h-[150px] bg-white/[0.03] rounded-xl relative overflow-hidden">
            {/* Decorative F Pattern */}
            <div className="absolute -left-[118px] -top-[91px] w-[209.78px] h-[299.68px] opacity-[0.03] transform rotate-[18.24deg]">
              <div className="w-full h-full bg-white"></div>
            </div>

            {/* Main Analysis Icons */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
              <img src="/assets/images/analisis.png" alt="Analyze Address" className="w-32 h-32" />
            </div>
          </div>

          {/* Title Section */}
          <div className="flex flex-col justify-end items-start p-3 gap-7 w-full h-auto min-h-[164px]">
            {/* Title */}
            <div className="flex flex-col items-center p-0 gap-2 w-full h-auto min-h-[68px]">
              <h2 className="text-white text-xl font-semibold leading-[120%]">Analyze Address</h2>
              <p className="text-white/80 text-sm leading-[130%] text-center tracking-[-0.01em] w-full">Check the risk level of a wallet address based on its transaction history and known fraud reports</p>
            </div>

            {/* Input Section */}
            <div className="flex flex-col sm:flex-row items-center p-0 gap-2 w-full h-auto">
              {/* Input Field */}
              <div className="flex flex-col items-start p-3 px-5 gap-4 w-full sm:w-[327px] h-11 bg-white/[0.05] border border-white/10 rounded-full">
                <input type="text" placeholder="Input address here..." className="w-full h-5 text-white/60 text-sm leading-[140%] bg-transparent outline-none placeholder-white/60" />
              </div>

              {/* Analyze Button */}
              <ButtonGreen
                size="sm"
                icon="/assets/icons/analyze-address-dark.svg"
                iconSize="w-5 h-5"
                className="w-full sm:w-[117px] h-10"
                textSize="text-sm"
                fontWeight="medium"
                onClick={handleAnalyse}
              >
                Analyse
              </ButtonGreen>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div
        className="flex flex-col items-start p-4 gap-3 w-full h-auto min-h-[68px] border-l border-[#99E39E] backdrop-blur-[14.5px] rounded-2xl"
        style={{
          background: "radial-gradient(107.65% 196.43% at -22.63% 50%, #4A834C 0%, #080E17 51.21%, #080E17 100%)",
        }}>
        {/* Text */}
        <div className="flex flex-col items-start p-0 gap-1.5 w-full h-auto min-h-9">
          <div className="flex flex-row items-start p-0 gap-2 w-full h-auto">
            {/* Info Icon */}
            <Info className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white/70 text-sm leading-[130%] w-full">Please enter a valid blockchain wallet address and make sure you input the correct format to receive an accurate analysis.</p>
          </div>
        </div>
      </div>

      {/* Scanning Modal */}
      <ScanningModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
