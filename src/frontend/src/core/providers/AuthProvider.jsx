import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor } from "@dfinity/agent";
import { getInternetIdentityNetwork } from "@/core/lib/canisterUtils";

const AuthContext = createContext();

export const AuthProvider = ({
  children,
  canisters = {},
  onLoginSuccess = null,
  onLogout = null,
  redirectAfterLogin = null,
  redirectAfterLogout = null,
  getProfileFunction = null,
  identityProvider = null,
}) => {
  const [authClient, setAuthClient] = useState(null);
  const [user, setUser] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getIdentityProvider = () => {
    return identityProvider || getInternetIdentityNetwork();
  };

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create({
        identityProvider: getIdentityProvider(),
      });
      window.authClient = client;
      setAuthClient(client);
      await updateIdentity(client);
    };
    initAuth();
  }, []);

  // ✅ NEW: Helper function to initialize swap service with retry
  const initializeSwapService = async (newIdentity, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      if (window.swapService && window.swapService.reinitializeAgent) {
        try {
          console.log(`🔄 Attempt ${i + 1}: Initializing swap service with identity...`);
          await window.swapService.reinitializeAgent(newIdentity);
          
          // ✅ FIXED: Check if identity was stored properly
          const storedIdentity = window.swapService.getIdentity?.();
          const principal = storedIdentity?.getPrincipal()?.toString();
          
          if (principal) {
            console.log("✅ Swap service initialized with principal:", principal);
            return true;
          } else {
            console.warn(`⚠️ Attempt ${i + 1}: No principal found after init`);
          }
        } catch (err) {
          console.error(`❌ Attempt ${i + 1} failed:`, err);
        }
      } else {
        console.warn(`⚠️ Attempt ${i + 1}: swapService not ready yet, waiting...`);
      }
      
      // Wait before retry (100ms, 200ms, 400ms)
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
    }
    
    console.error("❌ Failed to initialize swap service after all retries");
    return false;
  };

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

        // ✅ FIXED: Initialize swap service with retry logic
        await initializeSwapService(newIdentity);

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

    await new Promise((resolve, reject) => {
      const loginOptions = {
        identityProvider: getIdentityProvider(),
        onSuccess: resolve,
        onError: reject,
        windowOpenerFeatures: windowFeatures,
      };

      if (process.env.DFX_NETWORK === "ic") {
        loginOptions.derivationOrigin = "https://t4sse-tyaaa-aaaae-qfduq-cai.icp0.io";
      }

      authClient.login(loginOptions);
    });
    
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

    // ✅ FIXED: Initialize swap service with retry logic
    await initializeSwapService(newIdentity);

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

  const logout = async (url = null) => {
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIdentity(null);

    // Use custom logout handler or default redirect
    if (onLogout) {
      onLogout();
    } else {
      if (url) {
        document.location.href = url;
      } else if (redirectAfterLogout) {
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
        canisters,
        refreshUser,
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