// Transak API Service for getting price estimates
// Reference: https://docs.transak.com/

import { TRANSAK_CONFIG } from "@/core/config/transak";

const TRANSAK_API_BASE_URL = TRANSAK_CONFIG.environment === "PRODUCTION" ? "https://api.transak.com/api/v1" : "https://api-stg.transak.com/api/v1";

/**
 * Get quote from Transak API
 * @param {Object} params - Quote parameters
 * @param {string} params.fiatCurrency - Fiat currency (e.g., "USD")
 * @param {string} params.cryptoCurrency - Crypto currency (e.g., "ETH", "BTC", "SOL")
 * @param {number} params.fiatAmount - Amount in fiat currency
 * @param {string} params.network - Blockchain network (e.g., "ethereum", "bitcoin", "solana")
 * @param {string} params.paymentMethod - Payment method (default: "credit_debit_card")
 * @param {string} params.isBuyOrSell - Transaction type (default: "BUY")
 * @param {string} params.quoteCountryCode - Country code (default: "US")
 * @returns {Promise<Object>} Quote response from Transak
 */
export async function getTransakQuote({ fiatCurrency = "USD", cryptoCurrency, fiatAmount, network, paymentMethod = "credit_debit_card", isBuyOrSell = "BUY", quoteCountryCode = "US" }) {
  try {
    if (!TRANSAK_CONFIG.apiKey) {
      throw new Error("Transak API key not configured");
    }

    const params = new URLSearchParams({
      partnerApiKey: TRANSAK_CONFIG.apiKey,
      fiatCurrency,
      cryptoCurrency,
      fiatAmount: fiatAmount.toString(),
      network,
      paymentMethod,
      isBuyOrSell,
    });

    const response = await fetch(`${TRANSAK_API_BASE_URL}/pricing/public/quotes?${params.toString()}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // If there's an error in the response, throw it with the proper structure
      if (data.error) {
        throw data; // Throw the entire response so we can access data.error
      } else {
        throw new Error(`Transak API error: ${response.status} ${response.statusText}`);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching Transak quote:", error);
    throw error;
  }
}

/**
 * Get supported currencies for a specific network
 * @param {string} network - Network name
 * @returns {Promise<Array>} Array of supported currencies
 */
export async function getTransakSupportedCurrencies(network) {
  try {
    if (!TRANSAK_CONFIG.apiKey) {
      throw new Error("Transak API key not configured");
    }

    const params = new URLSearchParams({
      partnerApiKey: TRANSAK_CONFIG.apiKey,
      network,
    });

    const response = await fetch(`${TRANSAK_API_BASE_URL}/getSupportedCurrencies?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Transak API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to get supported currencies from Transak");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching Transak supported currencies:", error);
    throw error;
  }
}

/**
 * Get supported fiat currencies
 * @returns {Promise<Array>} Array of supported fiat currencies
 */
export async function getTransakFiatCurrencies() {
  try {
    const baseUrl = TRANSAK_CONFIG.environment === "PRODUCTION" ? "https://api.transak.com" : "https://api-stg.transak.com";
    const response = await fetch(`${baseUrl}/fiat/public/v1/currencies/fiat-currencies`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Transak API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      return data.response;
    } else {
      throw new Error("Invalid response format from Transak");
    }
  } catch (error) {
    console.error("Error fetching Transak fiat currencies:", error);
    throw error;
  }
}

/**
 * Get minimum and maximum amounts for a crypto currency
 * @param {string} cryptoCurrency - Crypto currency code
 * @param {string} network - Network name
 * @param {string} fiatCurrency - Fiat currency (default: "USD")
 * @returns {Promise<Object>} Min/max amounts
 */
export async function getTransakLimits(cryptoCurrency, network, fiatCurrency = "USD") {
  try {
    if (!TRANSAK_CONFIG.apiKey) {
      throw new Error("Transak API key not configured");
    }

    const params = new URLSearchParams({
      partnerApiKey: TRANSAK_CONFIG.apiKey,
      cryptoCurrency,
      network,
      fiatCurrency,
    });

    const response = await fetch(`${TRANSAK_API_BASE_URL}/getLimits?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Transak API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to get limits from Transak");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching Transak limits:", error);
    throw error;
  }
}
