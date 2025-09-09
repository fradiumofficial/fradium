// AI Analyze Service for Browser Extension
// TypeScript version of the original aiAnalyze.js

import { detectTokenType } from '~lib/utils/tokenUtils';
import { extractBitcoinFeatures } from './bitcoinAnalyzeService';
import { extractEthereumFeatures } from './ethereumAnalyzeService';
import { ai } from '../../../src/declarations/ai';
import { backend } from '../../../src/declarations/backend';
import { HistoryService } from './historyService';
import type {
  RansomwareResult,
  CommunityAnalysisResult,
  AnalysisResult,
  AIAnalysisResult,
  CombinedAnalysisResult,
  AnalysisOptions,
  SupportedNetwork,
  EthereumFeatures
} from './types';

/**
 * Main AI Analyze Service
 * Detects address type and routes to appropriate analyzer
 */
export class AIAnalyzeService {
  /**
   * Analyze an address and return risk assessment
   * @param address - The address to analyze
   * @param options - Analysis options
   * @returns Promise<CombinedAnalysisResult> Analysis result
   */
  static async analyzeAddress(
    address: string,
    options: AnalysisOptions = {}
  ): Promise<CombinedAnalysisResult> {
    try {
      // Validate address
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address: Address must be a non-empty string');
      }

      const trimmedAddress = address.trim();
      if (trimmedAddress.length === 0) {
        throw new Error('Invalid address: Address cannot be empty');
      }

      console.log('anjay mabar', ai, backend);

      // Detect network type using extension's tokenUtils
      const network = detectTokenType(trimmedAddress) as SupportedNetwork;
      console.log(`Detected network: ${network} for address: ${trimmedAddress}`);

      // Step 1: Perform AI Analysis first
      let aiResult: AIAnalysisResult;
      switch (network) {
        case 'Bitcoin':
          aiResult = await this.analyzeBitcoinAddress(trimmedAddress, options);
          break;
        case 'Ethereum':
          aiResult = await this.analyzeEthereumAddress(trimmedAddress, options);
          break;
        case 'Solana':
        default:
          throw new Error(`Token not supported: ${network} addresses are not yet supported for analysis`);
      }

      console.log('AI Analysis Result:', aiResult);

      // Case 2: If AI analysis shows unsafe, stop here
      if (!aiResult.result.isSafe) {
        console.log('AI analysis shows unsafe - stopping analysis');
        await this.saveAnalysisToHistory(trimmedAddress, aiResult, network);
        return {
          ...aiResult,
          analysisSource: 'ai',
          finalStatus: 'unsafe_by_ai',
        };
      }

      // Case 1 & 3: AI shows safe, proceed with community analysis
      console.log('AI analysis shows safe - proceeding with community analysis');
      const communityResult = await this.performCommunityAnalysis(trimmedAddress);
      console.log('Community Analysis Result:', communityResult);

      let finalResult: CombinedAnalysisResult;

      // Case 1: Both AI and Community show safe
      if (aiResult.result.isSafe && communityResult.result.isSafe) {
        finalResult = {
          ...aiResult,
          analysisSource: 'ai_and_community',
          finalStatus: 'safe_by_both',
          communityAnalysis: communityResult.result,
        };
      }
      // Case 3: AI shows safe but Community shows unsafe
      else if (aiResult.result.isSafe && !communityResult.result.isSafe) {
        finalResult = {
          ...communityResult,
          analysisSource: 'community',
          finalStatus: 'unsafe_by_community',
          aiAnalysis: aiResult.result,
        };
      }
      // Fallback case
      else {
        finalResult = {
          ...aiResult,
          analysisSource: 'ai',
          finalStatus: 'safe_by_ai',
        };
      }

      // Save the final result to history
      await this.saveAnalysisToHistory(trimmedAddress, finalResult, network);
      return finalResult;

    } catch (error) {
      console.error('AI Analyze Service Error:', error);
      throw error;
    }
  }

  /**
   * Analyze Bitcoin address
   * @param address - Bitcoin address
   * @param options - Analysis options
   * @returns Promise<AIAnalysisResult> Analysis result
   */
  static async analyzeBitcoinAddress(
    address: string,
    options: AnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    try {
      console.log(`Analyzing Bitcoin address: ${address}`);

      // Extract features using Bitcoin service
      const features = await extractBitcoinFeatures(address);
      console.log(`Extracted ${features.length} features for Bitcoin address`);

      // Call AI canister - following the correct backend call pattern
      const ransomwareReport = await ai.analyze_btc_address(features, address, features.length);

      if ('Ok' in ransomwareReport) {
        const result = ransomwareReport.Ok as RansomwareResult;
        console.log('AI Analysis Result:', result);

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: 'Bitcoin',
          address: address,
          result: transformedResult,
          features: features,
          type: 'ai',
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('Bitcoin AI analysis failed');
    } catch (error) {
      console.error('Bitcoin analysis error:', error);
      throw new Error(`Bitcoin analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze Ethereum address
   * @param address - Ethereum address
   * @param options - Analysis options
   * @returns Promise<AIAnalysisResult> Analysis result
   */
  static async analyzeEthereumAddress(
    address: string,
    options: AnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    try {
      console.log(`Analyzing Ethereum address: ${address}`);

      // Extract features using Ethereum service
      const features = await extractEthereumFeatures(address, options);
      console.log(`Extracted features for Ethereum address:`, features);

      // Convert features object to array format expected by Rust canister
      const featuresPairs: [string, number][] = Object.entries(features).map(([k, v]) => [k, typeof v === 'number' ? v : 0]);
      const txCount = this.getTxCountFromFeaturesETH(features);

      // Call AI canister
      const ransomwareReport = await ai.analyze_eth_address(featuresPairs, address, txCount);

      console.log('Ransomware Report:', ransomwareReport);

      if ('Ok' in ransomwareReport) {
        const result = ransomwareReport.Ok as RansomwareResult;
        console.log('AI Analysis Result:', result);

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: 'Ethereum',
          address: address,
          result: transformedResult,
          features: features,
          type: 'ai',
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('Ethereum AI analysis failed');
    } catch (error) {
      console.error('Ethereum analysis error:', error);
      throw new Error(`Ethereum analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform Community analysis using backend
   * @param address - Address to analyze
   * @returns Promise<AIAnalysisResult> Community analysis result
   */
  static async performCommunityAnalysis(address: string): Promise<AIAnalysisResult> {
    try {
      console.log(`Performing community analysis for address: ${address}`);

      const communityResult = await backend.analyze_address(address);

      if ('Err' in communityResult) {
        throw new Error(`Community analysis failed: ${communityResult.Err}`);
      }

      const result = communityResult.Ok as any;
      console.log('Community Analysis Result:', result);

      // Transform community result to frontend format
      const transformedResult = this.transformCommunityResult(result);

      return {
        success: true,
        network: 'Community',
        address: address,
        result: transformedResult,
        type: 'community',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Community analysis error:', error);
      throw error;
    }
  }

  /**
   * Get transaction count from Ethereum features
   * @param features - Ethereum features object
   * @returns number Transaction count
   */
  static getTxCountFromFeaturesETH(features: EthereumFeatures): number {
    return Math.round(features.total_txs || 0);
  }

  /**
   * Transform Community result to frontend format
   * @param communityResult - Result from community backend
   * @returns AnalysisResult Transformed result for frontend
   */
  static transformCommunityResult(communityResult: any): AnalysisResult {
    const isSafe = communityResult.is_safe;
    const hasReport = communityResult.report !== null;

    // Generate description based on result
    let description: string;
    if (isSafe) {
      description = 'This address has been analyzed by the community and appears to be safe with no suspicious activity reported.';
    } else {
      description = 'This address has been flagged by the community as potentially unsafe based on community reports and voting.';
    }

    // Generate security checks based on result
    const securityChecks: string[] = [];
    if (isSafe) {
      securityChecks.push('No community reports found');
      securityChecks.push('Community consensus indicates safety');
      securityChecks.push('No suspicious activity reported');
    } else {
      securityChecks.push('Community reports indicate potential risk');
      securityChecks.push('Voting consensus suggests unsafe activity');
      securityChecks.push('Address flagged by multiple community members');
    }

    return {
      isSafe: isSafe,
      confidence: isSafe ? 85 : 75, // Community confidence is generally lower than AI
      riskLevel: isSafe ? 'LOW' : 'HIGH',
      description: description,
      stats: {
        transactions: hasReport ? (communityResult.report?.votes_yes || 0) + (communityResult.report?.votes_no || 0) : 0,
        totalVolume: hasReport ? `${communityResult.report?.votes_yes || 0} votes` : 'No votes',
        riskScore: isSafe ? '15/100' : '85/100',
        lastActivity: hasReport ? 'Community analyzed' : 'Not analyzed',
        reportId: hasReport ? communityResult.report?.report_id : undefined,
        votesYes: hasReport ? communityResult.report?.votes_yes : undefined,
        votesNo: hasReport ? communityResult.report?.votes_no : undefined,
      },
      securityChecks: securityChecks,
      rawResult: communityResult,
    };
  }

  /**
   * Transform Rust RansomwareResult to frontend format
   * @param rustResult - Result from Rust canister
   * @returns AnalysisResult Transformed result for frontend
   */
  static transformRansomwareResult(rustResult: RansomwareResult): AnalysisResult {
    const isSafe = !rustResult.is_ransomware;
    const confidence = Math.round(rustResult.confidence * 100);
    const riskScore = Math.round(rustResult.ransomware_probability * 100);

    // Determine risk level based on ransomware probability
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (rustResult.ransomware_probability > 0.7) {
      riskLevel = 'HIGH';
    } else if (rustResult.ransomware_probability > 0.3) {
      riskLevel = 'MEDIUM';
    }

    // Generate description based on result
    let description: string;
    if (isSafe) {
      description = `This ${rustResult.chain_type.toLowerCase()} address appears to be clean with no suspicious activity detected in our comprehensive database. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    } else {
      description = `This ${rustResult.chain_type.toLowerCase()} address shows concerning patterns that may indicate suspicious activity. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    }

    // Generate security checks based on result
    const securityChecks: string[] = [];
    if (isSafe) {
      securityChecks.push('No links to known scam addresses');
      securityChecks.push('Transaction patterns appear normal');
      securityChecks.push('No suspicious mixing activity detected');
    } else {
      securityChecks.push('Potential links to suspicious addresses detected');
      securityChecks.push('Unusual transaction patterns identified');
      securityChecks.push('Possible mixing or laundering activity');
    }

    return {
      isSafe: isSafe,
      confidence: confidence,
      riskLevel: riskLevel,
      description: description,
      stats: {
        transactions: rustResult.transactions_analyzed,
        totalVolume: `${rustResult.ransomware_probability.toFixed(4)} (probability)`,
        riskScore: `${riskScore}/100`,
        lastActivity: 'Recently analyzed',
        thresholdUsed: rustResult.threshold_used,
        dataSource: rustResult.data_source,
      },
      securityChecks: securityChecks,
      rawResult: rustResult,
    };
  }

  /**
   * Save analysis result to history
   * @param address - The analyzed address
   * @param result - Analysis result to save
   * @param network - Network type
   */
  private static async saveAnalysisToHistory(
    address: string,
    result: AIAnalysisResult | CombinedAnalysisResult,
    network: SupportedNetwork
  ): Promise<void> {
    try {
      // Prepare metadata based on analysis type and result
      let metadata = '';
      let analyzedType: 'AIAnalysis' | 'CommunityVote' = 'AIAnalysis';

      if ('analysisSource' in result) {
        // Combined analysis result
        const combinedResult = result as CombinedAnalysisResult;

        if (combinedResult.analysisSource === 'community' || combinedResult.finalStatus === 'unsafe_by_community') {
          analyzedType = 'CommunityVote';
          metadata = JSON.stringify({
            analysis_type: 'community_analysis',
            final_status: combinedResult.finalStatus,
            community_result: combinedResult.result,
            ai_result: combinedResult.aiAnalysis,
            timestamp: Date.now()
          });
        } else {
          analyzedType = 'AIAnalysis';
          metadata = JSON.stringify({
            analysis_type: 'ai_analysis',
            final_status: combinedResult.finalStatus,
            ai_result: combinedResult.result,
            community_result: combinedResult.communityAnalysis,
            timestamp: Date.now()
          });
        }
      } else {
        // AI analysis result only
        const aiResult = result as AIAnalysisResult;
        metadata = JSON.stringify({
          analysis_type: 'ai_only_analysis',
          ai_result: aiResult.result,
          timestamp: Date.now()
        });
      }

      // Convert network to token type
      const tokenType = this.networkToTokenType(network);

      // Save to history using the HistoryService
      const authenticatedBackend = HistoryService.createAuthenticatedBackend(HistoryService.identity);
      await HistoryService.createAnalyzeHistory(authenticatedBackend, {
        address,
        is_safe: result.result.isSafe,
        analyzed_type: analyzedType,
        metadata,
        token_type: tokenType
      });

      console.log('Analysis result saved to history successfully');
    } catch (error) {
      console.error('Failed to save analysis to history:', error);
      // Don't throw error - history saving failure shouldn't break the analysis
    }
  }

  /**
   * Convert network type to token type for backend
   */
  private static networkToTokenType(network: SupportedNetwork): 'Bitcoin' | 'Ethereum' | 'Solana' | 'Fradium' | 'Unknown' {
    switch (network) {
      case 'Bitcoin':
        return 'Bitcoin';
      case 'Ethereum':
        return 'Ethereum';
      case 'Solana':
        return 'Solana';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get supported networks
   * @returns SupportedNetwork[] List of supported networks
   */
  static getSupportedNetworks(): SupportedNetwork[] {
    return ['Bitcoin', 'Ethereum'];
  }

  /**
   * Check if a network is supported
   * @param network - Network name
   * @returns boolean Whether the network is supported
   */
  static isNetworkSupported(network: string): boolean {
    return this.getSupportedNetworks().includes(network as SupportedNetwork);
  }
}

export default AIAnalyzeService;
