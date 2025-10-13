import { useAuth } from "@/core/providers/AuthProvider";
import UnauthorizedPage from "@/pages/SEO/UnauthorizePage";
import { useNavigate, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function AuthGuard({ children, isRedirectToLogin = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !hasShownToast.current) {
      // Mark that we've shown the toast
      hasShownToast.current = true;

      // Dismiss any existing toasts first
      toast.dismiss();

      // Show session expired toast
      toast.error("Your session has expired", {
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

  // Reset toast flag when user becomes authenticated or path changes
  useEffect(() => {
    if (isAuthenticated) hasShownToast.current = false;
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    // Always redirect to home via effect; render nothing meanwhile
    return null;
  }

  return children;
}
