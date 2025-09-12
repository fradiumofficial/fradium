export function getInternetIdentityNetwork() {
  const env = (typeof import.meta !== "undefined" ? (import.meta as any).env : {}) || {}
  const canisterId =
    env.PLASMO_PUBLIC_CANISTER_ID_INTERNET_IDENTITY ||
    env.VITE_CANISTER_ID_INTERNET_IDENTITY ||
    process.env.PLASMO_PUBLIC_CANISTER_ID_INTERNET_IDENTITY ||
    process.env.VITE_CANISTER_ID_INTERNET_IDENTITY ||
    process.env.CANISTER_ID_INTERNET_IDENTITY

  const network =
    env.PLASMO_PUBLIC_DFX_NETWORK ||
    env.VITE_DFX_NETWORK ||
    process.env.PLASMO_PUBLIC_DFX_NETWORK ||
    process.env.VITE_DFX_NETWORK ||
    process.env.DFX_NETWORK

  if (!canisterId) {
    console.warn("CANISTER_ID_INTERNET_IDENTITY is not set.");
    // Fallback to the public Internet Identity service
    return "https://id.ai";
  }

  if (network === "local") {
    return `http://${canisterId}.localhost:4943`;
  } else {
    // Mainnet/public II URL
    return `https://id.ai`;
  }
}

// Utility function to combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}