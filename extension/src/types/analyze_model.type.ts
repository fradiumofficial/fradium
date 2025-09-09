// src/model/AnalyzeAddressModel.ts

/**
 * Tipe data Principal dari DFINITY, biasanya direpresentasikan sebagai string.
 */
export type Principal = string;

/**
 * Model untuk detail laporan jika sebuah alamat dianggap tidak aman (unsafe).
 * Ini sesuai dengan record 'report' di dalam respons canister Anda.
 */
export interface Report {
  url: string[] | null;
  report_id: number;
  voted_by: any[];
  votes_no: string;
  chain: string;
  description: string;
  created_at: string;
  evidence: string[];
  vote_deadline: string;
  address: string;
  category: string;
  votes_yes: string;
  reporter: Principal;
}

/**
 * Model untuk hasil akhir dari analisis berbasis komunitas.
 * Ini adalah data yang akan Anda gunakan di UI.
 */
export interface CommunityAnalysisResult {
  is_safe: boolean;
  report: Report[]; // Laporan akan ada jika 'is_safe' bernilai false
}

/**
 * Model untuk respons mentah dari canister komunitas.
 * Canister mengembalikan 'variant' Result, yang bisa berupa 'Ok' atau 'Err'.
 */
export type CommunityAnalysisResponse = 
  | { Ok: CommunityAnalysisResult }
  | { Err: string };

/**
 * Model untuk respons mentah dari canister ransomware.
 */
export type RansomwareAnalysisResponse = 
  | { Ok: ICPAnalysisResult }
  | { Err: string };

/**
 * Model untuk hasil analisis dari canister AI.
 */
export interface ICPAnalysisResult {
  transactions_analyzed: number;
  threshold_used: number;
  is_ransomware: boolean;
  address: string;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  ransomware_probability: number;
}

/**
 * Combined analysis result that can contain both community and AI data
 */
export interface AnalysisResult {
  isSafe: boolean;
  source: "community" | "ai" | "ai_and_community" | "smartcontract";
  communityData?: CommunityAnalysisResult;
  aiData?: ICPAnalysisResult;
  tokenType: string;
  address: string;
  // Additional properties for enhanced analysis
  confidence?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string;
  stats?: {
    transactions?: number;
    totalVolume?: string;
    riskScore?: string;
    lastActivity?: string;
    thresholdUsed?: number;
    dataSource?: string;
    reportId?: number;
    votesYes?: number;
    votesNo?: number;
  };
  securityChecks?: string[];
  aiAnalysis?: any;
  finalStatus?: string;
}

/**
 * Analysis options for different token types
 */
export interface AnalysisOptions {
  etherscanApiKey?: string;
  cryptocompareApiKey?: string;
  moralisApiKey?: string;
}