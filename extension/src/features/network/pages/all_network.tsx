import { Check } from "lucide-react";
import { useNetwork } from "~features/network/context/networkContext";
import { useState } from "react";
import ManageNetwork from "./manage_network";
import { useWallet } from "~lib/context/walletContext";
import { CDN } from "~lib/constant/cdn";

const BASE_NETWORKS = [
  {
    key: "all" as const,
    name: "All Networks",
    icon: CDN.icons.construction,
  },
  {
    key: "btc" as const,
    name: "Bitcoin",
    icon: CDN.tokens.bitcoinDark,
  },
  {
    key: "eth" as const,
    name: "Ethereum",
    icon: CDN.tokens.ethereumDark,
  },
  {
    key: "sol" as const,
    name: "Solana",
    icon: CDN.tokens.solanaDark,
  },
  {
    key: "fra" as const,
    name: "Fradium",
    icon: CDN.tokens.fradiumDark,
  },
] as const;

type AllNetworkProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function AllNetwork({
  isOpen = true,
  onClose = () => {},
}: AllNetworkProps) {
  const { selectedNetwork, setSelectedNetwork, getNetworkDisplayName } = useNetwork();
  const { getNetworkValue, networkFilters } = useWallet();
  const [manageOpen, setManageOpen] = useState(false);

  // Generate networks with actual values from wallet, filtered by enabled networks
  const networks = BASE_NETWORKS.filter(network => {
    if (network.key === "all") return true; // Always show "All Networks"
    
    // Filter based on network filters
    switch (network.key) {
      case "btc": return networkFilters?.Bitcoin ?? true;
      case "eth": return networkFilters?.Ethereum ?? true;
      case "sol": return networkFilters?.Solana ?? true;
      case "fra": return networkFilters?.Fradium ?? true;
      default: return true;
    }
  }).map(network => ({
    ...network,
    amount: network.key === "all" 
      ? getNetworkValue("All Networks")
      : getNetworkValue(getNetworkDisplayName(network.key))
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* backdrop area to close when clicking outside */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!manageOpen) onClose();
        }}
      />

      {/* Glassmorphism dropdown translated from provided CSS */}
      <div className="absolute left-[96px] top-[60px] w-[260px] h-[256px]">
        <div className="flex flex-col items-start p-3 gap-2 w-full h-full bg-black/50 border border-white/15 backdrop-blur-[13.5px] rounded-[20px] shadow-xl">
          {/* Title: Choose Network */}
          <div className="flex items-center px-2 py-1">
            <h2 className="text-white text-[12px] leading-[120%] font-normal">Choose Network</h2>
          </div>

          {/* List */}
          <div className="flex flex-col items-start w-[236px] flex-1 overflow-auto gap-2">
            {networks.map((n) => {
              const isActive = n.key === selectedNetwork;
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    setSelectedNetwork(n.key);
                    onClose();
                  }}
                  className={`flex w-[236px] h-[45px] items-center justify-between rounded-[18px] ${
                    isActive ? "bg-white/10" : "bg-white/5"
                  } backdrop-blur-[10px] px-[14px] py-3 text-left`}
                >
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <Check className="w-5 h-5 text-[#9BE4A0]" />
                    ) : (
                      <img src={n.icon} alt="icon" className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-white text-[14px] leading-[130%] font-normal">{n.name}</span>
                  </div>
                  <span className="text-white/50 text-[14px] leading-[150%] font-medium">{n.amount}</span>
                </button>
              );
            })}
          </div>

          {/* Manage Networks */}
          <button
            onClick={() => setManageOpen(true)}
            className="flex w-[236px] h-[44px] items-center justify-between rounded-[18px] bg-white/5 backdrop-blur-[10px] px-2 py-3 text-left"
          >
            <div className="flex items-center gap-2 w-full">
              <img src={CDN.icons.construction} className="w-5 h-5" alt="manage" />
              <span className="text-[#99E39E] text-[14px] leading-[130%] font-medium">Manage Networks</span>
            </div>
          </button>
        </div>
      </div>

      {/* Manage modal overlay (centered panel, clicks inside do not close) */}
      {manageOpen && (
        <div className="absolute inset-0 z-[70] flex items-start justify-center pt-20">
          <div className="absolute inset-0" onClick={() => setManageOpen(false)} />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <ManageNetwork onClose={() => setManageOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
