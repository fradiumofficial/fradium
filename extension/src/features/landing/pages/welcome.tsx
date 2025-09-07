import { ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";
import { ROUTES } from "~lib/constant/routes";
import NeoButton from "~components/custom-button";
import { CDN } from "~lib/constant/cdn";

function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setMessage("Opening Internet Identity...");
    try {
      const client = await AuthClient.create({});
      const windowFeatures = [
        "width=500",
        "height=600",
        "scrollbars=yes",
        "resizable=yes",
        "toolbar=no",
        "menubar=no",
        "location=no",
        "status=no",
        "directories=no"
      ].join(",");

      await new Promise<void>((resolve, reject) =>
        client.login({
          onSuccess: resolve,
          onError: reject,
          windowOpenerFeatures: windowFeatures
        })
      );

      setMessage("Authenticated. Redirecting...");
      navigate(ROUTES.WALLET_CONFIRMATION, { replace: true });
    } catch (err) {
      console.error(err);
      setMessage("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md p-[32px]">
      <img src={CDN.images.welcomeCard} className="pt-[50px]" alt="welcome" />
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
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? "Authenticating..." : "Create Wallet"}
      </NeoButton>
    </div>
  );
}

export default Welcome;
