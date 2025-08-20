import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./authContext";
import type { WalletAddress, UserWallet } from "@/icp/services/backend_service";
import { getBalance, TokenType } from "@/services/balanceService";
import { createWallet as backendCreateWallet, getUserWallet } from "@/icp/services/backend_service";
import { getBitcoinAddress } from "@/icp/services/bitcoin_service";
import { getSolanaAddress } from "@/icp/services/solana_service";
import { BITCOIN_CONFIG } from "@/lib/config";

interface NetworkFilters {
  Bitcoin: boolean;
  Solana: boolean;
  Fradium: boolean;
}

interface NetworkValues {
  "All Networks": number;
  Bitcoin: number;
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
    Solana: 0,
    Fradium: 0,
  });
  const [networkFilters, setNetworkFilters] = useState<NetworkFilters>({
    Bitcoin: true,
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
        getSolanaAddress
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
      
      const supportedTokens = [TokenType.BITCOIN, TokenType.SOLANA, TokenType.FRADIUM];
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
              
              // CRITICAL FIX: Validate that balance is not negative or invalid
              if (totalBalance < 0 || !isFinite(totalBalance)) {
                console.warn(`WalletProvider: Invalid ${tokenType} balance detected: ${totalBalance}, setting to 0`);
                balances[networkName] = 0;
                continue; // Skip to next token type
              }
              
              // CRITICAL FIX: For new Bitcoin addresses, ensure they start with 0 balance
              // This prevents the $5 bug where new accounts get testnet coins
              if (tokenType === TokenType.BITCOIN && totalBalance > 0) {
                const isNewBitcoinAddress = await isNewlyCreatedBitcoinAddressInWallet(addresses[0]);
                if (isNewBitcoinAddress) {
                  console.warn(`WalletProvider: New Bitcoin address detected with non-zero balance ${totalBalance}. This may indicate testnet faucet is enabled.`);
                  
                  // For production, new Bitcoin addresses should start with 0
                  if (BITCOIN_CONFIG.isProduction()) {
                    console.warn('WalletProvider: Production environment detected. Setting Bitcoin balance to 0 for new address.');
                    balances[networkName] = 0;
                    continue; // Skip to next token type
                  }
                }
              }
              
              // Get USD value using the balance result directly, not by calling fetchBitcoinBalance again
              let usdValue = 0;
              if (totalBalance > 0) {
                try {
                  // Get current token price from CoinGecko
                  let tokenPrice = 0;
                  switch (tokenType) {
                    case TokenType.BITCOIN:
                      const btcPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                      const btcPriceData = await btcPriceResponse.json();
                      tokenPrice = btcPriceData.bitcoin?.usd || 45000; // fallback price
                      break;
                    case TokenType.SOLANA:
                      const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                      const solPriceData = await solPriceResponse.json();
                      tokenPrice = solPriceData.solana?.usd || 100; // fallback price
                      break;
                    case TokenType.FRADIUM:
                      tokenPrice = 1.0; // Placeholder price
                      break;
                  }
                  
                  // Calculate USD value based on token type and conversion factors
                  switch (tokenType) {
                    case TokenType.BITCOIN:
                      // totalBalance is in satoshi, convert to BTC then to USD
                      const btcAmount = totalBalance / 100000000; // satoshi to BTC
                      usdValue = btcAmount * tokenPrice;
                      break;
                    case TokenType.SOLANA:
                      // totalBalance is in lamports, convert to SOL then to USD
                      const solAmount = totalBalance / Math.pow(10, 9); // lamports to SOL
                      usdValue = solAmount * tokenPrice;
                      break;
                    case TokenType.FRADIUM:
                      usdValue = totalBalance * tokenPrice;
                      break;
                  }
                } catch (priceError) {
                  console.warn(`WalletProvider: Error getting price for ${tokenType}:`, priceError);
                  // Use fallback calculation
                  switch (tokenType) {
                    case TokenType.BITCOIN:
                      usdValue = (totalBalance / 100000000) * 45000; // fallback BTC price
                      break;
                    case TokenType.SOLANA:
                      usdValue = (totalBalance / Math.pow(10, 9)) * 100; // fallback SOL price
                      break;
                    case TokenType.FRADIUM:
                      usdValue = totalBalance * 1.0;
                      break;
                  }
                }
              }
              
              balances[networkName] = usdValue;
              console.log(`WalletProvider: Updated ${networkName} balance to $${usdValue} (totalBalance: ${totalBalance})`);
              
              // Log detailed calculation for debugging
              console.log(`WalletProvider: ${networkName} calculation details:`, {
                tokenType,
                addresses,
                balanceResult,
                totalBalance,
                usdValue,
                timestamp: new Date().toISOString()
              });
              
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
            tokenType === "solana" ? { Solana: null } :
            { ICP: null },
          token_type: 
            tokenType === "bitcoin" ? { Bitcoin: null } :
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

  // Helper function to check if Bitcoin address is newly created in this wallet
  const isNewlyCreatedBitcoinAddressInWallet = async (address: string): Promise<boolean> => {
    try {
      // Check if this address was created in the current wallet session
      const key = `wallet_bitcoin_address_created_${address}`;
      const creationTime = localStorage.getItem(key);
      
      if (!creationTime) {
        // Mark this address as newly created in this wallet
        localStorage.setItem(key, Date.now().toString());
        return true;
      }
      
      // Check if address was created in the last 5 minutes (new session)
      const createdTime = parseInt(creationTime);
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      return createdTime > fiveMinutesAgo;
    } catch (error) {
      console.warn('isNewlyCreatedBitcoinAddressInWallet: Error checking localStorage:', error);
      return false;
    }
  };

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
