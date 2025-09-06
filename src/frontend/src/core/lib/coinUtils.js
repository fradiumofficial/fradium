import { wallet } from "declarations/wallet";

// --- Mainnet tokens ---
export const TOKENS_CONFIG = [
  {
    id: 1,
    name: "Bitcoin Testnet4",
    symbol: "BTC",
    chain: "BTC",
    decimals: 8,
    imageUrl: "assets/images/coins/bitcoin.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 2,
    name: "Sepolia Ethereum",
    symbol: "ETH",
    chain: "ETH",
    decimals: 18,
    imageUrl: "assets/images/coins/ethereum.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 3,
    name: "Solana Devnet",
    symbol: "SOL",
    chain: "SOL",
    decimals: 9,
    imageUrl: "assets/images/coins/solana.webp",
    mainnet: false,
    // Token type
    type: "native",
  },
  {
    id: 4,
    name: "Internet Computer",
    symbol: "ICP",
    chain: "IC",
    decimals: 8,
    imageUrl: "assets/images/coins/icp.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  },
  {
    id: 5,
    name: "Fradium",
    symbol: "FADM",
    chain: "IC",
    decimals: 8,
    imageUrl: "assets/images/coins/fradium.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
  },
];

// Network configuration for WalletLayout compatibility
export const NETWORK_CONFIG = {
  Bitcoin: {
    name: "Bitcoin",
    icon: "/assets/images/coins/bitcoin.webp",
  },
  Ethereum: {
    name: "Ethereum",
    icon: "/assets/images/coins/ethereum.webp",
  },
  Solana: {
    name: "Solana",
    icon: "/assets/images/coins/solana.webp",
  },
  Fradium: {
    name: "Fradium",
    icon: "/assets/images/coins/fradium.webp",
  },
};

// Get supported networks function
export function getSupportedNetworks() {
  return ["Bitcoin", "Ethereum", "Solana", "Fradium"];
}

export function getTokens() {
  return TOKENS_CONFIG;
}

export async function sendToken(tokenId, to, amount) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  if (token.type === "native") {
    switch (token.id) {
      case "BTC":
        return await wallet.bitcoin_send({ destination_address: to, amount_in_satoshi: amount });
      case "ETH":
        return await wallet.ethereum_send(to, amount);
      case "SOL":
        return await wallet.solana_send(to, amount);
      default:
        throw new Error("Native token not supported");
    }
  }

  if (token.type === "icrc" && token.canisterId) {
    const ledger = await initLedgerActor(token.canisterId);
    return await ledger.icrc1_transfer({
      from_subaccount: [],
      to: { owner: to, subaccount: [] },
      amount,
      fee: [],
      memo: [],
      created_at_time: [],
    });
  }

  throw new Error("Unsupported token type");
}
