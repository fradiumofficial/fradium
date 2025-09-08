// React
import React from "react";
import { createPortal } from "react-dom";

// Token Configuration
import { TOKENS_CONFIG } from "@/core/lib/coinUtils";

const SendTokenModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
        <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="text-white text-xl font-semibold mb-2">Send Token</div>
        <div className="flex flex-col items-center gap-2">
          <img src="/assets/images/image-send-coin.png" alt="Send Coin" className="w-32 h-32 object-contain" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[#B0B6BE] text-sm mb-1">Select Token</div>
            <select className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none">
              <option value="">Select a token</option>
              {TOKENS_CONFIG.map((token) => (
                <option key={token.id} value={token.symbol}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="text-[#B0B6BE] text-sm">Amount</div>
              <div className="text-[#B0B6BE] text-xs">Balance: 0.00 BTC</div>
            </div>
            <div className="relative">
              <input type="number" className="w-full bg-[#23272F] border rounded px-3 py-2 pr-16 text-[#B0B6BE] text-sm outline-none border-[#393E4B]" placeholder="0.00" />
              <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-[#9BEB83] hover:text-white">
                MAX
              </button>
            </div>
          </div>
        </div>
        <button className="mt-2 w-full justify-center bg-[#9BE4A0] text-black font-semibold py-3 rounded-lg hover:bg-[#8FD391] transition-colors">Send Token</button>
      </div>
    </div>,
    document.body
  );
};

export default SendTokenModal;
