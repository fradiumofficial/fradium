import { TOKENS_CONFIG } from "../../config/tokens.config.js";
import { BitcoinService } from "./implementations/BitcoinService.js";
import { EthereumService } from "./implementations/EthereumService.js";
import { SolanaService } from "./implementations/SolanaService.js";

const SERVICE_CLASSES = {
  BitcoinService,
  EthereumService,
  SolanaService,
  FradiumService: EthereumService, // Use Ethereum service as base for now
};

/**
 * Token Service Factory
 * Manages creation and caching of token services
 */
export class TokenServiceFactory {
  static services = new Map();

  /**
   * Get or create a service for the specified token type
   * @param {string} tokenType - Token type (Bitcoin, Ethereum, Solana, etc.)
   * @returns {Promise<TokenServiceInterface>} - Token service instance
   */
  static async getService(tokenType) {
    // Return cached service if exists
    if (this.services.has(tokenType)) {
      return this.services.get(tokenType);
    }

    const config = TOKENS_CONFIG[tokenType];
    if (!config) {
      throw new Error(`Unsupported token type: ${tokenType}`);
    }

    const ServiceClass = SERVICE_CLASSES[config.serviceClass];
    if (!ServiceClass) {
      throw new Error(`Service class not found: ${config.serviceClass}`);
    }

    try {
      const service = new ServiceClass(config);
      await service.init();

      // Cache the initialized service
      this.services.set(tokenType, service);
      return service;
    } catch (error) {
      console.error(`Failed to initialize ${tokenType} service:`, error);
      throw error;
    }
  }

  /**
   * Get all supported token types
   * @returns {string[]} - Array of supported token types
   */
  static getSupportedTokens() {
    return Object.keys(TOKENS_CONFIG);
  }

  /**
   * Get token configuration
   * @param {string} tokenType - Token type
   * @returns {Object} - Token configuration
   */
  static getTokenConfig(tokenType) {
    return TOKENS_CONFIG[tokenType];
  }

  /**
   * Detect token type from address format
   * @param {string} address - Address to analyze
   * @returns {string} - Detected token type or 'Unknown'
   */
  static detectTokenType(address) {
    if (!address || typeof address !== "string") {
      return "Unknown";
    }

    for (const [tokenType, config] of Object.entries(TOKENS_CONFIG)) {
      const isValid = config.addressFormats.some((format) => {
        if (typeof format === "string") {
          return address.startsWith(format);
        }
        if (typeof format === "number") {
          return address.length === format;
        }
        return false;
      });

      if (isValid) {
        return tokenType;
      }
    }

    return "Unknown";
  }

  /**
   * Check if a token type is supported
   * @param {string} tokenType - Token type to check
   * @returns {boolean} - Whether token type is supported
   */
  static isSupported(tokenType) {
    return tokenType in TOKENS_CONFIG;
  }

  /**
   * Get all services that support a specific operation
   * @param {string} operation - Operation to check (balance, send, analyze, etc.)
   * @returns {Promise<Object>} - Object mapping token types to services
   */
  static async getServicesWithOperation(operation) {
    const services = {};

    for (const tokenType of this.getSupportedTokens()) {
      const config = TOKENS_CONFIG[tokenType];
      if (config.supportedOperations.includes(operation)) {
        try {
          services[tokenType] = await this.getService(tokenType);
        } catch (error) {
          console.warn(`Failed to get ${tokenType} service:`, error);
        }
      }
    }

    return services;
  }

  /**
   * Clear all cached services (useful for testing or reset)
   */
  static clearCache() {
    this.services.clear();
  }

  /**
   * Get service status for all token types
   * @returns {Promise<Object>} - Status of all services
   */
  static async getServicesStatus() {
    const status = {};

    for (const tokenType of this.getSupportedTokens()) {
      try {
        const service = await this.getService(tokenType);
        status[tokenType] = {
          available: true,
          initialized: service.isInitialized,
          config: service.config,
        };
      } catch (error) {
        status[tokenType] = {
          available: false,
          error: error.message,
          config: TOKENS_CONFIG[tokenType],
        };
      }
    }

    return status;
  }

  /**
   * Validate address for any supported token type
   * @param {string} address - Address to validate
   * @returns {Object} - Validation result with detected token type
   */
  static validateAddress(address) {
    const detectedType = this.detectTokenType(address);

    if (detectedType === "Unknown") {
      return {
        isValid: false,
        tokenType: "Unknown",
        error: "Address format not recognized",
      };
    }

    // Get the service class for additional validation
    const config = TOKENS_CONFIG[detectedType];
    const ServiceClass = SERVICE_CLASSES[config.serviceClass];

    if (ServiceClass) {
      const tempService = new ServiceClass(config);
      const validation = tempService.validateAddress(address);

      return {
        ...validation,
        tokenType: detectedType,
      };
    }

    return {
      isValid: true,
      tokenType: detectedType,
    };
  }

  /**
   * Execute operation across multiple token services
   * @param {string} operation - Operation to execute
   * @param {Object} params - Parameters for the operation
   * @param {string[]} tokenTypes - Token types to execute on (defaults to all)
   * @returns {Promise<Object>} - Results from all services
   */
  static async executeOperationAcrossServices(operation, params, tokenTypes = null) {
    const targetTokens = tokenTypes || this.getSupportedTokens();
    const results = {};

    for (const tokenType of targetTokens) {
      try {
        const service = await this.getService(tokenType);

        if (service.supportsOperation && !service.supportsOperation(operation)) {
          results[tokenType] = {
            success: false,
            error: `Operation ${operation} not supported by ${tokenType}`,
          };
          continue;
        }

        if (typeof service[operation] === "function") {
          const result = await service[operation](params);
          results[tokenType] = {
            success: true,
            data: result,
          };
        } else {
          results[tokenType] = {
            success: false,
            error: `Operation ${operation} not found in ${tokenType} service`,
          };
        }
      } catch (error) {
        results[tokenType] = {
          success: false,
          error: error.message,
        };
      }
    }

    return results;
  }
}
