// JSON utility functions

// Parse metadata JSON string dengan error handling
export function parseMetadata(metadata) {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return {};
  }
}
