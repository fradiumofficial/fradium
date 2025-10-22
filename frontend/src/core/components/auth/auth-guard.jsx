import { useAuth } from "@/core/providers/auth-provider";
import Unauthorized from "@/pages/SEO/unauthorize-page";
import UnauthorizedPage from "../../../pages/SEO/unauthorize-page";

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <UnauthorizedPage />;
  }

  // If no specific roles are required, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(user?.role);
  if (!hasRequiredRole) {
    return <Unauthorized />;
  }

  return children;
}
