export interface ICPAnalysisResult {
  transactions_analyzed: number;
  threshold_used: number;
  is_ransomware: boolean;
  address: string;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  ransomware_probability: number;
}