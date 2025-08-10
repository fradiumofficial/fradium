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

const MainLayout = () => {
  return (
    <div className="relative min-h-screen bg-background pb-16">
      <main>
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path={ROUTES.WELCOME} element={<Welcome />} />
        <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.HISTORY} element={<History />} />
          <Route path={ROUTES.DETAIL_HISTORY} element={<DetailHistory />} />
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
        <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
