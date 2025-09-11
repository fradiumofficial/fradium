import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthProvider";

// Wallet declarations
import { wallet } from "declarations/wallet";

// Token utilities
import { TOKENS_CONFIG, getBalance, getUSD, getUSDPrices } from "@/core/lib/tokenUtils";

// Create context for wallet data
const WalletContext = createContext();

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { identity, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("All Networks");
  const [hideBalance, setHideBalance] = useState(false);
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false);
  // Network values are now calculated dynamically, no need for state
  const [networkFilters, setNetworkFilters] = useState({
    Bitcoin: true,
    Ethereum: true,
    Solana: true,
    "Internet Computer": true,
  });

  // Address states for receive modal
  const [addresses, setAddresses] = useState({
    bitcoin: "",
    ethereum: "",
    solana: "",
    icp_principal: "",
    icp_account: "",
  });
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [hasLoadedAddressesOnce, setHasLoadedAddressesOnce] = useState(false);

  // Balance states
  const [balances, setBalances] = useState({});
  const [balanceLoading, setBalanceLoading] = useState({});
  const [balanceErrors, setBalanceErrors] = useState({});
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);

  // USD Price states
  const [usdPrices, setUsdPrices] = useState({});
  const [usdPriceLoading, setUsdPriceLoading] = useState({});
  const [usdPriceErrors, setUsdPriceErrors] = useState({});
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  // Memoize user principal string to prevent unnecessary re-renders
  const userPrincipalString = useMemo(() => {
    return user?.identity?.getPrincipal()?.toString();
  }, [user?.identity]);

  // Function to get localStorage key for user's network filters
  const getNetworkFiltersKey = useCallback(() => {
    return userPrincipalString ? `networkFilters_${userPrincipalString}` : "networkFilters_default";
  }, [userPrincipalString]);

  // Function to save network filters to localStorage
  const saveNetworkFilters = useCallback(
    (filters) => {
      const key = getNetworkFiltersKey();
      try {
        localStorage.setItem(key, JSON.stringify(filters));

        // Trigger storage event for cross-component sync
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: key,
            newValue: JSON.stringify(filters),
            storageArea: localStorage,
          })
        );
      } catch (error) {
        console.error("Error saving network filters to localStorage:", error);
      }
    },
    [getNetworkFiltersKey]
  );

  // Function to load network filters from localStorage
  const loadNetworkFilters = useCallback(() => {
    const key = getNetworkFiltersKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading network filters from localStorage:", error);
    }

    // Return default filters
    return {
      Bitcoin: true,
      Ethereum: true,
      Solana: true,
      Fradium: true,
    };
  }, [getNetworkFiltersKey]);

  // Function to update network filters
  const updateNetworkFilters = useCallback(
    (filters) => {
      setNetworkFilters(filters);
      saveNetworkFilters(filters);
    },
    [saveNetworkFilters]
  );

  // Load network filters from localStorage on mount and user change
  useEffect(() => {
    const loadSavedFilters = () => {
      try {
        const savedFilters = loadNetworkFilters();
        setNetworkFilters(savedFilters);
      } catch (error) {
        console.error("Error loading network filters:", error);
      }
    };

    loadSavedFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrincipalString]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("networkFilters_") && e.newValue) {
        try {
          const newFilters = JSON.parse(e.newValue);
          setNetworkFilters(newFilters);
        } catch (error) {
          console.error("Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Helper function to add new address to existing wallet
  const addAddressToWallet = useCallback(
    async (network, tokenType, address) => {
      if (!userWallet) {
        console.error("No wallet found");
        return false;
      }

      try {
        const newAddress = {
          network: network === "testnet" ? { Testnet: null } : { Mainnet: null },
          token_type: tokenType === "bitcoin" ? { Bitcoin: null } : tokenType === "ethereum" ? { Ethereum: null } : tokenType === "solana" ? { Solana: null } : null,
          address: address,
        };

        const updatedAddresses = [...userWallet.addresses, newAddress];

        // Update wallet with new address
        const response = await backend.create_wallet({
          addresses: updatedAddresses,
        });

        if ("Ok" in response) {
          // await fetchUserWallet(); // Refresh wallet data after adding address
          return true;
        } else {
          console.error("Failed to add address:", response.Err);
          return false;
        }
      } catch (error) {
        console.error("Error adding address:", error);
        return false;
      }
    },
    [userWallet]
  );

  // Network values are now calculated dynamically from balances and USD prices

  // Function to fetch wallet addresses
  const fetchAddresses = useCallback(async () => {
    if (!wallet || addressesLoaded) return;

    try {
      setAddressesLoading(true);
      const result = await wallet.wallet_addresses();

      console.log("result", result);

      const newAddresses = {
        bitcoin: result.bitcoin,
        ethereum: result.ethereum,
        solana: result.solana,
        icp_principal: result.icp_principal,
        icp_account: result.icp_account,
      };

      setAddresses(newAddresses);
      setAddressesLoaded(true);
      setHasLoadedAddressesOnce(true);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setAddressesLoading(false);
    }
  }, [addressesLoaded]);

  // Function to get loading state for addresses
  const getAddressesLoadingState = useCallback(() => {
    return addressesLoading && !hasLoadedAddressesOnce;
  }, [addressesLoading, hasLoadedAddressesOnce]);

  // Function to fetch balance for a specific token
  const fetchTokenBalance = useCallback(
    async (token) => {
      setBalanceLoading((prev) => ({ ...prev, [token.id]: true }));
      setBalanceErrors((prev) => ({ ...prev, [token.id]: null }));

      try {
        // Get principal from Internet Identity
        const principal = identity?.getPrincipal();

        const balance = await getBalance(token.id, principal);

        // For ICRC tokens, balance is already converted to proper units in getBalance
        // For native tokens, we need to convert from smallest unit
        let formattedBalance;
        if (token.type === "icrc") {
          formattedBalance = Number(balance).toFixed(6);
        } else {
          formattedBalance = (Number(balance) / Math.pow(10, token.decimals)).toFixed(6);
        }

        setBalances((prev) => ({ ...prev, [token.id]: formattedBalance }));
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        setBalanceErrors((prev) => ({ ...prev, [token.id]: error.message }));
        setBalances((prev) => ({ ...prev, [token.id]: "0.000000" }));
      } finally {
        setBalanceLoading((prev) => ({ ...prev, [token.id]: false }));
      }
    },
    [identity]
  );

  // Function to fetch all balances
  const fetchAllBalances = useCallback(async () => {
    // Load all token balances in parallel (both native and ICRC tokens)
    await Promise.all(TOKENS_CONFIG.map((token) => fetchTokenBalance(token)));
  }, [fetchTokenBalance]);

  // Function to refresh all balances
  const refreshAllBalances = useCallback(async () => {
    if (isRefreshingBalances) return; // Prevent multiple refresh calls

    setIsRefreshingBalances(true);

    // Set all tokens to loading state
    const loadingState = {};
    TOKENS_CONFIG.forEach((token) => {
      loadingState[token.id] = true;
    });
    setBalanceLoading((prev) => ({ ...prev, ...loadingState }));

    try {
      // Load all balances in parallel (both native and ICRC tokens)
      await Promise.all(TOKENS_CONFIG.map((token) => fetchTokenBalance(token)));
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [fetchTokenBalance, isRefreshingBalances]);

  // Function to fetch USD price for a specific token
  const fetchTokenUSDPrice = useCallback(async (tokenId) => {
    setUsdPriceLoading((prev) => ({ ...prev, [tokenId]: true }));
    setUsdPriceErrors((prev) => ({ ...prev, [tokenId]: null }));

    try {
      const price = await getUSD(tokenId);
      setUsdPrices((prev) => ({ ...prev, [tokenId]: price }));
    } catch (error) {
      console.error(`Error fetching USD price for token ${tokenId}:`, error);
      setUsdPriceErrors((prev) => ({ ...prev, [tokenId]: error.message }));
      setUsdPrices((prev) => ({ ...prev, [tokenId]: null }));
    } finally {
      setUsdPriceLoading((prev) => ({ ...prev, [tokenId]: false }));
    }
  }, []);

  // Function to fetch all USD prices
  const fetchAllUSDPrices = useCallback(async () => {
    const allTokenIds = TOKENS_CONFIG.map((token) => token.id);
    await Promise.all(allTokenIds.map((tokenId) => fetchTokenUSDPrice(tokenId)));
  }, [fetchTokenUSDPrice]);

  // Function to refresh all USD prices
  const refreshAllUSDPrices = useCallback(async () => {
    if (isRefreshingPrices) return;
    setIsRefreshingPrices(true);
    const allTokenIds = TOKENS_CONFIG.map((token) => token.id);
    const loadingState = {};
    allTokenIds.forEach((tokenId) => {
      loadingState[tokenId] = true;
    });
    setUsdPriceLoading((prev) => ({ ...prev, ...loadingState }));
    try {
      await Promise.all(allTokenIds.map((tokenId) => fetchTokenUSDPrice(tokenId)));
    } finally {
      setIsRefreshingPrices(false);
    }
  }, [fetchTokenUSDPrice, isRefreshingPrices]);

  // useEffect for balance and price fetching - placed after function definitions
  useEffect(() => {
    if (identity) {
      // Run all fetch operations in parallel to prevent blocking
      Promise.all([fetchAddresses(), fetchAllBalances(), fetchAllUSDPrices()]).catch((error) => {
        console.error("Error in parallel fetch operations:", error);
      });
    } else {
      setIsLoading(false);
      setUserWallet(null);
      // Reset balance states when user logs out
      setBalances({});
      setBalanceLoading({});
      setBalanceErrors({});
      setIsRefreshingBalances(false);
      // Reset USD price states when user logs out
      setUsdPrices({});
      setUsdPriceLoading({});
      setUsdPriceErrors({});
      setIsRefreshingPrices(false);
    }
  }, [identity, fetchAllBalances, fetchAddresses, fetchAllUSDPrices]);

  // Helper function to add new address to existing wallet

  // Function to calculate total USD value for a specific network
  const calculateNetworkValue = useCallback(
    (networkName) => {
      if (hideBalance) return 0;

      // Get all tokens for this network
      const networkTokens = TOKENS_CONFIG.filter((token) => {
        if (networkName === "All Networks") return true;
        return token.chain === networkName;
      });

      let totalValue = 0;

      networkTokens.forEach((token) => {
        const balance = balances[token.id] || 0;
        const usdPrice = usdPrices[token.id] || 0;
        const tokenValue = parseFloat(balance) * (usdPrice || 0);
        totalValue += tokenValue;
      });

      return totalValue;
    },
    [balances, usdPrices, hideBalance]
  );

  // Function to get formatted network value
  const getNetworkValue = useCallback(
    (networkName) => {
      const value = calculateNetworkValue(networkName);
      if (hideBalance) return "••••";
      return `$${value.toFixed(2)}`;
    },
    [calculateNetworkValue, hideBalance]
  );

  const walletContextValue = useMemo(
    () => ({
      isLoading,
      userWallet,
      setUserWallet,
      isCreatingWallet,
      setIsCreatingWallet,
      addAddressToWallet,
      network,
      setNetwork,
      hideBalance,
      setHideBalance,
      calculateNetworkValue,
      getNetworkValue,
      networkFilters,
      updateNetworkFilters,
      hasConfirmedWallet,
      setHasConfirmedWallet,
      // Address related
      addresses,
      addressesLoading,
      addressesLoaded,
      hasLoadedAddressesOnce,
      fetchAddresses,
      getAddressesLoadingState,
      // Balance related
      balances,
      balanceLoading,
      balanceErrors,
      isRefreshingBalances,
      fetchAllBalances,
      refreshAllBalances,
      // USD Price related
      usdPrices,
      usdPriceLoading,
      usdPriceErrors,
      isRefreshingPrices,
      fetchAllUSDPrices,
      refreshAllUSDPrices,
    }),
    [isLoading, userWallet, isCreatingWallet, addAddressToWallet, network, hideBalance, calculateNetworkValue, getNetworkValue, networkFilters, updateNetworkFilters, hasConfirmedWallet, addresses, addressesLoading, addressesLoaded, hasLoadedAddressesOnce, fetchAddresses, getAddressesLoadingState, balances, balanceLoading, balanceErrors, isRefreshingBalances, fetchAllBalances, refreshAllBalances, usdPrices, usdPriceLoading, usdPriceErrors, isRefreshingPrices, fetchAllUSDPrices, refreshAllUSDPrices]
  );

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
