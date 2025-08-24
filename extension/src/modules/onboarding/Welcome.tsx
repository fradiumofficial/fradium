import { useState, useEffect } from "react";
import NeoButton from "@/components/ui/custom-button";
import WelcomeCard from "../../assets/welcome_card.svg";
import ArrowRight from "../../assets/arrow_forward.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { loginWithInternetIdentity } from "@/icp/icpAuth";
import { useAuth } from "@/lib/contexts/authContext";
import { useWallet } from "@/lib/contexts/walletContext";

function Welcome() {
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const { userWallet, isLoading: walletLoading, hasConfirmedWallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Auto-redirect if user becomes authenticated and has wallet
  useEffect(() => {
    console.log("Welcome: useEffect - isAuthenticated:", isAuthenticated, "authLoading:", authLoading, "userWallet:", userWallet, "walletLoading:", walletLoading);
    if (!authLoading && !walletLoading && isAuthenticated) {
      if (userWallet && hasConfirmedWallet) {
        // Check if wallet has mock data
        const hasMockData = userWallet.addresses.some(addr => 
          addr.address.includes('Mock') || addr.address.includes('mock')
        );
        
        if (hasMockData) {
          console.log("Welcome: User has wallet with mock data, redirecting to wallet confirmation...");
          navigate(ROUTES.WALLET_CONFIRMATION, { replace: true });
        } else {
          console.log("Welcome: User is authenticated with real wallet, redirecting to home...");
          navigate(ROUTES.HOME, { replace: true });
        }
      } else if (userWallet === null) {
        // User is authenticated but has no wallet - redirect to wallet confirmation
        console.log("Welcome: User is authenticated but has no wallet, redirecting to wallet confirmation...");
        navigate(ROUTES.WALLET_CONFIRMATION, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, userWallet, walletLoading, hasConfirmedWallet, navigate]);

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
        console.log("Welcome: Final navigation - checking wallet status...");
        // The useEffect will handle the appropriate navigation based on wallet status
      }, 1000);
      
    } catch (e) {
      console.error('Welcome: Login failed:', e);
      setMessage(`Authentication failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      
      // Wait a bit and try to check auth state anyway
      setTimeout(async () => {
        console.log("Welcome: Retrying auth check...");
        await checkAuth();
        console.log("Welcome: Retry - isAuthenticated:", isAuthenticated);
        // The useEffect will handle the appropriate navigation based on wallet status
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
    </div>
  );
}

export default Welcome;
