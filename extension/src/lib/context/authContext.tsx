import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { getInternetIdentityNetwork } from "~lib/utils/utils";

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  principalText: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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

  const STORAGE_KEY_PRINCIPAL = "fradium_principal";

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedPrincipal = localStorage.getItem(STORAGE_KEY_PRINCIPAL);
        if (storedPrincipal) {
          setPrincipalText(storedPrincipal);
          setIsAuthenticated(true);
          return;
        }
        const client = await AuthClient.create({});
        const isAuth = await client.isAuthenticated();
        if (isAuth) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal().toString();
          setPrincipalText(principal);
          setIsAuthenticated(true);
          try { localStorage.setItem(STORAGE_KEY_PRINCIPAL, principal); } catch {}
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
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
    try {
      await chrome.runtime.sendMessage({ type: "LOGOUT" });
    } catch {}
    const client = await AuthClient.create({});
    await client.logout();
    setIsAuthenticated(false);
    setPrincipalText(null);
    try { localStorage.removeItem(STORAGE_KEY_PRINCIPAL); } catch {}
  }, []);

  const value = useMemo(() => ({ isLoading, isAuthenticated, principalText, signIn, signOut }), [isLoading, isAuthenticated, principalText, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
