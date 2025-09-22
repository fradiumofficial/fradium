import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CDN } from "~lib/constant/cdn";
import { useWallet } from "~lib/context/walletContext";

// Network configuration - only 4 main networks
const NETWORK_CONFIG = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: CDN.tokens.bitcoinDark,
  },
  {
    id: "ethereum", 
    name: "Ethereum",
    icon: CDN.tokens.ethereumDark,
  },
  {
    id: "solana",
    name: "Solana", 
    icon: CDN.tokens.solanaDark,
  },
  {
    id: "icp",
    name: "Internet Computer",
    icon: CDN.tokens.icp,
  },
];

export default function ManageNetwork() {
  const navigate = useNavigate();
  const { networkFilters, updateNetworkFilters } = useWallet() as any;

  // Local state for UI updates (will sync with networkFilters on save)
  const [tempNetworkFilters, setTempNetworkFilters] = useState<{[key: string]: boolean}>({});

  // Initialize temp state when component mounts
  useEffect(() => {
    if (networkFilters) {
      setTempNetworkFilters({ ...networkFilters });
    }
  }, [networkFilters]);

  // Handle toggle network
  const handleToggleNetwork = (networkName: string) => {
    setTempNetworkFilters((prev) => ({
      ...prev,
      [networkName]: !prev[networkName],
    }));
  };

  // Save function to persist changes
  const handleSave = () => {
    // Update the actual network filters
    updateNetworkFilters(tempNetworkFilters);
    // Navigate back after saving
    navigate(-1);
  };

  // Cancel function to reset temp state
  const handleCancel = () => {
    // Reset temp state to original
    setTempNetworkFilters({ ...networkFilters });
    navigate(-1);
  };

  return (
    <div className="w-[375px]">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded hover:bg-white/5 active:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white text-[20px] font-semibold">Active Networks</h2>
        </div>
        <p className="text-white/60 text-[14px] font-normal mt-2">
          Manage which networks are active in your wallet
        </p>
      </div>

      <div className="px-6 mt-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[10px] p-4">
          <div className="divide-y divide-white/10">
            {NETWORK_CONFIG.map((network) => (
              <div key={network.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <img src={network.icon} alt={network.name} className="w-7 h-7" />
                  <span className="text-white text-lg font-medium">{network.name}</span>
                </div>
                {/* Custom Switch */}
                <button 
                  className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 ${
                    tempNetworkFilters[network.name] ? "bg-[#9BE4A0]" : "bg-[#23272F]"
                  }`} 
                  onClick={() => handleToggleNetwork(network.name)}
                >
                  <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    tempNetworkFilters[network.name] ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-10 mb-6">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2 self-stretch flex-grow-0 hover:opacity-90 transition-opacity"
          >
            <span className="w-auto h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
              Save
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
