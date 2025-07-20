export interface ICPAnalysisResult {
  transactions_analyzed: number;
  threshold_used: number;
  is_ransomware: boolean;
  address: string;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  ransomware_probability: number;
}

export interface ICPAnalysisCommunityResult {
  report?: CommunityReport | null;
  is_safe: boolean;
}

export interface CommunityReport {
  url?: string | null;
  report_id: number;
  voted_by: string[]; // Array of principal IDs as strings
  votes_no: number;
  chain: string;
  description: string;
  created_at: number; // Timestamp as number (int in Candid)
  evidence: string[];
  vote_deadline: number; // Timestamp as number (int in Candid)
  address: string;
  category: ReportCategory;
  votes_yes: number;
  reporter: string; // Principal as string
}

export type ReportCategory = 
  | "scam" 
  | "phishing" 
  | "ransomware" 
  | "malware" 
  | "fraud" 
  | "suspicious" 
  | "other";

// Wrapper untuk response dari canister (dengan variant Result)
export interface CommunityAnalysisResponse {
  Ok?: ICPAnalysisCommunityResult;
  Err?: string;
}

// Helper type untuk handling optional report
export interface SafetyReport {
  hasSafetyReport: boolean;
  reportDetails?: CommunityReport;
  isSafeAddress: boolean;
  totalVotes: number;
  riskScore: number;
}

// Helper functions untuk menggunakan model ini
export const parseCommunityAnalysisResponse = (
  response: CommunityAnalysisResponse
): ICPAnalysisCommunityResult | null => {
  if (response.Ok) {
    return response.Ok;
  }
  console.error("Community analysis error:", response.Err);
  return null;
};

export const calculateRiskScore = (report: CommunityReport): number => {
  const totalVotes = report.votes_yes + report.votes_no;
  if (totalVotes === 0) return 0;
  return (report.votes_yes / totalVotes) * 100;
};

export const getSafetyReport = (result: ICPAnalysisCommunityResult): SafetyReport => {
  return {
    hasSafetyReport: !!result.report,
    reportDetails: result.report || undefined,
    isSafeAddress: result.is_safe,
    totalVotes: result.report ? result.report.votes_yes + result.report.votes_no : 0,
    riskScore: result.report ? calculateRiskScore(result.report) : 0
  };
};

export const formatReportDate = (timestamp: number): string => {
  return new Date(timestamp / 1_000_000).toLocaleDateString(); // Convert nanoseconds to milliseconds
};

export const isReportExpired = (report: CommunityReport): boolean => {
  const now = Date.now() * 1_000_000; // Convert to nanoseconds
  return now > report.vote_deadline;
};

export const isCommunityReportAvailable = (
  result: ICPAnalysisCommunityResult
): result is ICPAnalysisCommunityResult & { report: CommunityReport } => {
  return result.report !== null && result.report !== undefined;
};

export const isHighRiskReport = (report: CommunityReport): boolean => {
  const riskCategories: ReportCategory[] = ["ransomware", "scam", "phishing", "malware"];
  return riskCategories.includes(report.category);
};