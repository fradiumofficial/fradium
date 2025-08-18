import { useWallet } from "@/lib/walletContext";
import { useAuth } from "@/lib/authContext";
import type { WalletAddress, UserWallet } from "@/icp/services/backend_service";

export interface WalletApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NetworkBalance {
  network: string;
  balance: number;
  usdValue: number;
  address: string;
}

export interface WalletInfo {
  addresses: WalletAddress[];
  balances: NetworkBalance[];
  totalValue: number;
}

// Custom hook for wallet API operations
export const useWalletApi = () => {
  const { 
    userWallet, 
    isLoading, 
    createWallet, 
    fetchUserWallet, 
    networkValues,
    refreshBalances,
    hasConfirmedWallet,
    setUserWallet,
    setHasConfirmedWallet
  } = useWallet();
  const { isAuthenticated, principal, identity } = useAuth();

  /**
   * Get wallet information including addresses and balances
   */
  const getWalletInfo = async (): Promise<WalletApiResponse<WalletInfo>> => {
    try {
      if (!isAuthenticated) {
        return { success: false, error: "User not authenticated" };
      }

      if (!userWallet) {
        return { success: false, error: "No wallet found" };
      }

      // Create network balances from wallet addresses and network values
      const balances: NetworkBalance[] = [];
      
      for (const address of userWallet.addresses) {
        let networkName = '';
        let balance = 0;
        let usdValue = 0;

        if ('Bitcoin' in address.token_type) {
          networkName = 'Bitcoin';
          usdValue = networkValues.Bitcoin || 0;
        } else if ('Ethereum' in address.token_type) {
          networkName = 'Ethereum';
          usdValue = networkValues.Ethereum || 0;
        } else if ('Solana' in address.token_type) {
          networkName = 'Solana';
          usdValue = networkValues.Solana || 0;
        } else if ('Fradium' in address.token_type) {
          networkName = 'Fradium';
          usdValue = networkValues.Fradium || 0;
        }

        if (networkName) {
          balances.push({
            network: networkName,
            balance,
            usdValue,
            address: address.address
          });
        }
      }

      const totalValue = networkValues["All Networks"] || 0;

      return {
        success: true,
        data: {
          addresses: userWallet.addresses,
          balances,
          totalValue
        }
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Get address for a specific network
   */
  const getAddressForNetwork = (network: string): WalletApiResponse<string> => {
    try {
      if (!userWallet) {
        return { success: false, error: "No wallet found" };
      }

      const address = userWallet.addresses.find(addr => {
        if (network === 'Bitcoin' && 'Bitcoin' in addr.token_type) return true;
        if (network === 'Ethereum' && 'Ethereum' in addr.token_type) return true;
        if (network === 'Solana' && 'Solana' in addr.token_type) return true;
        if (network === 'Fradium' && 'Fradium' in addr.token_type) return true;
        return false;
      });

      if (!address) {
        return { success: false, error: `No address found for network: ${network}` };
      }

      return { success: true, data: address.address };
    } catch (error) {
      console.error('Error getting address for network:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Get balance for a specific network
   */
  const getBalanceForNetwork = (network: string): WalletApiResponse<NetworkBalance> => {
    try {
      if (!userWallet) {
        return { success: false, error: "No wallet found" };
      }

      const address = userWallet.addresses.find(addr => {
        if (network === 'Bitcoin' && 'Bitcoin' in addr.token_type) return true;
        if (network === 'Ethereum' && 'Ethereum' in addr.token_type) return true;
        if (network === 'Solana' && 'Solana' in addr.token_type) return true;
        if (network === 'Fradium' && 'Fradium' in addr.token_type) return true;
        return false;
      });

      if (!address) {
        return { success: false, error: `No address found for network: ${network}` };
      }

      const usdValue = networkValues[network as keyof typeof networkValues] || 0;

      return {
        success: true,
        data: {
          network,
          balance: 0, // TODO: Implement actual balance fetching
          usdValue,
          address: address.address
        }
      };
    } catch (error) {
      console.error('Error getting balance for network:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Create a new wallet
   */
  const createNewWallet = async (): Promise<WalletApiResponse<UserWallet>> => {
    try {
      if (!isAuthenticated) {
        return { success: false, error: "User not authenticated" };
      }

      await createWallet();
      await fetchUserWallet();

      if (!userWallet) {
        return { success: false, error: "Failed to create wallet" };
      }

      return { success: true, data: userWallet };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Refresh wallet data and balances
   */
  const refreshWallet = async (): Promise<WalletApiResponse<boolean>> => {
    try {
      console.log('WalletApi: Starting wallet refresh...');
      await fetchUserWallet();
      await refreshBalances();
      console.log('WalletApi: Wallet refresh completed successfully');
      return { success: true, data: true };
    } catch (error) {
      console.error('WalletApi: Error refreshing wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Get addresses for specific token type (following asset-page.jsx pattern)
   */
  const getAddressesForToken = (tokenType: string): string[] => {
    if (!userWallet?.addresses) return [];

    return userWallet.addresses
      .filter((addressObj) => {
        const addressTokenType = Object.keys(addressObj.token_type)[0];
        return addressTokenType === tokenType;
      })
      .map((addressObj) => addressObj.address);
  };

  /**
   * Force refresh balance for specific network
   */
  const refreshNetworkBalance = async (network: string): Promise<WalletApiResponse<NetworkBalance>> => {
    try {
      console.log(`WalletApi: Refreshing ${network} balance...`);
      
      if (!userWallet) {
        return { success: false, error: "No wallet found" };
      }

      // Get addresses for this network
      const addresses = getAddressesForToken(network);
      if (addresses.length === 0) {
        return { success: false, error: `No addresses found for network: ${network}` };
      }

      // Use the new getBalance function following asset-page.jsx pattern
      const { getBalance, TokenType } = await import("@/lib/balanceService");
      
      let tokenType: any;
      switch (network) {
        case 'Bitcoin':
          tokenType = TokenType.BITCOIN;
          break;
        case 'Ethereum':
          tokenType = TokenType.ETHEREUM;
          break;
        case 'Solana':
          tokenType = TokenType.SOLANA;
          break;
        case 'Fradium':
          tokenType = TokenType.FRADIUM;
          break;
        default:
          return { success: false, error: `Unsupported network: ${network}` };
      }

      console.log(`WalletApi: Fetching ${network} balance for addresses:`, addresses);
      const balanceResult = await getBalance(tokenType, addresses, identity);
      console.log(`WalletApi: ${network} balance result:`, balanceResult);

      // Calculate total balance
      const totalBalance = Object.values(balanceResult.balances).reduce((sum, balance) => sum + balance, 0);
      
      // Get USD value using individual balance service for price conversion
      let balanceData = { balance: 0, usdValue: 0 };
      if (totalBalance > 0) {
        switch (network) {
          case 'Bitcoin':
            const { fetchBitcoinBalance } = await import("@/lib/balanceService");
            const btcResult = await fetchBitcoinBalance(addresses[0]);
            balanceData = {
              balance: totalBalance / 100000000, // Convert satoshi to BTC
              usdValue: (btcResult.usdValue / btcResult.balance) * (totalBalance / 100000000)
            };
            break;
          case 'Ethereum':
            const { fetchEthereumBalance } = await import("@/lib/balanceService");
            const ethResult = await fetchEthereumBalance(addresses[0]);
            balanceData = {
              balance: totalBalance / Math.pow(10, 18), // Convert wei to ETH
              usdValue: (ethResult.usdValue / ethResult.balance) * (totalBalance / Math.pow(10, 18))
            };
            break;
          case 'Solana':
            const { fetchSolanaBalance } = await import("@/lib/balanceService");
            const solResult = await fetchSolanaBalance(addresses[0], identity);
            balanceData = {
              balance: totalBalance / Math.pow(10, 9), // Convert lamports to SOL
              usdValue: (solResult.usdValue / solResult.balance) * (totalBalance / Math.pow(10, 9))
            };
            break;
          case 'Fradium':
            balanceData = {
              balance: totalBalance,
              usdValue: totalBalance * 1.0 // Placeholder price
            };
            break;
        }
      }
      
      console.log(`WalletApi: Final ${network} balance data:`, balanceData);
      
      // Update network values with new balance
      await refreshBalances();
      
      return {
        success: true,
        data: {
          network,
          balance: balanceData.balance,
          usdValue: balanceData.usdValue,
          address: addresses[0] // Return first address as primary
        }
      };
    } catch (error) {
      console.error(`WalletApi: Error refreshing ${network} balance:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  /**
   * Check if user has a wallet
   */
  const hasWallet = (): boolean => {
    return userWallet !== null && hasConfirmedWallet;
  };

  /**
   * Get all supported networks
   */
  const getSupportedNetworks = (): string[] => {
    return ['Bitcoin', 'Ethereum', 'Solana', 'Fradium'];
  };

  /**
   * Delete existing wallet (for debugging/testing purposes)
   */
  const deleteWallet = async (): Promise<WalletApiResponse<boolean>> => {
    try {
      if (!isAuthenticated || !principal) {
        return { success: false, error: "User not authenticated" };
      }

      const { deleteUserWallet } = await import("@/icp/services/backend_service");
      const result = await deleteUserWallet(principal, identity);

      if ("Ok" in result) {
        // Clear local wallet state
        setUserWallet(null);
        setHasConfirmedWallet(false);
        return { success: true, data: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  return {
    // Data
    userWallet,
    isLoading,
    isAuthenticated,
    principal,
    hasWallet: hasWallet(),
    
    // Methods
    getWalletInfo,
    getAddressForNetwork,
    getBalanceForNetwork,
    createNewWallet,
    refreshWallet,
    refreshNetworkBalance,
    getSupportedNetworks,
    deleteWallet
  };
};

// Export the hook as default for easier importing
export default useWalletApi;
