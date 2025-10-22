import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor } from "@dfinity/agent";
import { getInternetIdentityNetwork } from "@/core/lib/canisterUtils";
import { backend } from "declarations/backend";
import { LoginModal } from "@/core/components/auth/login-modal";
import RegisterModal from "@/core/components/auth/register-modal";
import { nft } from "declarations/nft";
import { token } from "declarations/token";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [user, setUser] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginContext, setLoginContext] = useState("general");
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create({
        identityProvider: getInternetIdentityNetwork(),
      });
      setAuthClient(client);
      await updateIdentity(client);
    };
    initAuth();
  }, []);

  const parseMotokoResponse = (response) => {
    // Remove the outer curly braces and split by semicolon
    const content = response.slice(1, -1).trim();
    const parts = content.split(";").map((part) => part.trim());

    const result = {};
    parts.forEach((part) => {
      const [key, value] = part.split("=").map((item) => item.trim());
      // Remove quotes if present
      const cleanValue = value.replace(/^"|"$/g, "");
      result[key] = cleanValue;
    });

    return result;
  };

  const updateIdentity = async (client) => {
    try {
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const newIdentity = client.getIdentity();
        setIdentity(newIdentity);
        Actor.agentOf(backend).replaceIdentity(newIdentity);
        Actor.agentOf(nft).replaceIdentity(newIdentity);
        Actor.agentOf(token).replaceIdentity(newIdentity);
        const userResponse = await backend.getProfile();

        setIsLoading(false);

        if ("Ok" in userResponse) {
          const parsedUser = parseMotokoResponse(userResponse.Ok);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setIsLoading(false);
    }
  };

  const login = async (context = "general", path = "/") => {
    setLoginContext(context);
    setRedirectPath(path);
    setShowLoginModal(true);
  };

  const handleLogin = async () => {
    if (!authClient) return;
    await new Promise((resolve, reject) =>
      authClient.login({
        identityProvider: getInternetIdentityNetwork(),
        onSuccess: resolve,
        onError: reject,
      })
    );
    const newIdentity = authClient.getIdentity();
    await handleLoginSuccess(newIdentity);
  };

  const handleLoginSuccess = async (newIdentity) => {
    setIdentity(newIdentity);
    Actor.agentOf(backend).replaceIdentity(newIdentity);

    const userResponse = await backend.getProfile();

    setShowLoginModal(false);
    setIsLoading(false);

    if ("Ok" in userResponse) {
      const parsedUser = parseMotokoResponse(userResponse.Ok);
      setUser(parsedUser);
      setIsAuthenticated(true);
      window.location.reload();
    } else if ("Err" in userResponse) {
      setShowRegisterModal(true);
    }
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    document.location.reload();
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        handleLogin,
        identity,
        logout,
        isLoading,
        user,
      }}>
      {children}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
      <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} onSuccess={handleRegisterSuccess} />
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
