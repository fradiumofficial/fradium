import { TokenServiceInterface } from "../base/TokenServiceInterface.js";
import { createBalanceResult, createAmountValueResult, createSendResult, createAnalysisResult, ANALYSIS_SOURCES, TRANSACTION_STATUS } from "../../../types/token.types.js";
import { backend } from "declarations/backend";

/**
 * Bitcoin Service Implementation
 */
export class BitcoinService extends TokenServiceInterface {
  constructor(config) {
    super(config);
  }

  // ====== Bitcoin Utility Methods (migrated from bitcoinUtils.js) ======
  static SATOSHIS_PER_BTC = 100000000;
  static BTC_DECIMALS = 8;

  static satoshisToBTC(satoshis) {
    if (typeof satoshis === "string") satoshis = parseInt(satoshis);
    if (typeof satoshis === "bigint") satoshis = Number(satoshis);
    return satoshis / BitcoinService.SATOSHIS_PER_BTC;
  }

  static btcToSatoshis(btc) {
    return Math.floor(btc * BitcoinService.SATOSHIS_PER_BTC);
  }

  static formatBTC(btc, decimals = BitcoinService.BTC_DECIMALS) {
    if (btc === 0) return `0.${"0".repeat(decimals)}`;
    return btc.toFixed(decimals);
  }

  static formatSatoshisToBTC(satoshis, decimals = BitcoinService.BTC_DECIMALS) {
    const btc = BitcoinService.satoshisToBTC(satoshis);
    return BitcoinService.formatBTC(btc, decimals);
  }

  static formatUSD(usdValue, decimals = 2) {
    return `$${usdValue.toFixed(decimals)}`;
  }

  static isValidBitcoinAddress(address) {
    if (!address || typeof address !== "string") return false;
    const patterns = {
      legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      segwit: /^bc1[a-z0-9]{39,59}$/,
      testnet: /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      testnetSegwit: /^tb1[a-z0-9]{39,59}$/,
    };
    return Object.values(patterns).some((pattern) => pattern.test(address));
  }

  static getNetworkFromAddress(address) {
    if (!address) return null;
    if (address.startsWith("bc1")) return "mainnet";
    if (address.startsWith("tb1")) return "testnet";
    if (address.startsWith("1") || address.startsWith("3")) return "mainnet";
    if (address.startsWith("2") || address.startsWith("m") || address.startsWith("n")) return "testnet";
    return null;
  }

  static truncateBitcoinAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length <= startChars + endChars + 3) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  static async calculateBTCValueUSD(btc, btcPriceUSD = null) {
    const price = btcPriceUSD || (await BitcoinService.fetchBTCPrice());
    return btc * price;
  }

  static async getBTCValueUSD(satoshis, btcPriceUSD = null) {
    const btc = BitcoinService.satoshisToBTC(satoshis);
    const usdValue = await BitcoinService.calculateBTCValueUSD(btc, btcPriceUSD);
    return BitcoinService.formatUSD(usdValue);
  }

  static async convertSatoshisToReadable(satoshis) {
    const btc = BitcoinService.satoshisToBTC(satoshis);
    const usdValue = await BitcoinService.calculateBTCValueUSD(btc);
    return {
      satoshis: Number(satoshis),
      btc: btc,
      btcFormatted: BitcoinService.formatBTC(btc),
      usd: usdValue,
      usdFormatted: BitcoinService.formatUSD(usdValue),
    };
  }

  // ====== END Bitcoin Utility Methods ======

  /**
   * Initialize Bitcoin service
   */
  async init() {
    if (this.isInitialized) {
      return this.canister;
    }

    try {
      const { bitcoin } = await this.config.canisterImport();
      this.canister = bitcoin;
      this.isInitialized = true;
      return this.canister;
    } catch (error) {
      throw new Error(`Failed to initialize Bitcoin service: ${error.message}`);
    }
  }

  /**
   * Validate Bitcoin address
   */
  validateAddress(address) {
    if (!address || typeof address !== "string") {
      return { isValid: false, error: "Address is required" };
    }

    // Bitcoin address validation
    const isValid = BitcoinService.isValidBitcoinAddress(address);

    if (!isValid) {
      return { isValid: false, error: "Invalid Bitcoin address format" };
    }

    return { isValid: true };
  }

  /**
   * Get Bitcoin balances for multiple addresses
   */
  async getBalance(addresses) {
    await this.init();

    const balances = {};
    const errors = {};

    for (const address of addresses) {
      try {
        const balance = await this.canister.get_balance(address);
        balances[address] = Number(balance);
      } catch (error) {
        const standardError = this.handleError(error, "getBalance");
        errors[address] = standardError.message;
        balances[address] = 0;
      }
    }

    return createBalanceResult(balances, errors);
  }

  /**
   * Calculate Bitcoin amount and USD value
   */
  async calculateAmountAndValue(addresses, balances) {
    if (Array.isArray(addresses) && addresses.length === 2 && balances === undefined) {
      [addresses, balances] = addresses;
    }
    if (!balances || Object.keys(balances).length === 0) {
      return createAmountValueResult(0, "$0.00", false);
    }

    try {
      // Calculate total satoshis
      const totalSatoshis = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

      if (totalSatoshis === 0) {
        return createAmountValueResult(0, "$0.00", false);
      }

      // Get current BTC price
      const btcPrice = await this.getPrice();

      // Calculate BTC amount and USD value
      const btcAmount = BitcoinService.satoshisToBTC(totalSatoshis);
      const usdValue = await BitcoinService.calculateBTCValueUSD(btcAmount, btcPrice);

      return createAmountValueResult(
        totalSatoshis, // Keep as satoshis for internal use
        `$${usdValue.toFixed(2)}`,
        false
      );
    } catch (error) {
      console.error("Error calculating Bitcoin amount and value:", error);
      return this.createErrorState();
    }
  }

  /**
   * Send Bitcoin transaction
   */
  async sendToken(params) {
    await this.init();

    try {
      const { destinationAddress, amount } = params;

      // Validate destination address
      const validation = this.validateAddress(destinationAddress);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Convert amount to satoshis
      const satoshiAmount = BitcoinService.btcToSatoshis(parseFloat(amount));

      // Send transaction
      const transactionId = await this.canister.send_from_p2pkh_address({
        destination_address: destinationAddress,
        amount_in_satoshi: satoshiAmount,
      });

      return createSendResult(transactionId, TRANSACTION_STATUS.COMPLETED, null);
    } catch (error) {
      const standardError = this.handleError(error, "sendToken");
      return createSendResult(null, TRANSACTION_STATUS.FAILED, standardError);
    }
  }

  /**
   * Analyze Bitcoin address for security risks
   */
  async analyzeAddress(address) {
    try {
      // Validate address first
      console.log("address", address);
      const validation = this.validateAddress(address);
      console.log("validation", validation);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      console.log("object2");

      const communityReport = await backend.analyze_address(address);

      console.log("communityReport", communityReport);

      if ("Ok" in communityReport) {
        return createAnalysisResult(
          communityReport.Ok.is_safe,
          ANALYSIS_SOURCES.COMMUNITY,
          communityReport.Ok,
          95 // High confidence for community reports
        );
      } else {
        // Fallback to default safe if no community report
        return createAnalysisResult(
          true,
          ANALYSIS_SOURCES.COMMUNITY,
          null,
          50 // Lower confidence when no data
        );
      }
    } catch (error) {
      const standardError = this.handleError(error, "analyzeAddress");
      throw standardError;
    }
  }

  /**
   * Get Bitcoin transaction history
   */
  async getTransactionHistory(addresses) {
    try {
      // Implementation depends on backend structure
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      const standardError = this.handleError(error, "getTransactionHistory");
      throw standardError;
    }
  }

  /**
   * Format Bitcoin amount for display
   */
  formatAmount(amount) {
    if (amount === 0) return "0";

    // Convert satoshis to BTC
    const btcAmount = BitcoinService.satoshisToBTC(amount);

    // Remove trailing zeros
    return btcAmount.toString().replace(/\.?0+$/, "");
  }

  /**
   * Get Bitcoin price from external API (with fallback)
   */
  async getPrice() {
    const priceApiUrls = this.config.priceApiUrls || [];
    if (!priceApiUrls.length) return 0;

    let lastError = null;
    for (const apiUrl of priceApiUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        const price = BitcoinService.parsePriceResponse(data, apiUrl);
        if (price && price > 0) return price;
        throw new Error("Invalid price data received");
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    // Fallback
    console.warn("All price APIs failed for Bitcoin. Last error:", lastError?.message);
    return 45000;
  }

  /**
   * Parse different API response formats (adapted from tokens.config.js)
   */
  static parsePriceResponse(data, apiUrl) {
    try {
      if (apiUrl.includes("coingecko.com")) {
        return data.bitcoin?.usd;
      }
      if (apiUrl.includes("binance.com")) {
        return parseFloat(data.price);
      }
      if (apiUrl.includes("cryptocompare.com")) {
        return data.USD;
      }
      if (apiUrl.includes("coinbase.com")) {
        return parseFloat(data.data?.rates?.USD);
      }
      if (apiUrl.includes("kraken.com")) {
        const pairs = Object.keys(data.result || {});
        if (pairs.length > 0) {
          return parseFloat(data.result[pairs[0]]?.c?.[0]);
        }
      }
      if (apiUrl.includes("bitfinex.com")) {
        return parseFloat(data.last_price);
      }
      if (apiUrl.includes("coinmarketcap.com")) {
        const quotes = data.data?.[0]?.quote?.USD;
        return quotes?.price;
      }
      return null;
    } catch (error) {
      console.error("Error parsing price response:", error);
      return null;
    }
  }

  /**
   * Get max amount that can be sent (considering fees)
   */
  async getMaxSendAmount(addresses, balances) {
    if (!balances || Object.keys(balances).length === 0) {
      return 0;
    }

    const totalSatoshis = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

    // For Bitcoin, we could subtract estimated fees here
    // For now, return total available
    return totalSatoshis;
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(destinationAddress, amount) {
    // Bitcoin fee estimation logic
    // For now, return a default fee estimate
    return 1000; // 1000 satoshis default fee
  }
}
