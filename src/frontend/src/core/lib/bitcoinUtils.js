/**
 * Bitcoin utility functions for handling satoshis, BTC conversion, and formatting
 */

// Constants
export const SATOSHIS_PER_BTC = 100000000; // 1 BTC = 100,000,000 satoshis
export const BTC_DECIMALS = 8;

// Cache for BTC price
let btcPriceCache = {
  price: 43000, // Default fallback price
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * Fetch current Bitcoin price from CoinGecko API
 * @returns {Promise<number>} Current BTC price in USD
 */
export const fetchBTCPrice = async () => {
  const now = Date.now();

  // Return cached price if still valid
  if (now - btcPriceCache.lastUpdated < btcPriceCache.cacheDuration) {
    return btcPriceCache.price;
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const btcPrice = data.bitcoin?.usd;

    if (btcPrice && btcPrice > 0) {
      btcPriceCache.price = btcPrice;
      btcPriceCache.lastUpdated = now;
      return btcPrice;
    } else {
      throw new Error("Invalid price data received");
    }
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    // Return cached price or default if fetch fails
    return btcPriceCache.price;
  }
};

/**
 * Get cached BTC price (doesn't fetch from API)
 * @returns {number} Cached BTC price in USD
 */
export const getCachedBTCPrice = () => {
  return btcPriceCache.price;
};

/**
 * Convert satoshis to BTC
 * @param {number|string|BigInt} satoshis - Amount in satoshis
 * @returns {number} Amount in BTC
 */
export const satoshisToBTC = (satoshis) => {
  if (typeof satoshis === "string") {
    satoshis = parseInt(satoshis);
  }
  if (typeof satoshis === "bigint") {
    satoshis = Number(satoshis);
  }
  return satoshis / SATOSHIS_PER_BTC;
};

/**
 * Convert BTC to satoshis
 * @param {number} btc - Amount in BTC
 * @returns {number} Amount in satoshis
 */
export const btcToSatoshis = (btc) => {
  return Math.floor(btc * SATOSHIS_PER_BTC);
};

/**
 * Format BTC amount with proper decimal places
 * @param {number} btc - Amount in BTC
 * @param {number} decimals - Number of decimal places (default: 8)
 * @returns {string} Formatted BTC string
 */
export const formatBTC = (btc, decimals = BTC_DECIMALS) => {
  if (btc === 0) return `0.${"0".repeat(decimals)}`;
  return btc.toFixed(decimals);
};

/**
 * Format satoshis to BTC string
 * @param {number|string|BigInt} satoshis - Amount in satoshis
 * @param {number} decimals - Number of decimal places (default: 8)
 * @returns {string} Formatted BTC string
 */
export const formatSatoshisToBTC = (satoshis, decimals = BTC_DECIMALS) => {
  const btc = satoshisToBTC(satoshis);
  return formatBTC(btc, decimals);
};

/**
 * Calculate USD value from BTC amount
 * @param {number} btc - Amount in BTC
 * @param {number} btcPriceUSD - BTC price in USD (default: cached price)
 * @returns {number} USD value
 */
export const calculateBTCValueUSD = async (btc, btcPriceUSD = null) => {
  const price = btcPriceUSD || (await fetchBTCPrice());
  return btc * price;
};

/**
 * Format USD value with proper currency formatting
 * @param {number} usdValue - USD value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted USD string
 */
export const formatUSD = (usdValue, decimals = 2) => {
  return `$${usdValue.toFixed(decimals)}`;
};

/**
 * Get BTC value in USD from satoshis
 * @param {number|string|BigInt} satoshis - Amount in satoshis
 * @param {number} btcPriceUSD - BTC price in USD (default: cached price)
 * @returns {Promise<string>} Formatted USD string
 */
export const getBTCValueUSD = async (satoshis, btcPriceUSD = null) => {
  const btc = satoshisToBTC(satoshis);
  const usdValue = await calculateBTCValueUSD(btc, btcPriceUSD);
  return formatUSD(usdValue);
};

/**
 * Validate Bitcoin address format
 * @param {string} address - Bitcoin address to validate
 * @returns {boolean} True if valid Bitcoin address format
 */
export const isValidBitcoinAddress = (address) => {
  if (!address || typeof address !== "string") return false;

  // Basic validation for common Bitcoin address formats
  const patterns = {
    legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2PKH addresses
    segwit: /^bc1[a-z0-9]{39,59}$/, // Bech32 addresses
    testnet: /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Testnet addresses
    testnetSegwit: /^tb1[a-z0-9]{39,59}$/, // Testnet Bech32 addresses
  };

  return Object.values(patterns).some((pattern) => pattern.test(address));
};

/**
 * Get network type from Bitcoin address
 * @param {string} address - Bitcoin address
 * @returns {string} Network type ('mainnet' or 'testnet')
 */
export const getNetworkFromAddress = (address) => {
  if (!address) return null;

  if (address.startsWith("bc1")) return "mainnet";
  if (address.startsWith("tb1")) return "testnet";
  if (address.startsWith("1") || address.startsWith("3")) return "mainnet";
  if (
    address.startsWith("2") ||
    address.startsWith("m") ||
    address.startsWith("n")
  )
    return "testnet";

  return null;
};

/**
 * Truncate Bitcoin address for display
 * @param {string} address - Full Bitcoin address
 * @param {number} startChars - Number of characters to show at start (default: 6)
 * @param {number} endChars - Number of characters to show at end (default: 4)
 * @returns {string} Truncated address
 */
export const truncateBitcoinAddress = (
  address,
  startChars = 6,
  endChars = 4
) => {
  if (!address || address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Convert satoshis to human readable format
 * @param {number|string|BigInt} satoshis - Amount in satoshis
 * @returns {Promise<object>} Object with BTC and USD values
 */
export const convertSatoshisToReadable = async (satoshis) => {
  const btc = satoshisToBTC(satoshis);
  const usdValue = await calculateBTCValueUSD(btc);

  return {
    satoshis: Number(satoshis),
    btc: btc,
    btcFormatted: formatBTC(btc),
    usd: usdValue,
    usdFormatted: formatUSD(usdValue),
  };
};
