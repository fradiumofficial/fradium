import React, { useState } from "react";
import { useAuth } from "../../core/providers/AuthProvider";
import { useWallet } from "../../core/providers/WalletProvider";
import ManageNetworksModal from "../../core/components/modals/ManageNetworksModal";
import { NETWORK_CONFIG } from "../../core/lib/tokenUtils";
import toast from "react-hot-toast";

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
        toast.success("Principal ID copied to clipboard!", {
          position: "bottom-center",
          duration: 2000,
          style: {
            background: "#23272F",
            color: "#9BE4A0",
            border: "1px solid #393E4B",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
          },
          icon: "📋",
        });
      } catch (error) {
        console.error("Failed to copy Principal ID:", error);
        toast.error("Failed to copy Principal ID", {
          position: "bottom-center",
          duration: 2000,
          style: {
            background: "#23272F",
            color: "#FF6B6B",
            border: "1px solid #393E4B",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
          },
          icon: "❌",
        });
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

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-xl font-semibold mb-2">Setting</h1>
          <p className="text-[#9CA3AF] text-sm font-normal">Adjust wallet, security, and extension preferences</p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* General Section */}
          <div className="bg-[#1F2028] border border-[#2A2D35] rounded-xs p-6">
            <h2 className="text-white text-base font-semibold mb-6">General</h2>
            {/* Your Principal */}
            <div className="mb-6 flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-white text-base font-normal">Your Principal</span>
                <div className="relative group">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E] cursor-help" title="Your unique Internet Computer Principal ID used for authentication and wallet identification">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {/* Custom Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F2028] text-white text-xs rounded-lg shadow-lg border border-[#2A2D35] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Your unique Internet Computer Principal ID used for authentication and wallet identification
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2028]"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-base font-normal font-mono">{formatPrincipalId(identity?.getPrincipal()?.toString())}</span>
                <button className="p-1 hover:bg-[#23272F] rounded transition-colors" onClick={copyPrincipalToClipboard}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* List of scan activity Section */}
          <div className="bg-[#1F2028] border border-[#2A2D35] rounded-xs p-6">
            <h2 className="text-white text-xl font-semibold mb-6">List of scan activity</h2>
            {/* Active Networks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-base font-medium">Active Networks</span>
                <div className="relative group">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E] cursor-help" title="Networks that are currently enabled for scanning and analysis. You can manage which networks to include in your wallet.">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {/* Custom Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F2028] text-white text-xs rounded-lg shadow-lg border border-[#2A2D35] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                    Networks that are currently enabled for scanning and analysis. You can manage which networks to include in your wallet.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2028]"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Network Icons - Dynamic based on active networks */}
                <div className="flex items-center gap-3">
                  {getActiveNetworkIcons().map((network) => (
                    <img
                      key={network.id}
                      src={network.icon}
                      alt={network.name}
                      className="w-6 h-6 cursor-pointer"
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
                  {getActiveNetworkIcons().length === 0 && <span className="text-[#9CA3AF] text-sm">No active networks</span>}
                </div>
                {/* Edit Button */}
                <button className="flex items-center gap-2 text-[#9BE4A0] text-sm font-medium hover:text-white transition-colors" onClick={handleOpenModal}>
                  <span>Edit</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
