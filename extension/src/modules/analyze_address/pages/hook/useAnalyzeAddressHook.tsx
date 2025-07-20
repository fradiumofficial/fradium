import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeAddressCommunity } from "../../api/AnalyzeAddressApi";
import { ROUTES } from "@/constants/routes";
import { saveAnalysisToHistory } from "@/lib/localStorage";
import type { ICPAnalysisCommunityResult } from "../../model/AnalyzeAddressModel";

// Tipe data untuk hasil analisis agar lebih jelas
type CommunityResult = ICPAnalysisCommunityResult;
// type IcpResult = ICPAnalysisResult;

/**
 * Hook untuk mengelola logika analisis alamat.
 * Menangani state loading, error, dan alur navigasi.
 */
export const useAddressAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (address: string) => {
    setLoading(true);
    setError(null);
    console.log('Starting analysis for address:', address);

    // 1. Langsung navigasi ke halaman progress
    navigate(ROUTES.ANALYZE_PROGRESS, { state: { address, isAnalyzing: true } });

    try {
      // 2. Analisis Komunitas (dengan penanganan error internal)
      console.log('Step 1: Starting community analysis...');
      const communityResult: CommunityResult | null = await analyzeAddressCommunity(address)
        .catch(communityError => {
          // Jika analisis komunitas gagal, catat error tapi lanjutkan ke ICP
          console.error("Community analysis failed, continuing to ICP analysis...", communityError);
          return null; // Kembalikan null agar alur bisa lanjut
        });

      // 3. Cek hasil komunitas: Jika tidak aman, berhenti dan tampilkan hasil
      // if (communityResult?.is_safe === false) {
      console.log('Address flagged by community, showing result and stopping.');
      
      // Simpan hasil community analysis ke history
      saveAnalysisToHistory(address, communityResult!, 'community');
      
      navigate(ROUTES.ANALYZE_ADDRESS_COMMUNITY_RESULT, {
        state: { result: communityResult, address },
        replace: true
      });
      //   return; // Hentikan eksekusi lebih lanjut
      // }

      // 4. Analisis ICP (jika komunitas aman atau gagal)
      // console.log('Step 2: Starting ICP analysis...');
    //   const icpResult: IcpResult = await analyzeAddress(address);
    //   console.log("ICP Analysis Result:", icpResult);

      // 5. Simpan hasil ICP analysis ke history
    //   saveAnalysisToHistory(address, icpResult, 'icp');

      // 6. Navigasi ke halaman hasil ICP
    //   navigate(ROUTES.ANALYZE_ADDRESS_RESULT, {
    //     state: { result: icpResult, address },
    //     replace: true
    //   });

    } catch (err) {
      // Tangani error fatal (misalnya dari analisis ICP)
      console.error('A critical error occurred during analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      navigate(ROUTES.FAILED, {
        state: { error: errorMessage, address },
        replace: true
      });
    } finally {
      // Pastikan loading selalu diatur ke false setelah selesai
      setLoading(false);
    }
  };

  return { startAnalysis, loading, error };
};