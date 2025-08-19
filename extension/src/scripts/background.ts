import { analyzeAddressCommunity } from "@/icp/services/backend_service";
import { detectTokenType, TokenType } from "@/lib/utils/tokenUtils";
import { analyzeBtcAddress, analyzeEthAddress, analyzeSolAddress } from "@/icp/services/ai_service";
import { extractFeatures as extractFeaturesBTC } from "../services/ai/bitcoinAnalyzeService";
import { extractFeatures as extractFeaturesETH } from "../services/ai/ethereumAnalyzeService";
import { fetchBitcoinBalance, fetchEthereumBalance, fetchSolanaBalance } from "@/services/balanceService";

// Listener untuk saat ekstensi pertama kali di-install atau di-update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-extension",
    title: "Open Fraudify Extension",
    contexts: ["all"],
  });
});

chrome.runtime.onStartup.addListener(async () => {
  const btcAddress = await chrome.storage.local.get("bitcoinBalance");
  const ethAddress = await chrome.storage.local.get("ethereumBalance");
  const solAddress = await chrome.storage.local.get("solanaBalance");

  if (!btcAddress) return;
  if (!ethAddress) return;
  if (!solAddress) return;
  try {
    const btcBalance = await fetchBitcoinBalance(btcAddress.address);
    const ethBalance = await fetchEthereumBalance(ethAddress.address);
    const solBalance = await fetchSolanaBalance(solAddress.address);
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
});

// Listener untuk saat item di context menu (klik kanan) diklik
chrome.contextMenus.onClicked.addListener((info, _) => {
  if (info.menuItemId === "open-extension") {
    chrome.action.openPopup();
  }
});

// Helper function to perform AI analysis
async function performAIAnalysis(address: string): Promise<{ isSafe: boolean; data: any } | null> {
  try {
    const tokenType = detectTokenType(address);
    let features: any;
    let ransomwareReport: any;

    switch (tokenType) {
      case TokenType.BITCOIN:
        // Bitcoin AI Analysis
        try {
          features = await extractFeaturesBTC(address);
        } catch (error) {
          console.warn('Using fallback Bitcoin feature extraction');
          features = await extractFeaturesBTCFallback(address);
        }
        ransomwareReport = await analyzeBtcAddress(features, address, features.length);
        
        if ("Ok" in ransomwareReport) {
          return {
            isSafe: !ransomwareReport.Ok.is_ransomware,
            data: ransomwareReport.Ok,
          };
        }
        throw new Error("Bitcoin AI analysis failed");

      case TokenType.ETHEREUM:
        // Ethereum AI Analysis
        let ethFeatures;
        try {
          ethFeatures = await extractFeaturesETH(address);
        } catch (error) {
          console.warn('Using fallback Ethereum feature extraction');
          ethFeatures = await extractFeaturesETHFallback(address);
        }
        const featuresPairs: [string, number][] = Object.entries(ethFeatures).map(([k, v]) => [k, Number(v)]);
        const txCount = ethFeatures.total_txs || 0;
        ransomwareReport = await analyzeEthAddress(featuresPairs, address, txCount);
        
        if ("Ok" in ransomwareReport) {
          return {
            isSafe: !ransomwareReport.Ok.is_ransomware,
            data: ransomwareReport.Ok,
          };
        }
        throw new Error("Ethereum AI analysis failed");

      case TokenType.SOLANA:
        // Solana AI Analysis
        ransomwareReport = await analyzeSolAddress(address);
        
        if ("Ok" in ransomwareReport) {
          return {
            isSafe: !ransomwareReport.Ok.is_ransomware,
            data: ransomwareReport.Ok,
          };
        }
        throw new Error("Solana AI analysis failed");

      case TokenType.FUM:
        // Fradium AI Analysis - NOT IMPLEMENTED YET
        console.warn("Fradium AI analysis not implemented yet");
        return null;

      default:
        // Unknown token type
        console.warn(`AI analysis not supported for token type: ${tokenType}`);
        return null;
    }
  } catch (error) {
    console.error("AI analysis failed:", error);
    return null;
  }
}

// Comprehensive analysis function that combines community and AI
async function performComprehensiveAnalysis(address: string) {
  const tokenType = detectTokenType(address);
  let finalResult: any;

  try {
    // Step 1: Try Community Analysis first
    console.log('Starting community analysis...');
    const communityReport = await analyzeAddressCommunity(address);
    
    console.log('Community report received:', communityReport);
    
    // Handle different response formats
    let communityResult: any = null;
    let communityIsSafe = false;
    
    if (communityReport && typeof communityReport === 'object') {
      // Handle Result<T, E> format: { Ok: data } or { Err: error }
      if ('Ok' in communityReport) {
        communityResult = communityReport.Ok;
        communityIsSafe = communityResult?.is_safe === true;
      }
      // Handle error response: { Err: error }
      else if ('Err' in communityReport) {
        console.warn('Community analysis returned error:', communityReport.Err);
        throw new Error(`Community analysis error: ${communityReport.Err}`);
      }
      // Handle direct response format: { is_safe: boolean, ... }
      else if ('is_safe' in communityReport) {
        communityResult = communityReport;
        communityIsSafe = (communityReport as any).is_safe === true;
      }
      // Handle other formats
      else {
        console.warn('Unexpected community report format:', communityReport);
        throw new Error("Unexpected community analysis response format");
      }
    } else {
      throw new Error("Invalid community analysis response");
    }
    
    if (communityResult) {

      // Step 2: If community says safe, double-check with AI
      if (communityIsSafe) {
        const aiResult = await performAIAnalysis(address);

        if (aiResult && !aiResult.isSafe) {
          // AI detected as unsafe, override community result
          finalResult = {
            isSafe: false,
            source: "ai",
            aiData: aiResult.data,
            tokenType,
            address,
          };
        } else {
          // Use community result (safe)
          finalResult = {
            isSafe: true,
            source: "community",
            communityData: communityResult,
            tokenType,
            address,
          };
        }
      } else {
        // Community says unsafe, use community result
        finalResult = {
          isSafe: false,
          source: "community",
          communityData: communityResult,
          tokenType,
          address,
        };
      }
    } else {
      throw new Error("Invalid community analysis response");
    }
  } catch (communityError) {
    console.log('Community analysis failed, falling back to AI analysis:', communityError);
    
    // Step 3: No community report or error, use AI analysis as fallback
    const aiResult = await performAIAnalysis(address);

    if (aiResult) {
      finalResult = {
        isSafe: aiResult.isSafe,
        source: "ai",
        aiData: aiResult.data,
        tokenType,
        address,
      };
    } else {
      // Both community and AI failed
      throw new Error("Both community and AI analysis failed. Please try again later.");
    }
  }

  return finalResult;
}

// Listener utama untuk semua pesan yang masuk dari UI
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  // --- Aksi Sinkron: Membuka Popup ---
  if (request.action === "openExtension") {
    chrome.action.openPopup();
    return;
  } 
  
  if (request.type === "ANALYZE_ADDRESS_SMART_CONTRACT") {
    // --- Aksi Asinkron: Analisa Alamat via REST API (Fradium) ---
    const address = request.address;
    const analyze = async () => {
      try {
        const response = await fetch(`https://fradium.motionlaboratory.com/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        console.error("Error fetching analysis:", error);
        sendResponse({ success: false, error: "Failed to fetch analysis" });
      }
    };
    analyze();
    return true;
  } 
  
  if (request.type === "ANALYZE_ADDRESS") {
    const addressToAnalyze = request.address;
    
    // Tambahkan timeout yang lebih panjang
    const TIMEOUT_MS = 180000; // 3 menit untuk comprehensive analysis
    
    const callComprehensiveAnalysis = async () => {
      try {
        console.log(`Starting comprehensive analysis for address: ${addressToAnalyze}`);
        
        // Detect token type first
        const tokenType = detectTokenType(addressToAnalyze);
        console.log(`Detected token type: ${tokenType}`);
        
        if (tokenType === TokenType.UNKNOWN) {
          throw new Error("Unsupported address format. Please provide a valid Bitcoin, Ethereum, or Solana address.");
        }
        
        // Use comprehensive analysis with timeout
        const analysisPromise = performComprehensiveAnalysis(addressToAnalyze);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Comprehensive analysis timeout after 3 minutes')), TIMEOUT_MS);
        });
        
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        console.log('Comprehensive analysis completed:', result);
        
        // Convert BigInt values to strings for JSON serialization
        const convertedResult = convertBigIntToString(result);
        
        sendResponse({ success: true, data: convertedResult });
      } catch (error) {
        console.error("Error in comprehensive analysis:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ success: false, error: errorMessage });
      }
    };
    
    callComprehensiveAnalysis();
    return true;
  }

  // New comprehensive analysis endpoint
  if (request.type === "ANALYZE_ADDRESS_COMPREHENSIVE") {
    const addressToAnalyze = request.address;
    
    const TIMEOUT_MS = 180000; // 3 minutes for comprehensive analysis
    
    const callComprehensiveAnalysis = async () => {
      try {
        console.log(`Starting comprehensive analysis for address: ${addressToAnalyze}`);
        
        // Detect token type first
        const tokenType = detectTokenType(addressToAnalyze);
        console.log(`Detected token type: ${tokenType}`);
        
        if (tokenType === TokenType.UNKNOWN) {
          throw new Error("Unsupported address format. Please provide a valid Bitcoin, Ethereum, or Solana address.");
        }
        
        // Use comprehensive analysis with timeout
        const analysisPromise = performComprehensiveAnalysis(addressToAnalyze);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Comprehensive analysis timeout after 3 minutes')), TIMEOUT_MS);
        });
        
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        console.log('Comprehensive analysis completed:', result);
        
        // Convert BigInt values to strings for JSON serialization
        const convertedResult = convertBigIntToString(result);
        
        sendResponse({ success: true, data: convertedResult });
      } catch (error) {
        console.error("Error in comprehensive analysis:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ success: false, error: errorMessage });
      }
    };
    
    callComprehensiveAnalysis();
    return true;
  }

  if (request.type === "ANALYZE_ADDRESS_COMMUNITY") {
    const addressToAnalyze = request.address;

    const callCanisterBackend = async () => {
      try {
        console.log(`Starting community analysis for address: ${addressToAnalyze}`);
        
        const result = await analyzeAddressCommunity(addressToAnalyze);

        const convertResult = convertBigIntToString(result);

        sendResponse({ success: true, data: convertResult });
      } catch (error) {
        console.error("Error calling ICP canister for community analysis:", error);
        
        let safeErrorMessage = 'An unknown error occurred during community analysis.';
        if (error instanceof Error) {
          safeErrorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          safeErrorMessage = `Canister error: ${JSON.stringify(error)}`;
        } else if (error) {
          safeErrorMessage = String(error);
        }
        
        sendResponse({ success: false, error: safeErrorMessage });
      }
    };

    callCanisterBackend();
    return true;
  }

  // AI-only analysis endpoint
  if (request.type === "ANALYZE_ADDRESS_AI") {
    const addressToAnalyze = request.address;
    
    const TIMEOUT_MS = 120000; // 2 minutes for AI analysis
    
    const callAIAnalysis = async () => {
      try {
        console.log(`Starting AI analysis for address: ${addressToAnalyze}`);
        
        // Detect token type first
        const tokenType = detectTokenType(addressToAnalyze);
        console.log(`Detected token type: ${tokenType}`);
        
        if (tokenType === TokenType.UNKNOWN) {
          throw new Error("Unsupported address format. Please provide a valid Bitcoin, Ethereum, or Solana address.");
        }
        
        // Use AI analysis with timeout
        const analysisPromise = performAIAnalysis(addressToAnalyze);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI analysis timeout after 2 minutes')), TIMEOUT_MS);
        });
        
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        
        if (!result) {
          throw new Error(`AI analysis not supported for ${tokenType} addresses yet.`);
        }
        
        console.log('AI analysis completed:', result);
        
        // Convert BigInt values to strings for JSON serialization
        const convertedResult = convertBigIntToString(result);
        
        sendResponse({ success: true, data: convertedResult });
      } catch (error) {
        console.error("Error in AI analysis:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ success: false, error: errorMessage });
      }
    };
    
    callAIAnalysis();
    return true;
  }
});

// Mengubah semua nilai BigInt dalam objek menjadi string secara rekursif.
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertBigIntToString(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}
// Fallback implementations for feature extraction
async function extractFeaturesBTCFallback(address: string): Promise<number[]> {
  try {
    // Simple Bitcoin feature extraction for background script
    const response = await fetch(`https://mempool.space/api/address/${address}/txs`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    
    const transactions = await response.json();
    const txCount = Math.min(transactions.length, 100);
    
    // Return basic features - just transaction count for now
    const features = new Array(62).fill(0); // 62 features expected by model
    features[0] = txCount; // Time step
    features[6] = txCount; // total_txs
    
    return features;
  } catch (error) {
    console.error('Bitcoin feature extraction failed:', error);
    // Return default features if API fails
    return new Array(62).fill(0);
  }
}

async function extractFeaturesETHFallback(_address: string): Promise<Record<string, number>> {
  try {
    // Simple Ethereum feature extraction - return basic structure
    return {
      total_txs: 0,
      num_txs_as_sender: 0,
      num_txs_as_receiver: 0,
      // Add other required features with default values
    };
  } catch (error) {
    console.error('Ethereum feature extraction failed:', error);
    return { total_txs: 0 };
  }
}

