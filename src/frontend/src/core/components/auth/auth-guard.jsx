import { useAuth } from "@/core/providers/auth-provider";
import UnauthorizedPage from "@/pages/SEO/unauthorize-page";

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <UnauthorizedPage />;
  }

  return children;
}
