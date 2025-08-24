/**
 * Helper functions for communicating with background script
 */

export interface AnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Sends a message to the background script to perform comprehensive address analysis
 * @param address The address to analyze
 * @returns Promise with analysis result
 */
export const performComprehensiveAnalysis = (address: string): Promise<AnalysisResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ADDRESS_COMPREHENSIVE", address },
      (response: AnalysisResponse) => {
        resolve(response);
      }
    );
  });
};

/**
 * Sends a message to the background script to perform community-only analysis
 * @param address The address to analyze
 * @returns Promise with analysis result
 */
export const performCommunityAnalysis = (address: string): Promise<AnalysisResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ADDRESS_COMMUNITY", address },
      (response: AnalysisResponse) => {
        resolve(response);
      }
    );
  });
};

/**
 * Sends a message to the background script to perform AI-only analysis
 * @param address The address to analyze
 * @returns Promise with analysis result
 */
export const performAIAnalysis = (address: string): Promise<AnalysisResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ADDRESS_AI", address },
      (response: AnalysisResponse) => {
        resolve(response);
      }
    );
  });
};

/**
 * Sends a message to the background script to perform legacy analysis (backward compatibility)
 * @param address The address to analyze
 * @returns Promise with analysis result
 */
export const performLegacyAnalysis = (address: string): Promise<AnalysisResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ADDRESS", address },
      (response: AnalysisResponse) => {
        resolve(response);
      }
    );
  });
};

/**
 * Sends a message to the background script to perform smart contract analysis via REST API
 * @param address The address to analyze
 * @returns Promise with analysis result
 */
export const performSmartContractAnalysis = (address: string): Promise<AnalysisResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ADDRESS_SMART_CONTRACT", address },
      (response: AnalysisResponse) => {
        resolve(response);
      }
    );
  });
};
