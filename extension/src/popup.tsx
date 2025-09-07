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

function IndexPopup() {
  return (
    <BrowserRouter >
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path={ROUTES.WELCOME} element={<Welcome />}/>
            {/* Default route - show Home page directly */}
            <Route path="/" element={<Navigate to={ROUTES.WELCOME} replace />} />
            <Route path={ROUTES.WALLET_CONFIRMATION} element={<WalletConfirmation />} />
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.AI_ANALYZER} element={<AnalyzeAddress />} />
            <Route path={ROUTES.ANALYZE_ADDRESS} element={<AnalyzeAddress />} />
            <Route path={ROUTES.ANALYZE_ADDRESS_RESULT} element={<AnalyzeAddressResult />} />
            <Route path={ROUTES.ANALYZE_PROGRESS} element={<AnalyzeProgress />} />
            <Route path={ROUTES.HISTORY} element={<History />} />
            <Route path={ROUTES.SCAN_HISTORY} element={<ScanHistory />} />
            <Route path={ROUTES.DETAIL_HISTORY} element={<DetailHistory />} />
            <Route path={ROUTES.TX_DETAIL} element={<TxDetail />} />
            <Route path={ROUTES.ACCOUNT} element={<Account />} />
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </div>
        
        {/* Bottom Navigation Bar */}
        <div className="flex-shrink-0">
          <BottomNavbar />
        </div>
      </div>
    </BrowserRouter>
  )
}

export default IndexPopup