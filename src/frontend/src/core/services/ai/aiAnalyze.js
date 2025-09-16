import { detectAddressNetwork } from "@/core/lib/tokenUtils.js";
import { extractFeatures as extractBitcoinFeatures } from "./bitcoinAnalyzeService.js";
import { extractFeatures as extractEthereumFeatures } from "./ethereumAnalyzeService.js";
import SolanaAnalyzeService from "./solanaAnalyzeService.js";
import { buildComprehensiveFeatures as extractICPFeatures, prepareFeaturesForCanister } from "./icpAnalyzeService.js";
import { ai } from "declarations/ai";
import { backend } from "declarations/backend";

/**
 * Main AI Analyze Service
 * Detects address type and routes to appropriate analyzer
 */
export class AIAnalyzeService {
  /**
   * Analyze an address and return risk assessment
   * @param {string} address - The address to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  static async analyzeAddress(address, options = {}) {
    try {
      // Validate address
      if (!address || typeof address !== "string") {
        throw new Error("Invalid address: Address must be a non-empty string");
      }

      const trimmedAddress = address.trim();
      if (trimmedAddress.length === 0) {
        throw new Error("Invalid address: Address cannot be empty");
      }

      // Detect network type
      const network = detectAddressNetwork(trimmedAddress);

      // Step 1: Try AI Analysis first (if supported)
      let aiResult = null;
      let aiSupported = true;

      try {
        switch (network) {
          case "Bitcoin":
            aiResult = await this.analyzeBitcoinAddress(trimmedAddress, options);
            break;
          case "Ethereum":
            aiResult = await this.analyzeEthereumAddress(trimmedAddress, options);
            break;
          case "Solana":
            aiResult = await this.analyzeSolanaAddress(trimmedAddress, options);
            break;
          case "Internet Computer":
            aiResult = await this.analyzeICPAddress(trimmedAddress, options);
            break;
          default:
            aiSupported = false;
            break;
        }
      } catch (error) {
        console.error(`AI Analysis failed for ${network}:`, error.message);
        aiSupported = false;
      }

      // If AI is not supported or failed, skip directly to community analysis
      if (!aiSupported || !aiResult) {
        const communityResult = await this.performCommunityAnalysis(trimmedAddress);

        const result = {
          success: true,
          network: network,
          address: trimmedAddress,
          result: communityResult.result,
          analysisSource: "community",
          finalStatus: communityResult.result.isSafe ? "safe_by_community" : "unsafe_by_community",
          type: "community",
          timestamp: new Date().toISOString(),
        };

        // Create analyze history for community analysis only
        await this.createAnalyzeHistory(trimmedAddress, communityResult.result, "community", network);

        return result;
      }

      // Case 2: If AI analysis shows unsafe, stop here
      if (!aiResult.result.isSafe) {
        const result = {
          ...aiResult,
          analysisSource: "ai",
          finalStatus: "unsafe_by_ai",
          result: aiResult.result, // Ensure result is from AI analysis
        };

        // Create analyze history for AI analysis
        await this.createAnalyzeHistory(trimmedAddress, aiResult.result, "ai", network);

        return result;
      }

      // Case 1 & 3: AI shows safe, proceed with community analysis
      const communityResult = await this.performCommunityAnalysis(trimmedAddress);

      // Case 1: Both AI and Community show safe
      if (aiResult.result.isSafe && communityResult.result.isSafe) {
        const result = {
          ...aiResult,
          analysisSource: "ai_and_community",
          finalStatus: "safe_by_both",
          result: aiResult.result, // Primary result from AI
          communityAnalysis: communityResult.result,
          aiAnalysis: aiResult.result,
        };

        // Create analyze history for both AI and Community analysis
        await this.createAnalyzeHistory(trimmedAddress, aiResult.result, "ai", network);
        await this.createAnalyzeHistory(trimmedAddress, communityResult.result, "community", network);

        return result;
      }

      // Case 3: AI shows safe but Community shows unsafe
      if (aiResult.result.isSafe && !communityResult.result.isSafe) {
        const result = {
          ...aiResult, // Keep AI result as base (network, address, etc.)
          analysisSource: "community",
          finalStatus: "unsafe_by_community",
          result: communityResult.result, // Primary result from Community
          aiAnalysis: aiResult.result,
        };

        // Create analyze history for both AI and Community analysis
        await this.createAnalyzeHistory(trimmedAddress, aiResult.result, "ai", network);
        await this.createAnalyzeHistory(trimmedAddress, communityResult.result, "community", network);

        return result;
      }
    } catch (error) {
      console.error("AI Analyze Service Error:", error);
      throw error;
    }
  }

  /**
   * Analyze Bitcoin address
   * @param {string} address - Bitcoin address
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  static async analyzeBitcoinAddress(address, options = {}) {
    try {
      // Extract features using Bitcoin service
      const features = await extractBitcoinFeatures(address);

      // Call Rust AI canister - following the correct backend call pattern
      const ransomwareReport = await ai.analyze_btc_address(features, address, features.length);

      if ("Ok" in ransomwareReport) {
        const result = ransomwareReport.Ok;

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: "Bitcoin",
          address: address,
          result: transformedResult,
          features: features,
          type: "ai",
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error("Bitcoin AI analysis failed");
    } catch (error) {
      console.error("Bitcoin analysis error:", error);
      throw new Error(`Bitcoin analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze Ethereum address
   * @param {string} address - Ethereum address
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  static async analyzeEthereumAddress(address, options = {}) {
    try {
      // Extract features using Ethereum service
      const features = await extractEthereumFeatures(address, options);

      // Convert features object to array format expected by Rust canister - following the correct backend call pattern
      const featuresPairs = Object.entries(features).map(([k, v]) => [k, Number(v)]);
      const txCount = this.getTxCountFromFeaturesETH(features);

      // Call Rust AI canister
      const ransomwareReport = await ai.analyze_eth_address(featuresPairs, address, txCount);

      if ("Ok" in ransomwareReport) {
        const result = ransomwareReport.Ok;

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: "Ethereum",
          address: address,
          result: transformedResult,
          features: features,
          type: "ai",
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error("Ethereum AI analysis failed");
    } catch (error) {
      console.error("Ethereum analysis error:", error);
      throw new Error(`Ethereum analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze Solana address
   */
  static async analyzeSolanaAddress(address, options = {}) {
    try {
      const features = await SolanaAnalyzeService.extractFeatures(address, options);
      const featuresPairs = Object.entries(features).map(([k, v]) => [k, Number(v)]);
      const txCount = SolanaAnalyzeService.getTxCountFromFeatures(features);

      const ransomwareReport = await ai.analyze_sol_address(featuresPairs, address, txCount);

      if ("Ok" in ransomwareReport) {
        const result = ransomwareReport.Ok;
        const transformedResult = this.transformRansomwareResult(result);
        return {
          success: true,
          network: "Solana",
          address: address,
          result: transformedResult,
          features: features,
          type: "ai",
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error("Solana AI analysis failed");
    } catch (error) {
      console.error("Solana analysis error:", error);
      throw new Error(`Solana analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze ICP address
   */
  static async analyzeICPAddress(address, options = {}) {
    try {
      // Extract features using ICP service with real data from ICP canisters
      const features = await extractICPFeatures(address);

      // Validate features object
      if (!features || typeof features !== "object") {
        throw new Error("Invalid features object received from ICP service");
      }

      // Convert features to array format expected by Rust canister
      // Format: Array<[string, number]> as per TypeScript declarations
      const featuresArray = [];
      for (const [key, value] of prepareFeaturesForCanister(features)) {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          featuresArray.push([key, numValue]);
        } else {
          featuresArray.push([key, 0.0]);
        }
      }

      // Ensure we have at least some features
      if (featuresArray.length === 0) {
        featuresArray.push(["total_transactions", 0.0]);
        featuresArray.push(["icp_balance", 0.0]);
        featuresArray.push(["ckbtc_balance", 0.0]);
        featuresArray.push(["cketh_balance", 0.0]);
        featuresArray.push(["ckusdc_balance", 0.0]);
      }

      const txCount = Math.floor(Number(features.total_transactions) || 0);

      // Call Rust AI canister with array format

      // Ensure ai canister is available
      if (!ai) {
        throw new Error("AI canister not available");
      }

      const ransomwareReport = await ai.analyze_icp_address(featuresArray, address, txCount);

      // Validate canister response
      if (!ransomwareReport || typeof ransomwareReport !== "object") {
        throw new Error("Invalid response from ICP AI canister");
      }

      if ("Ok" in ransomwareReport) {
        const result = ransomwareReport.Ok;

        // Validate result object for ICP
        if (!result || typeof result !== "object") {
          throw new Error("Invalid result object from ICP AI canister");
        }

        // Transform Rust result to frontend format
        const transformedResult = this.transformRansomwareResult(result);

        return {
          success: true,
          network: "Internet Computer",
          address: address,
          result: transformedResult,
          features: features,
          type: "ai",
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error("ICP AI analysis failed");
    } catch (error) {
      console.error("ICP analysis error:", error);
      throw new Error(`ICP analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform Community analysis using backend
   * @param {string} address - Address to analyze
   * @returns {Promise<Object>} Community analysis result
   */
  static async performCommunityAnalysis(address) {
    try {
      const communityResult = await backend.analyze_address(address);

      if (communityResult.Err) {
        throw new Error(`Community analysis failed: ${communityResult.Err}`);
      }

      const result = communityResult.Ok;

      // Transform community result to frontend format
      const transformedResult = this.transformCommunityResult(result);

      return {
        success: true,
        network: "Community",
        address: address,
        result: transformedResult,
        type: "community",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Community analysis error:", error);
      throw error;
    }
  }

  /**
   * Get transaction count from Ethereum features
   * @param {Object} features - Ethereum features object
   * @returns {number} Transaction count
   */
  static getTxCountFromFeaturesETH(features) {
    return Math.round(features.total_txs || 0);
  }

  /**
   * Transform Community result to frontend format
   * @param {Object} communityResult - Result from community backend
   * @returns {Object} Transformed result for frontend
   */
  static transformCommunityResult(communityResult) {
    const isSafe = communityResult.is_safe;
    const hasReport = communityResult.report !== null;

    // Generate description based on result
    let description;
    if (isSafe) {
      description = "This address has been analyzed by the community and appears to be safe with no suspicious activity reported.";
    } else {
      description = "This address has been flagged by the community as potentially unsafe based on community reports and voting.";
    }

    // Generate security checks based on result
    const securityChecks = [];
    if (isSafe) {
      securityChecks.push("No community reports found");
      securityChecks.push("Community consensus indicates safety");
      securityChecks.push("No suspicious activity reported");
    } else {
      securityChecks.push("Community reports indicate potential risk");
      securityChecks.push("Voting consensus suggests unsafe activity");
      securityChecks.push("Address flagged by multiple community members");
    }

    return {
      isSafe: isSafe,
      confidence: isSafe ? 85 : 75, // Community confidence is generally lower than AI
      riskLevel: isSafe ? "LOW" : "HIGH",
      description: description,
      stats: {
        transactions: hasReport ? (communityResult.report?.votes_yes || 0) + (communityResult.report?.votes_no || 0) : 0,
        totalVolume: hasReport ? `${communityResult.report?.votes_yes || 0} votes` : "No votes",
        riskScore: isSafe ? "15/100" : "85/100",
        lastActivity: hasReport ? "Community analyzed" : "Not analyzed",
        reportId: hasReport ? communityResult.report?.report_id : null,
        votesYes: hasReport ? communityResult.report?.votes_yes : 0,
        votesNo: hasReport ? communityResult.report?.votes_no : 0,
      },
      securityChecks: securityChecks,
      rawResult: communityResult,
    };
  }

  /**
   * Transform Rust RansomwareResult to frontend format
   * @param {Object} rustResult - Result from Rust canister
   * @returns {Object} Transformed result for frontend
   */
  static transformRansomwareResult(rustResult) {
    const isSafe = !rustResult.is_ransomware;
    const confidence = Math.round(rustResult.confidence * 100);
    const riskScore = Math.round(rustResult.ransomware_probability * 100);

    // Determine risk level based on ransomware probability
    let riskLevel = "LOW";
    if (rustResult.ransomware_probability > 0.7) {
      riskLevel = "HIGH";
    } else if (rustResult.ransomware_probability > 0.3) {
      riskLevel = "MEDIUM";
    }

    // Generate description based on result
    let description;
    if (isSafe) {
      description = `This ${rustResult.chain_type.toLowerCase()} address appears to be clean with no suspicious activity detected in our comprehensive database. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    } else {
      description = `This ${rustResult.chain_type.toLowerCase()} address shows concerning patterns that may indicate suspicious activity. Analyzed ${rustResult.transactions_analyzed} transactions.`;
    }

    // Generate security checks based on result
    const securityChecks = [];
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
   * Get supported networks
   * @returns {Array<string>} List of supported networks
   */
  static getSupportedNetworks() {
    return ["Bitcoin", "Ethereum", "Solana", "Internet Computer"];
  }

  /**
   * Check if a network is supported
   * @param {string} network - Network name
   * @returns {boolean} Whether the network is supported
   */
  static isNetworkSupported(network) {
    return this.getSupportedNetworks().includes(network);
  }

  /**
   * Create analyze history in backend
   * @param {string} address - Address that was analyzed
   * @param {Object} result - Analysis result
   * @param {string} analysisType - Type of analysis ("ai" or "community")
   * @param {string} network - Network type
   * @returns {Promise<void>}
   */
  static async createAnalyzeHistory(address, result, analysisType, network) {
    try {
      // token_type now string; gunakan standar dari tokenUtils (chain/network)
      const tokenType = network;

      // Map analysis type to AnalyzeHistoryType (variant tetap sama)
      const analyzedType = analysisType === "community" ? { CommunityVote: null } : { AIAnalysis: null };

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
        token_type: tokenType,
      };

      const historyResult = await backend.create_analyze_history(historyParams);

      if (historyResult.Err) {
        console.error(`Failed to create analyze history: ${historyResult.Err}`);
      }
    } catch (error) {
      console.error(`Error creating analyze history for ${analysisType}:`, error);
      // Don't throw error to avoid breaking the main analysis flow
    }
  }
}

export default AIAnalyzeService;
