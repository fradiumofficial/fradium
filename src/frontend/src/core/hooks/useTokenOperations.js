import { useState, useCallback, useEffect, useMemo } from "react";
import { TokenServiceFactory } from "../services/tokens/TokenServiceFactory.js";
import { SERVICE_STATES, createServiceState } from "../types/token.types.js";

/**
 * Custom hook for token operations
 * Provides standardized interface for all token operations
 */
export const useTokenOperations = () => {
  const [operationStates, setOperationStates] = useState({});

  /**
   * Update state for a specific operation
   */
  const updateOperationState = useCallback((operationKey, state) => {
    setOperationStates((prev) => ({
      ...prev,
      [operationKey]: state,
    }));
  }, []);

  /**
   * Execute a token operation with state management
   */
  const executeTokenOperation = useCallback(
    async (tokenType, operation, params) => {
      const operationKey = `${tokenType}_${operation}`;

      try {
        // Set loading state
        updateOperationState(operationKey, createServiceState(SERVICE_STATES.LOADING));

        const service = await TokenServiceFactory.getService(tokenType);
        const result = await service[operation](params);

        // Set success state
        updateOperationState(operationKey, createServiceState(SERVICE_STATES.SUCCESS, result));

        return result;
      } catch (error) {
        // Set error state
        updateOperationState(operationKey, createServiceState(SERVICE_STATES.ERROR, null, error));
        throw error;
      }
    },
    [updateOperationState]
  );

  /**
   * Get balance for a token type
   */
  const getBalance = useCallback(
    (tokenType, addresses) => {
      return executeTokenOperation(tokenType, "getBalance", addresses);
    },
    [executeTokenOperation]
  );

  /**
   * Calculate amount and value for a token type
   */
  const calculateAmountAndValue = useCallback(
    (tokenType, addresses, balances) => {
      return executeTokenOperation(tokenType, "calculateAmountAndValue", [addresses, balances]);
    },
    [executeTokenOperation]
  );

  /**
   * Send tokens
   */
  const sendToken = useCallback(
    (tokenType, params) => {
      return executeTokenOperation(tokenType, "sendToken", params);
    },
    [executeTokenOperation]
  );

  /**
   * Analyze address
   */
  const analyzeAddress = useCallback(
    (tokenType, address) => {
      return executeTokenOperation(tokenType, "analyzeAddress", address);
    },
    [executeTokenOperation]
  );

  /**
   * Get transaction history
   */
  const getTransactionHistory = useCallback(
    (tokenType, addresses) => {
      return executeTokenOperation(tokenType, "getTransactionHistory", addresses);
    },
    [executeTokenOperation]
  );

  /**
   * Validate address
   */
  const validateAddress = useCallback((address) => {
    return TokenServiceFactory.validateAddress(address);
  }, []);

  /**
   * Detect token type from address
   */
  const detectTokenType = useCallback((address) => {
    return TokenServiceFactory.detectTokenType(address);
  }, []);

  /**
   * Get operation state
   */
  const getOperationState = useCallback(
    (tokenType, operation) => {
      const operationKey = `${tokenType}_${operation}`;
      return operationStates[operationKey] || createServiceState(SERVICE_STATES.IDLE);
    },
    [operationStates]
  );

  /**
   * Check if operation is loading
   */
  const isOperationLoading = useCallback(
    (tokenType, operation) => {
      const state = getOperationState(tokenType, operation);
      return state.isLoading;
    },
    [getOperationState]
  );

  /**
   * Get operation error
   */
  const getOperationError = useCallback(
    (tokenType, operation) => {
      const state = getOperationState(tokenType, operation);
      return state.error;
    },
    [getOperationState]
  );

  /**
   * Clear operation state
   */
  const clearOperationState = useCallback((tokenType, operation) => {
    const operationKey = `${tokenType}_${operation}`;
    setOperationStates((prev) => {
      const newStates = { ...prev };
      delete newStates[operationKey];
      return newStates;
    });
  }, []);

  /**
   * Clear all operation states
   */
  const clearAllStates = useCallback(() => {
    setOperationStates({});
  }, []);

  return {
    // Operation methods
    getBalance,
    calculateAmountAndValue,
    sendToken,
    analyzeAddress,
    getTransactionHistory,
    validateAddress,
    detectTokenType,

    // State management
    getOperationState,
    isOperationLoading,
    getOperationError,
    clearOperationState,
    clearAllStates,

    // Raw states
    operationStates,
  };
};

/**
 * Hook for managing multiple token balances
 */
export const useTokenBalances = (userWallet, networkFilters) => {
  const { getBalance, calculateAmountAndValue, isOperationLoading, getOperationError } = useTokenOperations();
  const [tokenBalances, setTokenBalances] = useState({});
  const [tokenAmountValues, setTokenAmountValues] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get addresses for a specific token type
   */
  const getAddressesForToken = useCallback(
    (tokenType) => {
      if (!userWallet?.addresses) return [];

      return userWallet.addresses
        .filter((addressObj) => {
          const addressTokenType = Object.keys(addressObj.token_type)[0];
          return addressTokenType === tokenType;
        })
        .map((addressObj) => addressObj.address);
    },
    [userWallet?.addresses]
  );

  /**
   * Fetch balances for all enabled tokens
   */
  const fetchAllBalances = useCallback(async () => {
    if (!userWallet?.addresses) return;

    setIsLoading(true);
    const supportedTokens = TokenServiceFactory.getSupportedTokens();

    try {
      for (const tokenType of supportedTokens) {
        if (networkFilters[tokenType]) {
          const addresses = getAddressesForToken(tokenType);
          if (addresses.length > 0) {
            try {
              const balanceResult = await getBalance(tokenType, addresses);

              setTokenBalances((prev) => ({
                ...prev,
                [tokenType]: balanceResult,
              }));

              // Calculate amount and value
              const amountValueResult = await calculateAmountAndValue(tokenType, addresses, balanceResult.balances);

              setTokenAmountValues((prev) => ({
                ...prev,
                [tokenType]: amountValueResult,
              }));
            } catch (error) {
              console.error(`Error fetching ${tokenType} data:`, error);
            }
          } else {
            // Jika tidak ada address, pastikan state tetap diupdate agar tidak stale
            setTokenBalances((prev) => ({
              ...prev,
              [tokenType]: { balances: {}, errors: {} },
            }));
            setTokenAmountValues((prev) => ({
              ...prev,
              [tokenType]: { amount: 0, value: "$0.00", isLoading: false },
            }));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userWallet?.addresses, networkFilters, getBalance, calculateAmountAndValue, getAddressesForToken]);

  /**
   * Get total portfolio value
   */
  const getTotalPortfolioValue = useCallback(() => {
    let total = 0;

    for (const tokenType in tokenAmountValues) {
      const amountValue = tokenAmountValues[tokenType];
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        total += numericValue;
      }
    }

    return total;
  }, [tokenAmountValues]);

  /**
   * Get network values for filtering - memoized object
   */
  const networkValues = useMemo(() => {
    const values = {
      "All Networks": getTotalPortfolioValue(),
      Bitcoin: 0,
      Ethereum: 0,
      Solana: 0,
      Fradium: 0,
    };

    for (const [tokenType, amountValue] of Object.entries(tokenAmountValues)) {
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        values[tokenType] = numericValue;
      }
    }

    return values;
  }, [tokenAmountValues, getTotalPortfolioValue]);

  /**
   * Get network values for filtering - getter function for backward compatibility
   */
  const getNetworkValues = useCallback(() => networkValues, [networkValues]);

  return {
    tokenBalances,
    tokenAmountValues,
    isLoading,
    fetchAllBalances,
    getTotalPortfolioValue,
    networkValues,
    getNetworkValues,
    getAddressesForToken,
  };
};

/**
 * Hook for token information (combines config with runtime data)
 */
export const useTokenInfo = (tokenType) => {
  const config = TokenServiceFactory.getTokenConfig(tokenType);
  const { getOperationState, isOperationLoading } = useTokenOperations();

  const balanceState = getOperationState(tokenType, "getBalance");
  const amountValueState = getOperationState(tokenType, "calculateAmountAndValue");

  return {
    config,
    balanceState,
    amountValueState,
    isLoading: isOperationLoading(tokenType, "getBalance") || isOperationLoading(tokenType, "calculateAmountAndValue"),
    hasBalance: balanceState.data?.hasBalances || false,
    hasError: balanceState.isError || amountValueState.isError,
  };
};
