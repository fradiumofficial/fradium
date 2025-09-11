import { Check, ChevronDown, Copy, ArrowLeft, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AllNetwork from "~features/network/pages/all_network";
import { CDN } from "~lib/constant/cdn";
import { ROUTES } from "~lib/constant/routes";
import { useNetwork } from "~features/network/context/networkContext";
import { useWallet } from "~lib/context/walletContext";

const ProfileHeader = () => {
  const [open, setOpen] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const { principalText } = useWallet() as any;
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Selected network from context
  const { selectedNetwork } = useNetwork();
  
  // Helper function to shorten principal
  const shortPrincipal = (principal?: string) => {
    if (!principal) return "Not connected";
    return principal.length > 10 ? `${principal.slice(0, 2)}...${principal.slice(-2)}` : principal;
  };

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
    setPrincipal(principalText || null);
  }, [principalText]);

  const rightIconSrc = selectedNetwork === "btc" ? `${CDN.tokens.bitcoinDark}` : selectedNetwork === "eth" ? `${CDN.tokens.ethereumDark}` : selectedNetwork === "sol" ? `${CDN.tokens.solanaDark}` : selectedNetwork === "fra" ? `${CDN.tokens.fradiumDark}` : `${CDN.icons.construction}`;

  const principalShort = shortPrincipal(principal || undefined);

  return (
    <div className="flex flex-row items-center p-[14px_20px] gap-3 isolate w-[375px] h-[68px] bg-white/5 flex-none order-1 self-stretch flex-grow-0 z-[1] relative">
      {/* Glow Effect */}
      <div
        className="absolute w-[325.33px] h-[276.44px] left-[calc(50%-325.33px/2+162.17px)] top-[-203px] opacity-30 flex-none order-0 flex-grow-0 z-0"
        style={{
          background: "radial-gradient(50% 50% at 50% 50%, rgba(150, 234, 99, 0.5) 0%, rgba(0, 0, 0, 0) 100%)",
          transform: "rotate(68.06deg)",
        }}
      />

      {/* Account Section (Left) - Combined Logo + Title + Principal */}
      <div className="flex flex-row items-center p-0 gap-2 w-[200px] h-[40px] flex-1 order-1 flex-grow-0 z-[1]">
        <div className="box-border w-[40px] h-[40px] rounded-full flex-none order-0 flex-grow-0 relative">
          <img src={CDN.icons.icon128} alt="Fradium Logo" className="w-full h-full rounded-full" />
        </div>
        <div className="flex flex-col justify-center items-start p-0 gap-[2px] w-[68px] h-[36px] flex-none order-1 flex-grow-0">
          <h1 className="w-[120px] h-[18px] font-['General Sans'] font-medium text-[12px] leading-[150%] flex items-center letter-[-0.01em] text-white flex-none order-0 flex-grow-0">
            Fradium Wallet
          </h1>
          <div className="flex flex-row items-center p-0 gap-[6px] w-[59px] h-4 flex-none order-1 flex-grow-0">
            <span className="w-[39px] h-4 font-['General Sans'] font-medium text-[12px] leading-4 flex items-center letter-[-0.01em] text-[#777777] flex-none order-0 flex-grow-0">
              {principalShort}
            </span>
            <div className="w-[14px] h-[14px] flex-none order-1 flex-grow-0 relative cursor-pointer hover:text-white transition-colors" onClick={() => principal && handleCopyAddress(principal)}>
              {copiedAddress === principal ? (
                <Check className="w-[14px] h-[14px] absolute left-[8.33%] right-[8.33%] top-[8.34%] bottom-[8.33%] text-green-500" />
              ) : (
                <Copy className="w-[14px] h-[14px] absolute left-[8.33%] right-[8.33%] top-[8.34%] bottom-[8.33%] text-[#777777]" />
              )}
            </div>
          </div>
        </div>
      </div>

       {/* Network Selector (Right) */}
       <button 
         type="button" 
         onClick={() => setOpen(true)} 
          className="box-border flex flex-row justify-center items-center p-[20px] gap-2 w-[145px] h-[40px] border border-white/15 backdrop-blur-[10px] rounded-full flex-none order-2 flex-grow-0 hover:bg-white/10 transition-colors cursor-pointer ml-auto"
       >
         <div className="w-5 h-5 flex-none order-0 flex-grow-0 relative">
           <img src={rightIconSrc} alt="Network" className="w-full h-full" />
         </div>
         <span className="w-[69px] h-4 font-['General Sans'] font-normal text-[12px] leading-[130%] flex items-center text-white flex-none order-1 flex-grow-0">
           All Networks
         </span>
         <div className="w-5 h-5 flex-none order-2 flex-grow-0 relative">
           {open ? (
            <ChevronUp className="w-full h-full text-[#D4D4D4]" />
           ) : (
            <ChevronDown className="w-full h-full text-[#D4D4D4]" />
           )}
         </div>
       </button>

      {/* Modal Dropdown */}
      <AllNetwork isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default ProfileHeader;
