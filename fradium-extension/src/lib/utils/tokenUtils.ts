import { CDN } from "~lib/constant/cdn";

export const TokenType = Object.freeze({
  BITCOIN: "Bitcoin",
  ETHEREUM: "Ethereum", 
  SOLANA: "Solana",
  FUM: "Fradium",
  UNKNOWN: "Unknown",
});

export const TOKENS_CONFIG = {
  [TokenType.BITCOIN]: {
    id: "bitcoin",
    name: "BTC",
    symbol: "Bitcoin",
    displayName: "Bitcoin",
    description: "Bitcoin • Internet Computer",
    icon: CDN.tokens.bitcoin,
    decimals: 8,
    unitConversion: {
      base: "satoshi",
      display: "BTC", 
      factor: 100000000,
    },
  },
  [TokenType.ETHEREUM]: {
    id: "ethereum",
    name: "ETH",
    symbol: "Ethereum",
    displayName: "Ethereum",
    description: "Ethereum • Internet Computer",
    icon: CDN.tokens.eth,
    decimals: 18,
    unitConversion: {
      base: "wei",
      display: "ETH",
      factor: 1000000000000000000,
    },
  },
  [TokenType.SOLANA]: {
    id: "solana",
    name: "SOL",
    symbol: "Solana",
    displayName: "Solana",
    description: "Solana • Internet Computer",
    icon: CDN.tokens.solana,
    decimals: 9,
    unitConversion: {
      base: "lamport",
      display: "SOL",
      factor: 1000000000,
    },
  },
  [TokenType.FUM]: {
    id: "fradium",
    name: "FUM",
    symbol: "Fradium",
    displayName: "Fradium",
    description: "Fradium • Internet Computer",
    icon: CDN.tokens.fum,
    decimals: 8,
    unitConversion: {
      base: "e8s",
      display: "FUM",
      factor: 100000000,
    },
  },
  [TokenType.UNKNOWN]: {
    id: "unknown",
    name: "Unknown",
    symbol: "Unknown",
    displayName: "Unknown",
    description: "Unknown • Internet Computer",
    icon: CDN.tokens.unknown,
    decimals: 0,
    unitConversion: {
      base: "unknown",
      display: "Unknown",
      factor: 1,
    },
  },
};

export function detectTokenType(address: string): string {
  const lower = address.toLowerCase();

  // Ethereum (0x + 40 hexdigits)
  if (address.startsWith("0x") && address.length === 42 && /^[0-9a-fA-F]+$/.test(address.slice(2))) {
    return TokenType.ETHEREUM;
  }

  // Bitcoin Mainnet Legacy (starts with 1 or 3)
  if ((address.startsWith("1") || address.startsWith("3")) && address.length >= 26 && address.length <= 35) {
    return TokenType.BITCOIN;
  }

  // Bitcoin Mainnet Bech32 (bc1q / bc1p)
  if (lower.startsWith("bc1q") || lower.startsWith("bc1p")) {
    return TokenType.BITCOIN;
  }

  // Bitcoin Testnet Legacy (m / n / 2)
  if ((address.startsWith("m") || address.startsWith("n") || address.startsWith("2")) && address.length >= 26 && address.length <= 35) {
    return TokenType.BITCOIN;
  }

  // Bitcoin Testnet Bech32 (tb1q / tb1p)
  if (lower.startsWith("tb1q") || lower.startsWith("tb1p")) {
    return TokenType.BITCOIN;
  }

  // Solana (Base58, 32–44 chars, valid Base58 chars)
  const base58Chars = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (address.length >= 36 && address.length <= 44 && base58Chars.test(address)) {
    return TokenType.SOLANA;
  }

  return TokenType.UNKNOWN;
}

export function amountToBaseUnit(cryptoName: string, amount: number) {
  // Get token config for the crypto name
  const tokenConfig = TOKENS_CONFIG[cryptoName as keyof typeof TOKENS_CONFIG];
  if (!tokenConfig) {
    throw new Error(`Error: Mata uang kripto '${cryptoName}' tidak didukung.`);
  }

  // Get decimals from token config
  const decimals = tokenConfig.decimals;

  // Convert to base unit using BigInt for precision
  const baseUnitValue = BigInt(Math.floor(amount * (10 ** decimals)));

  return baseUnitValue;
}
// Convert chain name to token type variant for canister
export const getTokenTypeVariant = (chainName: string) => {
  switch (chainName) {
    case TokenType.BITCOIN:
      return { Bitcoin: null };
    case TokenType.ETHEREUM:
      return { Ethereum: null };
    case TokenType.SOLANA:
      return { Solana: null };
    case TokenType.FUM:
      return { Fum: null };
    default:
      return { Unknown: null };
  }
};

function capitalize(s: string) {
  return String(s[0]).toUpperCase() + String(s).slice(1);
}

export function getTokenImageURL(chain: string) {
  switch (capitalize(chain)) {
    case TokenType.ETHEREUM:
      return CDN.tokens.eth;
    case TokenType.BITCOIN:
      return CDN.tokens.bitcoin;
    case TokenType.SOLANA:
      return CDN.tokens.solana;
    case TokenType.FUM:
      return CDN.tokens.fum;
    default:
      return CDN.tokens.unknown;
  }
}

export const validateAddress = (address: string, tokenType: string) => {
  if (!address || typeof address !== "string") {
    return { isValid: false, error: "Address is required" };
  }

  const detectedType = tokenType || detectTokenType(address);

  if (detectedType === TokenType.UNKNOWN) {
    return { isValid: false, error: "Unknown token type" };
  }

  return { isValid: true, tokenType: detectedType };
};
