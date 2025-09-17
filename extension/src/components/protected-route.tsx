import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '~lib/context/walletContext';
import { ROUTES } from '~lib/constant/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * 
 * Flow Authentication:
 * 1. User harus login ke Internet Identity terlebih dahulu
 * 2. Jika belum authenticated, redirect ke welcome page
 * 3. Jika sudah authenticated, tampilkan halaman yang diminta
 * 4. Bottom navigation bar hanya muncul jika authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useWallet();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#99E39E] mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to welcome page
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  // If authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
