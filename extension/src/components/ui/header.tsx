import { Check, ChevronDown, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNetwork } from "@/modules/all_network/networkContext";
import AllNetwork from "@/modules/all_network/pages/AllNetwork";
import { shortPrincipal, readStoredPrincipal } from "@/icp/icpAuth";

const ProfileHeader = () => {
  const { selectedNetwork } = useNetwork();
  const [open, setOpen] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedAddress(principal);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  useEffect(() => {
    setPrincipal(readStoredPrincipal());
  }, []);

  const rightIconSrc = selectedNetwork === "btc" ? "/assets/bitcoin-dark.svg" : selectedNetwork === "eth" ? "/assets/ethereum-dark.svg" : selectedNetwork === "sol" ? "/assets/solana-dark.svg" : selectedNetwork === "fra" ? "/assets/fradium-dark.svg" : "/assets/construction.svg";

  const principalText = shortPrincipal(principal || undefined);

  return (
    <div className="sticky top-0 z-20 relative w-full bg-[#1C1D22] p-4">
      <div className="relative flex items-center justify-between">
        {/* Left: Fradium Logo */}
        <div className="flex items-center">
          <img src="/assets/icon128.png" alt="Fradium Logo" className="w-10 h-10" />
        </div>

        {/* Center: Wallet Information */}
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-white text-sm font-medium mb-1">Fradium Wallet</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium text-xs">{principalText}</span>
            {copiedAddress === principal ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => principal && handleCopyAddress(principal)} />}
          </div>
        </div>

        {/* Right: Context-aware Icon + trigger */}
        <div className="flex items-center">
          <button type="button" onClick={() => setOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center mr-1 transition-colors">
            <img src={rightIconSrc} alt="Network" className={`w-10 h-10 ${selectedNetwork !== "all" ? "rounded-full" : ""}`} />
          </button>
          <ChevronDown className="w-5 h-5 text-gray-300" />
        </div>
      </div>

      {/* Glow overlay using glow.png */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "url(/assets/images/glow.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Modal Dropdown */}
      <AllNetwork isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default ProfileHeader;
