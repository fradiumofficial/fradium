// String utility functions

// Format address untuk display (truncate dengan ...)
export function formatAddress(address) {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
