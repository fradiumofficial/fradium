import type { 
  CommunityAnalysisResponse,
  CommunityAnalysisResult,
  ICPAnalysisResult,
  RansomwareAnalysisResponse,
} from "../model/AnalyzeAddressModel";

/**
 * Menganalisis alamat menggunakan canister ransomware (sudah di-refactor).
 */
export const analyzeAddressRansomware = async (address: string): Promise<ICPAnalysisResult> => {
  const responseData = await sendMessageToBackground<RansomwareAnalysisResponse>({
    type: 'ANALYZE_ADDRESS',
    address,
  });

  if ('Ok' in responseData) {
    return responseData.Ok;
  } 
  throw new Error(responseData.Err);
};

/**
 * Menganalisis alamat menggunakan canister komunitas (sudah di-refactor).
 */
export const analyzeAddressCommunity = async (address: string): Promise<CommunityAnalysisResult> => {
  const responseData = await sendMessageToBackground<CommunityAnalysisResponse>({
    type: "ANALYZE_ADDRESS_COMMUNITY",
    address,
  });

  if ('Ok' in responseData) {
    return responseData.Ok;
  }
  throw new Error(responseData.Err);
};

async function sendMessageToBackground<T>(message: object): Promise<T> {
  const response = await chrome.runtime.sendMessage(message);

  if (chrome.runtime.lastError) {
    throw new Error(chrome.runtime.lastError.message);
  }
  if (!response) {
    throw new Error("No response received from background script.");
  }
  if (!response.success) {
    throw new Error(response.error || "An unknown error occurred in the background script.");
  }
  
  return response.data as T;
}