// Transak Configuration for Fradium
// Reference: https://docs.transak.com/

export const TRANSAK_CONFIG = {
    // Environment configuration
    apiKey: import.meta.env.VITE_TRANSAK_API_KEY || "",
    environment: import.meta.env.VITE_TRANSAK_ENV || "STAGING",

    // Transak base URLs
    widgetUrl: import.meta.env.VITE_TRANSAK_ENV === "PRODUCTION"
        ? "https://global.transak.com"
        : "https://staging-global.transak.com",

    // Default configuration
    defaultFiatCurrency: "USD",
    defaultCryptoCurrency: "ETH",
    defaultFiatAmount: 100,

    // Supported networks and currencies
    networks: {
        ethereum: {
            name: "ethereum",
            currencies: ["ETH", "USDT", "USDC", "DAI"]
        },
        solana: {
            name: "solana",
            currencies: ["SOL"]
        },
        bitcoin: {
            name: "bitcoin",
            currencies: ["BTC"]
        }
    },

    // Widget customization
    themeColor: "7c3aed", // Purple theme matching Fradium
    hideMenu: false,
    isAutoFillUserData: true,

    // Widget configuration
    widgetHeight: "600px",
    widgetWidth: "100%"
};

/**
 * Generate Transak widget URL
 * @param {string} walletAddress - User's wallet address
 * @param {string} cryptoCurrency - Crypto to buy (ETH, BTC, SOL, etc)
 * @param {number} fiatAmount - Amount in fiat currency
 * @param {string} network - Blockchain network
 * @returns {string} Complete Transak URL
 */
export function generateTransakUrl(walletAddress, cryptoCurrency, fiatAmount, network = "ethereum") {
    const params = new URLSearchParams({
        apiKey: TRANSAK_CONFIG.apiKey,
        environment: TRANSAK_CONFIG.environment,
        walletAddress: walletAddress,
        defaultCryptoCurrency: cryptoCurrency,
        cryptoCurrencyCode: cryptoCurrency,
        fiatAmount: fiatAmount.toString(),
        fiatCurrency: TRANSAK_CONFIG.defaultFiatCurrency,
        network: network,
        themeColor: TRANSAK_CONFIG.themeColor,
        hideMenu: TRANSAK_CONFIG.hideMenu.toString(),
        isAutoFillUserData: TRANSAK_CONFIG.isAutoFillUserData.toString()
    });

    return `${TRANSAK_CONFIG.widgetUrl}?${params.toString()}`;
}

/**
 * Validate Transak configuration
 * @returns {boolean} True if config is valid
 */
export function validateTransakConfig() {
    if (!TRANSAK_CONFIG.apiKey) {
        console.error("Transak API key not configured. Please set VITE_TRANSAK_API_KEY in .env");
        return false;
    }
    return true;
}

/**
 * Get supported currencies for a network
 * @param {string} network - Network name
 * @returns {array} Array of supported currency codes
 */
export function getSupportedCurrencies(network) {
    return TRANSAK_CONFIG.networks[network]?.currencies || [];
}

// Debug logging in development
if (import.meta.env.DEV) {
    console.log("Transak Config:", {
        environment: TRANSAK_CONFIG.environment,
        apiKeySet: !!TRANSAK_CONFIG.apiKey,
        widgetUrl: TRANSAK_CONFIG.widgetUrl
    });
}

