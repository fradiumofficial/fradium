import React from "react"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import BottomNavbar from "~components/bottom-app-bar"
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
import Welcome from "~features/landing/pages/welcome"
import WalletConfirmation from "~features/landing/pages/createWallet"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 *
 * Tailwind CSS relies on `rem` units, which are based on the root font size (typically defined on the <html>
 * or <body> element). However, in a Shadow DOM (as used by Plasmo), there is no native root element, so the
 * rem values would reference the actual page's root font size—often leading to sizing inconsistencies.
 *
 * To address this, we:
 * 1. Replace the `:root` selector with `:host(plasmo-csui)` to properly scope the styles within the Shadow DOM.
 * 2. Convert all `rem` units to pixel values using a fixed base font size, ensuring consistent styling
 *    regardless of the host page's font size.
 */
export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize

    return `${pixelsValue}px`
  })

  const styleElement = document.createElement("style")

  styleElement.textContent = updatedCssText

  return styleElement
}

const PlasmoOverlay = () => {
  return (
    <div className="plasmo-z-50 plasmo-fixed plasmo-top-4 plasmo-right-4 plasmo-w-[375px] plasmo-h-[600px] plasmo-bg-[#25262B] plasmo-rounded-lg plasmo-shadow-2xl plasmo-overflow-hidden plasmo-flex plasmo-flex-col">
      <BrowserRouter>
        {/* Main Content Area */}
        <div className="plasmo-flex-1 plasmo-overflow-y-auto">
          <Routes>
            <Route path={ROUTES.WELCOME} element={<Welcome />}/>
            {/* Default route shows welcome page */}
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
        <div className="plasmo-flex-shrink-0">
          <BottomNavbar />
        </div>
      </BrowserRouter>
    </div>
  )
}

export default PlasmoOverlay
