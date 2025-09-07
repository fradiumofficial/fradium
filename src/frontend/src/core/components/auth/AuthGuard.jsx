import { useAuth } from "@/core/providers/AuthProvider";
import UnauthorizedPage from "@/pages/SEO/UnauthorizePage";
import { useNavigate, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function AuthGuard({ children, isRedirectToLogin = false }) {
  const { isAuthenticated, handleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && location.pathname.startsWith("/wallet") && !hasShownToast.current) {
      // Mark that we've shown the toast
      hasShownToast.current = true;

      // Dismiss any existing toasts first
      toast.dismiss();

      // Show session expired toast
      toast.error("Your login session has expired", {
        position: "bottom-center",
        duration: 3000,
        style: {
          background: "#23272F",
          color: "#FF6B6B",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "⏰",
      });

      // Redirect to home page
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Reset toast flag when user becomes authenticated or navigates away from wallet routes
  useEffect(() => {
    if (isAuthenticated || !location.pathname.startsWith("/wallet")) {
      hasShownToast.current = false;
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    // For wallet routes, we handle redirect in useEffect above
    if (location.pathname.startsWith("/wallet")) {
      return null; // Return null while redirecting
    }

    // Redirect to login page if not authenticated (for other routes)
    if (isRedirectToLogin) {
      handleLogin();
    }
    return <UnauthorizedPage />;
  }

  return children;
}
