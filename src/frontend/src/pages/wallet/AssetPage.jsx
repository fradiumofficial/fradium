// React
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import SendTokenModal from "@/core/components/modals/SendTokenModal";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Token Configuration
import { TOKENS_CONFIG, NETWORK_CONFIG } from "@/core/lib/tokenUtils";

// Wallet Provider
import { useWallet } from "@/core/providers/WalletProvider";

// Modal Components
import ReceiveAddressModal from "@/core/components/modals/ReceiveAddressModal";

// Token Item Card Component
import TokenItemCard from "@/core/components/cards/TokenItemCard";

export default function AssetsPage() {
  // Wallet Provider - Get balance state and functions
  const { balances, balanceLoading, balanceErrors, isRefreshingBalances, refreshAllBalances, network, networkFilters, usdPrices, usdPriceLoading, usdPriceErrors, isRefreshingPrices, refreshAllUSDPrices, hideBalance } = useWallet();

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
  const [hoverSearch, setHoverSearch] = useState(false);
  const [hoverFilter, setHoverFilter] = useState(false);

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

  // Calculate total portfolio value
  const { totalPortfolioValue, isPortfolioLoading } = useMemo(() => {
    let total = 0;
    let hasAnyLoading = false;
    let hasAnyError = false;

    TOKENS_CONFIG.forEach((token) => {
      const balance = balances[token.id];
      const usdPrice = usdPrices[token.id];
      const isBalanceLoading = balanceLoading[token.id];
      const hasBalanceError = balanceErrors[token.id];
      const isUsdPriceLoading = usdPriceLoading[token.id];
      const hasUsdPriceError = usdPriceErrors[token.id];

      // Check if any token is still loading or has error
      if (isBalanceLoading || isUsdPriceLoading) {
        hasAnyLoading = true;
      }
      if (hasBalanceError || hasUsdPriceError) {
        hasAnyError = true;
      }

      // Calculate value if we have both balance and price
      if (balance && usdPrice && !isBalanceLoading && !isUsdPriceLoading && !hasBalanceError && !hasUsdPriceError) {
        const numericBalance = parseFloat(balance);
        if (!isNaN(numericBalance) && numericBalance > 0) {
          total += numericBalance * usdPrice;
        }
      }
    });

    return {
      totalPortfolioValue: total,
      isPortfolioLoading: hasAnyLoading,
      hasPortfolioError: hasAnyError,
    };
  }, [balances, usdPrices, balanceLoading, usdPriceLoading, balanceErrors, usdPriceErrors]);

  // Format portfolio value for display
  const formattedPortfolioValue = useMemo(() => {
    if (isPortfolioLoading) {
      return <span className="inline-block w-24 h-8 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></span>;
    }

    // Hide balance if enabled
    if (hideBalance) {
      return "••••";
    }

    if (totalPortfolioValue === 0) {
      return "$0.00";
    }

    // Format with appropriate decimal places
    if (totalPortfolioValue < 0.01) {
      return "$0.0000";
    } else if (totalPortfolioValue < 1) {
      return `$${totalPortfolioValue.toFixed(4)}`;
    } else if (totalPortfolioValue < 1000) {
      return `$${totalPortfolioValue.toFixed(2)}`;
    } else {
      return `$${totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, [totalPortfolioValue, isPortfolioLoading, hideBalance]);

  return (
    <div className="relative flex flex-col max-w-[33rem] gap-8 mx-auto w-full bg-transparent px-4">
      <div className="relative z-10">
        {/* Card Wallet - Redesigned to match mockup with interaction */}
        <motion.div
          className="group relative w-full overflow-hidden rounded-[28px] p-6 bg-gradient-to-b from-[#7C72FE] via-[#5A52C6] to-[#433BA6] ring-1 ring-white/15"
          style={{ boxShadow: "0 5px 18px -4px rgba(74,66,170,0.6), 0 0 0 1px #7C77C4" }}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ boxShadow: "0 12px 28px -6px rgba(74,66,170,0.15), 0 0 0 1px #7C77C4" }}
          transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.6 }}
          onMouseEnter={() => setIsCardHover(true)}
          onMouseLeave={() => setIsCardHover(false)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCardMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}>
          {/* Inner soft highlight */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(255,255,255,0.24),transparent_60%)]" />
          {/* Cursor-follow gradient */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: isCardHover ? 1 : 0,
              background: `radial-gradient(240px 240px at ${cardMouse.x}px ${cardMouse.y}px, rgba(255,255,255,0.05), rgba(255,255,255,0) 90%)`,
            }}
          />

          {/* Header */}
          <div className="relative z-10 text-center">
            <div className="text-white text-[2.5rem] font-semibold my-2">{formattedPortfolioValue}</div>
            <div className="text-white/95 text-base font-medium">Total Portfolio Value</div>
          </div>

          {/* Actions */}
          <div className="relative z-10 mt-6 md:mt-7 flex items-center justify-center gap-3 md:gap-4">
            {/* Receive */}
            <div
              onClick={handleReceiveClick}
              className="group relative flex-1 flex items-center justify-center gap-3 md:gap-3.5 py-5 rounded-full cursor-pointer bg-[linear-gradient(105.56deg,rgba(255,255,255,0.003)-4.91%,rgba(255,255,255,0.111951)53.67%,rgba(255,255,255,0.15)95.27%)] hover:bg-white/15 transition-colors"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(20px)",
                transition: "all 200ms ease-in-out",
              }}>
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/qr-icon.svg" alt="Receive" className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-white text-sm font-medium">Receive</span>
              <svg className="ml-1.5 w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Send */}
            <div
              onClick={handleSendClick}
              className="group relative flex-1 flex items-center justify-center gap-3 md:gap-3.5 py-5 rounded-full cursor-pointer bg-[linear-gradient(105.56deg,rgba(255,255,255,0.003)-4.91%,rgba(255,255,255,0.111951)53.67%,rgba(255,255,255,0.15)95.27%)] hover:bg-white/15 transition-colors"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(20px)",
                transition: "all 200ms ease-in-out",
              }}>
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/send-icon.svg" alt="Send" className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-white text-sm font-medium">Send</span>
              <svg className="ml-1.5 w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Token List - Static */}
      <div>
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="md:text-base text-sm font-semibold text-white">Tokens</h2>
            <div className="flex md:gap-4 gap-2 ml-auto">
              <motion.img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4 cursor-pointer" onMouseEnter={() => setHoverSearch(true)} onMouseLeave={() => setHoverSearch(false)} onClick={handleSearchToggle} animate={hoverSearch ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 20 }} />
              <motion.img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4 cursor-pointer" onMouseEnter={() => setHoverFilter(true)} onMouseLeave={() => setHoverFilter(false)} animate={hoverFilter ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 20 }} />
            </div>
          </div>

          {/* Search Input with Animation */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                <div className="relative">
                  <input type="text" placeholder="Search tokens..." value={searchQuery} onChange={handleSearchChange} className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors" autoFocus />
                  {searchQuery && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B0B6BE] hover:text-white transition-colors" onClick={() => setSearchQuery("")}>
                      ×
                    </motion.button>
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
                    <motion.div
                      key={token.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}>
                      <TokenItemCard token={token} onClick={handleTokenClick} balance={balances[token.id] || "0.000000"} isLoading={balanceLoading[token.id]} hasError={balanceErrors[token.id]} usdPrice={usdPrices[token.id]} usdPriceLoading={usdPriceLoading[token.id]} usdPriceError={usdPriceErrors[token.id]} hideBalance={hideBalance} />
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
      <SendTokenModal isOpen={showSendModal} onClose={handleCloseSendModal} />

      {/* Modal Receive Address */}
      <ReceiveAddressModal isOpen={showReceive} onClose={handleCloseReceive} />
    </div>
  );
}
