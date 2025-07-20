import { saveAnalysisToHistory } from "@/lib/localStorage";
import type { ICPAnalysisResult, ICPAnalysisCommunityResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";

// Utility untuk menambahkan dummy data ke history (untuk testing)
export const addDummyHistoryData = () => {
  // Dummy ICP analysis result
  const dummyICPResult: ICPAnalysisResult = {
    transactions_analyzed: 150,
    threshold_used: 0.7,
    is_ransomware: false,
    address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    confidence_level: "HIGH",
    ransomware_probability: 0.05
  };

  const dummyRiskyICPResult: ICPAnalysisResult = {
    transactions_analyzed: 89,
    threshold_used: 0.7,
    is_ransomware: true,
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    confidence_level: "HIGH",
    ransomware_probability: 0.89
  };

  // Dummy community analysis result
  const dummyCommunityResult: ICPAnalysisCommunityResult = {
    is_safe: true,
    report: {
      url: null,
      report_id: 123,
      voted_by: ["principal1", "principal2"],
      votes_no: 2,
      chain: "Bitcoin",
      description: "Suspected ransomware activity",
      created_at: Date.now() - 86400000, // 1 day ago
      evidence: ["suspicious_transaction_pattern"],
      vote_deadline: Date.now() + 604800000, // 7 days from now
      address: "3FJ4EZVzFp4Pw1wYQYshbKn9Cq1K9vEuLm",
      category: "ransomware",
      votes_yes: 15,
      reporter: "community_reporter"
    }
  };

  try {
    // Tambahkan beberapa dummy data
    saveAnalysisToHistory("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", dummyICPResult, 'icp');
    saveAnalysisToHistory("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", dummyRiskyICPResult, 'icp');
    saveAnalysisToHistory("3FJ4EZVzFp4Pw1wYQYshbKn9Cq1K9vEuLm", dummyCommunityResult, 'community');
    
    console.log('Dummy history data added successfully!');
    return true;
  } catch (error) {
    console.error('Failed to add dummy history data:', error);
    return false;
  }
};

// Utility untuk clear semua history data (untuk testing)
export const clearAllHistoryData = () => {
  try {
    localStorage.removeItem('fradium_analysis_history');
    console.log('All history data cleared!');
    return true;
  } catch (error) {
    console.error('Failed to clear history data:', error);
    return false;
  }
};
