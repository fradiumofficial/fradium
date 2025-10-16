// React
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Token Configuration
import { TOKENS_CONFIG, NETWORK_CONFIG } from "@/core/config/tokenConfig.js";

// Providers
import { useAuth } from "@/core/providers/AuthProvider";

// Components
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";
import { ChevronDown } from "lucide-react";

// Utils
import { getTokenVisibility, setTokenVisibility, getAllTokenVisibility } from "@/core/lib/tokenUtils.js";

const ManageTokensModal = ({ isOpen, onClose }) => {
  // Auth Provider
  const { identity } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("All Networks");
  const [tokenStates, setTokenStates] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get principal for localStorage key
  const principal = identity?.getPrincipal?.();

  // Load token states from localStorage on mount
  useEffect(() => {
    if (isOpen && principal) {
      const savedStates = getAllTokenVisibility(principal);
      setTokenStates(savedStates);
      setHasChanges(false);
    }
  }, [isOpen, principal]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedNetwork("All Networks");
      setTokenStates({});
      setHasChanges(false);
    }
  }, [isOpen]);

  // Disable page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  // Filter tokens based on search and network
  const filteredTokens = useMemo(() => {
    return TOKENS_CONFIG.filter((token) => {
      // Filter by network
      let networkMatch = true;
      if (selectedNetwork !== "All Networks") {
        const selectedNetworkConfig = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === selectedNetwork.toLowerCase());
        if (selectedNetworkConfig) {
          networkMatch = token.chain.toLowerCase() === selectedNetworkConfig.name.toLowerCase();
        }
      }

      // Filter by search query
      let searchMatch = true;
      if (searchQuery.trim()) {
        searchMatch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) || token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || token.chain.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return networkMatch && searchMatch;
    });
  }, [searchQuery, selectedNetwork]);

  // Handle token toggle
  const handleTokenToggle = (tokenId) => {
    if (!principal) return;

    const newState = !tokenStates[tokenId];
    setTokenStates((prev) => ({
      ...prev,
      [tokenId]: newState,
    }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!principal) return;

    setIsSaving(true);
    try {
      // Save all token states to localStorage
      Object.entries(tokenStates).forEach(([tokenId, isVisible]) => {
        setTokenVisibility(principal, parseInt(tokenId), isVisible);
      });

      // Notify app that token visibility has changed
      try {
        window.dispatchEvent(new CustomEvent("tokenVisibilityUpdated", { detail: { principal: principal?.toString?.() } }));
      } catch (_e) {}

      setHasChanges(false);
      // Close modal after successful save
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error("Error saving token states:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <motion.div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#0A0D14] rounded-2xl border border-white/10 shadow-2xl" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
          {/* Close Button */}
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex flex-col h-[80vh]">
            {/* Fixed Header */}
            <div className="p-6 pb-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Manage Tokens</h2>
                <p className="text-white/60 text-sm mt-1">Customize which tokens are visible in your wallet</p>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <motion.div variants={itemVariants}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tokens..." className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/20 transition-all text-sm" />
                </motion.div>

                {/* Network Filter Dropdown */}
                <motion.div variants={itemVariants}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full px-4 py-2 bg-transparent border border-white/10 rounded-xl text-white text-left focus:outline-none focus:border-white/20 transition-all flex items-center justify-between hover:border-white/20 text-sm">
                        <span className="text-white/70">{selectedNetwork}</span>
                        <ChevronDown className="w-4 h-4 text-white/50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]" align="start">
                      <DropdownMenuItem onClick={() => setSelectedNetwork("All Networks")} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                        All Networks
                      </DropdownMenuItem>
                      {NETWORK_CONFIG.map((network) => (
                        <DropdownMenuItem key={network.name} onClick={() => setSelectedNetwork(network.name)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                          {network.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Token List */}
                <motion.div variants={itemVariants}>
                  <div className="bg-[#0A0D14] rounded-2xl p-4">
                    <div className="space-y-2">
                      {filteredTokens.length === 0 ? (
                        <div className="text-center py-8 text-[#B0B6BE] text-sm">No tokens found matching your criteria</div>
                      ) : (
                        filteredTokens.map((token) => {
                          const isVisible = tokenStates[token.id] !== undefined ? tokenStates[token.id] : true;

                          return (
                            <motion.div key={token.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 p-4 rounded-xl bg-[#161B22] border border-white/5 hover:border-white/30 transition-colors">
                              {/* Token Icon */}
                              <img src={`/${token.imageUrl}`} alt={token.name} className="w-10 h-10 rounded-full" />

                              {/* Token Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-base truncate">{token.name}</div>
                                <div className="text-white/50 text-sm">
                                  {token.symbol} • {token.chain}
                                </div>
                              </div>

                              {/* Toggle Switch */}
                              <button onClick={() => handleTokenToggle(token.id)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0A0D14] ${isVisible ? "bg-[#7C72FE]" : "bg-[#393E4B]"}`}>
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isVisible ? "translate-x-6" : "translate-x-1"}`} />
                              </button>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="p-6 pt-4 border-t border-white/10">
              <motion.div variants={itemVariants} className="flex gap-3">
                <button className="flex-1 py-3 px-6 bg-transparent border border-white/10 text-white/90 font-medium rounded-2xl hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={isSaving}>
                  Cancel
                </button>
                <ButtonGreen fullWidth className="flex-1" onClick={handleSave} disabled={!hasChanges || isSaving} size="md" textSize="text-base" fontWeight="medium">
                  {isSaving ? "Saving..." : "Save Changes"}
                </ButtonGreen>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
};

export default ManageTokensModal;
