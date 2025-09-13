import { ChevronLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { CDN } from "~lib/constant/cdn"
import { ROUTES } from "~lib/constant/routes"
import { useWallet } from "~lib/context/walletContext"

function Receive() {
  const navigate = useNavigate()
  const {
    addresses,
    isFetchingAddresses,
    addressesLoaded,
    getAddressesLoadingState,
    isAuthenticated
  } = useWallet()

  const [localAddresses, setLocalAddresses] = useState<{
    bitcoin?: string
    ethereum?: string
    solana?: string
    icp_principal?: string
    icp_account?: string
  } | null>(null)

  const copy = async (text?: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  // Update local addresses when context addresses change
  useEffect(() => {
    if (addresses) {
      setLocalAddresses(addresses)
    }
  }, [addresses])

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.HOME)
  }, [navigate])

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto">
      <div className="flex flex-row items-center px-[24px]">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-white/10 rounded"
          aria-label="Go back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[20px] font-semibold text-white px-[12px]">
          Receive Coin
        </h1>
      </div>

      <div className="flex flex-col px-[24px]">
        {/* Helper refresh when needed */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">
            {getAddressesLoadingState()
              ? "Fetching addresses..."
              : addressesLoaded
                ? "Addresses loaded"
                : "No addresses available"}
          </span>
        </div>
        {/* Bitcoin */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">
          Bitcoin:
        </h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px] rounded-[12px]">
          <input
            type="text"
            placeholder={
              isFetchingAddresses
                ? "Loading..."
                : "Bitcoin address will appear here"
            }
            className="bg-transparent outline-none flex-1 text-sm"
            value={localAddresses?.bitcoin || ""}
            readOnly
            disabled={!localAddresses?.bitcoin}
          />
          <div className="flex flex-row gap-[12px]">
            <img
              src={CDN.icons.qrCode}
              alt="QR Code"
              className="w-5 h-5 cursor-pointer"
              onClick={() =>
                navigate(ROUTES.RECEIVE_DETAIL, {
                  state: {
                    address: localAddresses?.bitcoin,
                    network: "bitcoin"
                  }
                })
              }
            />
            <img
              src={CDN.icons.copyContent}
              alt="Copy"
              className="w-5 h-5 cursor-pointer"
              onClick={() => copy(localAddresses?.bitcoin)}
            />
          </div>
        </div>

        {/* Ethereum */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">
          Ethereum:
        </h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px] rounded-[12px]">
          <input
            type="text"
            placeholder={
              isFetchingAddresses
                ? "Loading..."
                : "Ethereum address will appear here"
            }
            className="bg-transparent outline-none flex-1 text-sm"
            value={localAddresses?.ethereum || ""}
            readOnly
            disabled={!localAddresses?.ethereum}
          />
          <div className="flex flex-row gap-[12px]">
            <img
              src={CDN.icons.qrCode}
              alt="QR Code"
              className="w-5 h-5 cursor-pointer"
              onClick={() =>
                navigate(ROUTES.RECEIVE_DETAIL, {
                  state: {
                    address: localAddresses?.ethereum,
                    network: "ethereum"
                  }
                })
              }
            />
            <img
              src={CDN.icons.copyContent}
              alt="Copy"
              className="w-5 h-5 cursor-pointer"
              onClick={() => copy(localAddresses?.ethereum)}
            />
          </div>
        </div>

        {/* Solana */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Solana:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px] rounded-[12px]">
          <input
            type="text"
            placeholder={
              isFetchingAddresses
                ? "Loading..."
                : "Solana address will appear here"
            }
            className="bg-transparent outline-none flex-1 text-sm"
            value={localAddresses?.solana || ""}
            readOnly
            disabled={!localAddresses?.solana}
          />
          <div className="flex flex-row gap-[12px]">
            <img
              src={CDN.icons.qrCode}
              alt="QR Code"
              className="w-5 h-5 cursor-pointer"
              onClick={() =>
                navigate(ROUTES.RECEIVE_DETAIL, {
                  state: { address: localAddresses?.solana, network: "solana" }
                })
              }
            />
            <img
              src={CDN.icons.copyContent}
              alt="Copy"
              className="w-5 h-5 cursor-pointer"
              onClick={() => copy(localAddresses?.solana)}
            />
          </div>
        </div>

        {/* ICP Principal */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">
          ICP Principal:
        </h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px] rounded-[12px]">
          <input
            type="text"
            placeholder={
              isFetchingAddresses
                ? "Loading..."
                : "ICP Principal will appear here"
            }
            className="bg-transparent outline-none flex-1 text-sm"
            value={localAddresses?.icp_principal || ""}
            readOnly
            disabled={!localAddresses?.icp_principal}
          />
          <div className="flex flex-row gap-[12px]">
            <img
              src={CDN.icons.qrCode}
              alt="QR Code"
              className="w-5 h-5 cursor-pointer"
              onClick={() =>
                navigate(ROUTES.RECEIVE_DETAIL, {
                  state: {
                    address: localAddresses?.icp_principal,
                    network: "icp_principal"
                  }
                })
              }
            />
            <img
              src={CDN.icons.copyContent}
              alt="Copy"
              className="w-5 h-5 cursor-pointer"
              onClick={() => copy(localAddresses?.icp_principal)}
            />
          </div>
        </div>

        {/* ICP Account */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">
          ICP Account:
        </h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px] rounded-[12px]">
          <input
            type="text"
            placeholder={
              isFetchingAddresses
                ? "Loading..."
                : "ICP Account will appear here"
            }
            className="bg-transparent outline-none flex-1 text-sm"
            value={localAddresses?.icp_account || ""}
            readOnly
            disabled={!localAddresses?.icp_account}
          />
          <div className="flex flex-row gap-[12px]">
            <img
              src={CDN.icons.qrCode}
              alt="QR Code"
              className="w-5 h-5 cursor-pointer"
              onClick={() =>
                navigate(ROUTES.RECEIVE_DETAIL, {
                  state: {
                    address: localAddresses?.icp_account,
                    network: "icp_account"
                  }
                })
              }
            />
            <img
              src={CDN.icons.copyContent}
              alt="Copy"
              className="w-5 h-5 cursor-pointer"
              onClick={() => copy(localAddresses?.icp_account)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={false}
            onClick={() => navigate(ROUTES.HOME)}
            className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2 self-stretch flex-grow-0">
            {/* Icon placeholder */}
            <span className="w-[51px] h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
              Done
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Receive
