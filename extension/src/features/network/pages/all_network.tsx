import { Check } from "lucide-react";
import { useNetwork } from "~features/network/context/networkContext";
import { useState } from "react";
import ManageNetwork from "./manage_network";
import { useWallet } from "~features/wallet/context/walletContext";
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
      {/* backdrop (transparent per reference, but clickable) */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!manageOpen) onClose();
        }}
      />

      {/* Centered dropdown panel below header */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[88px] w-[320px]">
        <div className=" border border-white/10 bg-[#2A2D31] shadow-xl overflow-hidden">
          {/* Title */}
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-white text-[20px] font-semibold">
              Choose Network
            </h2>
          </div>

          {/* List */}
          <div className="divide-y divide-white/5">
            {networks.map((n) => {
              const isActive = n.key === selectedNetwork;
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    setSelectedNetwork(n.key);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 text-left ${
                    isActive ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Active check or spacer */}
                    {isActive ? (
                      <Check className="w-5 h-5 text-[#9BE4A0]" />
                    ) : (
                      <img
                        src={n.icon}
                        alt="icon"
                        className="w-5 h-5 rounded-full"
                      />
                    )}

                    <span className="text-white text-[14px] font-normal">
                      {n.name}
                    </span>
                  </div>
                  <span className="text-white/50 text-[14px] font-normal">
                    {n.amount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Manage button */}
          <div className="px-4 py-4">
            <button
              onClick={() => setManageOpen(true)}
              className="mx-auto flex items-center gap-2 text-[#9BE4A0] text-[14px] font-medium"
            >
              <img
                src={CDN.icons.construction}
                className="w-5 h-5"
                alt="manage"
              />
              Manage Networks
            </button>
          </div>
        </div>
      </div>

      {/* Manage modal overlay (centered panel, clicks inside do not close) */}
      {manageOpen && (
        <div className="absolute inset-0 z-[70] flex items-start justify-center pt-20">
          <div
            className="absolute inset-0"
            onClick={() => setManageOpen(false)}
          />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <ManageNetwork onClose={() => setManageOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
