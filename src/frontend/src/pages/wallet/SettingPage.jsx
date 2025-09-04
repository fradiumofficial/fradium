import React, { useState } from "react";
import { useAuth } from "../../core/providers/AuthProvider";
import { useWallet } from "../../core/providers/WalletProvider";
import { Dialog, DialogContent } from "../../core/components/ui/Dialog";
import SidebarButton from "../../core/components/SidebarButton";
import { toast } from "react-toastify";

export default function SettingPage() {
  const { identity } = useAuth();
  const [showManageNetworks, setShowManageNetworks] = useState(false);
  const [localActiveNetworks, setLocalActiveNetworks] = useState({
    bitcoin: true,
    ethereum: true,
    fradium: true,
  });
  const [tempActiveNetworks, setTempActiveNetworks] = useState({
    bitcoin: true,
    ethereum: true,
    fradium: true,
  });

  const NETWORKS = [
    {
      key: "bitcoin",
      name: "Bitcoin",
      icon: "/assets/icons/bitcoin-grey.svg",
    },
    {
      key: "ethereum",
      name: "Ethereum",
      icon: "/assets/icons/eth-grey.svg",
    },
    {
      key: "fradium",
      name: "Fradium",
      icon: "/assets/icons/fum-grey.svg",
    },
  ];

  // Functions for localStorage (same as wallet-layout.jsx)
  const getActiveNetworksKey = () => {
    return identity?.getPrincipal()?.toString() ? `activeNetworks_${identity.getPrincipal().toString()}` : "activeNetworks_default";
  };

  const loadActiveNetworks = () => {
    const key = getActiveNetworksKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading/parsing saved active networks:", error);
    }
    return {
      bitcoin: true,
      ethereum: true,
      fradium: true,
    };
  };

  const saveActiveNetworks = (networks) => {
    const key = getActiveNetworksKey();
    try {
      localStorage.setItem(key, JSON.stringify(networks));

      // Trigger storage event for cross-component sync
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: key,
          newValue: JSON.stringify(networks),
          storageArea: localStorage,
        })
      );
    } catch (error) {
      console.error("Error saving active networks to localStorage:", error);
    }
  };

  // Load active networks on component mount
  React.useEffect(() => {
    if (identity?.getPrincipal()) {
      const savedNetworks = loadActiveNetworks();
      setLocalActiveNetworks(savedNetworks);
    }
  }, [identity?.getPrincipal()?.toString()]);

  // Listen for localStorage changes from other components
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("activeNetworks_") && e.newValue) {
        try {
          const newNetworks = JSON.parse(e.newValue);
          setLocalActiveNetworks(newNetworks);
          // Update temp state as well if modal is not open
          if (!showManageNetworks) {
            setTempActiveNetworks(newNetworks);
          }
        } catch (error) {
          console.error("Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [showManageNetworks]);

  const handleToggleNetwork = (key) => {
    setTempActiveNetworks((prev) => {
      const newNetworks = { ...prev, [key]: !prev[key] };
      return newNetworks;
    });
  };

  const handleSaveNetworks = () => {
    setLocalActiveNetworks(tempActiveNetworks);
    saveActiveNetworks(tempActiveNetworks);
    setShowManageNetworks(false);
    toast.success("Network settings saved successfully!");
  };

  const handleOpenModal = () => {
    // Copy current state to temp state when modal opens
    setTempActiveNetworks({ ...localActiveNetworks });
    setShowManageNetworks(true);
  };

  const copyPrincipalToClipboard = () => {
    const principalId = identity?.getPrincipal()?.toString();
    if (principalId) {
      navigator.clipboard.writeText(principalId);
      toast.success("Principal ID copied to clipboard!");
    }
  };

  const formatPrincipalId = (principalId) => {
    if (!principalId) return "Not logged in";
    if (principalId.length <= 20) return principalId;
    return `${principalId.slice(0, 10)}...${principalId.slice(-6)}`;
  };

  const getActiveNetworkIcons = () => {
    return NETWORKS.filter((network) => localActiveNetworks[network.key]);
  };
  return (
    <>
      {/* Modal Manage Networks */}
      <Dialog
        open={showManageNetworks}
        onOpenChange={(open) => {
          if (!open) {
            // Reset temp state if modal is closed without saving
            setTempActiveNetworks({ ...localActiveNetworks });
          }
          setShowManageNetworks(open);
        }}>
        <DialogContent className="bg-[#23242A] border-none max-w-xl p-0 rounded-xl">
          <div className="px-8 pt-8 pb-4">
            <div className="text-white text-2xl font-bold mb-8">Active networks</div>
            <div className="divide-y divide-white/10">
              {NETWORKS.map((net) => (
                <div key={net.key} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <img src={net.icon} alt={net.name} className="w-7 h-7" />
                    <span className="text-white text-lg font-medium">{net.name}</span>
                  </div>
                  {/* Custom Switch */}
                  <button className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 ${tempActiveNetworks[net.key] ? "bg-[#9BE4A0]" : "bg-[#23272F]"}`} onClick={() => handleToggleNetwork(net.key)}>
                    <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${tempActiveNetworks[net.key] ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="px-8 pb-8">
            <SidebarButton onClick={handleSaveNetworks} className="w-full" buttonClassName="justify-center">
              Save
            </SidebarButton>
          </div>
        </DialogContent>
      </Dialog>

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
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
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
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#99E39E]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex items-center gap-4">
                {/* Network Icons - Dynamic based on active networks */}
                <div className="flex items-center gap-3">
                  {getActiveNetworkIcons().map((network) => (
                    <img key={network.key} src={network.icon} alt={network.name} className="w-6 h-6" title={network.name} />
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
