import ProfileHeader from "~components/header";
import { ChevronLeft } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "~lib/context/walletContext";

function Receive() {
  const navigate = useNavigate();
  const { 
    addresses, 
    isFetchingAddresses, 
    addressesLoaded,
    getAddressesLoadingState,
    isAuthenticated 
  } = useWallet();
  
  const [localAddresses, setLocalAddresses] = useState<{
    bitcoin?: string;
    ethereum?: string;
    solana?: string;
    icp_principal?: string;
    icp_account?: string;
  } | null>(null);

  const copy = async (text?: string) => {
    if (!text) return
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  // Update local addresses when context addresses change
  useEffect(() => {
    if (addresses) {
      setLocalAddresses(addresses);
    }
  }, [addresses]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-row items-center px-[24px]">
        <button
            onClick={handleBack}
            className="p-1 hover:bg-white/10 rounded"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive Coin</h1>
      </div>

      <div className="flex flex-col px-[24px]">
        {/* Helper refresh when needed */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">
            {getAddressesLoadingState() ? "Fetching addresses..." : addressesLoaded ? "Addresses loaded" : "No addresses available"}
          </span>
        </div>
        {/* Bitcoin */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Bitcoin:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input 
            type="text" 
            placeholder={isFetchingAddresses ? "Loading..." : "Bitcoin address will appear here"} 
            className="bg-transparent outline-none flex-1 text-sm" 
            value={localAddresses?.bitcoin || ""} 
            readOnly 
            disabled={!localAddresses?.bitcoin} 
          />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" onClick={() => navigate(ROUTES.RECEIVE_DETAIL, { state: { address: localAddresses?.bitcoin, network: "bitcoin" } })} />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.bitcoin)} />
          </div>
        </div>

        {/* Ethereum */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Ethereum:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input 
            type="text" 
            placeholder={isFetchingAddresses ? "Loading..." : "Ethereum address will appear here"} 
            className="bg-transparent outline-none flex-1 text-sm" 
            value={localAddresses?.ethereum || ""} 
            readOnly 
            disabled={!localAddresses?.ethereum} 
          />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" onClick={() => navigate(ROUTES.RECEIVE_DETAIL, { state: { address: localAddresses?.ethereum, network: "ethereum" } })} />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.ethereum)} />
          </div>
        </div>

        {/* Solana */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Solana:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input 
            type="text" 
            placeholder={isFetchingAddresses ? "Loading..." : "Solana address will appear here"} 
            className="bg-transparent outline-none flex-1 text-sm" 
            value={localAddresses?.solana || ""} 
            readOnly 
            disabled={!localAddresses?.solana} 
          />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" onClick={() => navigate(ROUTES.RECEIVE_DETAIL, { state: { address: localAddresses?.solana, network: "solana" } })} />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.solana)} />
          </div>
        </div>

        <div>
        <NeoButton onClick={() => navigate(ROUTES.HOME)}>
          Done
        </NeoButton>
      </div>
      </div>
    </div>
  )
}

export default Receive;