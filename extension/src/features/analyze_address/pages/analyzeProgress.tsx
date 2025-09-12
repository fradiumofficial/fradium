import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { CDN } from "~lib/constant/cdn";
import type { AnalysisResult, CommunityAnalysisResult } from "~types/analyze_model.type";
import { useAuth } from "~lib/context/authContext";
import AIAnalyzeService from "../../../service/aiAnalyzeService";
import type { CombinedAnalysisResult } from "../../../service/types";
import LocalStorageService from "~service/localStorageService";

// Remove the old backend import as we're using the new service

export default function AnalysisProgress() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const { isAuthenticated, identity } = useAuth();
  
  // Get data from navigation state
  const address = location.state?.address;
  const isAnalyzing = location.state?.isAnalyzing;

  const analysisSteps = [
    "Check if this address Already Flagged...",
    "Analyzing Address with AI...",
    "Analyzing Transaction Patterns...",
    "Checking Transaction History...",
    "Cross-referencing with Known Threats"
  ];

  useEffect(() => {
    // If not coming from analysis flow, redirect to home
    if (!isAnalyzing || !address) {
      navigate(ROUTES.HOME);
      return;
    }

    // Guard: must be authenticated
    if (!isAuthenticated || !identity) {
      navigate(ROUTES.ANALYZE_ADDRESS, { state: { error: "Please sign in first", address } });
      return;
    }

    // Kick off comprehensive AI and community analysis using the new service
    (async () => {
      try {
        console.log("Starting comprehensive address analysis...");

        // Use the new AI Analyze Service for comprehensive analysis
        const analysisResult: CombinedAnalysisResult = await AIAnalyzeService.analyzeAddress(address, {
          includeCommunity: true,
          timeout: 30000,
          maxRetries: 2
        });
        console.log("Comprehensive analysis result:", analysisResult);
        // Transform result for the existing result page format
        const result: AnalysisResult = {
          isSafe: analysisResult.result.isSafe,
          source: analysisResult.analysisSource === 'community' ? 'community' :
                 analysisResult.analysisSource === 'community_and_ai' ? 'ai_and_community' : 'ai',
          communityData: analysisResult.communityAnalysis ? {
            is_safe: analysisResult.communityAnalysis.isSafe,
            report: analysisResult.communityAnalysis.rawResult?.report ? [analysisResult.communityAnalysis.rawResult.report] : []
          } : undefined,
          tokenType: analysisResult.network.toLowerCase(),
          address: analysisResult.address,
          confidence: analysisResult.result.confidence,
          riskLevel: analysisResult.result.riskLevel,
          description: analysisResult.result.description,
          stats: analysisResult.result.stats,
          securityChecks: analysisResult.result.securityChecks,
          aiAnalysis: analysisResult.aiAnalysis,
          finalStatus: analysisResult.finalStatus
        };

        // Navigate to result page with the comprehensive analysis
        navigate(ROUTES.ANALYZE_ADDRESS_RESULT, {
          state: {
            result,
            address,
            analysisSource: analysisResult.analysisSource,
            finalStatus: analysisResult.finalStatus
          }
        });
      } catch (error) {
        console.error("Error during comprehensive address analysis:", error);

        // Handle different types of errors with appropriate user messages
        let errorMessage = "Analysis failed. Please try again.";
        if (error instanceof Error) {
          if (error.message.includes("not supported")) {
            errorMessage = error.message;
          } else if (error.message.includes("API key")) {
            errorMessage = "API configuration required. Please contact support to configure the necessary API keys for blockchain analysis.";
          } else if (error.message.includes("Connection") || error.message.includes("network")) {
            errorMessage = "Connection error. Please check your internet connection and try again.";
          } else if (error.message.includes("Invalid address")) {
            errorMessage = error.message;
          } else if (error.message.includes("Etherscan")) {
            errorMessage = "Blockchain data service temporarily unavailable. This may be due to high traffic or service maintenance.";
          } else {
            errorMessage = "Service temporarily unavailable. Please try again later.";
          }
        }

        // Update the analysis as failed in local storage
        const history = LocalStorageService.getHistory();
        const existingAnalysis = history.find(item =>
          item.address === address && item.status === 'in_progress'
        );

        if (existingAnalysis) {
        LocalStorageService.updateAnalysis(existingAnalysis.id, {
          status: 'failed' as const,
          date: new Date().toISOString(),
          analysisResult: {
            description: errorMessage,
            riskLevel: 'Unknown'
          }
        });
        }

        navigate(ROUTES.ANALYZE_ADDRESS, {
          state: {
            error: errorMessage,
            address
          }
        });
      }
    })();

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        // Keep cycling through steps while analysis is running
        if (prev >= analysisSteps.length - 1) {
          return 0; 
        }
        return prev + 1;
      });
    }, 2000);

    // Set a maximum timeout to prevent infinite loading
    const maxTimeout = setTimeout(() => {
      clearInterval(stepInterval);

      // Update the analysis as failed due to timeout
      const history = LocalStorageService.getHistory();
      const existingAnalysis = history.find(item =>
        item.address === address && item.status === 'in_progress'
      );

      if (existingAnalysis) {
        LocalStorageService.updateAnalysis(existingAnalysis.id, {
          status: 'failed' as const,
          date: new Date().toISOString(),
          analysisResult: {
            description: "Analysis timed out. Please try again.",
            riskLevel: 'Unknown'
          }
        });
      }

      // If still on this page after 5 minutes, go back to address form
      navigate(ROUTES.ANALYZE_ADDRESS, {
        state: {
          error: "Analysis timed out. Please try again.",
          address
        }
      });
    }, 300000); // 5 minutes

    return () => {
      clearInterval(stepInterval);
      clearTimeout(maxTimeout);
    };
  }, [isAnalyzing, address, navigate, analysisSteps.length, isAuthenticated, identity]);

  return (
    <div className="w-[375px] flex flex-col items-center p-[20px_20px_36px] gap-8 text-white overflow-y-auto">
      {/* Animated Circles */}
      <div className="w-[180px] h-[180px] relative flex-none flex-grow-0">
        {/* Ellipse 40 - Outer circle */}
        <div className="absolute w-[180px] h-[180px] left-[0.42px] top-[0.42px] rounded-full"
             style={{background: 'linear-gradient(180deg, rgba(153, 227, 158, 0.04) 0%, rgba(153, 227, 158, 0.02) 100%)'}} />

        {/* Ellipse 39 - Middle circle */}
        <div className="absolute w-[146.04px] h-[146.04px] left-[17.41px] top-[17.41px] rounded-full -rotate-90"
             style={{background: 'linear-gradient(180deg, rgba(153, 227, 158, 0.07) 0%, rgba(153, 227, 158, 0.035) 100%)'}} />

        {/* Ellipse 38 - Inner circle */}
        <div className="absolute w-[113.77px] h-[113.77px] left-[33.54px] top-[33.54px] rounded-full"
             style={{background: 'linear-gradient(180deg, rgba(153, 227, 158, 0.1) 0%, rgba(153, 227, 158, 0.05) 100%)'}} />

        {/* Image */}
        <div className="absolute w-[84.91px] h-[84.91px] left-[47.97px] top-[47.55px] flex items-center justify-center"
             style={{filter: 'drop-shadow(-4.24528px 4.24528px 16.9811px rgba(0, 0, 0, 0.25))'}}>
          <img src={CDN.icons.search} alt="Analysis in Progress" className="w-[84.91px] h-[84.91px] object-contain" draggable="false" />
        </div>
      </div>

      {/* Text Section */}
      <div className="w-[335px] flex flex-col items-center gap-3 flex-none flex-grow-0">
        {/* Show the address being analyzed */}
        {address && (
          <div className="w-[335px] font-sans font-normal text-[12px] leading-[140%] text-center tracking-[0.08em] text-white/60 flex-none flex-grow-0">
            TYPICALLY TAKES 2 MINS, HANG ON
          </div>
        )}

        <div className="w-[335px] font-sans font-semibold text-[14px] leading-[140%] text-center uppercase text-[#99E39E] flex-none flex-grow-0"
             style={{textShadow: '0px 8px 20px rgba(0, 0, 0, 0.8)'}}>
          ADDRESS ANALYSIS IS IN PROGRESS...
        </div>

        {/* Address Display */}
        {address && (
          <div className="w-[335px] font-mono text-[10px] text-center text-white/60 bg-white/5 p-2 rounded">
            Analyzing: {address}
          </div>
        )}
      </div>

      {/* Steps Section */}
      <div className="w-[335px] flex flex-col items-start gap-1 flex-none flex-grow-0">
        {analysisSteps.map((step, index) => (
          <div
            key={index}
            className={`w-[335px] font-sans font-normal text-[14px] leading-[140%] text-center transition-all duration-500 flex-none flex-grow-0 ${
              index === currentStep
                ? "text-[#99E39E] font-medium opacity-100"
                : index < currentStep
                  ? "text-white/60 opacity-80"
                  : "text-white/60 opacity-40"
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      <div className="flex-none flex-grow-0">
        <button
          onClick={() => {
            // Update the analysis as cancelled in local storage
            const history = LocalStorageService.getHistory();
            const existingAnalysis = history.find(item =>
              item.address === address && item.status === 'in_progress'
            );

            if (existingAnalysis) {
              LocalStorageService.updateAnalysis(existingAnalysis.id, {
                status: 'failed' as const,
                date: new Date().toISOString(),
                analysisResult: {
                  description: "Analysis cancelled by user",
                  riskLevel: 'Unknown'
                }
              });
            }

            navigate(ROUTES.ANALYZE_ADDRESS);
          }}
          className="w-[141px] h-[37px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] flex-none flex-grow-0"
        >
          <span className="w-[101px] h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent flex-none flex-grow-0">
            Cancel Analysis
          </span>
        </button>
      </div>
    </div>
  );
}