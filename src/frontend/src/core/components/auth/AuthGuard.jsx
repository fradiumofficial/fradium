import { useAuth } from "@/core/providers/AuthProvider";
import UnauthorizedPage from "@/pages/SEO/UnauthorizePage";

export default function AuthGuard({ children, isRedirectToLogin = false }) {
  const { isAuthenticated, handleLogin } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    if (isRedirectToLogin) {
      handleLogin();
    }
    return <UnauthorizedPage />;
  }

  return children;
}
