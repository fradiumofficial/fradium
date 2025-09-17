// Label and display utility functions

// Get analysis type label untuk display
export function getAnalysisTypeLabel(analyzedType, isSafe) {
  if (!analyzedType) return "Unknown";

  let typeLabel = "Unknown";

  // Handle different analyzed type structures
  if (typeof analyzedType === "string") {
    typeLabel = analyzedType;
  } else if (typeof analyzedType === "object") {
    // Handle object structure like { AIAnalysis: null }
    const keys = Object.keys(analyzedType);
    if (keys.length > 0) {
      typeLabel = keys[0];
    }
  }

  // Map to display labels
  const typeMapping = {
    AIAnalysis: "AI",
    CommunityVote: "Community",
    AI: "AI",
    Community: "Community",
  };

  const displayType = typeMapping[typeLabel] || typeLabel;
  const safetyLabel = isSafe ? "Safe" : "Ransomware";

  return `${safetyLabel} - ${displayType}`;
}
