// Type definitions for AI Analyze Service

export interface RansomwareResult {
  transactions_analyzed: number;
  threshold_used: number;
  data_source: string;
  is_ransomware: boolean;
  address: string;
  chain_type: string;
  confidence: number;
  confidence_level: string;
  ransomware_probability: number;
}

export interface CommunityAnalysisResult {
  is_safe: boolean;
  report?: {
    report_id: number;
    votes_yes: number;
    votes_no: number;
    description: string;
    address: string;
    category: string;
    created_at: bigint;
    evidence: string[];
    voted_by: Array<{
      voter: string;
      vote: boolean;
      vote_weight: bigint;
    }>;
  };
}

export interface AnalysisResult {
  isSafe: boolean;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  stats: {
    transactions?: number;
    totalVolume?: string;
    riskScore: string;
    lastActivity: string;
    thresholdUsed?: number;
    dataSource?: string;
    reportId?: number;
    votesYes?: number;
    votesNo?: number;
  };
  securityChecks: string[];
  rawResult?: any;
}

export interface AIAnalysisResult {
  success: boolean;
  network: string;
  address: string;
  result: AnalysisResult;
  features?: any;
  type: 'ai' | 'community';
  timestamp: string;
}

export interface CombinedAnalysisResult extends AIAnalysisResult {
  analysisSource: 'ai' | 'ai_and_community' | 'community' | 'community_and_ai';
  finalStatus: 'safe_by_both' | 'safe_by_ai' | 'unsafe_by_ai' | 'unsafe_by_community';
  communityAnalysis?: AnalysisResult;
  aiAnalysis?: AnalysisResult;
}

export interface AnalysisOptions {
  includeCommunity?: boolean;
  timeout?: number;
  maxRetries?: number;
}

export type SupportedNetwork = 'Bitcoin' | 'Ethereum' | 'Solana' | 'Internet Computer';

export type TokenType = 'Bitcoin' | 'Ethereum' | 'Solana' | 'Unknown';

export interface ExtractedFeatures {
  [key: string]: any;
}

export interface BitcoinFeatures extends ExtractedFeatures {
  transaction_count: number;
  total_received: number;
  total_sent: number;
  balance: number;
  first_seen: string;
  last_seen: string;
  unique_addresses: number;
  [key: string]: any;
}

export interface EthereumFeatures extends ExtractedFeatures {
  total_txs: number;
  total_ether_sent: number;
  total_ether_received: number;
  unique_incoming_addresses: number;
  unique_outgoing_addresses: number;
  first_transaction: string;
  last_transaction: string;
  current_balance: number;
  [key: string]: any;
}

export interface SolanaFeatures extends ExtractedFeatures {
  address_length: number;
  has_numbers: number;
  has_uppercase: number;
  has_lowercase: number;
  starts_with_number: number;
  starts_with_letter: number;
  total_txs: number;
  avg_tx_value: number;
  total_received: number;
  total_sent: number;
  unique_interactions: number;
  first_tx_age_days: number;
  last_tx_age_hours: number;
  balance_sol: number;
  program_interactions: number;
  is_system_program: number;
  is_vote_account: number;
  is_token_account: number;
  [key: string]: any;
}
