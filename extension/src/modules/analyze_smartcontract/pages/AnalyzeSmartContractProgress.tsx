import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { analyzeAddressSmartContract } from "../api/AnalyzeAddressSmartcontractApi";
import { saveAnalysisToHistory } from "@/lib/localStorage";
import Search from "../../../../../src/frontend/public/assets/images/analisis-progres.png";

export default function AnalyzeSmartContractProgress() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Get data from navigation state
  const address = location.state?.address;
  const isAnalyzing = location.state?.isAnalyzing;

  const analysisSteps = [
    "Connecting to Smart Contract Scanner...",
    "Analyzing Contract Bytecode...",
    "Checking for Known Vulnerabilities...",
    "Scanning Security Patterns...",
    "Generating Security Report..."
  ];

  useEffect(() => {
    // If not coming from analysis flow, redirect to smart contract page
    if (!isAnalyzing || !address) {
      navigate(ROUTES.ANALYZE_SMART_CONTRACT);
      return;
    }

    // Start analysis process
    const performAnalysis = async () => {
      try {
        const result = await analyzeAddressSmartContract(address);

        // Simpan ke localStorage
        const historyItem = saveAnalysisToHistory(address, result, 'smartcontract');
        console.log('Smart contract analysis saved to history:', historyItem);

        // Navigate ke halaman result dengan data
        navigate(ROUTES.ANALYZE_SMART_CONTRACT_RESULT, {
          state: {
            result,
            address,
            historyId: historyItem.id
          }
        });
      } catch (err) {
        console.error('Error analyzing smart contract:', err);
        navigate(ROUTES.ANALYZE_SMART_CONTRACT, {
          state: {
            error: (err as Error).message || 'Failed to analyze smart contract',
            address
          }
        });
      }
    };

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= analysisSteps.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    // Start the actual analysis
    performAnalysis();

    // Set a maximum timeout to prevent infinite loading
    const maxTimeout = setTimeout(() => {
      clearInterval(stepInterval);
      navigate(ROUTES.ANALYZE_SMART_CONTRACT, {
        state: {
          error: "Analysis timed out. Please try again.",
          address
        }
      });
    }, 120000); // 2 minutes timeout

    return () => {
      clearInterval(stepInterval);
      clearTimeout(maxTimeout);
    };
  }, [isAnalyzing, address, navigate, analysisSteps.length]);

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-hidden">
      <div className="px-4 py-12 w-full h-full flex flex-col items-center shadow-lg relative overflow-hidden">
        {/* Animated circles background */}
        <div className="mb-8 flex items-center justify-center w-full h-48 z-10 mx-auto relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {/* Ripple circles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute border-2 border-[#99E39E]/50 rounded-full bg-[#99E39E]/10"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{
                  scale: [0.5, 1.3, 2],
                  opacity: [1, 0.6, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut",
                }}
                style={{ width: "180px", height: "180px", left: "-90px", top: "-90px" }}
              />
            ))}
            {/* Middle steady circle */}
            <motion.div
              className="absolute border-2 border-[#99E39E]/70 rounded-full bg-[#99E39E]/15"
              animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "120px", height: "120px", left: "-60px", top: "-60px" }}
            />
            {/* Inner core circle */}
            <motion.div
              className="absolute border-2 border-[#99E39E]/90 rounded-full bg-[#99E39E]/25"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "90px", height: "90px", left: "-45px", top: "-45px" }}
            />
            {/* Search icon */}
            <motion.div
              className="absolute z-20 flex items-center justify-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "96px", height: "96px", left: "-48px", top: "-48px" }}>
              <img src={Search} alt="Analysis in Progress" className="w-24 h-24 object-contain" draggable="false" />
            </motion.div>
          </div>
        </div>

        {/* Show the address being analyzed */}
        {address && (
          <div className="text-[#B0B6BE] text-xs mb-4 text-center tracking-wide px-4">
            <div className="bg-white/5 p-2 rounded font-mono text-[10px] break-all">
              Analyzing Smart Contract: {address}
            </div>
          </div>
        )}

        <div className="text-[#B0B6BE] text-xs mb-2 text-center tracking-wide uppercase z-10">
          TYPICALLY TAKES 1-2 MINS, HANG ON
        </div>
        <div className="text-[#99E39E] text-lg font-bold mb-4 text-center z-10">
          SMART CONTRACT ANALYSIS IN PROGRESS...
        </div>
        <div className="text-[#B0B6BE] text-sm text-center space-y-1 z-10">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={index}
              className={`transition-all duration-500 relative ${index === currentStep
                ? "text-[#99E39E] font-medium opacity-100"
                : index < currentStep
                  ? "text-[#B0B6BE] opacity-70"
                  : "text-[#B0B6BE] opacity-40"
                }`}
              animate={{ scale: index === currentStep ? 1.05 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="relative flex items-center justify-center">
                <span className="relative z-10">{step}</span>
                {index === currentStep && (
                  <motion.div
                    className="absolute inset-0 bg-[#99E39E]/10 rounded-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cancel button */}
        <div className="mt-8 z-10">
          <button
            onClick={() => navigate(ROUTES.ANALYZE_SMART_CONTRACT)}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded transition-colors text-sm"
          >
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
