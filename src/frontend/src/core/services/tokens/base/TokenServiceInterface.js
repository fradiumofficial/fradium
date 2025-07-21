import { createBalanceResult, createAmountValueResult, createSendResult, createAnalysisResult, createAddressValidationResult, createError, ERROR_TYPES } from "../../../types/token.types.js";

/**
 * Base Token Service Interface
 * Semua token service harus mengimplement interface ini
 */
export class TokenServiceInterface {
  constructor(config) {
    if (this.constructor === TokenServiceInterface) {
      throw new Error("Cannot instantiate interface directly");
    }
    this.config = config;
    this.canister = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service (load canister, setup connections, etc.)
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error("init method must be implemented");
  }

  /**
   * Validate if an address is valid for this token type
   * @param {string} address - Address to validate
   * @returns {Object} - Validation result
   */
  validateAddress(address) {
    if (!address || typeof address !== "string") {
      return createAddressValidationResult(false, "Address is required");
    }

    // Default validation based on address formats in config
    const isValid = this.config.addressFormats.some((format) => {
      if (typeof format === "string") {
        return address.startsWith(format);
      }
      if (typeof format === "number") {
        return address.length === format;
      }
      return false;
    });

    if (!isValid) {
      return createAddressValidationResult(false, `Invalid ${this.config.displayName} address format`);
    }

    return createAddressValidationResult(true);
  }

  /**
   * Get balances for multiple addresses
   * @param {string[]} addresses - Array of addresses to get balance for
   * @returns {Promise<Object>} - Balance result object
   */
  async getBalance(addresses) {
    throw new Error("getBalance method must be implemented");
  }

  /**
   * Calculate total amount and USD value from balances
   * @param {string[]} addresses - Array of addresses
   * @param {Object} balances - Balances object
   * @returns {Promise<Object>} - Amount and value result
   */
  async calculateAmountAndValue(addresses, balances) {
    throw new Error("calculateAmountAndValue method must be implemented");
  }

  /**
   * Send tokens to destination address
   * @param {Object} params - Send parameters
   * @returns {Promise<Object>} - Send result
   */
  async sendToken(params) {
    throw new Error("sendToken method must be implemented");
  }

  /**
   * Analyze an address for security risks
   * @param {string} address - Address to analyze
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeAddress(address) {
    throw new Error("analyzeAddress method must be implemented");
  }

  /**
   * Get transaction history for addresses
   * @param {string[]} addresses - Array of addresses
   * @returns {Promise<Array>} - Transaction history array
   */
  async getTransactionHistory(addresses) {
    throw new Error("getTransactionHistory method must be implemented");
  }

  /**
   * Format amount for display (remove trailing zeros, convert units, etc.)
   * @param {number} amount - Raw amount
   * @returns {string} - Formatted amount
   */
  formatAmount(amount) {
    if (amount === 0) return "0";

    // Convert from base unit to display unit
    const displayAmount = amount / this.config.unitConversion.factor;

    // Remove trailing zeros
    return displayAmount.toString().replace(/\.?0+$/, "");
  }

  /**
   * Convert display amount to base unit
   * @param {number} displayAmount - Amount in display unit
   * @returns {number} - Amount in base unit
   */
  toBaseUnit(displayAmount) {
    return Math.floor(displayAmount * this.config.unitConversion.factor);
  }

  /**
   * Convert base unit to display amount
   * @param {number} baseAmount - Amount in base unit
   * @returns {number} - Amount in display unit
   */
  fromBaseUnit(baseAmount) {
    return baseAmount / this.config.unitConversion.factor;
  }

  /**
   * Get token type variant for backend calls
   * @returns {Object} - Token type variant
   */
  getTokenTypeVariant() {
    return { [this.config.symbol]: null };
  }

  /**
   * Get current token price in USD
   * @returns {Promise<number>} - Price in USD
   */
  async getPrice() {
    if (!this.config.priceApiUrl) {
      return 0; // No price API for custom tokens
    }

    try {
      const response = await fetch(this.config.priceApiUrl);
      const data = await response.json();

      // Extract price based on token type
      const tokenId = this.config.priceApiUrl.includes("bitcoin") ? "bitcoin" : this.config.priceApiUrl.includes("ethereum") ? "ethereum" : this.config.priceApiUrl.includes("solana") ? "solana" : null;

      return tokenId ? data[tokenId]?.usd || 0 : 0;
    } catch (error) {
      console.error(`Error fetching ${this.config.displayName} price:`, error);
      return 0;
    }
  }

  /**
   * Check if operation is supported by this token
   * @param {string} operation - Operation to check
   * @returns {boolean} - Whether operation is supported
   */
  supportsOperation(operation) {
    return this.config.supportedOperations.includes(operation);
  }

  /**
   * Handle common errors and return standardized error object
   * @param {Error} error - Original error
   * @param {string} operation - Operation that failed
   * @returns {Object} - Standardized error
   */
  handleError(error, operation) {
    console.error(`${this.config.displayName} ${operation} error:`, error);

    // Map common error patterns to error types
    if (error.message.includes("Insufficient")) {
      return createError(ERROR_TYPES.INSUFFICIENT_BALANCE, "Insufficient balance for this transaction", error);
    }

    if (error.message.includes("address") || error.message.includes("decode")) {
      return createError(ERROR_TYPES.INVALID_ADDRESS, "Invalid address format", error);
    }

    if (error.message.includes("network") || error.message.includes("connection")) {
      return createError(ERROR_TYPES.NETWORK_ERROR, "Network connection error", error);
    }

    return createError(ERROR_TYPES.UNKNOWN_ERROR, error.message || `Unknown error in ${operation}`, error);
  }

  /**
   * Create a standardized loading state
   * @returns {Object} - Loading amount value result
   */
  createLoadingState() {
    return createAmountValueResult(0, "$0.00", true);
  }

  /**
   * Create an error state for amount value
   * @returns {Object} - Error amount value result
   */
  createErrorState() {
    return createAmountValueResult(0, "Error", false);
  }
}
