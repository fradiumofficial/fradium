import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { getInternetIdentityNetwork } from "~lib/utils/utils";

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
  isAuthenticated: boolean;
  principalText: string | null;
  isCreatingWallet: boolean;
  setIsCreatingWallet: (creating: boolean) => void;
  hasConfirmedWallet: boolean;
  setHasConfirmedWallet: (confirmed: boolean) => void;
  confirmWallet: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principalText, setPrincipalText] = useState<string | null>(null);
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

  // Persist simple wallet confirmation state in localStorage
  const STORAGE_KEY_HAS_WALLET = "fradium_has_confirmed_wallet";
  const STORAGE_KEY_PRINCIPAL = "fradium_principal";

  // Load persisted state on first mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_HAS_WALLET);
        if (stored) setHasConfirmedWallet(stored === "true");

        const storedPrincipal = localStorage.getItem(STORAGE_KEY_PRINCIPAL);
        if (storedPrincipal) {
          setPrincipalText(storedPrincipal);
          setIsAuthenticated(true);
        } else {
          // Try to restore existing II session
          const client = await AuthClient.create({});
          const isAuth = await client.isAuthenticated();
          if (isAuth) {
            const identity = client.getIdentity();
            const principal = identity.getPrincipal().toString();
            setPrincipalText(principal);
            setIsAuthenticated(true);
            try { localStorage.setItem(STORAGE_KEY_PRINCIPAL, principal); } catch {}
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Helper to confirm/create a wallet locally (can be replaced with canister call)
  const confirmWallet = useCallback(() => {
    setHasConfirmedWallet(true);
    try {
      localStorage.setItem(STORAGE_KEY_HAS_WALLET, "true");
    } catch {
      // ignore storage errors
    }
  }, []);

  const signIn = useCallback(async () => {
    const client = await AuthClient.create({});

    const windowFeatures = [
      "width=500",
      "height=600",
      "scrollbars=yes",
      "resizable=yes",
      "toolbar=no",
      "menubar=no",
      "location=no",
      "status=no",
      "directories=no"
    ].join(",");

    await new Promise<void>((resolve, reject) =>
      client.login({
        identityProvider: getInternetIdentityNetwork() || undefined,
        onSuccess: resolve,
        onError: reject,
        windowOpenerFeatures: windowFeatures
      })
    );
    const identity = client.getIdentity();
    const principal = identity.getPrincipal().toString();
    setPrincipalText(principal);
    setIsAuthenticated(true);
    try { localStorage.setItem(STORAGE_KEY_PRINCIPAL, principal); } catch {}
  }, []);

  const signOut = useCallback(async () => {
    const client = await AuthClient.create({});
    await client.logout();
    setIsAuthenticated(false);
    setPrincipalText(null);
    try { localStorage.removeItem(STORAGE_KEY_PRINCIPAL); } catch {}
  }, []);


  const walletContextValue = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      principalText,
      isCreatingWallet,
      setIsCreatingWallet,
      hasConfirmedWallet,
      setHasConfirmedWallet,
      confirmWallet,
      signIn,
      signOut,
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
      isAuthenticated,
      principalText,
      isCreatingWallet,
      hasConfirmedWallet,
      confirmWallet,
      signIn,
      signOut,
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