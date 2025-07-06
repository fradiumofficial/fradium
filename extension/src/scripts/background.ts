chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openExtension") {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
  }
});
