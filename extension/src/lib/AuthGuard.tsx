import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/authContext';
import { ROUTES } from '@/constants/routes';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AuthGuard: isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'pathname:', location.pathname);
    
    if (!isLoading) {
      // If user is not authenticated and not on welcome page, redirect to welcome
      if (!isAuthenticated && location.pathname !== ROUTES.WELCOME) {
        console.log(`AuthGuard: Redirecting to Welcome - Not authenticated and not on welcome page`);
        navigate(ROUTES.WELCOME, { replace: true });
      }
      // If user is authenticated and on welcome page, redirect to home
      if (isAuthenticated && location.pathname === ROUTES.WELCOME) {
        console.log(`AuthGuard: Redirecting to Home - Authenticated but on welcome page`);
        navigate(ROUTES.HOME, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#9BE4A0] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
