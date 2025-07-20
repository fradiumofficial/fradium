import { analyzeAddress } from "../canister/ransomware_service";
import { analyzeAddressCommunity } from "../canister/backend_service";

// Listener untuk saat ekstensi pertama kali di-install atau di-update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-extension",
    title: "Open Fraudify Extension",
    contexts: ["all"],
  });
});

// Listener untuk saat item di context menu (klik kanan) diklik
chrome.contextMenus.onClicked.addListener((info, _) => {
  if (info.menuItemId === "open-extension") {
    chrome.action.openPopup();
  }
});

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
    const TIMEOUT_MS = 120000; // 2 menit
    
    const callCanister = async () => {
      try {
        console.log(`Starting analysis for address: ${addressToAnalyze}`);
        
        // 1. Analisa alamat menggunakan ransomware detector
        const analysisPromise = analyzeAddress(addressToAnalyze);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Analysis timeout after 2 minutes')), TIMEOUT_MS);
        });
        
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        console.log('Analysis completed:', result);
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Error calling ICP canister:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ success: false, error: errorMessage });
      }
    };
    
    callCanister();
    return true;
  }

  if (request.type === "ANALYZE_ADDRESS_COMMUNITY") {
    const addressToAnalyze = request.address;

    const callCanisterBackend = async () => {
      try {
        console.log(`Starting community analysis for address: ${addressToAnalyze}`);
        
        // 1. Analisa alamat menggunakan ransomware detector
        const result = await analyzeAddressCommunity(addressToAnalyze);
        console.log('Community analysis completed:', result);
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Error calling ICP canister for community analysis:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ success: false, error: errorMessage });
      }
    };

    callCanisterBackend();
    return true;
  }
});