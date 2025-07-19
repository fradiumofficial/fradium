import React, { createContext, useContext, useState, useEffect } from "react";
import { backend } from "declarations/backend";
import { bitcoin } from "declarations/bitcoin";
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
  const [isLoading, setIsLoading] = useState(true);
  const [userWallet, setUserWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("All Networks");
  const [hideBalance, setHideBalance] = useState(false);
  const [networkValues, setNetworkValues] = useState({
    "All Networks": 0,
    Bitcoin: 0,
    Ethereum: 0,
    Fradium: 0,
  });
  const [networkFilters, setNetworkFilters] = useState({
    Bitcoin: true,
    Ethereum: true,
    Solana: true,
    Fradium: true,
  });

  const { user } = useAuth();

  // Function to get localStorage key for user's network filters
  const getNetworkFiltersKey = () => {
    return user?.identity?.getPrincipal()?.toString() ? `networkFilters_${user.identity.getPrincipal().toString()}` : "networkFilters_default";
  };

  // Function to save network filters to localStorage
  const saveNetworkFilters = (filters) => {
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
  };

  // Function to load network filters from localStorage
  const loadNetworkFilters = () => {
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
  };

  // Function to update network filters
  const updateNetworkFilters = (filters) => {
    setNetworkFilters(filters);
    saveNetworkFilters(filters);
  };

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
  }, [user?.identity?.getPrincipal()?.toString()]);

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

  const fetchUserWallet = async () => {
    setIsLoading(true);
    const response = await backend.get_wallet();

    if (response.Ok) {
      setUserWallet(response.Ok);
      setIsLoading(false);
    } else {
      createWallet();
    }
  };

  useEffect(() => {
    fetchUserWallet();
  }, []);

  async function createWallet() {
    setIsCreatingWallet(true);
    try {
      // Get bitcoin address
      const bitcoinResponse = await bitcoin.get_p2pkh_address();

      // Create wallet with new structure
      const response = await backend.create_wallet({
        addresses: [
          {
            network: { Bitcoin: null },
            token_type: { Bitcoin: null },
            address: bitcoinResponse,
          },
        ],
      });

      setIsCreatingWallet(false);
      if (response.Ok) {
        setUserWallet(response.value);
        await fetchUserWallet();
        setIsLoading(false);
      } else {
        console.error("Failed to create wallet:", response);
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      setIsCreatingWallet(false);
    }
  }

  // Helper function to add new address to existing wallet
  const addAddressToWallet = async (network, tokenType, address) => {
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

      if (response.Ok) {
        setUserWallet(response.value);
        await fetchUserWallet();
        return true;
      } else {
        console.error("Failed to add address:", response.Err);
        return false;
      }
    } catch (error) {
      console.error("Error adding address:", error);
      return false;
    }
  };

  // Function to update network values
  const updateNetworkValues = (values) => {
    setNetworkValues((prev) => ({ ...prev, ...values }));
  };

  // Function to get formatted network value
  const getNetworkValue = (networkName) => {
    const value = networkValues[networkName] || 0;
    if (hideBalance) return "••••";
    return `$${value.toFixed(2)}`;
  };

  const walletContextValue = {
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
    networkValues,
    updateNetworkValues,
    getNetworkValue,
    networkFilters,
    updateNetworkFilters,
  };

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
