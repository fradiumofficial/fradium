/**
 * Report Utilities
 * Helper functions for report data processing and conversion
 */

/**
 * Convert backend report status to frontend readable string
 * Backend status is a variant type: { Voting: null }, { NotValidated: null }, { Safe: null }, { Unsafe: null }
 * @param {Object|String} backendStatus - Status from backend (variant object or string)
 * @returns {String} - Readable status string: "Voting", "Not Validated", "Safe", "Unsafe", "Pending"
 */
export function convertReportStatus(backendStatus) {
  if (!backendStatus) {
    return "Pending";
  }

  // Handle variant type (object with single key)
  if (typeof backendStatus === "object") {
    if (backendStatus.Voting !== undefined) return "Voting";
    if (backendStatus.NotValidated !== undefined) return "Not Validated";
    if (backendStatus.Safe !== undefined) return "Safe";
    if (backendStatus.Unsafe !== undefined) return "Unsafe";
    // Legacy support
    if (backendStatus.Pending !== undefined) return "Pending";
    if (backendStatus.Ongoing !== undefined) return "Voting";
  }

  // Handle string type (if backend sends string directly)
  if (typeof backendStatus === "string") {
    if (backendStatus === "Voting") return "Voting";
    if (backendStatus === "NotValidated") return "Not Validated";
    if (backendStatus === "Safe") return "Safe";
    if (backendStatus === "Unsafe") return "Unsafe";
    // Return as-is for other string values
    return backendStatus;
  }

  return "Pending";
}

/**
 * Format report address to short version
 * @param {String} address - Full address
 * @param {Number} startChars - Number of characters at start (default: 6)
 * @param {Number} endChars - Number of characters at end (default: 4)
 * @returns {String} - Shortened address
 */
export function formatShortAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Convert nanoseconds timestamp to Date object
 * @param {BigInt|Number|String} nanoseconds - Timestamp in nanoseconds
 * @returns {Date} - JavaScript Date object
 */
export function nanosToDate(nanoseconds) {
  const timestamp = typeof nanoseconds === "bigint" ? Number(nanoseconds) : parseInt(nanoseconds);
  return new Date(timestamp / 1000000); // Convert nanoseconds to milliseconds
}

/**
 * Calculate vote percentages from vote counts
 * @param {Number} votesYes - Number of yes votes
 * @param {Number} votesNo - Number of no votes
 * @returns {Object} - { yesPercentage, noPercentage, totalVotes }
 */
export function calculateVotePercentages(votesYes, votesNo) {
  const totalVotes = votesYes + votesNo;
  const yesPercentage = totalVotes > 0 ? Number(((votesYes / totalVotes) * 100).toFixed(2)) : 0;
  const noPercentage = totalVotes > 0 ? Number(((votesNo / totalVotes) * 100).toFixed(2)) : 0;

  return {
    yesPercentage,
    noPercentage,
    totalVotes,
  };
}

/**
 * Check if a report has met the minimum quorum requirement
 * @param {Number} totalVoters - Number of unique voters
 * @param {Number} minimumQuorum - Minimum required voters (default: 3)
 * @returns {Boolean} - True if quorum is met
 */
export function hasMetQuorum(totalVoters, minimumQuorum = 3) {
  return totalVoters >= minimumQuorum;
}

/**
 * Get display name for report category
 * @param {String} category - Category from backend
 * @returns {String} - Formatted category name
 */
export function formatCategory(category) {
  if (!category) return "Unknown";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Convert backend vote type to frontend boolean or readable string
 * Backend vote type is a variant: { Unsafe: null } or { Safe: null }
 * @param {Object} voteType - Vote type from backend (variant object)
 * @param {String} returnType - "boolean" or "string" (default: "boolean")
 * @returns {Boolean|String} - true for Unsafe, false for Safe (if boolean) or "Unsafe"/"Safe" (if string)
 */
export function convertVoteType(voteType, returnType = "boolean") {
  if (!voteType) {
    return returnType === "boolean" ? false : "Safe";
  }

  // Handle variant type (object with single key)
  if (typeof voteType === "object") {
    const isUnsafe = voteType.Unsafe !== undefined;

    if (returnType === "string") {
      return isUnsafe ? "Unsafe" : "Safe";
    }
    return isUnsafe; // true for Unsafe, false for Safe
  }

  // Handle if it's already a boolean (backward compatibility)
  if (typeof voteType === "boolean") {
    if (returnType === "string") {
      return voteType ? "Unsafe" : "Safe";
    }
    return voteType;
  }

  // Default
  return returnType === "boolean" ? false : "Safe";
}
