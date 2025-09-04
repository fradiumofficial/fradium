// Dependency
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Declarations
import { fradium_token as token } from "declarations/fradium_token";
import { backend as backend } from "declarations/backend";

// Global Style
import "@/core/style/global.css";

// Provider
import { AuthProvider } from "@/core/providers/AuthProvider.jsx";

// Layouts
import HomeLayout from "@/core/components/layouts/HomeLayout.jsx";
import WalletLayout from "@/core/components/layouts/WalletLayout.jsx";

// Auth
import AuthGuard from "@/core/components/auth/AuthGuard.jsx";

// Pages
import HomePage from "@/pages/home/HomePage.jsx";
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
import AssistantPage from "@/pages/assistant/AssistantPage.jsx";

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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{
          opacity: 0,
          filter: "blur(25px) saturate(0%) contrast(300%) brightness(0.5)",
        }}
        animate={{
          opacity: 1,
          filter: "blur(0px) saturate(100%) contrast(100%) brightness(1)",
        }}
        exit={{
          opacity: 0,
          filter: "blur(20px) saturate(30%) contrast(200%) brightness(1.2)",
        }}
        transition={{
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
          filter: { duration: 1.0 },
        }}>
        <Routes location={location}>
          <Route path="/" element={<HomeLayout />}>
            <Route path="/" element={<HomePage />} />
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
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="*" element={<NotFoundPage />} />
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
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <NProgressRouter />
      <AuthProvider canisters={{ token, backend }}>
        <AnimatedRoutes />
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </BrowserRouter>
  </StrictMode>
);
