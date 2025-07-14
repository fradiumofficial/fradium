import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { performCompleteAnalysis } from "../api/AnalyzeAddressApi";
import { ROUTES } from "@/constants/routes";
import type { AnalyzeResult } from "../model/AnalyzeAddressModel";

export function useAnalyzeAddress() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = async (address: string) => {
        if (!address) {
            setError("Please enter a valid address.");
            return null;
        }

        // Basic Bitcoin address validation
        if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address)) {
            setError("Please enter a valid Bitcoin address.");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔍 Starting complete analysis for address: ${address}`);
            
            // Perform the complete analysis (fetch transactions, extract features, analyze with AI)
            const result: AnalyzeResult = await performCompleteAnalysis(address);

            console.log(`✅ Analysis completed successfully!`, result);

            // Navigate to result page with the analysis result
            navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { state: { result } });

            return result;

        } catch (err: any) {
            console.error("❌ Analysis failed:", err);
            const errorMessage = err.message || "An unexpected error occurred during analysis.";
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        analyze
    };
}