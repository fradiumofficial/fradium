import { useState, useEffect } from "react";
import { X, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/core/providers/auth-provider";

export function LoginModal({ isOpen, onClose, redirectPath = "/" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // null, 'success', 'error'
  const [isVisible, setIsVisible] = useState(false);
  const { handleLogin: authHandleLogin } = useAuth();

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Match this with CSS transition duration
    }
  }, [isOpen]);

  // Reset status when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setStatus(null), 300);
    }
  }, [isOpen]);

  const handleLogin = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      await authHandleLogin();
      setIsLoading(false);
    } catch (error) {
      console.error("Login error:", error);
      setStatus("error");
      setIsLoading(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0", isVisible ? "visible" : "invisible")}>
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        style={{
          transition: "backdrop-filter 300ms ease-out, background-color 300ms ease-out",
        }}
      />

      {/* Modal content */}
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ duration: 0.3 }} className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="mb-2 flex items-center justify-center">
            <Shield className="mr-2 h-6 w-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">Login to Lumora</h2>
          </div>

          <p className="text-center text-muted-foreground">Connect with Internet Identity to access your account, track your eco-actions, and earn rewards.</p>

          {status === "success" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full items-center justify-center rounded-md bg-emerald-500/10 p-3 text-emerald-500">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span>Login successful! Redirecting...</span>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full items-center justify-center rounded-md bg-red-500/10 p-3 text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>Authentication failed. Please try again.</span>
            </motion.div>
          )}

          <div className={cn("mt-4 w-full rounded-lg border border-border/50 p-4 transition-all", "hover:border-emerald-500/50 hover:bg-emerald-500/5", status === "error" ? "border-red-500/30" : "", isLoading ? "opacity-80" : "")}>
            <button className="flex w-full items-center justify-center" onClick={handleLogin} disabled={isLoading || status === "success"}>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 overflow-hidden rounded-full border flex items-center justify-center">
                  <img src="/images/internet-identity.png" alt="Internet Identity" width={40} height={40} className="object-center" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Internet Identity</div>
                  <div className="text-xs text-muted-foreground">Secure authentication for the Internet Computer</div>
                </div>
              </div>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              ) : (
                <div className="rounded-full bg-emerald-500/10 p-1">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
