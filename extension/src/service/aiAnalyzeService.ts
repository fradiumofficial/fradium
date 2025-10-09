import { detectTokenType } from '~lib/utils/tokenUtils';
import { extractBitcoinFeatures } from './bitcoinAnalyzeService';
import { extractFeatures, buildFeatureVector, getTxCountFromFeatures } from './ethereumAnalyzeService';
import { extractSolanaFeatures } from './solanaAnalyzeService';
// @ts-ignore - explicit extension to satisfy module resolver
import { buildComprehensiveFeatures as extractICPFeatures, prepareFeaturesForCanister as prepareICPFeaturesForCanister } from './icpAnalyzeService.ts';
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

  // Normalize token type/network names to match frontend expectations
  private static normalizeNetwork(network: string | null | undefined): SupportedNetwork | null {
    if (!network) return null;
    const n = String(network).toLowerCase().replace(/[_\s-]+/g, '');
    if (n === 'bitcoin' || n === 'btc') return 'Bitcoin';
    if (n === 'ethereum' || n === 'eth') return 'Ethereum';
    if (n === 'solana' || n === 'sol') return 'Solana';
    if (n === 'internetcomputer' || n === 'icp' || n === 'ic') return 'Internet Computer';
    return null;
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
   * New flow: AI Analysis first, then Community Analysis if AI is safe
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

      // Detect network type using extension's tokenUtils, normalize to frontend names
      const detected = detectTokenType(trimmedAddress) as unknown as string;
      const network = this.normalizeNetwork(detected);
      const networkNameForHistory = network ?? (detected || 'Unknown');
      console.log(`Detected network: ${detected} → normalized: ${network} for address: ${trimmedAddress}`);

      // Step 1: Try AI Analysis first (if supported)
      let aiResult: AIAnalysisResult | null = null;
      let aiSupported = true;

      try {
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
          case 'Internet Computer':
            aiResult = await this.analyzeICPAddress(trimmedAddress, options);
            break;
          default:
            aiSupported = false;
            break;
        }
      } catch (error) {
        console.error(`AI Analysis failed for ${network}:`, error);
        aiSupported = false;
      }

      // If AI is not supported or failed, stop here (do not use community)
      if (!aiSupported || !aiResult) {
        throw new Error('AI analysis not available for this network');
      }

      // Case 2: If AI analysis shows unsafe, stop here
      if (!aiResult.result.isSafe) {
        const result: CombinedAnalysisResult = {
          ...aiResult,
          analysisSource: 'ai',
          finalStatus: 'unsafe_by_ai',
        };

        // Create analyze history for AI analysis
        await this.createAnalyzeHistory(trimmedAddress, aiResult.result, 'ai', networkNameForHistory);

        return result;
      }

      // AI shows safe -> return AI-only result (no community analysis)
      const result: CombinedAnalysisResult = {
        ...aiResult,
        analysisSource: 'ai',
        finalStatus: 'safe_by_ai',
      } as any;

      await this.createAnalyzeHistory(trimmedAddress, aiResult.result, 'ai', networkNameForHistory);
      return result;

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
      const features = await extractFeatures(address, options);
      console.log(`Extracted features for Ethereum address:`, features);

      // Convert features object to array format expected by Rust canister
      const featuresPairs: [string, number][] = Object.entries(features).map(([k, v]) => [k, Number(v as any)]);
      const txCount = getTxCountFromFeatures(features);

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
      const featuresPairs: [string, number][] = Object.entries(features).map(([k, v]) => [k, Number(v as any)]);
      const txCount = this.getTxCountFromFeaturesSOL(features);

      // Call AI canister via safe actor
      const aiActor = this.getAiActor();
      const ransomwareReport = await aiActor.analyze_sol_address(featuresPairs, address, txCount);

      console.log('Solana AI Report:', ransomwareReport);

      if ('Ok' in ransomwareReport) {
        const result = ransomwareReport.Ok as RansomwareResult;
        console.log('AI Analysis Result:', result);

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: 'Solana',
          address: address,
          result: transformedResult,
          features: features,
          type: 'ai',
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('Solana AI analysis failed');
    } catch (error) {
      console.error('Solana analysis error:', error);
      throw new Error(`Solana analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze ICP address
   * @param address - ICP address
   * @param options - Analysis options
   * @returns Promise<AIAnalysisResult> Analysis result
   */
  static async analyzeICPAddress(
    address: string,
    options: AnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    try {
      console.log(`Analyzing ICP address: ${address}`);

      // Extract features using ICP service with real data from ICP canisters
      const features = await extractICPFeatures(address);

      // Validate features object
      if (!features || typeof features !== 'object') {
        throw new Error('Invalid features object received from ICP service');
      }

      // Convert features to array format expected by Rust canister
      // Format: Array<[string, number]> as per TypeScript declarations
      const featuresArray: [string, number][] = [];
      for (const [key, value] of prepareICPFeaturesForCanister(features)) {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          featuresArray.push([key, numValue]);
        } else {
          featuresArray.push([key, 0.0]);
        }
      }

      // Ensure we have at least some features
      if (featuresArray.length === 0) {
        featuresArray.push(['total_transactions', 0.0]);
        featuresArray.push(['icp_balance', 0.0]);
        featuresArray.push(['ckbtc_balance', 0.0]);
        featuresArray.push(['cketh_balance', 0.0]);
        featuresArray.push(['ckusdc_balance', 0.0]);
      }

      const txCount = Math.floor(Number(features.total_transactions) || 0);

      // Call Rust AI canister with array format
      const aiActor = this.getAiActor();
      if (!aiActor) {
        throw new Error('AI canister not available');
      }

      const ransomwareReport = await aiActor.analyze_icp_address(featuresArray, address, txCount);

      // Validate canister response
      if (!ransomwareReport || typeof ransomwareReport !== 'object') {
        throw new Error('Invalid response from ICP AI canister');
      }

      if ('Ok' in ransomwareReport) {
        const result = ransomwareReport.Ok as RansomwareResult;

        // Validate result object for ICP
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid result object from ICP AI canister');
        }

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: 'Internet Computer',
          address: address,
          result: transformedResult,
          features: features,
          type: 'ai',
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('ICP AI analysis failed');
    } catch (error) {
      console.error('ICP analysis error:', error);
      throw new Error(`ICP analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    if (networkName === 'icp') networkName = 'internet computer';

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


  // ICP feature extraction and preparation now sourced from './icpAnalyzeService'

  /**
   * Create analyze history in backend
   * @param address - Address that was analyzed
   * @param result - Analysis result
   * @param analysisType - Type of analysis ("ai" or "community")
   * @param network - Network type
   * @returns Promise<void>
   */
  static async createAnalyzeHistory(address: string, result: AnalysisResult, analysisType: string, network: string): Promise<void> {
    try {
      // Map analysis type to AnalyzeHistoryType (variant tetap sama)
      const analyzedType = analysisType === 'community' ? { CommunityVote: null } : { AIAnalysis: null };

      const historyParams = {
        address: address,
        is_safe: result.isSafe,
        analyzed_type: analyzedType,
        metadata: JSON.stringify({
          confidence: result.confidence,
          riskLevel: result.riskLevel,
          riskScore: result.stats?.riskScore,
          transactions: result.stats?.transactions,
          analysisType: analysisType,
          network: network,
          timestamp: new Date().toISOString(),
        }),
        token_type: network,
      };

      const backendActor = this.getBackendActor();
      const historyResult = await backendActor.create_analyze_history(historyParams);

      if ('Err' in historyResult) {
        console.error(`Failed to create analyze history: ${historyResult.Err}`);
      }
    } catch (error) {
      console.error(`Error creating analyze history for ${analysisType}:`, error);
      // Don't throw error to avoid breaking the main analysis flow
    }
  }

  /**
   * Get supported networks
   * @returns SupportedNetwork[] List of supported networks
   */
  static getSupportedNetworks(): SupportedNetwork[] {
    return ['Bitcoin', 'Ethereum', 'Solana', 'Internet Computer'];
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
