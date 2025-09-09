import ProfileHeader from "~components/header";
import { ChevronLeft } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useWallet } from "~lib/context/walletContext";

function Receive() {
  const navigate = useNavigate();
  const { 
    addresses, 
    isFetchingAddresses, 
    addressesLoaded,
    hasLoadedAddressesOnce,
    fetchAddresses, 
    fetchWalletAddresses,
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

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-row items-center px-[24px]">
        <ChevronLeft className="w-6 h-6" />
        <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive Coin</h1>
      </div>

      <div className="flex flex-col px-[24px]">
        {/* Helper refresh when needed */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">
            {getAddressesLoadingState() ? "Fetching addresses..." : addressesLoaded ? "Addresses loaded" : "No addresses available"}
          </span>
          <button 
            onClick={async () => {
              const walletAddresses = await fetchWalletAddresses?.();
              if (walletAddresses) {
                setLocalAddresses(walletAddresses);
              }
            }} 
            className="text-xs text-[#9BE4A0] hover:underline"
            disabled={isFetchingAddresses}
          >
            {isFetchingAddresses ? "Loading..." : "Refresh"}
          </button>
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
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
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
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
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
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.solana)} />
          </div>
        </div>

        {/* ICP Principal */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">ICP Principal:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input 
            type="text" 
            placeholder={isFetchingAddresses ? "Loading..." : "ICP Principal will appear here"} 
            className="bg-transparent outline-none flex-1 text-sm" 
            value={localAddresses?.icp_principal || ""} 
            readOnly 
            disabled={!localAddresses?.icp_principal} 
          />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.icp_principal)} />
          </div>
        </div>

        {/* ICP Account ID */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">ICP Account ID:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[24px]">
          <input 
            type="text" 
            placeholder={isFetchingAddresses ? "Loading..." : "ICP Account ID will appear here"} 
            className="bg-transparent outline-none flex-1 text-sm" 
            value={localAddresses?.icp_account || ""} 
            readOnly 
            disabled={!localAddresses?.icp_account} 
          />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(localAddresses?.icp_account)} />
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