import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthProvider";

// Wallet declarations
import { wallet } from "declarations/wallet";
import { ckbtc_minter } from "declarations/ckbtc_minter";

// Token utilities
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { getBalance, getUSD, getUSDPrices, clearBalanceCache } from "@/core/lib/tokenUtils";

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

  // Address states for receive modal (simple)
  const [addresses, setAddresses] = useState({
    bitcoin: "",
    ethereum: "",
    solana: "",
    icp_principal: "",
    icp_account: "",
    ckbtc: "",
  });
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesReady, setAddressesReady] = useState(false);

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

  // Memoize user principal string (robust: coba dari identity lalu user.identity)
  const userPrincipalString = useMemo(() => {
    try {
      const principal = (typeof identity?.getPrincipal === "function" ? identity.getPrincipal() : null) || (typeof user?.identity?.getPrincipal === "function" ? user.identity.getPrincipal() : null);
      return principal?.toString() || null;
    } catch (_e) {
      return null;
    }
  }, [identity, user]);

  // Function to get localStorage key for user's network filters
  const getNetworkFiltersKey = useCallback(() => {
    return userPrincipalString ? `networkFilters_${userPrincipalString}` : "networkFilters_default";
  }, [userPrincipalString]);

  // Function to get localStorage key for user's wallet addresses
  const getAddressesKey = useCallback(() => {
    if (!userPrincipalString) {
      throw new Error("Principal ID is required for wallet addresses cache");
    }
    return `walletAddresses_${userPrincipalString}`;
  }, [userPrincipalString]);

  // Function to save wallet addresses to localStorage
  const saveAddressesToStorage = useCallback(
    (addresses) => {
      const key = getAddressesKey();
      try {
        localStorage.setItem(key, JSON.stringify(addresses));
      } catch (error) {
        console.error("Error saving wallet addresses to localStorage:", error);
      }
    },
    [getAddressesKey, userPrincipalString]
  );

  // Function to load wallet addresses from localStorage
  const loadAddressesFromStorage = useCallback(() => {
    const key = getAddressesKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedAddresses = JSON.parse(saved);
        return parsedAddresses;
      }
    } catch (error) {
      console.error("Error loading wallet addresses from localStorage:", error);
    }
    return null;
  }, [getAddressesKey, userPrincipalString]);

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

  // Simple fetch addresses:
  // 1) Cek localStorage by principal -> pakai jika ada
  // 2) Jika tidak ada -> fetch dari wallet.wallet_addresses
  // 3) Tambahkan ckBTC deposit BTC address dari ckbtc_minter.get_btc_address (parallel)
  // 4) Simpan ke localStorage
  const fetchAddresses = useCallback(async () => {
    if (!wallet || !userPrincipalString) {
      return;
    }

    try {
      setAddressesLoading(true);

      const cached = loadAddressesFromStorage();
      // Jika cache lama belum memiliki ckbtc_btc_address, jangan cache hit (lanjut fetch baru)
      if (cached && typeof cached.ckbtc === "string" && cached.ckbtc) {
        setAddresses(cached);
        setAddressesReady(true);
        return;
      }

      const result = await wallet.wallet_addresses();

      // Jalankan fetch ckBTC BTC deposit address secara parallel
      // Hanya jika principal tersedia
      const principal = identity?.getPrincipal();
      const promises = [];

      // ckBTC BTC address promise
      let ckbtcBtcAddress = "";
      if (principal && ckbtc_minter && typeof ckbtc_minter.get_btc_address === "function") {
        const ckbtcPromise = ckbtc_minter
          .get_btc_address({ owner: [principal], subaccount: [] })
          .then((addr) => (typeof addr === "string" ? addr : ""))
          .catch((_e) => "");
        promises.push(ckbtcPromise);
      }

      // Tunggu semua promise parallel (saat ini hanya ckBTC, mudah ditambah kedepan)
      const results = await Promise.all(promises);
      if (results.length > 0) {
        ckbtcBtcAddress = results[0] || "";
      }

      const newAddresses = {
        bitcoin: result?.bitcoin || "",
        ethereum: result?.ethereum || "",
        solana: result?.solana || "",
        icp_principal: result?.icp_principal || "",
        icp_account: result?.icp_account || "",
        ckbtc: ckbtcBtcAddress,
      };

      saveAddressesToStorage(newAddresses);
      setAddresses(newAddresses);
      setAddressesReady(true);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      // Jangan set fallback kosong; biarkan addressesReady tetap false agar UI menunggu/menampilkan error
    } finally {
      setAddressesLoading(false);
    }
  }, [wallet, userPrincipalString, loadAddressesFromStorage, saveAddressesToStorage, identity]);

  // Function to get loading state for addresses (simple)
  const getAddressesLoadingState = useCallback(() => {
    return !userPrincipalString || addressesLoading || !addressesReady;
  }, [userPrincipalString, addressesLoading, addressesReady]);

  // Function to fetch balance for a specific token
  const fetchTokenBalance = useCallback(
    async (token, useCache = true) => {
      setBalanceLoading((prev) => ({ ...prev, [token.id]: true }));
      setBalanceErrors((prev) => ({ ...prev, [token.id]: null }));

      try {
        // Get principal from Internet Identity
        const principal = identity?.getPrincipal();

        const balance = await getBalance(token.id, principal, useCache);

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
        setBalanceErrors((prev) => ({ ...prev, [token.id]: error.message || "Failed to fetch balance" }));
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
      // Use cache=false for refresh to ensure fresh data from blockchain
      await Promise.all(TOKENS_CONFIG.map((token) => fetchTokenBalance(token, false)));
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
      setUsdPriceErrors((prev) => ({ ...prev, [tokenId]: error.message || "Failed to fetch price" }));
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

  // Function to clear balance cache manually
  const clearBalanceCacheManual = useCallback(
    async (tokenId = null) => {
      try {
        const principal = identity?.getPrincipal();
        clearBalanceCache(principal, tokenId);
      } catch (error) {
        console.error("Error clearing balance cache manually:", error);
      }
    },
    [identity]
  );

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

      // Clear balance cache when user logs out
      try {
        clearBalanceCache(null); // Clear all balance cache
      } catch (error) {
        console.error("Error clearing balance cache on logout:", error);
      }
      // Reset USD price states when user logs out
      setUsdPrices({});
      setUsdPriceLoading({});
      setUsdPriceErrors({});
      setIsRefreshingPrices(false);
      // Reset address states when user logs out
      setAddresses({
        bitcoin: "",
        ethereum: "",
        solana: "",
        icp_principal: "",
        icp_account: "",
        ckbtc: "",
      });
      setAddressesReady(false);
    }
  }, [identity, fetchAllBalances, fetchAddresses, fetchAllUSDPrices]);

  // Clear addresses and balance cache when user changes (principal changes)
  useEffect(() => {
    if (userPrincipalString) {
      // Clear any old cache when principal changes
      const oldAddressKeys = Object.keys(localStorage).filter((key) => key.startsWith("walletAddresses_") && !key.includes(userPrincipalString));
      oldAddressKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error clearing old cache:", error);
        }
      });

      // Clear balance cache for old principals
      try {
        const oldBalanceKeys = Object.keys(localStorage).filter((key) => key.startsWith("balanceCache_") && !key.includes(userPrincipalString));
        oldBalanceKeys.forEach((key) => {
          localStorage.removeItem(key);
        });
      } catch (error) {
        console.error("Error clearing old balance cache:", error);
      }
    }
  }, [userPrincipalString]);

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
      // Cache management
      clearBalanceCacheManual,
    }),
    [isLoading, userWallet, isCreatingWallet, addAddressToWallet, network, hideBalance, calculateNetworkValue, getNetworkValue, networkFilters, updateNetworkFilters, hasConfirmedWallet, addresses, addressesLoading, fetchAddresses, getAddressesLoadingState, balances, balanceLoading, balanceErrors, isRefreshingBalances, fetchAllBalances, refreshAllBalances, usdPrices, usdPriceLoading, usdPriceErrors, isRefreshingPrices, fetchAllUSDPrices, refreshAllUSDPrices, clearBalanceCacheManual]
  );

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
