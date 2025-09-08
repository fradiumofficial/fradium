import ProfileHeader from "~components/header";
import { ChevronLeft } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useWallet } from "~lib/context/walletContext";

function Receive() {
  const navigate = useNavigate();
  const { addresses, isFetchingAddresses, fetchAddresses, hasConfirmedWallet, isAuthenticated } = useWallet() as any;

  const copy = async (text?: string) => {
    if (!text) return
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  useEffect(() => {
    if (isAuthenticated && hasConfirmedWallet && !addresses) {
      fetchAddresses?.()
    }
  }, [isAuthenticated, hasConfirmedWallet, addresses, fetchAddresses])
  
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
          <span className="text-xs text-white/60">{isFetchingAddresses ? "Fetching addresses..." : ""}</span>
          <button onClick={() => fetchAddresses?.()} className="text-xs text-[#9BE4A0] hover:underline">Refresh</button>
        </div>
        {/* Bitcoin */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Bitcoin:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input type="text" placeholder={isFetchingAddresses ? "Loading..." : addresses?.bitcoin } className="bg-transparent outline-none flex-1" value={addresses?.bitcoin || ""} readOnly disabled={!addresses?.bitcoin} />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(addresses?.bitcoin)} />
          </div>
        </div>

        {/* Ethereum */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Ethereum:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input type="text" placeholder={isFetchingAddresses ? "Loading..." : addresses?.ethereum } className="bg-transparent outline-none flex-1" value={addresses?.ethereum || ""} readOnly disabled={!addresses?.ethereum} />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(addresses?.ethereum)} />
          </div>
        </div>

        {/* Solana */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Solana:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[24px]">
          <input type="text" placeholder={isFetchingAddresses ? "Loading..." : addresses?.solana } className="bg-transparent outline-none flex-1" value={addresses?.solana || ""} readOnly disabled={!addresses?.solana} />
          <div className="flex flex-row gap-[12px]">
            <img src={CDN.icons.qrCode} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CDN.icons.copyContent} alt="Copy" className="w-5 h-5 cursor-pointer" onClick={() => copy(addresses?.solana)} />
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