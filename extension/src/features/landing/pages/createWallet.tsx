import { useState } from "react"
import { useNavigate } from "react-router-dom"

import NeoButton from "~components/custom-button"

function WalletConfirmation() {
  const navigate = useNavigate()

  // If user already has a wallet, skip this screen
  // useEffect(() => {
  //   if (hasConfirmedWallet && !isLoading) {
  //     navigate(ROUTES.HOME, { replace: true })
  //   }
  // }, [hasConfirmedWallet, isLoading, navigate])

  // const handleCreateWallet = useCallback(async () => {
  //   setMessage("Creating your wallet...")
  //   const ok = await confirmWallet()
  //   if (ok) {
  //     setMessage("Wallet created! Redirecting...")
  //     navigate(ROUTES.HOME, { replace: true })
  //   } else {
  //     setMessage("Failed to create wallet. Please try again.")
  //   }
  // }, [confirmWallet, navigate])

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white p-8 flex flex-col justify-center">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-[#9BE4A0] rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-black"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Create Your Wallet
          </h1>
          <p className="text-white/70 text-sm">
            To access all features of Fradium, you need to create a secure
            wallet. This will enable you to:
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">
                  Multi-Chain Support
                </h3>
                <p className="text-white/60 text-xs">
                  Bitcoin, Ethereum, Solana, and Fradium tokens
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">
                  Real-Time Protection
                </h3>
                <p className="text-white/60 text-xs">
                  AI-powered scam and fraud detection
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">
                  Secure Transactions
                </h3>
                <p className="text-white/60 text-xs">
                  Send and receive crypto with confidence
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <NeoButton
            iconPosition="right"
            onClick={() => {}}
            disabled={false}
            className="w-full">
            Create Wallet
          </NeoButton>
        </div>
      </div>
    </div>
  )
}

export default WalletConfirmation
