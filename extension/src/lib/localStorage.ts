import type { AnalysisResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";
// New interface for scan history items (comprehensive analysis results)
export interface ScanHistoryItem {
  id: string;
  address: string;
  tokenType: string;
  analysisResult: AnalysisResult;
  timestamp: number;
  date: string;
  isSafe: boolean;
  source: "community" | "ai" | "smartcontract";
}

export interface ScanHistoryStorage {
  items: ScanHistoryItem[];
}

const HISTORY_STORAGE_KEY = 'fradium_analysis_history';
const SCAN_HISTORY_STORAGE_KEY = 'fradium_scan_history';
const MAX_SCAN_HISTORY_ITEMS = 100;
const TX_HISTORY_STORAGE_KEY = 'fradium_tx_history';
const MAX_TX_HISTORY_ITEMS = 200;

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

// New functions for scan history (comprehensive analysis results)
export function saveComprehensiveAnalysisToScanHistory(analysisResult: AnalysisResult): ScanHistoryItem {
  const timestamp = Date.now();
  const date = new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  const scanHistoryItem: ScanHistoryItem = {
    id: `${timestamp}_${analysisResult.address.slice(-8)}_${analysisResult.source}`,
    address: analysisResult.address,
    tokenType: analysisResult.tokenType,
    analysisResult,
    timestamp,
    date,
    isSafe: analysisResult.isSafe,
    source: analysisResult.source,
  };

  try {
    const existingScanHistory = getScanHistory();
    
    // Check for recent analysis of same address (within last hour)
    const recentAnalysis = existingScanHistory.items.find(item => 
      item.address === analysisResult.address && 
      (timestamp - item.timestamp) < 3600000 // 1 hour
    );

    let updatedItems: ScanHistoryItem[];
    
    if (recentAnalysis) {
      // Update existing recent analysis
      updatedItems = existingScanHistory.items.map(item => 
        item.id === recentAnalysis.id ? scanHistoryItem : item
      );
    } else {
      // Add new item to the beginning
      updatedItems = [scanHistoryItem, ...existingScanHistory.items];
    }

    // Limit to MAX_SCAN_HISTORY_ITEMS
    if (updatedItems.length > MAX_SCAN_HISTORY_ITEMS) {
      updatedItems = updatedItems.slice(0, MAX_SCAN_HISTORY_ITEMS);
    }

    const updatedScanHistory: ScanHistoryStorage = {
      items: updatedItems
    };

    localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(updatedScanHistory));
    
    console.log('Comprehensive analysis saved to scan history:', scanHistoryItem);
    return scanHistoryItem;
  } catch (error) {
    console.error('Error saving comprehensive analysis to scan history:', error);
    // Try to clear old cache if storage is full
    try {
      clearOldScanHistoryCache();
      localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify({ items: [scanHistoryItem] }));
      return scanHistoryItem;
    } catch (e) {
      console.error('Still unable to save to localStorage after cleanup:', e);
      throw error;
    }
  }
}

// Function to get scan history
export function getScanHistory(): ScanHistoryStorage {
  try {
    const stored = localStorage.getItem(SCAN_HISTORY_STORAGE_KEY);
    if (!stored) {
      return { items: [] };
    }
    
    const parsed = JSON.parse(stored) as ScanHistoryStorage;
    
    // Validate and clean up invalid entries
    const validItems = parsed.items.filter(item => 
      item.id && 
      item.address && 
      item.analysisResult && 
      typeof item.timestamp === 'number' &&
      item.source
    );

    return { items: validItems };
  } catch (error) {
    console.error('Error reading scan history:', error);
    return { items: [] };
  }
}

// Function to get scan history item by ID
export function getScanHistoryItemById(id: string): ScanHistoryItem | null {
  const scanHistory = getScanHistory();
  return scanHistory.items.find(item => item.id === id) || null;
}

// Function to delete scan history item
export function deleteScanHistoryItem(id: string): boolean {
  try {
    const scanHistory = getScanHistory();
    const filteredItems = scanHistory.items.filter(item => item.id !== id);
    
    const updatedScanHistory: ScanHistoryStorage = {
      items: filteredItems
    };

    localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(updatedScanHistory));
    return true;
  } catch (error) {
    console.error('Error deleting scan history item:', error);
    return false;
  }
}

// Function to clear all scan history
export function clearScanHistory(): boolean {
  try {
    localStorage.removeItem(SCAN_HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing scan history:', error);
    return false;
  }
}

// Function to clear old scan history cache
function clearOldScanHistoryCache(): void {
  const scanHistory = getScanHistory();
  
  if (scanHistory.items.length > 50) {
    // Keep only the 50 most recent items
    const recentItems = scanHistory.items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    
    const updatedScanHistory: ScanHistoryStorage = {
      items: recentItems
    };
    
    localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(updatedScanHistory));
    console.log('Cleared old scan history cache, kept 50 most recent items');
  }
}

// ============================
// Transaction history helpers
// ============================

export type TxDirection = 'Send' | 'Receive';

export interface TransactionHistoryItem {
  id: string;
  tokenType: string;
  chain: string;
  direction: TxDirection;
  amount: string; // human-readable unit (BTC, SOL, etc.)
  fromAddress?: string;
  toAddress: string;
  transactionId?: string;
  status: 'Pending' | 'Completed';
  timestamp: number;
  usdValue?: number;
  note?: string;
}

export interface TransactionHistoryStorage {
  items: TransactionHistoryItem[];
}

export interface SaveTransactionParams {
  tokenType: string;
  direction: TxDirection;
  amount: string;
  toAddress: string;
  fromAddress?: string;
  transactionId?: string;
  status?: 'Pending' | 'Completed';
  usdValue?: number;
  note?: string;
}

export function getTransactionHistory(): TransactionHistoryStorage {
  try {
    const stored = localStorage.getItem(TX_HISTORY_STORAGE_KEY);
    if (!stored) return { items: [] };
    const parsed = JSON.parse(stored) as TransactionHistoryStorage;
    const validItems = (parsed.items || []).filter((item) => item && item.id && item.tokenType && item.direction && item.amount && item.toAddress && typeof item.timestamp === 'number');
    return { items: validItems };
  } catch (error) {
    console.error('Error reading transaction history:', error);
    return { items: [] };
  }
}

export function getTransactionById(id: string): TransactionHistoryItem | null {
  const txs = getTransactionHistory();
  return txs.items.find((i) => i.id === id) || null;
}

export function clearTransactionHistory(): boolean {
  try {
    localStorage.removeItem(TX_HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    return false;
  }
}

export function deleteTransactionById(id: string): boolean {
  try {
    const txs = getTransactionHistory();
    const filtered = txs.items.filter((i) => i.id !== id);
    localStorage.setItem(TX_HISTORY_STORAGE_KEY, JSON.stringify({ items: filtered } satisfies TransactionHistoryStorage));
    return true;
  } catch (error) {
    console.error('Error deleting transaction history item:', error);
    return false;
  }
}

export function saveTransaction(params: SaveTransactionParams): TransactionHistoryItem {
  const timestamp = Date.now();
  const shortAddr = (params.direction === 'Send' ? (params.toAddress || '') : params.toAddress || '').slice(-8);
  const id = `${timestamp}_${params.tokenType}_${params.direction}_${shortAddr}`;
  const item: TransactionHistoryItem = {
    id,
    tokenType: params.tokenType,
    chain: params.tokenType,
    direction: params.direction,
    amount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    transactionId: params.transactionId,
    status: params.status || 'Completed',
    timestamp,
    usdValue: params.usdValue,
    note: params.note,
  };

  try {
    const existing = getTransactionHistory();
    let updated = [item, ...existing.items];
    if (updated.length > MAX_TX_HISTORY_ITEMS) {
      updated = updated.slice(0, MAX_TX_HISTORY_ITEMS);
    }
    localStorage.setItem(TX_HISTORY_STORAGE_KEY, JSON.stringify({ items: updated } satisfies TransactionHistoryStorage));
    return item;
  } catch (error) {
    console.error('Error saving transaction history item:', error);
    throw error;
  }
}

// Balance baselines to detect incoming funds
function balanceBaselineKey(tokenType: string, address: string): string {
  return `fradium_last_balance_${tokenType}_${address}`;
}

export function getLastKnownBalance(tokenType: string, address: string): number | null {
  try {
    const stored = localStorage.getItem(balanceBaselineKey(tokenType, address));
    if (!stored) return null;
    const value = parseFloat(stored);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function setLastKnownBalance(tokenType: string, address: string, balance: number): void {
  try {
    localStorage.setItem(balanceBaselineKey(tokenType, address), String(balance));
  } catch (error) {
    console.warn('Failed to set last known balance:', error);
  }
}