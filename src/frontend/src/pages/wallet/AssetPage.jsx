// React
import React, { useState } from "react";

// Modal Components
import ReceiveAddressModal from "@/core/components/modals/ReceiveAddressModal";

export default function AssetsPage() {
  // Modal States
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  // Event Handlers
  const handleSendClick = () => {
    setShowSendModal(true);
  };

  const handleReceiveClick = () => {
    setShowReceive(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
  };

  const handleCloseReceive = () => {
    setShowReceive(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219] md:p-0 p-2">
      {/* Card Wallet - Static */}
      <div className="relative w-full bg-white bg-opacity-5 pb-4 overflow-hidden border border-[#393E4B] md:p-0 p-2">
        {/* Pattern Background */}
        <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 md:w-80 md:h-80 w-40 h-40 z-0 pointer-events-none select-none object-cover object-right-top" />

        {/* Character Illustration - Positioned at top center */}
        <div className="relative z-10 flex justify-center mb-2">
          <img src="/assets/images/illus-wallet.png" alt="Wallet Character" className="w-full object-contain object-center" />
        </div>

        {/* Content */}
        <div className="relative z-20 text-center">
          <div className="text-white text-sm font-normal mb-1">Total Portfolio Value</div>
          <div className="text-white md:text-3xl text-2xl font-semibold mb-1">$0.00</div>
          <div className="text-[#9BE4A0] md:text-base text-sm font-medium md:mb-6 mb-3">Top up your wallet to start using it!</div>

          {/* Action Buttons */}
          <div className="flex md:gap-4 gap-2 w-full max-w-lg mx-auto">
            {/* Receive Button */}
            <div className="flex-1">
              <div className="relative bg-white bg-opacity-10 md:h-32 h-20 w-full md:p-4 p-2 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={handleReceiveClick}>
                <div className="absolute md:top-4 top-2 md:right-4 right-2">
                  <img src="/assets/icons/received.svg" alt="Receive" className="md:w-6 md:h-6 w-5 h-5" />
                </div>
                <div className="absolute md:bottom-4 bottom-2 md:left-4 left-2">
                  <div className="text-white md:text-xl text-base font-semibold">Receive</div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex-1">
              <div className="relative bg-white bg-opacity-10 md:h-32 h-20 w-full md:p-4 p-2 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={handleSendClick}>
                <div className="absolute md:top-4 top-2 md:right-4 right-2">
                  <img src="/assets/icons/send.svg" alt="Send" className="md:w-6 md:h-6 w-5 h-5" />
                </div>
                <div className="absolute md:bottom-4 bottom-2 md:left-4 left-2">
                  <div className="text-white md:text-xl text-base font-semibold">Send</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token List - Static */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="md:text-lg text-base font-semibold text-white">Tokens (All Networks)</h2>
          <div className="flex md:gap-4 gap-2">
            <img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4" />
            <img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-[#23272F]">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-[#B0B6BE] text-sm mb-2">No tokens found</div>
              <div className="text-[#9BEB83] text-xs">Add addresses to see your tokens here</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Send Coin */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
            <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={handleCloseSendModal} aria-label="Close">
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
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="solana">Solana (SOL)</option>
                </select>
              </div>
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">Recipient Address</div>
                <input type="text" className="w-full bg-[#23272F] border rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none border-[#393E4B]" placeholder="Input your address" />
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
        </div>
      )}

      {/* Modal Receive Address */}
      <ReceiveAddressModal isOpen={showReceive} onClose={handleCloseReceive} />
    </div>
  );
}
