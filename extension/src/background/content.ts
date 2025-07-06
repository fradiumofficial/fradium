document.addEventListener('dblclick', () => {
  chrome.runtime.sendMessage({ action: "openExtension" });
});