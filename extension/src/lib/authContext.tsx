import React, { createContext, useContext, useState, useEffect } from 'react';
import { readStoredPrincipal, isStoredAuthenticated, clearStoredAuth, getAuthClient } from './icpAuth';

interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  identity: any | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    principal: null,
    identity: null,
    isLoading: true,
  });

  const checkAuth = async () => {
    try {
      console.log('AuthContext: Checking authentication...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // First check localStorage for stored authentication
      const storedAuthenticated = isStoredAuthenticated();
      const storedPrincipal = readStoredPrincipal();
      console.log('AuthContext: Stored authenticated:', storedAuthenticated);
      console.log('AuthContext: Stored principal:', storedPrincipal);
      
      if (storedAuthenticated && storedPrincipal) {
        // Verify with AuthClient using consistent storage
        const client = await getAuthClient();
        const isAuth = await client.isAuthenticated();
        console.log('AuthContext: AuthClient is authenticated:', isAuth);
        
        if (isAuth) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal().toText();
          console.log('AuthContext: Setting authenticated state with principal:', principal);
          
          setAuthState({
            isAuthenticated: true,
            principal,
            identity,
            isLoading: false,
          });
          return;
        } else {
          // AuthClient says not authenticated but localStorage says yes - clear storage
          console.log('AuthContext: Mismatch between localStorage and AuthClient - clearing storage');
          clearStoredAuth();
        }
      }

      // Not authenticated
      console.log('AuthContext: Setting unauthenticated state');
      setAuthState({
        isAuthenticated: false,
        principal: null,
        identity: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('AuthContext: Error checking authentication:', error);
      // Clear potentially corrupted auth state
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        principal: null,
        identity: null,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out...');
      const client = await getAuthClient();
      await client.logout();
      clearStoredAuth();
      
      setAuthState({
        isAuthenticated: false,
        principal: null,
        identity: null,
        isLoading: false,
      });
      
      console.log('AuthContext: Logout completed');
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
      // Force clear state even if logout fails
      clearStoredAuth();
      setAuthState({
        isAuthenticated: false,
        principal: null,
        identity: null,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    checkAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
