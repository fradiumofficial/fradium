import React from 'react';
import { BrowserRouter, Route, Routes, Navigate, Outlet, Router } from "react-router-dom"
import BottomNavbar from '~components/bottom-app-bar';
import Home from "~features/home/pages/home"
import AnalyzeAddress from "~features/analyze_address/pages/analyzeAdress"
import AnalyzeAddressResult from "~features/analyze_address/pages/analyzeAddressResult"
import AnalyzeProgress from "~features/analyze_address/pages/analyzeProgress"
import History from "~features/history/pages/history"
import ScanHistory from "~features/history/pages/scanHistory"
import DetailHistory from "~features/history/pages/detailHistory"
import TxDetail from "~features/history/pages/transactionDetail"
import Account from "~features/preferences/pages/account"
import { ROUTES } from "~lib/constant/routes"

import "~style.css"
import Welcome from '~features/landing/pages/welcome';
import WalletConfirmation from '~features/landing/pages/createWallet';
import { AuthProvider } from '~lib/context/authContext';
import { WalletProvider } from '~lib/context/walletContext';
import { useWallet } from "~lib/context/walletContext";
import { NetworkProvider } from "~features/network/context/networkContext";
import { Send } from 'lucide-react';
import Receive from '~features/transaction/receive';

const RequireWallet: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { hasConfirmedWallet, isAuthenticated, isLoading } = useWallet() as any
  if (isLoading) return children
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.WELCOME} replace />
  }
  if (!hasConfirmedWallet) {
    return <Navigate to={ROUTES.WALLET_CONFIRMATION} replace />
  }
  return children
}

const AuthOrWelcome: React.FC = () => {
  const { isAuthenticated, hasConfirmedWallet, isLoading } = useWallet() as any
  if (isLoading) return null
  if (isAuthenticated) {
    return <Navigate to={hasConfirmedWallet ? ROUTES.HOME : ROUTES.WALLET_CONFIRMATION} replace />
  }
  return <Welcome />
}

async function handleLogin() {
  const response = await chrome.runtime.sendMessage({ type: "LOGIN_WITH_ICP" })
  if (response.ok) {
    console.log("Login successful", response.principal)
    return response.principal
  } else {
    console.log("Login failed")
    return null
  }
}

function IndexPopup() {
  return (
    <BrowserRouter >
      <AuthProvider>
      <WalletProvider>
      <NetworkProvider>
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path={ROUTES.WELCOME} element={<AuthOrWelcome />}/>
            {/* Default route - show Home page directly */}
            <Route path="/" element={<Navigate to={ROUTES.WELCOME} replace />} />
            <Route path={ROUTES.WALLET_CONFIRMATION} element={<WalletConfirmation />} />
            <Route path={ROUTES.HOME} element={<RequireWallet><Home /></RequireWallet>} />
            <Route path={ROUTES.AI_ANALYZER} element={<RequireWallet><AnalyzeAddress /></RequireWallet>} />
            <Route path={ROUTES.ANALYZE_ADDRESS} element={<RequireWallet><AnalyzeAddress /></RequireWallet>} />
            <Route path={ROUTES.ANALYZE_ADDRESS_RESULT} element={<RequireWallet><AnalyzeAddressResult /></RequireWallet>} />
            <Route path={ROUTES.ANALYZE_PROGRESS} element={<RequireWallet><AnalyzeProgress /></RequireWallet>} />
            <Route path={ROUTES.HISTORY} element={<RequireWallet><History /></RequireWallet>} />
            <Route path={ROUTES.SCAN_HISTORY} element={<RequireWallet><ScanHistory /></RequireWallet>} />
            <Route path={ROUTES.DETAIL_HISTORY} element={<RequireWallet><DetailHistory /></RequireWallet>} />
            <Route path={ROUTES.TX_DETAIL} element={<RequireWallet><TxDetail /></RequireWallet>} />
            <Route path={ROUTES.ACCOUNT} element={<RequireWallet><Account /></RequireWallet>} />
            <Route path={ROUTES.RECEIVE} element={<RequireWallet><Receive /></RequireWallet>} />
            <Route path={ROUTES.SEND} element={<RequireWallet><Send /></RequireWallet>} />
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </div>
        
        {/* Bottom Navigation Bar */}
        <div className="flex-shrink-0">
          <BottomNavbar />
        </div>
      </div>
      </NetworkProvider>
      </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default IndexPopup