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
    icon: "/assets/svg/tokens/bitcoin.svg",
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
    icon: "/assets/svg/tokens/eth.svg",
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
    icon: "/assets/svg/tokens/solana.svg",
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
    icon: "/assets/svg/tokens/fum.svg",
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
    icon: "/assets/svg/tokens/unknown.svg",
    decimals: 0,
    unitConversion: {
      base: "unknown",
      display: "Unknown",
      factor: 1,
    },
  },
};

export function detectTokenType(address) {
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

function capitalize(s) {
  return String(s[0]).toUpperCase() + String(s).slice(1);
}

export function getTokenImageURL(chain) {
  switch (capitalize(chain)) {
    case TokenType.ETHEREUM:
      return "/assets/svg/tokens/eth.svg";
    case TokenType.BITCOIN:
      return "/assets/svg/tokens/bitcoin.svg";
    case TokenType.SOLANA:
      return "/assets/svg/tokens/solana.svg";
    case TokenType.FUM:
      return "/assets/svg/tokens/fum.svg";
    default:
      return "/assets/svg/tokens/unknown.svg";
  }
}

// Universal CoinGecko price fetcher
/**
 * Menghitung nilai USD dari amountInToken (satuan terkecil) untuk tokenType tertentu.
 * @param {string} tokenType - Tipe token (TokenType.BITCOIN, dst)
 * @param {number} amountInToken - Jumlah dalam satuan terkecil (satoshi, wei, lamport, e8s)
 * @returns {Promise<string>} - Nilai USD (string, misal "$291.08")
 */
export async function getPriceUSD(tokenType, amountInToken) {
  // CoinGecko uses lowercase id
  const id = TOKENS_CONFIG[tokenType]?.id;
  const symbol = TOKENS_CONFIG[tokenType]?.name;
  if (!id || !symbol) return "$0.00";

  // Validate amountInToken
  if (!amountInToken || isNaN(amountInToken) || amountInToken <= 0) {
    return "$0.00";
  }

  const urlCoingecko = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
  const urlCryptoCompare = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`;
  let price = 0;

  // Try CoinGecko first
  try {
    const response = await fetch(urlCoingecko);

    if (response.ok) {
      const data = await response.json();
      price = data[id]?.usd || 0;
    }
  } catch (error) {
    console.warn(`CoinGecko API error for ${tokenType}:`, error);
  }

  // Fallback to CryptoCompare if needed
  if (!price || price <= 0) {
    try {
      const response = await fetch(urlCryptoCompare);
      if (response.ok) {
        const data = await response.json();
        price = data.USD || 0;
      }
    } catch (error) {
      console.warn(`CryptoCompare API error for ${tokenType}:`, error);
    }
  }

  if (!price || price <= 0) return "$0.00";

  // Convert amountInToken to display unit first, then multiply by price
  const displayAmount = getAmountToken(tokenType, amountInToken);

  // Validate displayAmount
  if (!displayAmount || displayAmount === "0" || displayAmount === "") {
    return "$0.00";
  }

  const displayAmountNumber = parseFloat(displayAmount);
  if (isNaN(displayAmountNumber) || displayAmountNumber <= 0) {
    return "$0.00";
  }

  const usdValue = displayAmountNumber * price;

  // Validate final result
  if (isNaN(usdValue) || usdValue <= 0) {
    return "$0.00";
  }

  // Format USD dinamis:
  // - >= 0.01: 2 desimal
  // - < 0.01 dan > 0: gunakan toLocaleString tanpa trailing zero (hingga 20 desimal)
  let formattedUsd = "0.00";
  if (usdValue >= 0.01) {
    formattedUsd = usdValue.toFixed(2);
  } else if (usdValue > 0) {
    const small = usdValue
      .toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
        useGrouping: false,
      })
      .replace(/0+$/, "")
      .replace(/\.$/, "");
    formattedUsd = small && small !== "" ? small : "0.00";
  } else {
    formattedUsd = "0.00";
  }
  return `$${formattedUsd}`;
}

export function getAmountToken(tokenType, amountInToken) {
  // Validate inputs
  if (!amountInToken || isNaN(amountInToken) || amountInToken <= 0) {
    return "0";
  }

  const factor = TOKENS_CONFIG[tokenType]?.unitConversion?.factor || 1;
  const decimals = TOKENS_CONFIG[tokenType]?.decimals ?? 8;
  const amount = amountInToken / factor;

  // Format dengan fixed decimal, lalu hapus trailing zero tanpa mengubah ke Number
  // agar tidak menjadi notasi ilmiah (e.g., 1e-8)
  const formattedAmount = amount.toFixed(decimals);
  const trimmed = formattedAmount.replace(/\.?0+$/, "");

  // Pastikan tidak mengembalikan string kosong
  return trimmed.length > 0 ? trimmed : "0";
}

/**
 * Konversi dari display amount (misal: 0.001 BTC) ke base unit (misal: satoshi)
 * @param {string} tokenType - Tipe token (TokenType.BITCOIN, dst)
 * @param {number|string} amount - Jumlah dalam satuan display (misal: 0.001)
 * @returns {number} - Jumlah dalam satuan base (misal: 100000 satoshi)
 */
export function amountToBaseUnit(tokenType, amount) {
  const factor = TOKENS_CONFIG[tokenType]?.unitConversion?.factor || 1;
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return 0;

  return Math.floor(n * factor);
}

/**
 * Konversi dari base unit (misal: satoshi) ke display amount (misal: BTC)
 * @param {string} tokenType - Tipe token (TokenType.BITCOIN, dst)
 * @param {number} baseAmount - Jumlah dalam satuan base (misal: 100000 satoshi)
 * @returns {string} - Jumlah dalam satuan display (misal: 0.001)
 */
export function baseUnitToAmount(tokenType, baseAmount) {
  const factor = TOKENS_CONFIG[tokenType]?.unitConversion?.factor || 1;
  if (!baseAmount || isNaN(baseAmount) || baseAmount <= 0) return "0";
  const amount = baseAmount / factor;
  const decimals = TOKENS_CONFIG[tokenType]?.decimals ?? 8;

  return amount.toFixed(decimals).replace(/\.?0+$/, "");
}
