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
      await fetchUserWallet();
      await refreshBalances();
      return { success: true, data: true };
    } catch (error) {
      console.error('Error refreshing wallet:', error);
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
    getSupportedNetworks,
    deleteWallet
  };
};

// Export the hook as default for easier importing
export default useWalletApi;
