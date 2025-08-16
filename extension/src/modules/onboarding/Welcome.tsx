import { useState, useEffect } from "react";
import NeoButton from "@/components/ui/custom-button";
import WelcomeCard from "../../assets/welcome_card.svg";
import ArrowRight from "../../assets/arrow_forward.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { loginWithInternetIdentity, resetAuthState } from "@/lib/icpAuth";
import { useAuth } from "@/lib/authContext";

function Welcome() {
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Auto-redirect if user becomes authenticated
  useEffect(() => {
    console.log("Welcome: useEffect - isAuthenticated:", isAuthenticated, "authLoading:", authLoading);
    if (!authLoading && isAuthenticated) {
      console.log("Welcome: User is authenticated, redirecting to home...");
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      setMessage("Opening Internet Identity...");
      
      console.log("Welcome: Starting authentication...");
      await loginWithInternetIdentity();
      
      setMessage("Authentication successful! Checking status...");
      console.log("Welcome: Authentication completed, checking auth state...");
      
      // Refresh auth state after login
      await checkAuth();
      
      setMessage("Redirecting to home...");
      console.log("Welcome: Auth state refreshed");
      console.log("Welcome: Current isAuthenticated:", isAuthenticated);
      console.log("Welcome: Navigating to home...");
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        console.log("Welcome: Final navigation to HOME");
        navigate(ROUTES.HOME);
      }, 500);
      
    } catch (e) {
      console.error('Welcome: Login failed:', e);
      setMessage(`Authentication failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      
      // Wait a bit and try to check auth state anyway
      setTimeout(async () => {
        console.log("Welcome: Retrying auth check...");
        await checkAuth();
        console.log("Welcome: Retry - isAuthenticated:", isAuthenticated);
        navigate(ROUTES.HOME);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md p-[32px]">
      <img src={WelcomeCard} className="pt-[50px]" alt="welcome" />
      <h1 className="text-[20px] font-bold text-center mx-[50px]">
        Step Into Safer Web3 with Fradium
      </h1>
      <p className="text-[12px] text-center tracking-wide font-normal text-white/70">
        Create or connect your wallet to unlock real-time scam protection,
        AI-powered risk scoring, and smart contract insights right from your
        browser
      </p>
      <p className="text-[12px] text-center font-normal tracking-wide text-white/70">
        Start your safer crypto interactions with Fradium
      </p>
      
      {/* Status Message */}
      {message && (
        <div className="text-center p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-blue-200 text-xs">{message}</p>
        </div>
      )}
      
      <NeoButton
        icon={isLoading ? undefined : ArrowRight}
        iconPosition="right"
        onClick={handleCreateWallet}
        disabled={isLoading}
      >
        {isLoading ? "Authenticating..." : "Create Wallet"}
      </NeoButton>
      
      {/* Debug button for testing */}
      <div className="flex space-x-2">
        <button
          onClick={async () => {
            await resetAuthState();
            await checkAuth();
            setMessage("Authentication state reset");
          }}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
        >
          Reset Auth (Debug)
        </button>
        <button
          onClick={() => {
            console.log("Debug - isAuthenticated:", isAuthenticated);
            console.log("Debug - authLoading:", authLoading);
            navigate(ROUTES.HOME);
          }}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
        >
          Force Home
        </button>
      </div>
    </div>
  );
}

export default Welcome;
