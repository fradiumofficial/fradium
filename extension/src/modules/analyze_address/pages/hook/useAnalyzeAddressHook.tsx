import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { performComprehensiveAnalysis } from "@/lib/backgroundMessaging";
import { detectTokenType, TokenType } from "@/lib/tokenUtils";
import type { AnalysisResult, AnalysisOptions } from "../../model/AnalyzeAddressModel";
import { ROUTES } from "@/constants/routes";
import { saveComprehensiveAnalysisToScanHistory } from "@/lib/localStorage";

/**
 * Hook untuk mengelola logika analisis alamat menggunakan kombinasi Community dan AI.
 * Menangani state loading, error, dan alur navigasi.
 */
export const useAddressAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (address: string, _options: AnalysisOptions = {}) => {
    setLoading(true);
    setError(null);

    // 1. Navigate to progress page for better UX
    navigate(ROUTES.ANALYZE_PROGRESS, { state: { address, isAnalyzing: true } });

    try {
      const tokenType = detectTokenType(address);
      
      // Validate token type
      if (tokenType === TokenType.UNKNOWN) {
        throw new Error("Unsupported address format. Please provide a valid Bitcoin, Ethereum, or Solana address.");
      }

      console.log('Starting comprehensive analysis via background script...');
      
      // Use background script for comprehensive analysis
      const response = await performComprehensiveAnalysis(address);
      
      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      const finalResult: AnalysisResult = response.data;

      // 2. Save to scan history and navigate to result page
      console.log('Analysis successful. Saving to scan history and navigating to result page.');
      try {
        saveComprehensiveAnalysisToScanHistory(finalResult);
      } catch (saveError) {
        console.warn('Failed to save to scan history:', saveError);
        // Continue with navigation even if save fails
      }
      
      navigate(ROUTES.ANALYZE_ADDRESS_COMMUNITY_RESULT, {
        state: { result: finalResult, address },
        replace: true
      });

    } catch (err) {
      // 3. Handle errors and navigate to failure page
      console.error('A critical error occurred during analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);

      navigate(ROUTES.FAILED, {
        state: { error: errorMessage, address },
        replace: true
      });
    } finally {
      // 4. Ensure loading is always set to false after completion
      setLoading(false);
    }
  };

  return { startAnalysis, loading, error };
};