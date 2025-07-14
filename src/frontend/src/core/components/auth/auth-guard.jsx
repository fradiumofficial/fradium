import { useAuth } from "@/core/providers/auth-provider";
import UnauthorizedPage from "@/pages/SEO/unauthorize-page";

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
