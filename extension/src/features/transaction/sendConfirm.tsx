import { useLocation, useNavigate } from "react-router-dom"
import { useCallback, useMemo, useState } from "react"
import { ROUTES } from "~lib/constant/routes"
import { useWallet } from "~lib/context/walletContext"
import { useAuth } from "~lib/context/authContext"
import { AlertCircle, Loader2 } from "lucide-react"
import { TxHistoryService } from "~service/txHistoryService"

type NetworkKey = "btc" | "eth" | "sol"

export default function SendConfirm() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { walletActor } = useWallet() as any
  const { identity } = useAuth() as any

  // Context passed from analyze result page
  const { recipientAddress, amount, selectedNetwork } = location.state || {}

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenMeta = useMemo(() => {
    const map: Record<NetworkKey, { symbol: string; tokenType: string }> = {
      btc: { symbol: "BTC", tokenType: "Bitcoin" },
      eth: { symbol: "ETH", tokenType: "Ethereum" },
      sol: { symbol: "SOL", tokenType: "Solana" },
    }
    return map[(selectedNetwork as NetworkKey) || "btc"]
  }, [selectedNetwork])

  const convertToUnits = useCallback((amountStr: string): bigint => {
    const v = parseFloat(amountStr || "0")
    switch (selectedNetwork as NetworkKey) {
      case "btc":
        return BigInt(Math.floor(v * 100000000))
      case "eth":
        return BigInt(Math.floor(v * 1e18))
      case "sol":
        return BigInt(Math.floor(v * 1e9))
      default:
        return 0n
    }
  }, [selectedNetwork])

  const handleConfirm = useCallback(async () => {
    if (!walletActor || !identity) {
      setError("Wallet not connected")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const amt = convertToUnits(amount)
      let txResult: string
      switch (selectedNetwork as NetworkKey) {
        case "btc":
          txResult = await walletActor.bitcoin_send({ destination_address: recipientAddress, amount_in_satoshi: amt })
          break
        case "eth":
          txResult = await walletActor.ethereum_send(recipientAddress, amt)
          break
        case "sol":
          txResult = await walletActor.solana_send(recipientAddress, amt)
          break
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
  }, [walletActor, identity, amount, recipientAddress, selectedNetwork, tokenMeta, navigate, convertToUnits])

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


