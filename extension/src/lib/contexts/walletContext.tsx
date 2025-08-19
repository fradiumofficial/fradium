import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./authContext";
import type { WalletAddress, UserWallet } from "@/icp/services/backend_service";
import { getBalance, fetchBitcoinBalance, fetchEthereumBalance, fetchSolanaBalance, TokenType } from "@/services/balanceService";
import { createWallet as backendCreateWallet, getUserWallet } from "@/icp/services/backend_service";
import { getBitcoinAddress } from "@/icp/services/bitcoin_service";
import { getSolanaAddress } from "@/icp/services/solana_service";
import { getEthereumAddress } from "@/icp/services/ethereum_service";

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

  // Function to get backend, bitcoin, solana, and ethereum services
  const getServices = useCallback(() => {
    try {
      return {
        createWallet: backendCreateWallet,
        getUserWallet,
        getBitcoinAddress,
        getSolanaAddress,
        getEthereumAddress
      };
    } catch (error) {
      console.error("Error getting services:", error);
      throw error;
    }
  }, [identity, principal]);

  const createWallet = useCallback(async () => {
    if (!identity || !principal) {
      throw new Error("User not authenticated");
    }

    setIsCreatingWallet(true);
    try {
      console.log("WalletProvider: Starting wallet creation...");
      const { createWallet: backendCreateWallet, getUserWallet, getBitcoinAddress, getSolanaAddress, getEthereumAddress } = await getServices();

      // Get bitcoin address
      console.log("WalletProvider: Getting Bitcoin address...");
      const bitcoinResponse = await getBitcoinAddress();
      console.log("WalletProvider: Bitcoin address:", bitcoinResponse);

      // Get ethereum address
      console.log("WalletProvider: Getting Ethereum address...");
      const ethereumResponse = await getEthereumAddress();
      console.log("WalletProvider: Ethereum address:", ethereumResponse);

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
            address: ethereumResponse,
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

    // Get addresses for specific token type (following asset-page.jsx pattern)
  const getAddressesForToken = useCallback(
    (tokenType: string) => {
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

  // Fetch real balance data for each network (following asset-page.jsx pattern)
  const fetchNetworkBalances = useCallback(async () => {
    if (!userWallet || !userWallet.addresses) return;

    console.log('WalletProvider: Fetching balances for wallet:', userWallet);
    
    try {
      // Import services
      
      const supportedTokens = [TokenType.BITCOIN, TokenType.ETHEREUM, TokenType.SOLANA, TokenType.FRADIUM];
      const balances: Partial<NetworkValues> = {};

      for (const tokenType of supportedTokens) {
        const networkName = tokenType as keyof NetworkValues;
        
        // Check if this network is enabled in filters
        if (networkName !== 'All Networks' && networkFilters[networkName as keyof NetworkFilters]) {
          const addresses = getAddressesForToken(tokenType);
          
          if (addresses.length > 0) {
            console.log(`WalletProvider: Fetching ${tokenType} balance for addresses:`, addresses);
            
            try {
              const balanceResult = await getBalance(tokenType, addresses, identity);
              console.log(`WalletProvider: ${tokenType} balance result:`, balanceResult);
              
              // Calculate total balance for this token type
              const totalBalance = Object.values(balanceResult.balances).reduce((sum, balance) => sum + balance, 0);
              
              // Get USD value using individual balance services for price conversion
              let usdValue = 0;
              if (totalBalance > 0) {
                switch (tokenType) {
                  case TokenType.BITCOIN:

                    const btcResult = await fetchBitcoinBalance(addresses[0]);
                    usdValue = (btcResult.usdValue / btcResult.balance) * (totalBalance / 100000000); // Convert satoshi to BTC
                    break;
                  case TokenType.ETHEREUM:

                    const ethResult = await fetchEthereumBalance(addresses[0]);
                    usdValue = (ethResult.usdValue / ethResult.balance) * (totalBalance / Math.pow(10, 18)); // Convert wei to ETH
                    break;
                  case TokenType.SOLANA:

                    const solResult = await fetchSolanaBalance(addresses[0], identity);
                    usdValue = (solResult.usdValue / solResult.balance) * (totalBalance / Math.pow(10, 9)); // Convert lamports to SOL
                    break;
                  case TokenType.FRADIUM:
                    usdValue = totalBalance * 1.0; // Placeholder price
                    break;
                }
              }
              
              balances[networkName] = usdValue;
              console.log(`WalletProvider: Updated ${networkName} balance to $${usdValue}`);
              
            } catch (error) {
              console.error(`WalletProvider: Error fetching ${tokenType} balance:`, error);
              balances[networkName] = 0;
            }
          } else {
            console.log(`WalletProvider: No addresses found for ${tokenType}`);
            balances[networkName] = 0;
          }
        }
      }
      
      console.log('WalletProvider: Final balances to update:', balances);
      updateNetworkValues(balances);
      
    } catch (error) {
      console.error('WalletProvider: Error in fetchNetworkBalances:', error);
    }
  }, [userWallet, networkFilters, getAddressesForToken, updateNetworkValues]);

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
