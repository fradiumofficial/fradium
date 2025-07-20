import type { ICPAnalysisResult, ICPAnalysisCommunityResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
import type { Root as SmartContractAnalysisResult } from "@/modules/analyze_smartcontract/model/AnalyzeSmartContractModel";

// Interface untuk History Item
export interface HistoryItem {
  id: string;
  address: string;
  result: ICPAnalysisResult | ICPAnalysisCommunityResult | SmartContractAnalysisResult;
  timestamp: number;
  date: string;
  isSafe: boolean;
  riskScore: number;
  analysisType: 'icp' | 'community' | 'smartcontract'; // Tambah jenis analisis smart contract
}

export interface HistoryStorage {
  items: HistoryItem[];
}

const HISTORY_STORAGE_KEY = 'fradium_analysis_history';
const MAX_HISTORY_ITEMS = 100;

// Fungsi untuk menyimpan analysis result ke history
export function saveAnalysisToHistory(
  address: string, 
  result: ICPAnalysisResult | ICPAnalysisCommunityResult | SmartContractAnalysisResult,
  analysisType: 'icp' | 'community' | 'smartcontract' = 'icp'
): HistoryItem {
  const timestamp = Date.now();
  const date = new Date(timestamp).toLocaleDateString();
  
  // Determine if address is safe based on analysis type
  let isSafe: boolean;
  let riskScore: number;
  
  if (analysisType === 'community') {
    const communityResult = result as ICPAnalysisCommunityResult;
    isSafe = communityResult.is_safe === true;
    
    // Calculate risk score from community votes if available
    if (communityResult.report) {
      const totalVotes = communityResult.report.votes_yes + communityResult.report.votes_no;
      riskScore = totalVotes > 0 ? (communityResult.report.votes_yes / totalVotes) * 100 : 0;
    } else {
      riskScore = isSafe ? 0 : 50; // Default risk score
    }
  } else if (analysisType === 'smartcontract') {
    const smartContractResult = result as SmartContractAnalysisResult;
    // Hitung high severity issues untuk menentukan keamanan
    const highSeverityCount = smartContractResult.issues.filter(issue => 
      issue.severity.toLowerCase() === 'high'
    ).length;
    
    // Smart contract dianggap aman jika tidak ada high severity issues
    isSafe = highSeverityCount === 0;
    
    // Risk score berdasarkan jumlah dan severity issues
    const totalIssues = smartContractResult.issues.length;
    const mediumSeverityCount = smartContractResult.issues.filter(issue => 
      issue.severity.toLowerCase() === 'medium'
    ).length;
    
    // Formula: high issues = 100% risk, medium = 50% risk, low = 25% risk
    riskScore = Math.min(100, 
      (highSeverityCount * 100) + 
      (mediumSeverityCount * 50) + 
      ((totalIssues - highSeverityCount - mediumSeverityCount) * 25)
    );
  } else {
    const icpResult = result as ICPAnalysisResult;
    isSafe = icpResult.is_ransomware === false;
    riskScore = icpResult.ransomware_probability * 100;
  }

  const historyItem: HistoryItem = {
    id: `${timestamp}_${address.slice(-8)}_${analysisType}`,
    address,
    result,
    timestamp,
    date,
    isSafe,
    riskScore,
    analysisType
  };

  try {
    const existingHistory = getAnalysisHistory();
    
    // Check for recent analysis of same address and type (within last hour)
    const recentAnalysis = existingHistory.items.find(item => 
      item.address === address && 
      item.analysisType === analysisType &&
      (timestamp - item.timestamp) < 3600000 // 1 hour
    );

    let updatedItems: HistoryItem[];
    
    if (recentAnalysis) {
      // Update existing recent analysis
      updatedItems = existingHistory.items.map(item => 
        item.id === recentAnalysis.id ? historyItem : item
      );
    } else {
      // Add new item to the beginning
      updatedItems = [historyItem, ...existingHistory.items];
    }

    // Limit to MAX_HISTORY_ITEMS
    if (updatedItems.length > MAX_HISTORY_ITEMS) {
      updatedItems = updatedItems.slice(0, MAX_HISTORY_ITEMS);
    }

    const updatedHistory: HistoryStorage = {
      items: updatedItems
    };

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    console.log(`${analysisType} analysis saved to history:`, historyItem);
    return historyItem;
  } catch (error) {
    console.error('Error saving analysis to history:', error);
    // Try to clear old cache if storage is full
    try {
      clearOldHistoryCache();
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ items: [historyItem] }));
      return historyItem;
    } catch (e) {
      console.error('Still unable to save to localStorage after cleanup:', e);
      throw error;
    }
  }
}

// Fungsi untuk mengambil analysis history
export function getAnalysisHistory(): HistoryStorage {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) {
      return { items: [] };
    }
    
    const parsed = JSON.parse(stored) as HistoryStorage;
    
    // Validate and clean up invalid entries
    const validItems = parsed.items.filter(item => 
      item.id && 
      item.address && 
      item.result && 
      typeof item.timestamp === 'number' &&
      item.analysisType
    );

    return { items: validItems };
  } catch (error) {
    console.error('Error reading analysis history:', error);
    return { items: [] };
  }
}

// Fungsi untuk mendapatkan history item berdasarkan ID
export function getHistoryItemById(id: string): HistoryItem | null {
  const history = getAnalysisHistory();
  return history.items.find(item => item.id === id) || null;
}

// Fungsi untuk menghapus history item
export function deleteHistoryItem(id: string): boolean {
  try {
    const history = getAnalysisHistory();
    const filteredItems = history.items.filter(item => item.id !== id);
    
    const updatedHistory: HistoryStorage = {
      items: filteredItems
    };

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return false;
  }
}

// Fungsi untuk membersihkan semua history
export function clearAnalysisHistory(): boolean {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    return false;
  }
}

// Fungsi untuk mendapatkan statistik history
export function getHistoryStats() {
  const history = getAnalysisHistory();
  const totalAnalyses = history.items.length;
  const safeAddresses = history.items.filter(item => item.isSafe).length;
  const riskyAddresses = totalAnalyses - safeAddresses;
  const icpAnalyses = history.items.filter(item => item.analysisType === 'icp').length;
  const communityAnalyses = history.items.filter(item => item.analysisType === 'community').length;
  
  return {
    totalAnalyses,
    safeAddresses,
    riskyAddresses,
    icpAnalyses,
    communityAnalyses,
    safePercentage: totalAnalyses > 0 ? (safeAddresses / totalAnalyses) * 100 : 0
  };
}

// Fungsi untuk membersihkan cache lama
function clearOldHistoryCache(): void {
  const history = getAnalysisHistory();
  
  if (history.items.length > 50) {
    // Keep only the 50 most recent items
    const recentItems = history.items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    
    const updatedHistory: HistoryStorage = {
      items: recentItems
    };
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    console.log('Cleared old history cache, kept 50 most recent items');
  }
}

// Legacy functions untuk backward compatibility
export function saveToLocalStorage(key: string, data: []): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved ${data.length} items to localStorage with key: ${key}`);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    try {
      clearOldCaches();
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Still unable to save to localStorage after cleanup:', e);
    }
  }
}

function clearOldCaches(): void {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("analyze_address_")) {
      keys.push(key);
    }
  }

  if (keys.length > 10) {
    keys.slice(0, keys.length - 10).forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed old cache entry: ${key}`);
    });
  }
}

export function isCacheFresh(key: string): boolean {
  const cacheTimeKey = `${key}-timestamp`;
  const timestamp = localStorage.getItem(cacheTimeKey);
  
  if (!timestamp) return false;
  
  const savedTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 1 hari dalam milidetik
  
  return currentTime - savedTime < maxAge;
}

export function getFromLocalStorage(key: string): [] | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsedData = JSON.parse(data) as [];
    console.log(`Retrieved ${parsedData.length} items from localStorage with key: ${key}`);
    return parsedData;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return null;
  }
}

// Fungsi helper khusus untuk smart contract analysis
export function getSmartContractHistory(): HistoryItem[] {
  const allHistory = getAnalysisHistory();
  return allHistory.items.filter(item => item.analysisType === 'smartcontract');
}

export function getLatestSmartContractAnalysis(address: string): HistoryItem | null {
  const smartContractHistory = getSmartContractHistory();
  const addressHistory = smartContractHistory.filter(item => 
    item.address.toLowerCase() === address.toLowerCase()
  );
  
  if (addressHistory.length === 0) return null;
  
  // Return the most recent analysis
  return addressHistory.sort((a, b) => b.timestamp - a.timestamp)[0];
}