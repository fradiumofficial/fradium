// ICPSwap configuration (env-driven)
// Keep IDs in .env as CANISTER_ID_ICPSWAP_*

export const ICPSWAP_CONFIG = {
  // Swap information canister used for quotes and pool discovery
  infoCanisterId: process.env.CANISTER_ID_SWAP_INFO,
  // Router/aggregator canister that executes one-step ICRC-1 trades
  routerCanisterId: process.env.CANISTER_ID_SWAP_ROUTE,
  // Optional: factory canister (not required for swapping)
  factoryCanisterId: process.env.CANISTER_ID_SWAP_FACTORY,
};

// Tokens we will expose in the swap UI (must be ICRC-1 and commonly supported by ICPSwap)
export const ICPSWAP_SUPPORTED_SYMBOLS = new Set(["ICP", "ckBTC", "ckETH"]);

// Helper to filter app tokens to ICRC-1 that are likely swappable on ICPSwap
export function getSwappableTokens(tokensConfig) {
  return (tokensConfig || []).filter((t) => t.type === "icrc" && ICPSWAP_SUPPORTED_SYMBOLS.has(t.symbol));
}


