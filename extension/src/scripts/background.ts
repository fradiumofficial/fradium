import { idlFactory as canisterIdlFactory } from "@dfinity/agent/lib/cjs/canisters/management_service";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-extension",
    title: "Open Fraudify Extension",
    contexts: ["all"], // Show on all right-clicks
  });
});

chrome.contextMenus.onClicked.addListener((info, _) => {
  if (info.menuItemId === "open-extension") {
    chrome.action.openPopup();
  }
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "openExtension") {
    chrome.action.openPopup();
  }

  if (request.type === "ANALYZE_ADDRESS") {
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

    analyze()
    return true;
  }
});