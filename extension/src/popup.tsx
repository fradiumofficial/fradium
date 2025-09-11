import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import BottomNavbar from '~components/bottom-app-bar';
import ProfileHeader from '~components/header';
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
import { AuthProvider } from '~lib/context/authContext';
import { WalletProvider } from '~lib/context/walletContext';
import { useWallet } from "~lib/context/walletContext";
import { NetworkProvider } from "~features/network/context/networkContext";
import Receive from '~features/transaction/receive';
import ProtectedRoute from '~components/protected-route';
import ReceiveDetail from '~features/transaction/receiveDetail';
import Send from '~features/transaction/send';

const AuthOrWelcome: React.FC = () => {
  const { isAuthenticated, addresses, isLoading } = useWallet() as any
  if (isLoading) return null
  if (isAuthenticated) {
    // If user is authenticated, go to home (wallet addresses will be loaded automatically)
    return <Navigate to={ROUTES.HOME} replace />
  }
  return <Welcome />
}

function IndexPopup() {
  return (
    <BrowserRouter >
      <AuthProvider>
      <WalletProvider>
      <NetworkProvider>
      <div className="w-[375px] h-[600px] bg-[#000510] text-white flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <ProfileHeader />
        </div>

        {/* Main Content Area - With proper spacing for header and bottom bar */}
        <div className="flex-1 overflow-y-auto pb-20">
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path={ROUTES.WELCOME} element={<AuthOrWelcome />}/>
            <Route path="/" element={<Navigate to={ROUTES.WELCOME} replace />} />

            {/* Protected routes - authentication required */}
            <Route path={ROUTES.HOME} element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.AI_ANALYZER} element={
              <ProtectedRoute>
                <AnalyzeAddress />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ANALYZE_ADDRESS} element={
              <ProtectedRoute>
                <AnalyzeAddress />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ANALYZE_ADDRESS_RESULT} element={
              <ProtectedRoute>
                <AnalyzeAddressResult />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ANALYZE_PROGRESS} element={
              <ProtectedRoute>
                <AnalyzeProgress />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.HISTORY} element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.SCAN_HISTORY} element={
              <ProtectedRoute>
                <ScanHistory />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.DETAIL_HISTORY} element={
              <ProtectedRoute>
                <DetailHistory />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.TX_DETAIL} element={
              <ProtectedRoute>
                <TxDetail />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ACCOUNT} element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.RECEIVE} element={
              <ProtectedRoute>
                <Receive />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.SEND} element={
              <ProtectedRoute>
                <Send />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.RECEIVE_DETAIL} element={
              <ProtectedRoute>
                <ReceiveDetail />
              </ProtectedRoute>
            } />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
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