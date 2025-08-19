import React from 'react';

interface SendProgressModalProps {
  isOpen: boolean;
  message?: string;
}

const SendProgressModal: React.FC<SendProgressModalProps> = ({ 
  isOpen, 
  message = "Processing transaction..." 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#25262B] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6 border border-white/10">
        <div className="text-white text-xl font-semibold text-center">Sending Transaction</div>
        
        <div className="flex flex-col items-center gap-4">
          {/* Loading Animation */}
          <div className="relative w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#99E39E]"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
          </div>
          
          {/* Progress Message */}
          <div className="text-center">
            <div className="text-white text-base font-medium mb-2">{message}</div>
            <div className="text-white/60 text-sm">
              Please wait while we process your transaction...
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#99E39E]"></div>
            <span className="text-white/80 text-sm">Validating transaction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#99E39E] animate-pulse"></div>
            <span className="text-white/80 text-sm">Broadcasting to network</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <span className="text-white/40 text-sm">Waiting for confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendProgressModal;
