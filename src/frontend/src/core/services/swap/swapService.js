// Swap Service
// Integrasi dengan ICPSwap untuk token swapping tanpa membuat canister baru

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { backend } from "declarations/backend";

// ICPSwap API Configuration
const ICPSWAP_API_BASE = "https://api.icpswap.com";
const ICPSWAP_FRONTEND_BASE = "https://icpswap.com";

// Token mappings untuk ICPSwap
const TOKEN_MAPPINGS = {
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  FRADIUM: "sr4wk-4qaaa-aaaae-qfdta-cai", 
  ckBTC: "mc6ru-gyaaa-aaaar-qaaaq-cai",
  ckETH: "ss2fx-dyaaa-aaaar-qacoq-cai"
};

export class SwapService {
  /**
   * Get swap quote from backend canister
   * @param {Object} params - Swap parameters
   * @param {string} params.fromToken - Source token symbol
   * @param {string} params.toToken - Destination token symbol  
   * @param {number} params.amount - Amount to swap
   * @returns {Promise<Object>} Swap quote
   */
  static async getSwapQuote({ fromToken, toToken, amount }) {
    try {
      // Validate tokens
      if (!TOKEN_MAPPINGS[fromToken] || !TOKEN_MAPPINGS[toToken]) {
        throw new Error(`Unsupported token pair: ${fromToken}/${toToken}`);
      }

      // Convert amount to smallest unit
      const amountInSmallestUnit = this.toSmallestUnit(amount, fromToken);

      // Call backend canister for swap quote
      const request = {
        from_token: fromToken,
        to_token: toToken,
        amount: amountInSmallestUnit
      };

      const quote = await backend.get_swap_quote(request);
      
      // Convert response to standard format
      return {
        rate: quote.rate,
        estimatedOutput: this.fromSmallestUnit(quote.estimated_output, toToken),
        fee: this.fromSmallestUnit(quote.fee, fromToken),
        priceImpact: quote.price_impact.toFixed(2),
        minAmountOut: this.fromSmallestUnit(quote.min_amount_out, toToken),
        validFor: quote.valid_for
      };
    } catch (error) {
      console.error("Swap quote error:", error);
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  /**
   * Execute swap transaction
   * @param {Object} params - Swap execution parameters
   * @param {string} params.fromToken - Source token symbol
   * @param {string} params.toToken - Destination token symbol
   * @param {number} params.amount - Amount to swap
   * @param {number} params.minAmountOut - Minimum amount out (slippage protection)
   * @param {string|null} params.recipient - Recipient address (null for self)
   * @returns {Promise<Object>} Swap result
   */
  static async executeSwap({ fromToken, toToken, amount, minAmountOut, recipient }) {
    try {
      // Validate parameters
      if (!TOKEN_MAPPINGS[fromToken] || !TOKEN_MAPPINGS[toToken]) {
        throw new Error(`Unsupported token pair: ${fromToken}/${toToken}`);
      }

      if (amount <= 0) {
        throw new Error("Invalid swap amount");
      }

      // Convert amounts to smallest units
      const amountInSmallestUnit = this.toSmallestUnit(amount, fromToken);
      const minAmountOutInSmallestUnit = this.toSmallestUnit(minAmountOut, toToken);

      // Call backend canister for swap execution
      const request = {
        from_token: fromToken,
        to_token: toToken,
        amount: amountInSmallestUnit,
        min_amount_out: minAmountOutInSmallestUnit,
        recipient: recipient ? Principal.fromText(recipient) : null,
        deadline: null
      };

      const result = await backend.execute_swap(request);
      
      if (result.success && result.redirect_url) {
        // Open ICPSwap in new tab
        window.open(result.redirect_url, '_blank');
        
        return {
          success: true,
          transactionId: result.transaction_id,
          redirectUrl: result.redirect_url,
          message: "Redirected to ICPSwap for swap execution"
        };
      } else {
        throw new Error(result.error || "Swap execution failed");
      }
    } catch (error) {
      console.error("Swap execution error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate ICPSwap URL with parameters
   * @param {Object} params - URL parameters
   * @returns {string} ICPSwap URL
   */
  static generateSwapUrl({ fromToken, toToken, amount }) {
    const fromCanisterId = TOKEN_MAPPINGS[fromToken];
    const toCanisterId = TOKEN_MAPPINGS[toToken];
    
    const params = new URLSearchParams({
      inputCurrency: fromCanisterId,
      outputCurrency: toCanisterId,
      amount: amount.toString()
    });

    return `${ICPSWAP_FRONTEND_BASE}/swap?${params.toString()}`;
  }

  /**
   * Mock swap quote for MVP testing
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object>} Mock quote
   */
  static async getMockSwapQuote({ fromToken, toToken, amount }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock price data (in production, this would come from ICPSwap API)
    const mockRates = {
      "ICP/FRADIUM": 1000,
      "FRADIUM/ICP": 0.001,
      "ICP/ckBTC": 0.000025,
      "ckBTC/ICP": 40000,
      "ICP/ckETH": 0.0004,
      "ckETH/ICP": 2500,
      "FRADIUM/ckBTC": 0.000000025,
      "ckBTC/FRADIUM": 40000000,
      "FRADIUM/ckETH": 0.0000004,
      "ckETH/FRADIUM": 2500000
    };

    const rateKey = `${fromToken}/${toToken}`;
    const rate = mockRates[rateKey] || 1;

    const estimatedOutput = amount * rate;
    const fee = amount * 0.003; // 0.3% fee
    const priceImpact = Math.random() * 0.5; // Random price impact for demo
    const minAmountOut = estimatedOutput * 0.95; // 5% slippage tolerance

    return {
      rate,
      estimatedOutput,
      fee,
      priceImpact: priceImpact.toFixed(2),
      minAmountOut,
      validFor: 300 // 5 minutes
    };
  }

  /**
   * Get supported token pairs
   * @returns {Array} List of supported token pairs
   */
  static getSupportedPairs() {
    const tokens = Object.keys(TOKEN_MAPPINGS);
    const pairs = [];

    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i !== j) {
          pairs.push({
            from: tokens[i],
            to: tokens[j],
            fromCanisterId: TOKEN_MAPPINGS[tokens[i]],
            toCanisterId: TOKEN_MAPPINGS[tokens[j]]
          });
        }
      }
    }

    return pairs;
  }

  /**
   * Check if token pair is supported
   * @param {string} fromToken - Source token symbol
   * @param {string} toToken - Destination token symbol
   * @returns {boolean} Whether pair is supported
   */
  static isPairSupported(fromToken, toToken) {
    return TOKEN_MAPPINGS[fromToken] && TOKEN_MAPPINGS[toToken];
  }

  /**
   * Get token info for ICPSwap
   * @param {string} tokenSymbol - Token symbol
   * @returns {Object|null} Token info
   */
  static getTokenInfo(tokenSymbol) {
    const canisterId = TOKEN_MAPPINGS[tokenSymbol];
    if (!canisterId) return null;

    return {
      symbol: tokenSymbol,
      canisterId,
      decimals: this.getTokenDecimals(tokenSymbol)
    };
  }

  /**
   * Get token decimals
   * @param {string} tokenSymbol - Token symbol
   * @returns {number} Token decimals
   */
  static getTokenDecimals(tokenSymbol) {
    const decimalsMap = {
      ICP: 8,
      FRADIUM: 8,
      ckBTC: 8,
      ckETH: 18
    };

    return decimalsMap[tokenSymbol] || 8;
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount to format
   * @param {string} tokenSymbol - Token symbol
   * @returns {string} Formatted amount
   */
  static formatAmount(amount, tokenSymbol) {
    const decimals = this.getTokenDecimals(tokenSymbol);
    return parseFloat(amount).toFixed(decimals);
  }

  /**
   * Convert amount to smallest unit
   * @param {number} amount - Amount to convert
   * @param {string} tokenSymbol - Token symbol
   * @returns {bigint} Amount in smallest unit
   */
  static toSmallestUnit(amount, tokenSymbol) {
    const decimals = this.getTokenDecimals(tokenSymbol);
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }

  /**
   * Convert from smallest unit
   * @param {bigint} amount - Amount in smallest unit
   * @param {string} tokenSymbol - Token symbol
   * @returns {number} Amount in standard unit
   */
  static fromSmallestUnit(amount, tokenSymbol) {
    const decimals = this.getTokenDecimals(tokenSymbol);
    return Number(amount) / Math.pow(10, decimals);
  }
}
