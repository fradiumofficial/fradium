import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor } from "@dfinity/agent";
import { getInternetIdentityNetwork } from "@/core/lib/canisterUtils";

const AuthContext = createContext();

export const AuthProvider = ({
  children,
  canisters = {}, // Object of canister instances
  onLoginSuccess = null, // Custom login success handler
  onLogout = null, // Custom logout handler
  redirectAfterLogin = null, // Default redirect after login
  redirectAfterLogout = null, // Default redirect after logout
  getProfileFunction = null, // Function to get user profile
  identityProvider = null, // Custom identity provider
}) => {
  const [authClient, setAuthClient] = useState(null);
  const [user, setUser] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use provided identity provider or default
  const getIdentityProvider = () => {
    return identityProvider || getInternetIdentityNetwork();
  };

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create({
        identityProvider: getIdentityProvider(),
      });
      setAuthClient(client);
      await updateIdentity(client);
    };
    initAuth();
  }, []);

  const updateIdentity = async (client) => {
    try {
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const newIdentity = client.getIdentity();
        setIdentity(newIdentity);

        // Update identity for all provided canisters
        Object.values(canisters).forEach((canister) => {
          if (canister && Actor.agentOf(canister)) {
            Actor.agentOf(canister).replaceIdentity(newIdentity);
          }
        });

        setIsLoading(true);

        // Use custom profile function if provided
        if (getProfileFunction) {
          try {
            const userResponse = await getProfileFunction();
            setUser(userResponse);
            setIsAuthenticated(true);
          } catch (err) {
            console.error("Profile fetch error:", err);
            setIsAuthenticated(true);
            setUser(null);
          }
        } else {
          setIsAuthenticated(true);
          setUser(null);
        }

        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setIsLoading(false);
    }
  };

  const handleLogin = async (customLoginSuccessHandler = null) => {
    if (!authClient) return;

    // Konfigurasi untuk membuka window baru, bukan tab
    const windowFeatures = ["width=500", "height=600", "scrollbars=yes", "resizable=yes", "toolbar=no", "menubar=no", "location=no", "status=no", "directories=no"].join(",");

    await new Promise((resolve, reject) =>
      authClient.login({
        identityProvider: getIdentityProvider(),
        onSuccess: resolve,
        onError: reject,
        windowOpenerFeatures: windowFeatures,
      })
    );
    const newIdentity = authClient.getIdentity();
    await handleLoginSuccess(newIdentity, customLoginSuccessHandler);
  };

  const handleLoginSuccess = async (newIdentity, customLoginSuccessHandler = null) => {
    setIdentity(newIdentity);

    // Update identity for all provided canisters
    Object.values(canisters).forEach((canister) => {
      if (canister && Actor.agentOf(canister)) {
        Actor.agentOf(canister).replaceIdentity(newIdentity);
      }
    });

    setIsLoading(true);

    // Use custom profile function if provided
    if (getProfileFunction) {
      try {
        const userResponse = await getProfileFunction();
        if (userResponse && "Ok" in userResponse) {
          setIsAuthenticated(true);
          setUser(userResponse.Ok);
        } else if (userResponse && "Err" in userResponse) {
          console.error("Error getting profile:", userResponse.Err);
          setIsAuthenticated(true);
          setUser(null);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setIsAuthenticated(true);
        setUser(null);
      }
    } else {
      setIsAuthenticated(true);
      setUser(null);
    }

    setIsLoading(false);

    // Use custom login success handler or default redirect
    if (customLoginSuccessHandler) {
      customLoginSuccessHandler({ user, isAuthenticated: true });
    } else if (onLoginSuccess) {
      onLoginSuccess({ user, isAuthenticated: true });
    } else {
      if (redirectAfterLogin) {
        window.open(redirectAfterLogin, "_blank");
      } else {
        // Jika tidak ada redirectAfterLogin, tidak reload halaman
        // Biarkan user tetap di halaman yang sama
      }
    }
  };

  const refreshUser = async () => {
    if (!isAuthenticated || !getProfileFunction) return;

    try {
      const userResponse = await getProfileFunction();
      if (userResponse && "Ok" in userResponse) {
        setUser(userResponse.Ok);
      } else if (userResponse && "Err" in userResponse) {
        console.error("Error refreshing profile:", userResponse.Err);
        setUser(null);
      }
    } catch (err) {
      console.error("Profile refresh error:", err);
      setUser(null);
    }
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);

    // Use custom logout handler or default redirect
    if (onLogout) {
      onLogout();
    } else {
      if (redirectAfterLogout) {
        document.location.href = redirectAfterLogout;
      } else {
        window.location.reload();
      }
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        handleLogin,
        identity,
        logout,
        isLoading,
        user,
        authClient,
        canisters, // Expose canisters for use in components
        refreshUser, // Add refreshUser function
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
