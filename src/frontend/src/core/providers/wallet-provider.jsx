import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { backend } from "declarations/backend";
import { bitcoin } from "declarations/bitcoin";
import { solana } from "declarations/solana";
import { useAuth } from "./auth-provider";

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
  const [isLoading, setIsLoading] = useState(true);
  const [userWallet, setUserWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("All Networks");
  const [hideBalance, setHideBalance] = useState(false);
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false);
  const [networkValues, setNetworkValues] = useState({
    "All Networks": 0,
    Bitcoin: 0,
    Ethereum: 0,
    Solana: 0,
    Fradium: 0,
  });
  const [networkFilters, setNetworkFilters] = useState({
    Bitcoin: true,
    Ethereum: true,
    Solana: true,
    Fradium: true,
  });

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

  const createWallet = useCallback(async () => {
    setIsCreatingWallet(true);
    try {
      // Get bitcoin address
      const bitcoinResponse = await bitcoin.get_p2pkh_address();

      // Get solana address
      const solanaResponse = await solana.solana_account([identity?.getPrincipal()]);

      // Create wallet with new structure
      const response = await backend.create_wallet({
        addresses: [
          {
            network: { Bitcoin: null },
            token_type: { Bitcoin: null },
            address: bitcoinResponse,
          },
          {
            network: { Ethereum: null },
            token_type: { Ethereum: null },
            address: "0x0000000000000000000000000000000000000000",
          },
          {
            network: { Solana: null },
            token_type: { Solana: null },
            address: solanaResponse,
          },
          {
            network: { ICP: null },
            token_type: { Fradium: null },
            address: identity?.getPrincipal()?.toString(),
          },
        ],
      });

      if ("Ok" in response) {
        // Fetch wallet data immediately after creation
        const walletData = await backend.get_wallet();
        if ("Ok" in walletData) {
          setUserWallet(walletData.Ok);
          setHasConfirmedWallet(true); // Set state bahwa user sudah konfirmasi
        }
      } else {
        console.error("Failed to create wallet:", response);
        throw new Error("Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    } finally {
      setIsCreatingWallet(false);
      setIsLoading(false);
    }
  }, [identity]);

  const fetchUserWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await backend.get_wallet();
      if ("Ok" in response) {
        setUserWallet(response.Ok);
      } else {
        createWallet();
      }
    } catch (error) {
      setUserWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (identity) {
      fetchUserWallet();
    } else {
      setIsLoading(false);
      setUserWallet(null);
    }
  }, [identity]);

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

  // Function to update network values
  const updateNetworkValues = useCallback((values) => {
    setNetworkValues((prev) => ({ ...prev, ...values }));
  }, []);

  // Function to get formatted network value
  const getNetworkValue = useCallback(
    (networkName) => {
      const value = networkValues[networkName] || 0;
      if (hideBalance) return "••••";
      return `$${value.toFixed(2)}`;
    },
    [networkValues, hideBalance]
  );

  const walletContextValue = useMemo(
    () => ({
      isLoading,
      userWallet,
      setUserWallet,
      isCreatingWallet,
      setIsCreatingWallet,
      createWallet,
      fetchUserWallet,
      addAddressToWallet,
      network,
      setNetwork,
      hideBalance,
      setHideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      networkFilters,
      updateNetworkFilters,
      hasConfirmedWallet,
      setHasConfirmedWallet,
    }),
    [isLoading, userWallet, isCreatingWallet, createWallet, fetchUserWallet, addAddressToWallet, network, hideBalance, networkValues, updateNetworkValues, getNetworkValue, networkFilters, updateNetworkFilters, hasConfirmedWallet]
  );

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
