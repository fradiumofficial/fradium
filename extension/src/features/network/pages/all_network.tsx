import { Check } from "lucide-react";
import { useNetwork } from "~features/network/context/networkContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "~lib/context/walletContext";
import { CDN } from "~lib/constant/cdn";
import { ROUTES } from "~lib/constant/routes";

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
  {
    key: "icp" as const,
    name: "Internet Computer",
    icon: CDN.tokens.icp,
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
  const { getNetworkValue, networkFilters, usdPrices, balances } = useWallet() as any;
  const [manageOpen, setManageOpen] = useState(false);
  const navigate = useNavigate();

  // Generate networks with actual values from wallet, filtered by enabled networks
  const networks = BASE_NETWORKS.filter(network => {
    if (network.key === "all") return true; // Always show "All Networks"
    
    // Filter based on network filters
    switch (network.key) {
      case "btc": return networkFilters?.Bitcoin ?? true;
      case "eth": return networkFilters?.Ethereum ?? true;
      case "sol": return networkFilters?.Solana ?? true;
      case "fra": return networkFilters?.Fradium ?? true;
      case "icp": return true;
      default: return true;
    }
  }).map(network => {
    // derive token id mapping for price * balance
    const keyToId: any = { btc: "bitcoin", eth: "ethereum", sol: "solana", fra: "fradium", icp: "icp" };
    const formatUSD = (v: number) => `$${(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

    let totalUsd = 0;
    if (network.key === "all") {
      const ids = Object.values(keyToId) as string[];
      totalUsd = ids.reduce((sum, id) => {
        const price = Number(usdPrices?.[id] ?? 0);
        const qty = parseFloat(String(balances?.[id] ?? "0"));
        if (!isFinite(price) || !isFinite(qty)) return sum;
        return sum + price * qty;
      }, 0);
    } else {
      const tokenId = keyToId[network.key as keyof typeof keyToId];
      const price = Number(usdPrices?.[tokenId] ?? 0);
      const qty = parseFloat(String(balances?.[tokenId] ?? "0"));
      if (isFinite(price) && isFinite(qty)) totalUsd = price * qty;
    }

    return {
      ...network,
      amount: formatUSD(totalUsd),
      usd: totalUsd
    };
  });

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

      {/* Glassmorphism dropdown */}
      <div className="absolute right-3 top-[56px] w-[296px]">
        <div className="flex flex-col p-3 gap-2 w-full bg-white/[0.04] border border-white/15 backdrop-blur-[16px] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          {/* List */}
          <div className="flex flex-col w-full max-h-[360px] overflow-auto">
            {networks.map((n, idx) => {
              const isActive = n.key === selectedNetwork;
              return (
                <div key={n.key}>
                  <button
                    onClick={() => {
                      setSelectedNetwork(n.key);
                      onClose();
                    }}
                    className={`flex w-full h-[52px] items-center justify-between px-4 ${
                      isActive ? "bg-white/10 rounded-2xl" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <Check className="w-5 h-5 text-[#9BE4A0]" />
                      ) : (
                        <img src={n.icon} alt="icon" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-white text-[16px] leading-[130%] font-normal">{n.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white/60 text-[16px] leading-[150%] font-medium">{n.amount}</span>
                    </div>
                  </button>
                  {idx < networks.length - 1 && (
                    <div className="mx-3 h-px bg-white/10" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Manage Networks */}
          <button
            onClick={() => {
              setManageOpen(false);
              onClose();
              navigate(ROUTES.MANAGE_NETWORK);
            }}
            className="mt-1 flex w-full h-[48px] items-center gap-3 rounded-2xl bg-white/5 px-4 hover:bg-white/10 transition-colors"
          >
            <img src={CDN.icons.managNetwork} className="w-5 h-5" alt="manage" />
            <span className="text-[#99E39E] text-[16px] leading-[130%] font-medium">Manage Networks</span>
          </button>
        </div>
      </div>
    </div>
  );
}
