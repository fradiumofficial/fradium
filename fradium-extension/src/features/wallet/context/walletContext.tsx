import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface NetworkFilters {
  Bitcoin: boolean;
  Solana: boolean;
  Fradium: boolean;
  Ethereum: boolean;
}

interface NetworkValues {
  "All Networks": number;
  Bitcoin: number;
  Solana: number;
  Fradium: number;
  Ethereum: number;
}

interface WalletContextType {
  // Wallet state
  isLoading: boolean;
  isCreatingWallet: boolean;
  setIsCreatingWallet: (creating: boolean) => void;
  hasConfirmedWallet: boolean;
  setHasConfirmedWallet: (confirmed: boolean) => void;
  
  // Wallet operations
  addAddressToWallet: (network: string, tokenType: string, address: string) => Promise<boolean>;
  
  // Network management
  network: string;
  setNetwork: (network: string) => void;
  networkFilters: NetworkFilters;
  
  // Balance management
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
  networkValues: NetworkValues;
  updateNetworkValues: (values: Partial<NetworkValues>) => void;
  getNetworkValue: (networkName: string) => string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("All Networks");
  const [hideBalance, setHideBalance] = useState(false);
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false);
  const [networkValues, setNetworkValues] = useState<NetworkValues>({
    "All Networks": 0,
    Bitcoin: 0,
    Solana: 0,
    Fradium: 0,
    Ethereum: 0,
  });
  const [networkFilters, setNetworkFilters] = useState<NetworkFilters>({
    Bitcoin: true,
    Solana: true,
    Fradium: true,
    Ethereum: true,
  });

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

  // Minimal implementation: format value for display
  const getNetworkValue = useCallback((networkName: string) => {
    const value = networkValues[networkName as keyof NetworkValues] || 0;
    if (hideBalance) return "••••";
    return `$${value.toFixed(2)}`;
  }, [networkValues, hideBalance]);

  // Minimal implementation: no-op add address, returns false
  const addAddressToWallet = useCallback(async (_network: string, _tokenType: string, _address: string) => {
    console.warn("addAddressToWallet is not implemented in this build");
    return false;
  }, []);


  const walletContextValue = useMemo(
    () => ({
      isLoading,
      isCreatingWallet,
      setIsCreatingWallet,
      hasConfirmedWallet,
      setHasConfirmedWallet,
      addAddressToWallet,
      network,
      setNetwork,
      hideBalance,
      setHideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      networkFilters,
    }),
    [
      isLoading,
      isCreatingWallet,
      hasConfirmedWallet,
      addAddressToWallet,
      network,
      hideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      networkFilters,
    ]
  );

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};