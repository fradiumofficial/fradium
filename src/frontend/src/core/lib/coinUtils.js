import { wallet } from "declarations/wallet";

// --- Mainnet tokens ---
export const TOKENS_CONFIG = [
  {
    id: 1,
    name: "Bitcoin Testnet4",
    symbol: "BTC",
    chain: "Bitcoin",
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
    chain: "Ethereum",
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
    chain: "Solana",
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
    chain: "Internet Computer",
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
    chain: "Internet Computer",
    decimals: 8,
    imageUrl: "assets/images/coins/fradium.webp",
    mainnet: true,
    // Token type
    type: "icrc",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
  },
];

// Network configuration for WalletLayout compatibility
export const NETWORK_CONFIG = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: "/assets/images/networks/bitcoin.webp",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/assets/images/networks/ethereum.webp",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "/assets/images/networks/solana.webp",
  },
  {
    id: "icp",
    name: "Internet Computer",
    icon: "/assets/images/networks/solana.webp", // Using solana as placeholder for ICP
  },
];

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

export async function getBalance(tokenId) {
  const token = TOKENS_CONFIG.find((t) => t.id === tokenId);
  if (!token) throw new Error("Token not found: " + tokenId);

  if (token.type === "native") {
    switch (token.id) {
      case 1: // BTC
        return await wallet.bitcoin_balance();
      case 2: // ETH
        return await wallet.ethereum_balance();
      case 3: // SOL
        return await wallet.solana_balance();
      default:
        throw new Error("Native token not supported");
    }
  }
  throw new Error("Unsupported token type");
}

// Function to format amount with specific rules
export function formatAmount(amount) {
  // Convert to number if it's a string
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // If amount is 0, return "0.0"
  if (numAmount === 0) {
    return "0.0";
  }

  // Convert to string with maximum precision
  const amountStr = numAmount.toString();

  // If it's an integer (no decimal part), add .0
  if (!amountStr.includes(".")) {
    return amountStr + ".0";
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = amountStr.split(".");

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  // If decimal part becomes empty after trimming, add .0
  if (trimmedDecimal === "") {
    return integerPart + ".0";
  }

  // Return with trimmed decimal part
  return integerPart + "." + trimmedDecimal;
}

// Function to get network icon based on chain
export function getNetworkIcon(chain) {
  const network = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === chain.toLowerCase());
  return network ? network.icon : null;
}
