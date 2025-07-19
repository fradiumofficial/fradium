import type { Root as AnalysisReport } from "../model/AnalyzeSmartContractModel";

/**
 * Mengirim permintaan analisa alamat ke background script.
 * @param address Alamat smart contract yang akan dianalisa.
 * @returns Promise yang akan resolve dengan hasil analisa atau reject dengan error.
 */
export const analyzeAddressSmartContract = (address: string): Promise<AnalysisReport> => {
  return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{ 
				type: 'ANALYZE_ADDRESS_SMART_CONTRACT',
				address: address,
			},
			(response) => {
				if (chrome.runtime.lastError) {
					return reject(new Error(chrome.runtime.lastError.message));
				}

				if (response.success) {
					return resolve(response.data as AnalysisReport);
				} else {
					return reject(new Error(response.error || "Failed to analyze address"));
				}
			}
		)
  });
}