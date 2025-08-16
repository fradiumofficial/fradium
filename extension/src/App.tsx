import Home from "./modules/home/pages/Home";
import { ThemeProvider } from "./components/ui/theme-provider";
import AnalyzeAddress from "./modules/analyze_address/pages/AnalyzeAdress";
import AnalyzeSmartContract from "./modules/analyze_smartcontract/pages/AnalyzeSmartContract";
import AnalyzeSmartContractResult from "./modules/analyze_smartcontract/pages/AnalyzeSmartContractResult";
import AnalyzeSmartContractProgress from "./modules/analyze_smartcontract/pages/AnalyzeSmartContractProgress";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import AnalyzeAdressResult from "./modules/analyze_address/pages/AnalyzeAddressResult";
import DetailHistory from "./modules/history/pages/DetailHistory";
import History from "./modules/history/pages/History";
import AnalysisProgress from "./modules/analyze_address/pages/AnalyzeProgress";
import Failed from "./modules/SEO/Failed";
import AnalyzeAddressCommunityResult from "./modules/analyze_address/pages/AnalyzeAddressCommunityResult";
import Welcome from "./modules/onboarding/Welcome";
import BottomNavbar from "./components/ui/bottom-appbar";
import Account from "./modules/account/pages/Account";
import ScanHistory from "./modules/history/pages/ScanHistory";
import AIAnalyzer from "./modules/ai_analyzer/AIAnalyzer";
import Setting from "./modules/account/pages/Setting";
import AllNetwork from "./modules/all_network/pages/AllNetwork";
import { NetworkProvider } from "./modules/all_network/networkContext";
import { AuthProvider } from "./lib/authContext";
import { WalletProvider } from "./lib/walletContext";
import CreateWallet from "./modules/wallet/pages/CreateWallet";
import AuthGuard from "./lib/AuthGuard";

const MainLayout = () => {
  return (
    <div className="relative w-[375px] h-[600px] overflow-hidden bg-[#25262B]">
      <main className="w-full h-full">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <WalletProvider>
          <NetworkProvider>
          <Routes>
            <Route path={ROUTES.WELCOME} element={<Welcome />} />
            <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
            
            {/* Wallet Routes */}
            <Route path={ROUTES.CREATE_WALLET} element={<AuthGuard><CreateWallet /></AuthGuard>} />
            
            <Route element={<MainLayout />}>
              <Route path={ROUTES.HOME} element={<AuthGuard><Home /></AuthGuard>} />
              <Route path={ROUTES.HISTORY} element={<History />} />
              <Route path={ROUTES.SCAN_HISTORY} element={<ScanHistory />} />
              <Route path={ROUTES.DETAIL_HISTORY} element={<DetailHistory />} />
              <Route path={ROUTES.ACCOUNT} element={<Account />} />
              <Route path={ROUTES.SETTING} element={<Setting />} />
              <Route path={ROUTES.ALL_NETWORK} element={<AllNetwork />} />

              <Route path={ROUTES.AI_ANALYZER} element={<AIAnalyzer />} />
              <Route path={ROUTES.ANALYZE_ADDRESS} element={<AnalyzeAddress />} />
              <Route
                path={ROUTES.ANALYZE_SMART_CONTRACT}
                element={<AnalyzeSmartContract />}
              />
              <Route
                path={ROUTES.ANALYZE_ADDRESS_RESULT}
                element={<AnalyzeAdressResult />}
              />
              <Route
                path={ROUTES.ANALYZE_SMART_CONTRACT_RESULT}
                element={<AnalyzeSmartContractResult />}
              />
              <Route
                path={ROUTES.ANALYZE_SMART_CONTRACT_PROGRESS}
                element={<AnalyzeSmartContractProgress />}
              />
              <Route
                path={ROUTES.ANALYZE_PROGRESS}
                element={<AnalysisProgress />}
              />
              <Route path={ROUTES.FAILED} element={<Failed />} />
              <Route
                path={ROUTES.ANALYZE_ADDRESS_COMMUNITY_RESULT}
                element={<AnalyzeAddressCommunityResult />}
              />
            </Route>
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
          </NetworkProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
