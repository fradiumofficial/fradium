import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Hanya impor fungsi dan tipe yang relevan untuk analisis komunitas
import { analyzeAddressCommunity } from "../../api/AnalyzeAddressApi";
import type { CommunityAnalysisResult } from "../../model/AnalyzeAddressModel";
import { ROUTES } from "@/constants/routes";
import { saveAnalysisToHistory } from "@/lib/localStorage";

/**
 * Hook untuk mengelola logika analisis alamat HANYA menggunakan canister Komunitas.
 * Menangani state loading, error, dan alur navigasi.
 */
export const useAddressAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (address: string) => {
    setLoading(true);
    setError(null);

    // 1. Langsung navigasi ke halaman progress untuk UX yang lebih baik
    navigate(ROUTES.ANALYZE_PROGRESS, { state: { address, isAnalyzing: true } });

    try {
      // 2. Jalankan analisis komunitas
      console.log('Starting community analysis...');
      const result: CommunityAnalysisResult = await analyzeAddressCommunity(address);

      // 3. Jika berhasil, simpan riwayat dan navigasi ke halaman hasil
      console.log('Analysis successful. Navigating to result page.');
      saveAnalysisToHistory(address, result, 'community');
      
      navigate(ROUTES.ANALYZE_ADDRESS_COMMUNITY_RESULT, {
        state: { result, address },
        replace: true
      });

    } catch (err) {
      // 4. Jika terjadi error, tangani dan navigasi ke halaman gagal
      console.error('A critical error occurred during community analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);

      navigate(ROUTES.FAILED, {
        state: { error: errorMessage, address },
        replace: true
      });
    } finally {
      // 5. Pastikan loading selalu diatur ke false setelah selesai
      setLoading(false);
    }
  };

  return { startAnalysis, loading, error };
};