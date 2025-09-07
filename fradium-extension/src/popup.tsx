import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom"
import AnalyzeAddressResult from "~features/analyze_address/pages/analyzeAddressResult"
import AnalyzeAddress from "~features/analyze_address/pages/analyzeAdress"
import AnalyzeProgress from "~features/analyze_address/pages/analyzeProgress"
import DetailHistory from "~features/history/pages/detailHistory"
import ScanHistory from "~features/history/pages/scanHistory"
import Home from "~features/home/pages/home"
import Account from "~features/preferences/pages/account"
import History from "~features/history/pages/history"
import TxDetail from "~features/history/pages/transactionDetail"
import { ROUTES } from "~lib/constant/routes"

import "~style.css"

function Popup() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ANALYZE_ADDRESS} element={<AnalyzeAddress />} />
        <Route path={ROUTES.ANALYZE_ADDRESS_RESULT} element={<AnalyzeAddressResult />} />
        <Route path={ROUTES.HISTORY} element={<History />} />
        <Route path={ROUTES.SCAN_HISTORY} element={<ScanHistory />} />
        <Route path={ROUTES.DETAIL_HISTORY} element={<DetailHistory />} />
        <Route path={ROUTES.TX_DETAIL} element={<TxDetail />} />
        <Route path={ROUTES.ACCOUNT} element={<Account />} />
        <Route path={ROUTES.ANALYZE_PROGRESS} element={<AnalyzeProgress />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Popup