// History Service for Browser Extension
// Connects to backend history functionality

import { backend, createActor, canisterId } from '../../../src/declarations/backend';
import type { Identity } from '@dfinity/agent';
import { HttpAgent } from '@dfinity/agent';

export interface AnalyzeHistoryEntry {
  address: string;
  is_safe: boolean;
  analyzed_type: 'CommunityVote' | 'AIAnalysis';
  token_type: 'Bitcoin' | 'Ethereum' | 'Solana' | 'Fradium' | 'Unknown';
  created_at: bigint;
  metadata: string;
}

export interface HistoryServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * History Service Class
 * Handles all history-related operations with the backend
 */
export class HistoryService {
  static identity: Identity | null = null;


  /**
   * Create authenticated backend actor with identity
   */
  static createAuthenticatedBackend(identity: Identity) {
    if (!canisterId) {
      throw new Error('Backend canister ID not configured');
    }

    const agent = new HttpAgent({
      identity,
    });

    // Fetch root key for certificate validation during development
    if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey().catch((err) => {
        console.warn(
          "Unable to fetch root key. Check to ensure that your local replica is running"
        );
        console.error(err);
      });
    }

    return createActor(canisterId, {
      agent: agent as any,
    });
  }

  /**
   * Get analyze history from backend
   */
  static async getAnalyzeHistory(): Promise<HistoryServiceResult<AnalyzeHistoryEntry[]>> {
    try {
      if (!HistoryService.identity) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // First, let's test a simple method to ensure canister connection works
      console.log('Testing canister connection...');

      // Try to call get_reports method first to test connection
      try {
        const testResult = await backend.get_reports();
        console.log('Canister connection test successful:', testResult);
      } catch (testError) {
        console.error('Canister connection test failed:', testError);
        return {
          success: false,
          error: 'Canister connection failed. Please try again later.'
        };
      }

      // Create authenticated backend actor
      console.log('Creating authenticated backend actor...');
      const authenticatedBackend = HistoryService.createAuthenticatedBackend(HistoryService.identity!);

      // Now try the actual method
      console.log('Calling get_analyze_history...');
      const result = await authenticatedBackend.get_analyze_history();

      if ('Ok' in result) {
        // Convert backend data to frontend format
        const convertedData = this.convertBackendToFrontendEntries(result.Ok);
        return {
          success: true,
          data: convertedData
        };
      } else {
        return {
          success: false,
          error: result.Err
        };
      }
    } catch (error) {
      console.error('Error fetching analyze history:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('too few arguments')) {
          return {
            success: false,
            error: 'Method signature mismatch. The canister method may not be properly deployed.'
          };
        } else if (error.message.includes('Call failed')) {
          return {
            success: false,
            error: 'Canister call failed. Please check your connection and try again.'
          };
        } else {
          return {
            success: false,
            error: error.message
          };
        }
      }

      return {
        success: false,
        error: 'Unknown error occurred while fetching history'
      };
    }
  }

  /**
   * Create a new analyze history entry
   */
  static async createAnalyzeHistory(
    authenticatedBackend: any,
    params: {
      address: string;
      is_safe: boolean;
      analyzed_type: 'CommunityVote' | 'AIAnalysis';
      metadata: string;
      token_type: 'Bitcoin' | 'Ethereum' | 'Solana' | 'Fradium' | 'Unknown';
    }
  ): Promise<HistoryServiceResult<AnalyzeHistoryEntry[]>> {
    try {
      if (!HistoryService.identity) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const historyParams = {
        address: params.address,
        is_safe: params.is_safe,
        analyzed_type: params.analyzed_type === 'CommunityVote' ? { CommunityVote: null } : { AIAnalysis: null },
        metadata: params.metadata,
        token_type: this.mapTokenTypeToBackend(params.token_type)
      };

      const result = await authenticatedBackend.create_analyze_history(historyParams);

      if ('Ok' in result) {
        // Convert backend data to frontend format
        const convertedData = this.convertBackendToFrontendEntries(result.Ok);
        return {
          success: true,
          data: convertedData
        };
      } else {
        return {
          success: false,
          error: result.Err
        };
      }
    } catch (error) {
      console.error('Error creating analyze history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Analyze address and automatically save to history
   */
  static async analyzeAddressAndSave(
    address: string
  ): Promise<HistoryServiceResult<AnalyzeHistoryEntry[]>> {
    try {
      if (!HistoryService.identity) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // First analyze the address
      const authenticatedBackend = HistoryService.createAuthenticatedBackend(HistoryService.identity!);
      const analyzeResult = await authenticatedBackend.analyze_address(address);

      if ('Err' in analyzeResult) {
        return {
          success: false,
          error: analyzeResult.Err
        };
      }

      const analysisData = analyzeResult.Ok;

      // Prepare metadata based on analysis result
      let metadata = '';
      let analyzedType: 'CommunityVote' | 'AIAnalysis' = 'CommunityVote';

      if (analysisData.report && analysisData.report.length > 0) {
        const report = analysisData.report[0];
        metadata = JSON.stringify({
          report_id: report.report_id,
          votes_yes: report.votes_yes,
          votes_no: report.votes_no,
          description: report.description,
          category: report.category,
          created_at: Number(report.created_at),
          evidence: report.evidence
        });
        analyzedType = 'CommunityVote';
      } else {
        metadata = JSON.stringify({
          analysis_type: 'address_analysis',
          timestamp: Date.now()
        });
        analyzedType = 'AIAnalysis';
      }

      // Create history entry and return converted data
      const createResult = await this.createAnalyzeHistory(authenticatedBackend, {
        address,
        is_safe: analysisData.is_safe,
        analyzed_type: analyzedType,
        metadata,
        token_type: this.detectTokenType(address)
      });

      return createResult;

    } catch (error) {
      console.error('Error analyzing address and saving history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete analyze history entry (if needed for cleanup)
   */
  static async deleteAnalyzeHistory(
    address: string,
    createdAt: bigint
  ): Promise<HistoryServiceResult<string>> {
    try {
      if (!HistoryService.identity) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Note: Backend doesn't have a delete function, this is for future use
      return {
        success: false,
        error: 'Delete operation not implemented in backend'
      };
    } catch (error) {
      console.error('Error deleting analyze history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Map frontend token type to backend token type
   */
  private static mapTokenTypeToBackend(tokenType: string): { Bitcoin: null } | { Ethereum: null } | { Solana: null } | { Fradium: null } | { Unknown: null } {
    switch (tokenType) {
      case 'Bitcoin':
        return { Bitcoin: null };
      case 'Ethereum':
        return { Ethereum: null };
      case 'Solana':
        return { Solana: null };
      case 'Fradium':
        return { Fradium: null };
      default:
        return { Unknown: null };
    }
  }

  /**
   * Detect token type from address
   */
  private static detectTokenType(address: string): 'Bitcoin' | 'Ethereum' | 'Solana' | 'Fradium' | 'Unknown' {
    // Simple detection based on address format
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
      return 'Bitcoin';
    } else if (address.startsWith('0x') && address.length === 42) {
      return 'Ethereum';
    } else if (address.length >= 32 && address.length <= 44) {
      return 'Solana';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Convert backend AnalyzeHistory to frontend format
   */
  static convertBackendHistoryToFrontend(
    backendHistory: AnalyzeHistoryEntry[]
  ): Array<{
    id: string;
    address: string;
    tokenType: string;
    isSafe: boolean;
    source: 'ai' | 'community';
    date: string;
    analysisResult: any;
  }> {
    return backendHistory.map((entry, index) => {
      // Parse metadata
      let analysisResult = {};
      try {
        analysisResult = JSON.parse(entry.metadata);
      } catch (e) {
        console.warn('Failed to parse metadata:', entry.metadata);
        // Fallback for old format or malformed data
        analysisResult = { metadata: entry.metadata };
      }

      return {
        id: `scan_${index + 1}_${entry.created_at}`, // More unique ID using timestamp
        address: entry.address,
        tokenType: this.convertTokenTypeToString(entry.token_type),
        isSafe: entry.is_safe,
        source: entry.analyzed_type === 'CommunityVote' ? 'community' : 'ai',
        date: new Date(Number(entry.created_at)).toLocaleString(),
        analysisResult
      };
    });
  }

  /**
   * Convert backend AnalyzeHistory to frontend AnalyzeHistoryEntry
   */
  private static convertBackendToFrontendEntries(backendHistory: any[]): AnalyzeHistoryEntry[] {
    return backendHistory.map((entry: any) => ({
      address: entry.address,
      is_safe: entry.is_safe,
      analyzed_type: this.convertAnalyzedType(entry.analyzed_type),
      token_type: this.convertTokenTypeToString(entry.token_type),
      created_at: entry.created_at,
      metadata: entry.metadata
    }));
  }

  /**
   * Convert backend analyzed_type variant to frontend string
   */
  private static convertAnalyzedType(analyzedType: any): 'CommunityVote' | 'AIAnalysis' {
    if ('CommunityVote' in analyzedType) return 'CommunityVote';
    if ('AIAnalysis' in analyzedType) return 'AIAnalysis';
    return 'AIAnalysis'; // default fallback
  }

  /**
   * Convert backend token type to string
   */
  private static convertTokenTypeToString(tokenType: any): 'Bitcoin' | 'Ethereum' | 'Solana' | 'Fradium' | 'Unknown' {
    if ('Bitcoin' in tokenType) return 'Bitcoin';
    if ('Ethereum' in tokenType) return 'Ethereum';
    if ('Solana' in tokenType) return 'Solana';
    if ('Fradium' in tokenType) return 'Fradium';
    return 'Unknown';
  }
}
