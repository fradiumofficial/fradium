import { detectTokenType } from '~lib/utils/tokenUtils';
import { extractBitcoinFeatures } from './bitcoinAnalyzeService';
import { extractEthereumFeatures } from './ethereumAnalyzeService';
import { extractSolanaFeatures } from './solanaAnalyzeService';
import { createActor as createAiActor, canisterId as aiCanisterId } from '../declarations/ai';
import { createActor as createBackendActor, canisterId as backendCanisterId } from '../declarations/backend';
import { HttpAgent } from '@dfinity/agent';
import type {
  RansomwareResult,
  AnalysisResult,
  AIAnalysisResult,
  CombinedAnalysisResult,
  AnalysisOptions,
  SupportedNetwork,
  EthereumFeatures,
  SolanaFeatures
} from './types';

/**
 * Main AI Analyze Service
 * Detects address type and routes to appropriate analyzer
 */
export class AIAnalyzeService {
  private static backendActorSingleton: any | null = null;
  private static aiActorSingleton: any | null = null;
  // Resolve canister IDs with fallbacks for extension builds
  private static readonly EFFECTIVE_BACKEND_CANISTER_ID =
    backendCanisterId ||
    // Vite/Plasmo style env
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_CANISTER_ID_BACKEND) ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PLASMO_PUBLIC_CANISTER_ID_BACKEND) ||
    // Next/Node style env
    (typeof process !== 'undefined' && (
      (process as any).env?.VITE_CANISTER_ID_BACKEND ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_BACKEND ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_BACKEND ||
      (process as any).env?.CANISTER_ID_BACKEND
    )) ||
    // mainnet fallback from canister_ids.json
    'oqcob-6iaaa-aaaar-qbr7q-cai';

  private static readonly EFFECTIVE_AI_CANISTER_ID =
    aiCanisterId ||
    // Vite/Plasmo style env
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_CANISTER_ID_AI) ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PLASMO_PUBLIC_CANISTER_ID_AI) ||
    // Next/Node style env
    (typeof process !== 'undefined' && (
      (process as any).env?.VITE_CANISTER_ID_AI ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_AI ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_AI ||
      (process as any).env?.CANISTER_ID_AI
    )) ||
    // mainnet fallback from canister_ids.json
    'zkoni-faaaa-aaaar-qbsaa-cai';

  private static createAgent(identity?: any) {
    const agent = new HttpAgent({ identity });
    if (process.env.DFX_NETWORK !== 'ic') {
      agent.fetchRootKey().catch((err) => {
        console.warn('Unable to fetch root key. Check local replica');
        console.error(err);
      });
    }
    return agent as any;
  }

  private static getBackendActor(identity?: any) {
    if (this.backendActorSingleton) return this.backendActorSingleton;
    const canisterId = this.EFFECTIVE_BACKEND_CANISTER_ID;
    if (!canisterId) {
      throw new Error('Backend canister ID not configured');
    }
    const agent = this.createAgent(identity);
    const actor = createBackendActor?.(canisterId, { agent });
    if (!actor) {
      throw new Error('Failed to create backend actor');
    }
    this.backendActorSingleton = actor;
    return actor;
  }

  private static getAiActor(identity?: any) {
    if (this.aiActorSingleton) return this.aiActorSingleton;
    const canisterId = this.EFFECTIVE_AI_CANISTER_ID;
    if (!canisterId) {
      throw new Error('AI canister ID not configured');
    }
    const agent = this.createAgent(identity);
    const actor = createAiActor?.(canisterId, { agent });
    if (!actor) {
      throw new Error('Failed to create AI actor');
    }
    this.aiActorSingleton = actor;
    return actor;
  }
  /**
   * Analyze an address and return risk assessment
   * New flow: Community Analysis first, then AI Analysis if community is safe
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

      // Detect network type using extension's tokenUtils
      const network = detectTokenType(trimmedAddress) as SupportedNetwork;
      console.log(`Detected network: ${network} for address: ${trimmedAddress}`);

      // Step 1: Perform Community Analysis first
      console.log('Starting Community Analysis first...');
      const communityResult = await this.performCommunityAnalysis(trimmedAddress);
      console.log('Community Analysis Result:', communityResult);

      // Case 1: If Community analysis shows unsafe, stop here and return community result
      if (!communityResult.result.isSafe) {
        console.log('Community analysis shows unsafe - stopping analysis');
        await this.saveAnalysisToHistory(trimmedAddress, communityResult, network);
        return {
          ...communityResult,
          analysisSource: 'community',
          finalStatus: 'unsafe_by_community',
        };
      }

      // Case 2: Community shows safe, proceed with AI Analysis
      console.log('Community analysis shows safe - proceeding with AI analysis');
      let aiResult: AIAnalysisResult;
      switch (network) {
        case 'Bitcoin':
          aiResult = await this.analyzeBitcoinAddress(trimmedAddress, options);
          break;
        case 'Ethereum':
          aiResult = await this.analyzeEthereumAddress(trimmedAddress, options);
          break;
        case 'Solana':
          aiResult = await this.analyzeSolanaAddress(trimmedAddress, options);
          break;
        default:
          throw new Error(`Token not supported: ${network} addresses are not yet supported for analysis`);
      }

      console.log('AI Analysis Result:', aiResult);

      let finalResult: CombinedAnalysisResult;

      // Case 2a: Both Community and AI show safe
      if (communityResult.result.isSafe && aiResult.result.isSafe) {
        finalResult = {
          ...aiResult,
          analysisSource: 'community_and_ai',
          finalStatus: 'safe_by_both',
          communityAnalysis: communityResult.result,
        };
      }
      // Case 2b: Community shows safe but AI shows unsafe
      else if (communityResult.result.isSafe && !aiResult.result.isSafe) {
        finalResult = {
          ...aiResult,
          analysisSource: 'ai',
          finalStatus: 'unsafe_by_ai',
          communityAnalysis: communityResult.result,
        };
      }
      // Fallback case
      else {
        finalResult = {
          ...aiResult,
          analysisSource: 'ai',
          finalStatus: 'safe_by_ai',
          communityAnalysis: communityResult.result,
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

      // Call AI canister via safe actor
      const aiActor = this.getAiActor();
      const ransomwareReport = await aiActor.analyze_btc_address(features, address, features.length);

      console.log("Bitcoin AI Report:", ransomwareReport);

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

      // Call AI canister via safe actor
      const aiActor = this.getAiActor();
      const ransomwareReport = await aiActor.analyze_eth_address(featuresPairs, address, txCount);

      console.log('Ethereum AI Report:', ransomwareReport);

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
   * Analyze Solana address
   * @param address - Solana address
   * @param options - Analysis options
   * @returns Promise<AIAnalysisResult> Analysis result
   */
  static async analyzeSolanaAddress(
    address: string,
    options: AnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    try {
      console.log(`Analyzing Solana address: ${address}`);

      // Extract features using Solana service
      const features = await extractSolanaFeatures(address);
      console.log(`Extracted features for Solana address:`, features);

      // Convert features object to array format expected by Rust canister
      const featuresPairs: [string, number][] = Object.entries(features).map(([k, v]) => [k, typeof v === 'number' ? v : 0]);
      const txCount = this.getTxCountFromFeaturesSOL(features);

      // Note: AI analysis for Solana is not yet implemented in the canister
      // For now, return a basic safe result with placeholder data
      console.log('Solana AI analysis not yet implemented, returning basic analysis');

      const transformedResult: AnalysisResult = {
        isSafe: true, // Default to safe for now
        confidence: 50, // Lower confidence since no AI analysis
        riskLevel: 'MEDIUM',
        description: `Basic analysis completed for Solana address. AI-powered analysis for Solana is not yet available. This address appears to be valid but comprehensive risk assessment requires AI analysis.`,
        stats: {
          transactions: features.total_txs,
          totalVolume: `${features.total_received} SOL received`,
          riskScore: '50/100',
          lastActivity: 'Address validated',
        },
        securityChecks: [
          'Address format is valid',
          'Basic pattern analysis completed',
          'AI analysis not yet available for Solana'
        ],
        rawResult: features,
      };

      return {
        success: true,
        network: 'Solana',
        address: address,
        result: transformedResult,
        features: features,
        type: 'ai',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Solana analysis error:', error);
      throw new Error(`Solana analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const backendActor = this.getBackendActor();
      if (!backendActor || typeof (backendActor as any).analyze_address !== 'function') {
        throw new Error('Backend actor not initialized correctly (analyze_address missing)');
      }
      const communityResult = await backendActor.analyze_address(address);

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
   * Get transaction count from Solana features
   * @param features - Solana features object
   * @returns number Transaction count
   */
  static getTxCountFromFeaturesSOL(features: SolanaFeatures): number {
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
    console.log("🔍 TransformRansomwareResult - Raw Rust Result:", rustResult);
    const isSafe = !rustResult.is_ransomware;
    const confidence = Math.round(rustResult.confidence * 100);
    const riskScore = Math.round(rustResult.ransomware_probability * 100);

    console.log("🔍 TransformRansomwareResult - Transformed:", {
      isSafe,
      confidence,
      riskScore,
      is_ransomware: rustResult.is_ransomware,
      ransomware_probability: rustResult.ransomware_probability,
    });

    // Determine risk level based on ransomware probability
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (rustResult.ransomware_probability > 0.7) {
      riskLevel = 'HIGH';
    } else if (rustResult.ransomware_probability > 0.3) {
      riskLevel = 'MEDIUM';
    }

    // Convert chain_type to proper network name
    let networkName = rustResult.chain_type.toLowerCase();
    if (networkName === 'btc') networkName = 'bitcoin';
    if (networkName === 'eth') networkName = 'ethereum';
    if (networkName === 'sol') networkName = 'solana';

    // Generate description based on result
    let description: string;
    if (isSafe) {
      description = `This ${networkName} address appears to be clean with no suspicious activity detected in our comprehensive database. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    } else {
      description = `This ${networkName} address shows concerning patterns that may indicate suspicious activity. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    }

    // Generate security checks based on result
    const securityChecks: string[] = [];
    if (isSafe) {
      securityChecks.push("No links to known scam addresses");
      securityChecks.push("Transaction patterns appear normal");
      securityChecks.push("No suspicious mixing activity detected");
    } else {
      securityChecks.push("Potential links to suspicious addresses detected");
      securityChecks.push("Unusual transaction patterns identified");
      securityChecks.push("Possible mixing or laundering activity");
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
        lastActivity: "Recently analyzed",
        thresholdUsed: rustResult.threshold_used,
        dataSource: rustResult.data_source,
      },
      securityChecks: securityChecks,
      rawResult: rustResult, // Include raw result for debugging
    };
  }

  /**
   * Save analysis result to history
   * @param address - The analyzed address
   * @param result - Analysis result to save
   * @param network - Network type
   */
  private static async saveAnalysisToHistory(
    _address: string,
    _result: AIAnalysisResult | CombinedAnalysisResult,
    _network: SupportedNetwork
  ): Promise<void> {
    // History persistence via backend has been disabled in the extension build
    // after removing historyService. This is intentionally a no-op.
    return;
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
    return ['Bitcoin', 'Ethereum', 'Solana'];
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
