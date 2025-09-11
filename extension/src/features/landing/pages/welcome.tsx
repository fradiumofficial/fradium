import { CDN } from "~lib/constant/cdn";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import NeoButton from "~components/custom-button";
import { useAuth } from "~lib/context/authContext";

function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();

  console.log("🏠 Welcome: Component mounted/rendered");
  console.log("🏠 Welcome: Auth state - isAuthenticated:", isAuthenticated, "authLoading:", authLoading);

  // Monitor auth state changes
  React.useEffect(() => {
    console.log("🏠 Welcome: Auth state changed - isAuthenticated:", isAuthenticated, "authLoading:", authLoading);

    // If user becomes authenticated while on welcome page, redirect to home
    if (isAuthenticated && !authLoading) {
      console.log("🏠 Welcome: User is authenticated, redirecting to home...");
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async () => {
    console.log("🏠 Welcome: handleLogin called, starting authentication flow");
    setIsLoading(true);
    setMessage("Opening Internet Identity...");
    console.log("🏠 Welcome: Set loading state to true, message: 'Opening Internet Identity...'");

    try {
      console.log("🏠 Welcome: Calling signIn() from AuthContext...");
      await signIn();
      console.log("🏠 Welcome: signIn() completed successfully");

      setMessage("Authenticated. Redirecting...");
      console.log("🏠 Welcome: Set message to 'Authenticated. Redirecting...'");

      console.log("🏠 Welcome: Navigating to home page...");
      navigate(ROUTES.HOME, { replace: true });
      console.log("🏠 Welcome: Navigation completed");

    } catch (err) {
      console.error("🏠 Welcome: Authentication failed:", err);
      setMessage("Authentication failed. Please try again.");
      console.log("🏠 Welcome: Set error message: 'Authentication failed. Please try again.'");
    } finally {
      setIsLoading(false);
      console.log("🏠 Welcome: Set loading state to false");
    }
  }

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md p-[32px]">
      <img src={CDN.images.welcomeCard} alt="welcome" />
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
      
      <NeoButton
        icon={CDN.icons.arrowForward}
        iconPosition="right"
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? message : "Create Wallet"}
      </NeoButton>
    </div>
  );
}

export default Welcome;
