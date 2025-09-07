import { Check, ChevronDown, Copy, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CDN } from "~lib/constant/cdn";
import { ROUTES } from "~lib/constant/routes";

const ProfileHeader = () => {
  const [open, setOpen] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mock data for now
  const selectedNetwork = "btc";
  
  // Helper function to shorten principal
  const shortPrincipal = (principal?: string) => {
    if (!principal) return "Not connected";
    return principal.length > 10 ? `${principal.slice(0, 6)}...${principal.slice(-4)}` : principal;
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
    // Mock principal for now
    setPrincipal("cy7jashlashdabmnnzz");
  }, []);

  const rightIconSrc = selectedNetwork === "btc" ? `${CDN.tokens.bitcoinDark}` : selectedNetwork === "eth" ? `${CDN.tokens.ethereumDark}` : selectedNetwork === "sol" ? `${CDN.tokens.solanaDark}` : selectedNetwork === "fra" ? `${CDN.tokens.fradiumDark}` : `${CDN.icons.construction}`;

  const principalText = shortPrincipal(principal || undefined);
  
  // Check if we should show back button
  const showBackButton = location.pathname !== ROUTES.HOME && location.pathname !== "/";
  
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="sticky top-0 z-20 relative w-full bg-[#1C1D22] p-4">
      <div className="relative flex items-center justify-between">
        {/* Left: Back Button or Fradium Logo */}
        <div className="flex items-center">
          {showBackButton ? (
            <button 
              onClick={handleBackClick}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <img src={CDN.icons.icon128} alt="Fradium Logo" className="w-10 h-10" />
          )}
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
            <img src={rightIconSrc} alt="Network" className="w-10 h-10 rounded-full" />
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

      {/* Modal Dropdown - Commented out for now since AllNetwork component might not exist */}
      {/* <AllNetwork isOpen={open} onClose={() => setOpen(false)} /> */}
    </div>
  );
};

export default ProfileHeader;
