import type { ICPAnalysisResult } from "../model/AnalyzeAddressModel";

export const analyzeAddress = (address: string): Promise<ICPAnalysisResult> => {
  return new Promise((resolve, reject) => {
    // Set timeout di sisi client juga
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timeout - analysis is taking too long"));
    }, 130000); // 2.5 menit

    chrome.runtime.sendMessage(
      { type: 'ANALYZE_ADDRESS', address },
      (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }

        if (!response) {
          return reject(new Error("No response received from background script"));
        }

        if (response.success) {
          const canisterResponse = response.data;

          // Handle Result<RansomwareResult, String> dari canister
          if ('Ok' in canisterResponse) {
            resolve(canisterResponse.Ok as ICPAnalysisResult);
          } else if ('Err' in canisterResponse) {
            reject(new Error(canisterResponse.Err));
          } else {
            // Fallback jika response langsung berupa data
            resolve(canisterResponse as ICPAnalysisResult);
          }
        } else {
          reject(new Error(response.error || "Failed to analyze address"));
        }
      }
    );
  });
};