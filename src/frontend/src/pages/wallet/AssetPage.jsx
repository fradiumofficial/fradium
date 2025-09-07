// React
import React, { useState, useEffect } from "react";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Token Configuration
import { TOKENS_CONFIG, NETWORK_CONFIG } from "@/core/lib/coinUtils";

// Wallet Provider
import { useWallet } from "@/core/providers/WalletProvider";

// Modal Components
import ReceiveAddressModal from "@/core/components/modals/ReceiveAddressModal";

// Token Item Card Component
import TokenItemCard from "@/core/components/cards/TokenItemCard";

export default function AssetsPage() {
  // Wallet Provider - Get balance state and functions
  const { balances, balanceLoading, balanceErrors, isRefreshingBalances, refreshAllBalances, network, networkFilters } = useWallet();

  // Modal States
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // Search States
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hover/interaction states
  const [isCardHover, setIsCardHover] = useState(false);
  const [cardMouse, setCardMouse] = useState({ x: 0, y: 0 });
  const [hoverReceive, setHoverReceive] = useState(false);
  const [hoverSend, setHoverSend] = useState(false);

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

  const handleTokenClick = (token) => {
    setSelectedToken(token);
    // For now, just log the selected token
    console.log("Selected token:", token);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery("");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter tokens based on network selection and search query
  const filteredTokens = TOKENS_CONFIG.filter((token) => {
    // First, filter by network selection
    let networkMatch = true;
    if (network !== "All Networks") {
      // Find the network in NETWORK_CONFIG to get the correct name
      const selectedNetwork = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === network.toLowerCase());
      if (selectedNetwork) {
        networkMatch = token.chain.toLowerCase() === selectedNetwork.name.toLowerCase();
      }
    }

    // Then, filter by search query if provided
    let searchMatch = true;
    if (searchQuery.trim()) {
      searchMatch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) || token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || token.chain.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return networkMatch && searchMatch;
  });

  return (
    <div className="relative flex flex-col max-w-xl gap-8 mx-auto w-full bg-transparent">
      <div className="relative z-10">
        {/* Card Wallet - Redesigned to match mockup with interaction */}
        <motion.div
          className="group relative w-full overflow-hidden rounded-[28px] p-6 md:p-8 bg-gradient-to-b from-[#7C72FE] via-[#5A52C6] to-[#433BA6] ring-1 ring-white/15"
          style={{ boxShadow: "0 5px 18px -4px rgba(74,66,170,0.6), 0 0 0 1px #7C77C4" }}
          initial={{ y: 0, scale: 1 }}
          whileHover={{ y: -2, scale: 1.005, boxShadow: "0 12px 28px -6px rgba(74,66,170,0.7), 0 0 0 1px #7C77C4" }}
          transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.6 }}
          onMouseEnter={() => setIsCardHover(true)}
          onMouseLeave={() => setIsCardHover(false)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCardMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          {/* Inner soft highlight */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(255,255,255,0.24),transparent_60%)]" />
          {/* Cursor-follow gradient */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: isCardHover ? 1 : 0,
              background: `radial-gradient(240px 240px at ${cardMouse.x}px ${cardMouse.y}px, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)`,
            }}
          />

          {/* Header */}
          <div className="relative z-10 text-center">
            <div className="text-white/95 text-base font-medium">Total Portofolio Value</div>
            <div className="text-white text-xl md:text-3xl font-semibold mt-2">$0.00</div>
            <div className="text-white/95 text-base font-medium mt-2">Top up your wallet to start using it!</div>
          </div>

          {/* Actions */}
          <div className="relative z-10 mt-6 md:mt-7 flex items-center justify-center gap-3 md:gap-4">
            {/* Receive */}
            <motion.button
              onHoverStart={() => setHoverReceive(true)}
              onHoverEnd={() => setHoverReceive(false)}
              animate={hoverReceive ? { scale: 1.04, y: [0, -1, 0, 1, 0] } : { scale: 1, y: 0 }}
              transition={hoverReceive ? { duration: 1.4, repeat: Infinity, repeatType: "loop", ease: "easeInOut" } : { duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReceiveClick}
              className="group relative flex items-center gap-3 md:gap-3.5 px-5 md:px-6 h-11 md:h-12 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
              style={{
                border: "1.5px solid transparent",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08)), linear-gradient(90deg, rgba(255,255,255,0.15), rgba(92,85,170,0.5))",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                boxShadow: "0 0 0 1px rgba(124,119,196,0.35) inset",
              }}
            >
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/qr-icon.svg" alt="Receive" className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-white text-sm font-medium">Receive</span>
              <svg className="ml-1.5 w-5 h-5 text-white/90 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.button>
            {/* Send */}
            <motion.button
              onHoverStart={() => setHoverSend(true)}
              onHoverEnd={() => setHoverSend(false)}
              animate={hoverSend ? { scale: 1.04, y: [0, -1, 0, 1, 0] } : { scale: 1, y: 0 }}
              transition={hoverSend ? { duration: 1.4, repeat: Infinity, repeatType: "loop", ease: "easeInOut" } : { duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendClick}
              className="group relative flex items-center gap-3 md:gap-3.5 px-5 md:px-6 h-11 md:h-12 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
              style={{
                border: "1.5px solid transparent",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08)), linear-gradient(90deg, rgba(255,255,255,0.15), rgba(92,85,170,0.5))",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                boxShadow: "0 0 0 1px rgba(124,119,196,0.35) inset",
              }}
            >
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/send-icon.svg" alt="Send" className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-white text-sm font-medium">Send</span>
              <svg className="ml-1.5 w-5 h-5 text-white/90 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Token List - Static */}
      <div>
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="md:text-lg text-base font-semibold text-white">Tokens (All Networks)</h2>
            <div className="flex md:gap-4 gap-2">
              <motion.img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4 cursor-pointer" onClick={handleSearchToggle} animate={{ rotate: showSearch ? 45 : 0 }} transition={{ duration: 0.2 }} />
              <motion.img src="/assets/icons/refresh.svg" alt="Refresh" className={`md:w-5 md:h-5 w-4 h-4 ${isRefreshingBalances ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} onClick={refreshAllBalances} animate={isRefreshingBalances ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: isRefreshingBalances ? Infinity : 0, ease: "linear" }} />
              <img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4" />
            </div>
          </div>

          {/* Search Input with Animation */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                <div className="relative">
                  <input type="text" placeholder="Search tokens..." value={searchQuery} onChange={handleSearchChange} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
                  {searchQuery && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B0B6BE] hover:text-white transition-colors" onClick={() => setSearchQuery("")}>×</motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col divide-y divide-[#23272F]">
          <AnimatePresence mode="wait">
            {filteredTokens.length > 0 ? (
              <motion.div key="token-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <AnimatePresence>
                  {filteredTokens.map((token, index) => (
                    <motion.div key={token.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>
                      <TokenItemCard token={token} onClick={handleTokenClick} balance={balances[token.id] || "0.000000"} isLoading={balanceLoading[token.id]} hasError={balanceErrors[token.id]} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="no-results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-[#B0B6BE] text-sm mb-2">{searchQuery ? `No tokens found for "${searchQuery}"${network !== "All Networks" ? ` in ${network}` : ""}` : network !== "All Networks" ? `No tokens available in ${network}` : "No tokens found"}</div>
                  <div className="text-[#9BEB83] text-xs">{searchQuery ? "Try a different search term" : network !== "All Networks" ? `Switch to "All Networks" to see all tokens` : "Add addresses to see your tokens here"}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Send Coin */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
            <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={handleCloseSendModal} aria-label="Close">×</button>
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
                  <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-[#9BEB83] hover:text-white">MAX</button>
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
