import type { ICPAnalysisResult } from "../model/AnalyzeAddressModel";

export const analyzeAddress = (address: string): Promise<ICPAnalysisResult> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'ANALYZE_ADDRESS', address },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }

        if (response.success) {
          const canisterResponse = response.data;

          if ('Ok' in canisterResponse) {
            resolve(canisterResponse.Ok as ICPAnalysisResult);
          } else if ('Err' in canisterResponse) {
            reject(new Error(JSON.stringify(canisterResponse.Err)));
          } else {
            reject(new Error("Unexpected response format"));
          }
          return resolve(response.data as ICPAnalysisResult);
        } else {
          return reject(new Error(response.error || "Failed to analyze address"));
        }
      }
    )
  })
}