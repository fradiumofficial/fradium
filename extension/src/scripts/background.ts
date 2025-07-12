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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openExtension") {
    chrome.action.openPopup();
  }
});