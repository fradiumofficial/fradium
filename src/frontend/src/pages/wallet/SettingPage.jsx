import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../core/providers/AuthProvider";
import { useWallet } from "../../core/providers/WalletProvider";
import ManageNetworksModal from "../../core/components/modals/ManageNetworksModal";
import { NETWORK_CONFIG } from "@/core/config/tokenConfig.js";
// toast removed for copy feedback

export default function SettingPage() {
  const { identity } = useAuth();
  const { networkFilters, updateNetworkFilters, network, setNetwork } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = useState(false);
  const [localActiveNetworks, setLocalActiveNetworks] = useState({
    bitcoin: true,
    ethereum: true,
    solana: true,
    icp: true,
  });
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  // Use NETWORK_CONFIG from tokenUtils for consistency
  const NETWORKS = NETWORK_CONFIG;

  // Load active networks on component mount
  React.useEffect(() => {
    if (identity?.getPrincipal()) {
      // Convert networkFilters to localActiveNetworks format for display
      const convertedNetworks = {
        bitcoin: networkFilters.Bitcoin || false,
        ethereum: networkFilters.Ethereum || false,
        solana: networkFilters.Solana || false,
        icp: networkFilters["Internet Computer"] || false,
      };
      setLocalActiveNetworks(convertedNetworks);
    }
  }, [identity?.getPrincipal()?.toString(), networkFilters]);

  const handleOpenModal = () => {
    setShowManageNetworks(true);
  };

  const copyPrincipalToClipboard = async () => {
    const principalId = identity?.getPrincipal()?.toString();
    if (principalId) {
      try {
        await navigator.clipboard.writeText(principalId);
        setCopiedPrincipal(true);
        setTimeout(() => setCopiedPrincipal(false), 1500);
      } catch (error) {
        console.error("Failed to copy Principal ID:", error);
      }
    }
  };

  const formatPrincipalId = (principalId) => {
    if (!principalId) return "Not logged in";
    if (principalId.length <= 20) return principalId;
    return `${principalId.slice(0, 10)}...${principalId.slice(-6)}`;
  };

  const getActiveNetworkIcons = () => {
    return NETWORKS.filter((network) => localActiveNetworks[network.id]);
  };
  return (
    <>
      {/* Modal Manage Networks */}
      <ManageNetworksModal isOpen={showManageNetworks} onClose={() => setShowManageNetworks(false)} networkFilters={networkFilters} updateNetworkFilters={updateNetworkFilters} currentNetwork={network} setNetwork={setNetwork} />

      <motion.div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4 pb-24 md:pb-0 overflow-x-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        {/* Header */}
        <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
          <h1 className="text-white text-2xl font-semibold">Settings</h1>
          <p className="text-white/60 text-sm">Adjust wallet, security, and extension preferences</p>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* General Section */}
          <motion.div className="bg-[#1F2028] border border-[#2A2D35] rounded-xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
            <h2 className="text-white text-base font-semibold mb-6">General</h2>
            {/* Your Principal */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white text-base font-normal">Your Principal</span>
                <div className="relative group">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E] cursor-help" title="Your unique Internet Computer Principal ID">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {/* Custom Tooltip - Hidden on mobile */}
                  <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F2028] text-white text-xs rounded-lg shadow-lg border border-[#2A2D35] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Your unique Internet Computer Principal ID
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2028]"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white text-sm sm:text-base font-normal font-mono truncate">{formatPrincipalId(identity?.getPrincipal()?.toString())}</span>
                <button className="p-1 hover:bg-[#23272F] rounded transition-colors flex-shrink-0" onClick={copyPrincipalToClipboard} aria-label={copiedPrincipal ? "Copied" : "Copy Principal ID"}>
                  {copiedPrincipal ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#99E39E]">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Active Networks Section */}
          <motion.div className="bg-[#1F2028] border border-[#2A2D35] rounded-xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}>
            <h2 className="text-white text-base font-semibold mb-6">Active Networks</h2>
            {/* Network Management */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white text-base font-normal">Enabled Networks</span>
                <div className="relative group">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E] cursor-help" title="Networks that are currently enabled">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {/* Custom Tooltip - Hidden on mobile */}
                  <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F2028] text-white text-xs rounded-lg shadow-lg border border-[#2A2D35] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 text-center whitespace-normal">
                    Networks that are currently enabled for scanning
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2028]"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 min-w-0">
                {/* Network Icons - Dynamic based on active networks */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
                  {getActiveNetworkIcons().map((network) => (
                    <img
                      key={network.id}
                      src={network.icon}
                      alt={network.name}
                      className="w-6 h-6 flex-shrink-0 cursor-pointer"
                      title={network.name}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                        transition: "transform 0.2s ease-in-out",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    />
                  ))}
                  {getActiveNetworkIcons().length === 0 && <span className="text-[#9CA3AF] text-sm">None</span>}
                </div>
                {/* Edit Button */}
                <button className="flex items-center gap-1 sm:gap-2 text-[#9BE4A0] text-sm font-medium hover:text-white transition-colors flex-shrink-0" onClick={handleOpenModal}>
                  <span className="hidden sm:inline">Edit</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
