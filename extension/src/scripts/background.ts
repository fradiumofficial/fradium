import { getActor } from "../canister/canister_service";

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
    // Tidak perlu 'return true' karena ini operasi sinkron
    return;
  }

  // --- Aksi Asinkron: Analisa Alamat via REST API (Fradium) ---
  if (request.type === "ANALYZE_ADDRESS_SMART_CONTRACT") {
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
    // Wajib 'return true' untuk menjaga port tetap terbuka
    return true;
  }

  // --- Aksi Asinkron: Analisa Alamat via Canister ICP ---
  // Ini adalah blok baru yang kita tambahkan
  if (request.type === 'ANALYZE_ADDRESS') {
    const addressToAnalyze = request.address;
    const callCanister = async () => {
      try {
        // 1. Dapatkan actor dari service
        const actor = await getActor();
        
        // 2. Panggil fungsi di canister (pastikan 'analyze_address' adalah nama fungsi yang benar)
        const result = await actor.analyze_address(addressToAnalyze);
        
        // 3. Kirim kembali response sukses
        sendResponse({ success: true, data: result });
      } catch (error) {
        // 4. Kirim kembali response error
        console.error("Error calling ICP canister:", error);
        sendResponse({ success: false, error: (error as Error).message });
      }
    };
    callCanister();
    // Wajib 'return true' untuk menjaga port tetap terbuka
    return true;
  }
});