import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { getInternetIdentityNetwork } from "~lib/utils/utils";

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  principalText: string | null;
  user: any | null;
  identity: any | null;
  authClient: AuthClient | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [identity, setIdentity] = useState<any | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  const STORAGE_KEY_PRINCIPAL = "fradium_principal";

  // Use provided identity provider or default
  const getIdentityProvider = useCallback(() => {
    return getInternetIdentityNetwork();
  }, []);

  // Update identity function (similar to AuthProvider.jsx)
  const updateIdentity = useCallback(async (client: AuthClient) => {
    try {
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const newIdentity = client.getIdentity();
        setIdentity(newIdentity);
        const principal = newIdentity.getPrincipal().toString();
        setPrincipalText(principal);
        
        setIsLoading(true);
        
        // For extension, we don't have profile function, so just set user to null
        setUser(null);
        setIsAuthenticated(true);
        
        setIsLoading(false);
        
        // Store principal in localStorage
        try { 
          localStorage.setItem(STORAGE_KEY_PRINCIPAL, principal); 
        } catch {}
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check localStorage first
        const storedPrincipal = localStorage.getItem(STORAGE_KEY_PRINCIPAL);
        if (storedPrincipal) {
          setPrincipalText(storedPrincipal);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Initialize AuthClient
        const client = await AuthClient.create({});
        setAuthClient(client);
        await updateIdentity(client);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setIsLoading(false);
      }
    };
    initAuth();
  }, [updateIdentity]);

  const signIn = useCallback(async () => {
    if (!authClient) {
      // Create new client if not available
      const client = await AuthClient.create({});
      setAuthClient(client);
    }

    const currentClient = authClient || await AuthClient.create({});

    // Konfigurasi untuk membuka window baru, bukan tab (same as AuthProvider.jsx)
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
      currentClient.login({
        identityProvider: getIdentityProvider(),
        onSuccess: resolve,
        onError: reject,
        windowOpenerFeatures: windowFeatures
      })
    );
    
    const newIdentity = currentClient.getIdentity();
    await handleLoginSuccess(newIdentity);
  }, [authClient, getIdentityProvider]);

  // Handle login success (similar to AuthProvider.jsx)
  const handleLoginSuccess = useCallback(async (newIdentity: any) => {
    console.log("AuthContext: Login success, setting identity:", newIdentity.getPrincipal().toString());
    
    setIdentity(newIdentity);
    const principal = newIdentity.getPrincipal().toString();
    setPrincipalText(principal);
    
    setIsLoading(true);
    
    // For extension, we don't have profile function, so just set user to null
    setUser(null);
    setIsAuthenticated(true);
    
    setIsLoading(false);
    
    // Store principal in localStorage
    try { 
      localStorage.setItem(STORAGE_KEY_PRINCIPAL, principal); 
      console.log("AuthContext: Principal stored in localStorage:", principal);
    } catch (error) {
      console.error("AuthContext: Failed to store principal in localStorage:", error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // For extension, we don't have profile function, so just refresh identity
      if (authClient) {
        const isAuth = await authClient.isAuthenticated();
        if (isAuth) {
          const newIdentity = authClient.getIdentity();
          setIdentity(newIdentity);
          const principal = newIdentity.getPrincipal().toString();
          setPrincipalText(principal);
        } else {
          // User is no longer authenticated
          setIsAuthenticated(false);
          setPrincipalText(null);
          setIdentity(null);
          setUser(null);
          try { localStorage.removeItem(STORAGE_KEY_PRINCIPAL); } catch {}
        }
      }
    } catch (err) {
      console.error("User refresh error:", err);
      // On error, assume user is no longer authenticated
      setIsAuthenticated(false);
      setPrincipalText(null);
      setIdentity(null);
      setUser(null);
      try { localStorage.removeItem(STORAGE_KEY_PRINCIPAL); } catch {}
    }
  }, [isAuthenticated, authClient]);

  const signOut = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: "LOGOUT" });
    } catch {}
    
    if (authClient) {
      await authClient.logout();
    } else {
      const client = await AuthClient.create({});
      await client.logout();
    }
    
    setIsAuthenticated(false);
    setPrincipalText(null);
    setIdentity(null);
    setUser(null);
    setAuthClient(null);
    
    try { 
      localStorage.removeItem(STORAGE_KEY_PRINCIPAL); 
    } catch {}
  }, [authClient]);

  const value = useMemo(() => ({ 
    isLoading, 
    isAuthenticated, 
    principalText, 
    user, 
    identity, 
    authClient, 
    signIn, 
    signOut, 
    refreshUser 
  }), [isLoading, isAuthenticated, principalText, user, identity, authClient, signIn, signOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
