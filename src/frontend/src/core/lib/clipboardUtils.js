// Clipboard utility functions

// Copy to clipboard dengan error handling
export function copyToClipboard(text) {
  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Toast feedback bisa ditambahkan di sini jika diperlukan
      console.log("Address copied to clipboard");
    })
    .catch((error) => {
      console.error("Failed to copy to clipboard:", error);
    });
}
