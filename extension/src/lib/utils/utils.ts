import { HttpAgent } from "@dfinity/agent"

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
    env.PLASMO_PUBLIC_DFX_NETWORK ||
    process.env.PLASMO_PUBLIC_DFX_NETWORK ||
    process.env.VITE_DFX_NETWORK ||
    process.env.DFX_NETWORK

  if (!canisterId) {
    console.warn("CANISTER_ID_INTERNET_IDENTITY is not set.");
    return "https://id.ai";
  }

  if (network === "local") {
    return `http://${canisterId}.localhost:4943`;
  } else {
    // Mainnet/public II URL
    return `https://id.ai`;
  }
}

// Resolve DFX network from multiple env sources (plasmo/vite/node)
export function getDfxNetwork(): string {
  const env = (typeof import.meta !== "undefined" ? (import.meta as any).env : {}) || {}
  return (
    env.PLASMO_PUBLIC_DFX_NETWORK ||
    env.VITE_DFX_NETWORK ||
    process.env.PLASMO_PUBLIC_DFX_NETWORK ||
    process.env.VITE_DFX_NETWORK ||
    process.env.DFX_NETWORK ||
    "ic"
  )
}

// Return proper agent host based on network
export function getIcHost(): string | undefined {
  const net = getDfxNetwork()
  if (net === "local") {
    return "http://127.0.0.1:4943"
  }
  // undefined lets @dfinity/agent use default boundary (icp-api.io)
  return undefined
}

// Convenience factory to create HttpAgent honoring host and root key policy
export function createHttpAgent(identity?: any): HttpAgent {
  const host = getIcHost()
  const agent = new HttpAgent({ identity, host }) as HttpAgent
  if (getDfxNetwork() !== "ic") {
    try { (agent as any).fetchRootKey?.() } catch {}
  }
  return agent
}

// Create an agent tailored for a specific canister id. In local mode,
// always talk to the local replica and fetch the root key. In mainnet,
// use the default boundary node host and do NOT fetch root key.
export function createAgentForCanister(canisterId: string | undefined, identity?: any): HttpAgent {
  const network = getDfxNetwork()
  const isLocalEnv = network !== "ic"

  console.log("NETWORK", network);

  // Known mainnet canister IDs used by the extension for production ledgers and services
  const MAINNET_CANISTERS = new Set<string>([
    // ICP Ledger (mainnet)
    // "ryjl3-tyaaa-aaaaa-aaaba-cai",
    // // Fradium Ledger (project mainnet value)
    // "sr4wk-4qaaa-aaaae-qfdta-cai",
    // // Fradium Index (project mainnet value)
    // "vjrnc-hiaaa-aaaam-aejza-cai",
    // // ckBTC Ledger / Index / Minter / KYT (mainnet)
    // "mc6ru-gyaaa-aaaar-qaaaq-cai",
    // "mm444-5iaaa-aaaar-qaabq-cai",
    // "ml52i-qqaaa-aaaar-qaaba-cai",
    // "pvm5g-xaaaa-aaaar-qaaia-cai",
    // "v3x23-lyaaa-aaaam-aej2a-cai",
    // "qhbym-qaaaa-aaaaa-aaafq-cai",
    // "oqcob-6iaaa-aaaar-qbr7q-cai",
    // "zkoni-faaaa-aaaar-qbsaa-cai",
    // "t4sse-tyaaa-aaaae-qfduq-cai",
    // "7hfb6-caaaa-aaaar-qadga-cai",
    // "tghme-zyaaa-aaaar-qarca-cai",
  ])

  const targetIsMainnet = !!canisterId && MAINNET_CANISTERS.has(canisterId)
  const shouldUseLocalHost = isLocalEnv && !targetIsMainnet

  const host = shouldUseLocalHost ? "http://127.0.0.1:4943" : undefined
  const agent = new HttpAgent({ identity, host, verifyQuerySignatures: false }) as HttpAgent

  // Only fetch root key when talking to a local replica
  if (shouldUseLocalHost) {
    try { agent.fetchRootKey?.() } catch {}
  }

  return agent
}

// Utility function to combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}