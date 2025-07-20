import type { Root as AnalysisReport } from "../model/AnalyzeSmartContractModel";

const API_ENDPOINT = 'https://fradium.motionlaboratory.com/analyze';

/**
 * Mengirim permintaan analisa alamat smart contract ke API endpoint.
 * @param address Alamat smart contract yang akan dianalisa.
 * @returns Promise yang akan resolve dengan hasil analisa atau reject dengan error.
 */
export const analyzeAddressSmartContract = async (address: string): Promise<AnalysisReport> => {
  try {
    if (!address || !address.trim()) {
      throw new Error('Address is required');
    }

    console.log('Analyzing smart contract:', address);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address.trim()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json() as AnalysisReport;
    
    if (!data.success) {
      throw new Error(data.message || 'Analysis failed');
    }

    console.log('Analysis result:', data);
    return data;

  } catch (error) {
    console.error('Error analyzing smart contract:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze smart contract');
  }
};