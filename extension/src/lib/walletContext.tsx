import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./authContext";
import type { WalletAddress, UserWallet } from "@/icp/services/backend_service";

interface NetworkFilters {
  Bitcoin: boolean;
  Ethereum: boolean;
  Solana: boolean;
  Fradium: boolean;
}

interface NetworkValues {
  "All Networks": number;
  Bitcoin: number;
  Ethereum: number;
  Solana: number;
  Fradium: number;
}

interface WalletContextType {
  // Wallet state
  isLoading: boolean;
  userWallet: UserWallet | null;
  setUserWallet: (wallet: UserWallet | null) => void;
  isCreatingWallet: boolean;
  setIsCreatingWallet: (creating: boolean) => void;
  hasConfirmedWallet: boolean;
  setHasConfirmedWallet: (confirmed: boolean) => void;
  
  // Wallet operations
  createWallet: () => Promise<void>;
  fetchUserWallet: () => Promise<void>;
  addAddressToWallet: (network: string, tokenType: string, address: string) => Promise<boolean>;
  
  // Network management
  network: string;
  setNetwork: (network: string) => void;
  networkFilters: NetworkFilters;
  updateNetworkFilters: (filters: NetworkFilters) => void;
  
  // Balance management
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  networkValues: NetworkValues;
  updateNetworkValues: (values: Partial<NetworkValues>) => void;
  getNetworkValue: (networkName: string) => string;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { identity, isAuthenticated, principal } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("All Networks");
  const [hideBalance, setHideBalance] = useState(false);
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false);
  const [networkValues, setNetworkValues] = useState<NetworkValues>({
    "All Networks": 0,
    Bitcoin: 0,
    Ethereum: 0,
    Solana: 0,
    Fradium: 0,
  });
  const [networkFilters, setNetworkFilters] = useState<NetworkFilters>({
    Bitcoin: true,
    Ethereum: true,
    Solana: true,
    Fradium: true,
  });

  // Memoize user principal string to prevent unnecessary re-renders
  const userPrincipalString = useMemo(() => {
    return principal;
  }, [principal]);

  // Function to get localStorage key for user's network filters
  const getNetworkFiltersKey = useCallback(() => {
    return userPrincipalString ? `networkFilters_${userPrincipalString}` : "networkFilters_default";
  }, [userPrincipalString]);

  // Function to save network filters to localStorage
  const saveNetworkFilters = useCallback(
    (filters: NetworkFilters) => {
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
    (filters: NetworkFilters) => {
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

    if (userPrincipalString) {
      loadSavedFilters();
    }
  }, [userPrincipalString, loadNetworkFilters]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
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

  // Function to get backend, bitcoin, and solana services
  const getServices = useCallback(async () => {
    try {
      // Import services dynamically to avoid circular dependencies
      const { createWallet: backendCreateWallet, getUserWallet } = await import("@/icp/services/backend_service");
      const { getBitcoinAddress } = await import("@/icp/services/bitcoin_service");
      const { getSolanaAddress } = await import("@/icp/services/solana_service");
      
      return {
        createWallet: backendCreateWallet,
        getUserWallet,
        getBitcoinAddress,
        getSolanaAddress
      };
    } catch (error) {
      console.error("Error getting services:", error);
      throw error;
    }
  }, []);

  const createWallet = useCallback(async () => {
    if (!identity || !principal) {
      throw new Error("User not authenticated");
    }

    setIsCreatingWallet(true);
    try {
      console.log("WalletProvider: Starting wallet creation...");
      const { createWallet: backendCreateWallet, getUserWallet, getBitcoinAddress, getSolanaAddress } = await getServices();

      // Get bitcoin address
      console.log("WalletProvider: Getting Bitcoin address...");
      const bitcoinResponse = await getBitcoinAddress();
      console.log("WalletProvider: Bitcoin address:", bitcoinResponse);

      // Get solana address
      console.log("WalletProvider: Getting Solana address...");
      const solanaResponse = await getSolanaAddress(identity);
      console.log("WalletProvider: Solana address:", solanaResponse);

      // Create wallet with new structure
      console.log("WalletProvider: Creating wallet in backend...");
      const response = await backendCreateWallet({
        addresses: [
          {
            network: { Bitcoin: null },
            token_type: { Bitcoin: null },
            address: bitcoinResponse,
          },
          {
            network: { Ethereum: null },
            token_type: { Ethereum: null },
            address: "0x0000000000000000000000000000000000000000", // Placeholder
          },
          {
            network: { Solana: null },
            token_type: { Solana: null },
            address: solanaResponse,
          },
          {
            network: { ICP: null },
            token_type: { Fradium: null },
            address: principal,
          },
        ],
      }, identity); // Pass the authenticated identity

      console.log("WalletProvider: Create wallet response:", response);

      if ("Ok" in response) {
        // Fetch wallet data immediately after creation
        console.log("WalletProvider: Fetching wallet data after creation...");
        const walletData = await getUserWallet(identity);
        if ("Ok" in walletData) {
          console.log("WalletProvider: Wallet created successfully:", walletData.Ok);
          setUserWallet(walletData.Ok);
          setHasConfirmedWallet(true);
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
  }, [identity, principal, getServices]);

  const fetchUserWallet = useCallback(async () => {
    if (!isAuthenticated || !principal) {
      setIsLoading(false);
      setUserWallet(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log("WalletProvider: Fetching user wallet...");
      const { getUserWallet } = await getServices();
      const response = await getUserWallet(identity);
      
      console.log("WalletProvider: Get wallet response:", response);
      
      if ("Ok" in response) {
        console.log("WalletProvider: Wallet found:", response.Ok);
        setUserWallet(response.Ok);
        setHasConfirmedWallet(true);
      } else {
        console.log("WalletProvider: No wallet found");
        setUserWallet(null);
        setHasConfirmedWallet(false);
      }
    } catch (error) {
      console.error("WalletProvider: Error fetching wallet:", error);
      setUserWallet(null);
      setHasConfirmedWallet(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, principal, identity, getServices, createWallet]);

  // Function to update network values
  const updateNetworkValues = useCallback((values: Partial<NetworkValues>) => {
    setNetworkValues((prev) => {
      const updated = { ...prev, ...values };
      
      // Auto-calculate "All Networks" as sum of enabled individual networks only
      if (!values["All Networks"]) {
        updated["All Networks"] = 
          (networkFilters.Bitcoin ? updated.Bitcoin : 0) + 
          (networkFilters.Ethereum ? updated.Ethereum : 0) + 
          (networkFilters.Solana ? updated.Solana : 0) + 
          (networkFilters.Fradium ? updated.Fradium : 0);
      }
      
      return updated;
    });
  }, [networkFilters]);

  // Fetch wallet when user is authenticated
  useEffect(() => {
    if (isAuthenticated && principal) {
      fetchUserWallet();
    } else {
      setIsLoading(false);
      setUserWallet(null);
      setHasConfirmedWallet(false);
    }
  }, [isAuthenticated, principal, fetchUserWallet]);

  // Fetch real balance data for each network
  const fetchNetworkBalances = useCallback(async () => {
    if (!userWallet || !userWallet.addresses) return;

    try {
      // Import balance services dynamically
      const { 
        fetchBitcoinBalance, 
        fetchEthereumBalance, 
        fetchSolanaBalance, 
        fetchFradiumBalance,
        fetchMockBalances 
      } = await import('./balanceService');

      // For testing, you can use mock balances
      const useMockData = false; // Set to false when ready to use real APIs
      
      if (useMockData) {
        const mockBalances = fetchMockBalances();
        const balances: Partial<NetworkValues> = {};
        
        Object.entries(mockBalances).forEach(([network, data]) => {
          balances[network as keyof NetworkValues] = data.usdValue;
        });
        
        updateNetworkValues(balances);
        return;
      }

      // Real balance fetching (when useMockData = false)
      const balances: Partial<NetworkValues> = {};
      
      // Fetch balances for each address
      for (const addr of userWallet.addresses) {
        let networkName = '';
        let balanceData = { balance: 0, usdValue: 0 };
        
        if ('Bitcoin' in addr.token_type) {
          networkName = 'Bitcoin';
          balanceData = await fetchBitcoinBalance(addr.address);
        } else if ('Ethereum' in addr.token_type) {
          networkName = 'Ethereum';
          balanceData = await fetchEthereumBalance(addr.address);
        } else if ('Solana' in addr.token_type) {
          networkName = 'Solana';
          balanceData = await fetchSolanaBalance(addr.address);
        } else if ('Fradium' in addr.token_type) {
          networkName = 'Fradium';
          balanceData = await fetchFradiumBalance(addr.address);
        }
        
        if (networkName) {
          balances[networkName as keyof NetworkValues] = balanceData.usdValue;
        }
      }
      
      updateNetworkValues(balances);
    } catch (error) {
      console.error('Error fetching network balances:', error);
    }
  }, [userWallet, updateNetworkValues]);

  // Fetch balances when wallet is loaded
  useEffect(() => {
    if (isAuthenticated && userWallet) {
      fetchNetworkBalances();
    }
  }, [isAuthenticated, userWallet, fetchNetworkBalances]);

  // Helper function to add new address to existing wallet
  const addAddressToWallet = useCallback(
    async (_network: string, tokenType: string, address: string): Promise<boolean> => {
      if (!userWallet) {
        console.error("No wallet found");
        return false;
      }

      try {
        const { createWallet: backendCreateWallet } = await getServices();
        
        const newAddress: WalletAddress = {
          network: 
            tokenType === "bitcoin" ? { Bitcoin: null } :
            tokenType === "ethereum" ? { Ethereum: null } :
            tokenType === "solana" ? { Solana: null } :
            { ICP: null },
          token_type: 
            tokenType === "bitcoin" ? { Bitcoin: null } :
            tokenType === "ethereum" ? { Ethereum: null } :
            tokenType === "solana" ? { Solana: null } :
            { Fradium: null },
          address: address,
        };

        const updatedAddresses = [...userWallet.addresses, newAddress];

        // Update wallet with new address
        const response = await backendCreateWallet({
          addresses: updatedAddresses,
        }, identity);

        if ("Ok" in response) {
          // Refresh wallet data after adding address
          await fetchUserWallet();
          return true;
        } else {
          console.error("Failed to add address:", response);
          return false;
        }
      } catch (error) {
        console.error("Error adding address:", error);
        return false;
      }
    },
    [userWallet, identity, getServices, fetchUserWallet]
  );

  // Function to get formatted network value
  const getNetworkValue = useCallback(
    (networkName: string) => {
      const value = networkValues[networkName as keyof NetworkValues] || 0;
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
      refreshBalances: fetchNetworkBalances,
      networkFilters,
      updateNetworkFilters,
      hasConfirmedWallet,
      setHasConfirmedWallet,
    }),
    [
      isLoading,
      userWallet,
      isCreatingWallet,
      createWallet,
      fetchUserWallet,
      addAddressToWallet,
      network,
      hideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      fetchNetworkBalances,
      networkFilters,
      updateNetworkFilters,
      hasConfirmedWallet,
    ]
  );

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
