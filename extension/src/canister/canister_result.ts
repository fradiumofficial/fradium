export interface RansomwareResult {
  address: string;
  confidence_level: string;
  threshold_used: number;
  transactions_analyzed: number;
  ransomware_probability: number;
  is_ransomware: boolean;
}