import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractFeatures, fetchTransactions } from "../api/AnalyzeAddressApi";
import { ROUTES } from "@/constants/routes";
import type { Transaction } from "../model/AnalyzeAddressModel";

export interface AnalyzeResult {
    features: number[];
    analyzedAddress: string;
}

export function useAnalyzeAddress() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = async (address: string) => {
        if (!address) {
            setError("Please enter a valid address.");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Step A: Fetch transactions for the entered address
            console.log(`Starting analysis for address: ${address}`);
            const transactions: Transaction[] = await fetchTransactions(address);

            if (!transactions || transactions.length === 0) {
                throw new Error("No transactions found for this address.");
            }

            // Step B: Extract the feature vector from the transactions
            const featureVector = extractFeatures(transactions, address);
            console.log("✅ Analysis Complete! Feature Vector:", featureVector);

            const result: AnalyzeResult = {
                features: featureVector,
                analyzedAddress: address
            };

            // Step C: Navigate to the result page with the feature vector and address
            navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { state: result });

        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "An unexpected error occurred.");
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