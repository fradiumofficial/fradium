// Dependency
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";

// Declarations
import { fradium_token as token } from "declarations/fradium_token";
import { backend as backend } from "declarations/backend";
import { wallet as wallet } from "declarations/wallet";
import { fradium_ledger as fradium_ledger } from "declarations/fradium_ledger";
import { icp_ledger as icp_ledger } from "declarations/icp_ledger";
import { fradium_index as fradium_index } from "declarations/fradium_index";
import { icp_index as icp_index } from "declarations/icp_index";
import { ckbtc_ledger as ckbtc_ledger } from "declarations/ckbtc_ledger";
import { ckbtc_index as ckbtc_index } from "declarations/ckbtc_index";
import { ckbtc_minter as ckbtc_minter } from "declarations/ckbtc_minter";
import { ckbtc_kyt as ckbtc_kyt } from "declarations/ckbtc_kyt";
import { cketh_ledger as cketh_ledger } from "declarations/cketh_ledger";
import { cketh_index as cketh_index } from "declarations/cketh_index";

// Global Style
import "@/core/style/global.css";

// Provider
import { AuthProvider } from "@/core/providers/AuthProvider.jsx";

// Layouts
import HomeLayout from "@/core/components/layouts/HomeLayout.jsx";
import WalletLayout from "@/core/components/layouts/WalletLayout.jsx";
import EscrowLayout from "@/core/components/layouts/EscrowLayout.jsx";
import PaylinkLayout from "@/core/components/layouts/PaylinkLayout.jsx";
import SimplePaymentLayout from "@/core/components/layouts/SimplePaymentLayout.jsx";

// Auth
import AuthGuard from "@/core/components/auth/AuthGuard.jsx";

// Pages
import Home from "@/pages/home/Home.jsx";
import NotFoundPage from "@/pages/SEO/NotFoundPage.jsx";
import ListReportPage from "@/pages/report/ListReportPage.jsx";
import ReportPage from "@/pages/report/DetailReportPage.jsx";
import CreateReportPage from "@/pages/report/CreateReportPage.jsx";
import FaucetPage from "@/pages/wallet/FaucetPage.jsx";
import BalancePage from "@/pages/wallet/BalancePage.jsx";
import MyReportPage from "@/pages/report/MyReportPage.jsx";
import AssetsPage from "@/pages/wallet/AssetPage.jsx";
import AnalyzeAddressPage from "@/pages/wallet/AnalyzeAddressPage.jsx";
import AnalyzeContractPage from "@/pages/wallet/AnalyzeContractPage.jsx";
import TransactionHistoryPage from "@/pages/wallet/TransactionHistoryPage.jsx";
import ScanHistoryPage from "@/pages/wallet/ScanHistoryPage.jsx";
import SettingPage from "@/pages/wallet/SettingPage.jsx";
import ProductsExtension from "@/pages/products/ProductsExtensionPage.jsx";
import ProductsWallet from "@/pages/products/ProductsWalletPage.jsx";
import ProductsPaylink from "@/pages/products/ProductsPaylinkPage.jsx";
import ProductsEscrow from "@/pages/products/ProductsEscrowPage.jsx";
import AssistantPage from "@/pages/assistant/AssistantPage.jsx";
import EscrowHistoryPage from "@/pages/escrow/EscrowHistoryPage.jsx";
import CreateEscrowPage from "@/pages/escrow/CreateEscrowPage.jsx";
import P2PTradePage from "@/pages/escrow/P2PTradePage.jsx";
import MyEscrowPage from "@/pages/escrow/MyEscrowPage.jsx";
import EscrowDetailPage from "@/pages/escrow/EscrowDetailPage.jsx";
import PricingPage from "@/pages/developers/PricingPage.jsx";
import DeveloperPage from "@/pages/developers/DeveloperPage.jsx";
import APILayout from "@/core/components/layouts/APILayout.jsx";
import OverviewPage from "@/pages/developers/api/OverviewPage.jsx";
import AnalyzeHistoryPage from "@/pages/developers/api/AnalyzeHistoryPage.jsx";
import AccessTokenPage from "@/pages/developers/api/AccessTokenPage.jsx";
import APICreditsPage from "@/pages/developers/api/APICreditsPage.jsx";
import TryAPIPage from "@/pages/developers/api/TryAPIPage.jsx";
import PaymentLinksPage from "@/pages/payment-links/PaymentLinksPage.jsx";
import PaymentRequestPage from "@/pages/payment-links/PaymentRequestPage.jsx";

// NProgress
NProgress.configure({
  minimum: 0.3,
  easing: "ease",
  speed: 800,
  showSpinner: false,
});

const customStyles = `
  #nprogress .bar {
    background: #10b981 !important;
    height: 3px !important;
  }
  #nprogress .peg {
    box-shadow: 0 0 10px #10b981, 0 0 5px #10b981 !important;
  }
  
  /* Pixelate Immersive Transition Styles */
  .route-fade-enter {
    opacity: 0;
    filter: blur(25px) saturate(0%) contrast(300%) brightness(0.5);
  }
  
  .route-fade-enter-active {
    opacity: 1;
    filter: blur(0px) saturate(100%) contrast(100%) brightness(1);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .route-fade-exit {
    opacity: 1;
    filter: blur(0px) saturate(100%) contrast(100%) brightness(1);
  }
  
  .route-fade-exit-active {
    opacity: 0;
    filter: blur(20px) saturate(30%) contrast(200%) brightness(1.2);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);

function NProgressRouter() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    NProgress.start();

    const timer = setTimeout(() => {
      NProgress.done();
    }, 500);

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    return () => {
      clearTimeout(timer);
      NProgress.remove();
    };
  }, [location, navigationType]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  // Determine layout key - only animate when switching between different layouts
  const layoutKey = location.pathname.startsWith("/wallet") ? "wallet" : location.pathname.startsWith("/escrow") ? "escrow" : "home";

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        {/* Home Routes */}
        <Route path="/" element={<HomeLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/reports" element={<ListReportPage />} />
          <Route path="/reports/create" element={<CreateReportPage />} />
          <Route path="/reports/:id" element={<ReportPage />} />
          <Route
            path="/my-report"
            element={
              <AuthGuard>
                <MyReportPage />
              </AuthGuard>
            }
          />
          <Route path="/faucet" element={<FaucetPage />} />
          <Route path="/products" element={<ProductsExtension />} />
          <Route path="/products-wallet" element={<ProductsWallet />} />
          <Route path="/products-escrow" element={<ProductsEscrow />} />
          <Route path="/products-paylink" element={<ProductsPaylink />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/developer-overview" element={<DeveloperPage />} />
          <Route path="/developer-pricing" element={<PricingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ✅ PUBLIC Payment Request Route with Simple Layout */}
        <Route element={<SimplePaymentLayout />}>
          <Route path="/paylink/:linkId" element={<PaymentRequestPage />} />
        </Route>

        {/* ✅ PROTECTED Paylink Management Routes - Requires login */}
        <Route
          path="/paylink"
          element={
            <AuthGuard isRedirectToLogin>
              <PaylinkLayout />
            </AuthGuard>
          }>
          <Route index element={<PaymentLinksPage />} />
          <Route path="create" element={<PaymentLinksPage />} />
          <Route path="manage" element={<PaymentLinksPage />} />
        </Route>

        {/* Wallet Routes */}
        <Route
          path="/developer"
          element={
            <AuthGuard isRedirectToLogin>
              <APILayout />
            </AuthGuard>
          }>
          <Route index element={<OverviewPage />} />
          <Route path="analyze-history" element={<AnalyzeHistoryPage />} />
          <Route path="access-token" element={<AccessTokenPage />} />
          <Route path="api-credits" element={<APICreditsPage />} />
          <Route path="try-api" element={<TryAPIPage />} />
        </Route>
        <Route
          path="/wallet"
          element={
            <AuthGuard isRedirectToLogin>
              <WalletLayout />
            </AuthGuard>
          }>
          <Route index element={<AssetsPage />} />
          <Route path="analyze-address" element={<AnalyzeAddressPage />} />
          <Route path="analyze-contract" element={<AnalyzeContractPage />} />
          <Route path="transaction-history" element={<TransactionHistoryPage />} />
          <Route path="scan-history" element={<ScanHistoryPage />} />
          <Route path="setting" element={<SettingPage />} />
        </Route>

        {/* Escrow Routes */}
        <Route
          path="/escrow"
          element={
            <AuthGuard isRedirectToLogin>
              <EscrowLayout />
            </AuthGuard>
          }>
          <Route index element={<P2PTradePage />} />
          <Route path="create" element={<CreateEscrowPage />} />
          <Route path="list" element={<P2PTradePage />} />
          <Route path="my-escrow" element={<MyEscrowPage />} />
          <Route path="detail/:escrowId" element={<EscrowDetailPage />} />
          <Route path="history" element={<EscrowHistoryPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NProgressRouter />
    <AuthProvider canisters={{ token, backend, wallet, fradium_ledger, icp_ledger, fradium_index, icp_index, ckbtc_ledger, ckbtc_index, ckbtc_minter, ckbtc_kyt, cketh_ledger, cketh_index }}>
      <AnimatedRoutes />
    </AuthProvider>
    <Toaster
      position="bottom-center"
      containerStyle={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 50,
        pointerEvents: "none",
        zIndex: 99999,
      }}
      toastOptions={{
        duration: 2000,
        style: {
          background: "#23272F",
          color: "#B0B6BE",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          zIndex: 99999,
          pointerEvents: "auto",
        },
      }}
    />
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
  </BrowserRouter>
);
