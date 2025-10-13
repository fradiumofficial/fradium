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

  // Check if paylink ID route (format: /paylink/xxx where xxx is alphanumeric with dashes)
  const isPaymentLinkRoute = /^\/paylink\/[a-z0-9_-]+$/i.test(location.pathname);

  // Check if current route requires redirect
  // Wallet routes and paylink dashboard (/paylink), but NOT the public payment links (/paylink/:id)
  const requiresRedirect = location.pathname.startsWith("/wallet") || 
                          (location.pathname.startsWith("/paylink") && !isPaymentLinkRoute);

  useEffect(() => {
    if (!isAuthenticated && requiresRedirect && !hasShownToast.current) {
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
  }, [isAuthenticated, requiresRedirect, navigate]);

  // Reset toast flag when user becomes authenticated or navigates away from protected routes
  useEffect(() => {
    if (isAuthenticated || !requiresRedirect) {
      hasShownToast.current = false;
    }
  }, [isAuthenticated, requiresRedirect]);

  if (!isAuthenticated) {
    // For wallet and paylink dashboard routes, we handle redirect in useEffect above
    if (requiresRedirect) {
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