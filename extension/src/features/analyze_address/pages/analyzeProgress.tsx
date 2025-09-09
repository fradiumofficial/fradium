import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { CDN } from "~lib/constant/cdn";
import type { AnalysisResult, CommunityAnalysisResult } from "~types/analyze_model.type";
import { useAuth } from "~lib/context/authContext";
import AIAnalyzeService from "../../../service/aiAnalyzeService";
import type { CombinedAnalysisResult } from "../../../service/types";

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
    "Checking Community Reports...", 
    "Analyzing Address with AI...", 
    "Processing Transaction Patterns...", 
    "Checking Security Database...", 
    "Finalizing Risk Assessment..."
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
          source: analysisResult.analysisSource,
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
          } else if (error.message.includes("Connection") || error.message.includes("network")) {
            errorMessage = "Connection error. Please check your internet connection and try again.";
          } else if (error.message.includes("Invalid address")) {
            errorMessage = error.message;
          } else {
            errorMessage = "Service temporarily unavailable. Please try again later.";
          }
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
    <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
      <div className="px-4 py-12 w-full h-full flex flex-col items-center shadow-lg relative overflow-hidden">
        {/* Animated circles background (CSS-based to avoid runtime issues) */}
        <div className="mb-8 flex items-center justify-center w-full h-48 z-10 mx-auto relative">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full border-2 border-[#99E39E]/50 bg-[#99E39E]/10 animate-ping" />
            <div className="absolute inset-4 rounded-full border-2 border-[#99E39E]/70 bg-[#99E39E]/15 animate-pulse" />
            <div className="absolute inset-8 rounded-full border-2 border-[#99E39E]/90 bg-[#99E39E]/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={CDN.icons.search} alt="Analysis in Progress" className="w-24 h-24 object-contain" draggable="false" />
            </div>
          </div>
        </div>

        {/* Show the address being analyzed */}
        {address && (
          <div className="text-[#B0B6BE] text-xs mb-4 text-center tracking-wide px-4">
            <div className="bg-white/5 p-2 rounded font-mono text-[10px] break-all">
              Analyzing: {address}
            </div>
          </div>
        )}

        <div className="text-[#B0B6BE] text-xs mb-2 text-center tracking-wide uppercase z-10">
          TYPICALLY TAKES 2 MINS, HANG ON
        </div>
        <div className="text-[#99E39E] text-lg font-bold mb-4 text-center z-10">
          ADDRESS ANALYSIS IS IN PROGRESS...
        </div>
        <div className="text-[#B0B6BE] text-sm text-center space-y-1 z-10">
          {analysisSteps.map((step, index) => (
            <div
              key={index}
              className={`transition-all duration-500 relative ${
                index === currentStep 
                  ? "text-[#99E39E] font-medium opacity-100 scale-[1.03]" 
                  : index < currentStep 
                    ? "text-[#B0B6BE] opacity-70" 
                    : "text-[#B0B6BE] opacity-40"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="relative z-10">{step}</span>
                {index === currentStep && (
                  <div className="absolute inset-0 bg-[#99E39E]/10 rounded-md animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cancel button */}
        <div className="mt-8 z-10">
          <button
            onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded transition-colors text-sm"
          >
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
  );
}