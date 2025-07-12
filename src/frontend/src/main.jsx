import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./core/style/global.css";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import HomePage from "./pages/home-page.jsx";
import NotFoundPage from "./pages/SEO/not-found-page";
import TransactionPage from "./pages/transaction.jsx";
import AnalyseAddressPage from "./pages/analyse-address.jsx";
import AnalyseContractPage from "./pages/analyse-contract.jsx";
import TransactionHistoryPage from "./pages/transaction-history.jsx";
import ScanHistoryPage from "./pages/scan-history.jsx";
import SettingPage from "./pages/setting.jsx";
import LogoutPage from "./pages/logout.jsx";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <NProgressRouter />
      <Routes>
        <Route path="/" element={<TransactionPage />} />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/analyse-address" element={<AnalyseAddressPage />} />
        <Route path="/analyse-contract" element={<AnalyseContractPage />} />
        <Route path="/transaction-history" element={<TransactionHistoryPage />} />
        <Route path="/scan-history" element={<ScanHistoryPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </BrowserRouter>
  </StrictMode>
);
