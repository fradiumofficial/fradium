import { useLocation, useNavigate } from "react-router-dom"
import { useCallback, useMemo, useState } from "react"
import { ROUTES } from "~lib/constant/routes"
import { useWallet } from "~lib/context/walletContext"
import { useAuth } from "~lib/context/authContext"
import { AlertCircle, Loader2 } from "lucide-react"
import { TxHistoryService } from "~service/txHistoryService"

type NetworkKey = "btc" | "eth" | "sol" | "icp" | "fra" | "ckbtc" | "cketh"

export default function SendConfirm() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { walletActor, sendIcrcTransfer } = useWallet() as any
  const { identity } = useAuth() as any

  // Context passed from analyze result page
  const { recipientAddress, amount, selectedNetwork } = location.state || {}

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenMeta = useMemo(() => {
    const map: Record<string, { symbol: string; tokenType: string }> = {
      // Network keys
      btc: { symbol: "BTC", tokenType: "Bitcoin" },
      eth: { symbol: "ETH", tokenType: "Ethereum" },
      sol: { symbol: "SOL", tokenType: "Solana" },
      icp: { symbol: "ICP", tokenType: "Internet Computer" },
      fra: { symbol: "FUM", tokenType: "Fradium" },
      ckbtc: { symbol: "ckBTC", tokenType: "Chain Key BTC" },
      cketh: { symbol: "ckETH", tokenType: "Chain Key ETH" },
      // Token IDs (from send.tsx)
      bitcoin: { symbol: "BTC", tokenType: "Bitcoin" },
      ethereum: { symbol: "ETH", tokenType: "Ethereum" },
      solana: { symbol: "SOL", tokenType: "Solana" },
      fradium: { symbol: "FUM", tokenType: "Fradium" },
    }
    return map[selectedNetwork] || map["btc"]
  }, [selectedNetwork])

  const convertToUnits = useCallback((amountStr: string): bigint => {
    const v = parseFloat(amountStr || "0")
    switch (selectedNetwork) {
      case "btc":
      case "bitcoin":
        return BigInt(Math.floor(v * 100000000))
      case "eth":
      case "ethereum":
        return BigInt(Math.floor(v * 1e18))
      case "sol":
      case "solana":
        return BigInt(Math.floor(v * 1e9))
      case "icp":
        return BigInt(Math.floor(v * 1e8))
      case "fra":
      case "fradium":
        return BigInt(Math.floor(v * 1e8))
      case "ckbtc":
        return BigInt(Math.floor(v * 1e8))
      case "cketh":
        return BigInt(Math.floor(v * 1e18))
      default:
        return 0n
    }
  }, [selectedNetwork])

  const handleConfirm = useCallback(async () => {
    if (!identity) {
      setError("Wallet not connected")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      let txResult: string
      switch (selectedNetwork) {
        case "btc":
        case "bitcoin":
          if (!walletActor) throw new Error("Wallet actor not available")
          txResult = await walletActor.bitcoin_send({ destination_address: recipientAddress, amount_in_satoshi: convertToUnits(amount) })
          break
        case "eth":
        case "ethereum":
          if (!walletActor) throw new Error("Wallet actor not available")
          txResult = await walletActor.ethereum_send(recipientAddress, convertToUnits(amount))
          break
        case "sol":
        case "solana":
          if (!walletActor) throw new Error("Wallet actor not available")
          txResult = await walletActor.solana_send(recipientAddress, convertToUnits(amount))
          break
        case "icp": {
          const res = await sendIcrcTransfer("icp", recipientAddress, parseFloat(amount))
          if (!res?.success) throw new Error(res?.error || "ICP transfer failed")
          txResult = res?.blockIndex || ""
          break
        }
        case "fra":
        case "fradium": {
          const res = await sendIcrcTransfer("fradium", recipientAddress, parseFloat(amount))
          if (!res?.success) throw new Error(res?.error || "Fradium transfer failed")
          txResult = res?.blockIndex || ""
          break
        }
        case "ckbtc": {
          const res = await sendIcrcTransfer("ckbtc", recipientAddress, parseFloat(amount))
          if (!res?.success) throw new Error(res?.error || "ckBTC transfer failed")
          txResult = res?.blockIndex || ""
          break
        }
        case "cketh": {
          const res = await sendIcrcTransfer("cketh", recipientAddress, parseFloat(amount))
          if (!res?.success) throw new Error(res?.error || "ckETH transfer failed")
          txResult = res?.blockIndex || ""
          break
        }
        default:
          throw new Error("Unsupported network")
      }

      // Save to history
      try {
        TxHistoryService.add({
          tokenType: tokenMeta.tokenType as any,
          direction: "Send",
          amount: parseFloat(amount),
          toAddress: recipientAddress,
          txId: txResult
        })
      } catch {}

      navigate(ROUTES.SEND_SUCCESS, { state: { amount, symbol: tokenMeta.symbol, to: recipientAddress, txId: txResult } })
    } catch (e: any) {
      const msg = e?.message || String(e)
      if (msg.toLowerCase().includes("insufficient funds for gas")) {
        setError("Insufficient funds for gas. Reduce amount or add more funds.")
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [walletActor, identity, amount, recipientAddress, selectedNetwork, tokenMeta, navigate, convertToUnits, sendIcrcTransfer])

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto">
      <div className="flex flex-col px-[24px]">
        <h1 className="text-[20px] font-semibold mt-4">Confirm Transfer</h1>

        <div className="mt-4 space-y-3">
          <div className="bg-white/5 rounded p-3 text-sm">
            <div className="text-white/60">Destination</div>
            <div className="break-all">{recipientAddress}</div>
          </div>
          <div className="bg-white/5 rounded p-3 text-sm flex justify-between">
            <span className="text-white/60">Network</span>
            <span className="font-medium uppercase">{(selectedNetwork || "btc").toString()}</span>
          </div>
          <div className="bg-white/5 rounded p-3 text-sm flex justify-between">
            <span className="text-white/60">Amount</span>
            <span className="font-medium">{amount} {tokenMeta.symbol}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded text-sm">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-6 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-sans font-medium text-[14px] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">Confirm & Send</span>}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] border border-white/15 rounded-[99px] mt-2"
        >
          <span className="font-sans font-medium text-[14px]">Back</span>
        </button>
      </div>
    </div>
  )
}


