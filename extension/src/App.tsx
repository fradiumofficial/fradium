import Home from "./features/home/Home"
import { ThemeProvider } from "./components/ui/theme-provider"
import AnalyzeAddress from "./features/analyze_address/AnalyzeAdress"
import AnalyzeSmartContract from "./features/analyze_smartcontract/AnalyzeSmartContract"
import { Route, Routes } from "react-router-dom"
import { ROUTES } from "./constants/routes"
import AnalyzeAdressResult from "./features/analyze_address/AnalyzeAddressResult"

function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ANALYZE_ADDRESS} element={<AnalyzeAddress />} />
        <Route path={ROUTES.ANALYZE_SMART_CONTRACT} element={<AnalyzeSmartContract />} />
        <Route path={ROUTES.ANALYZE_ADDRESS_RESULT} element={<AnalyzeAdressResult />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App