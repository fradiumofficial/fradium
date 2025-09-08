import { CDN } from "~lib/constant/cdn";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import NeoButton from "~components/custom-button";
import { useAuth } from "~lib/context/authContext";
import { CANISTERS } from "~config/canisters";

function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signIn } = useAuth();

  const handleLogin = async () => {
    console.log('hahaha anj', process.env.PLASMO_PUBLIC_CANISTER_ID_WALLET)
    console.log('hahaha ababa', CANISTERS.wallet)
    setIsLoading(true)
    setMessage("Opening Internet Identity...")
    try {
      await signIn()
      setMessage("Authenticated. Redirecting...")
      navigate(ROUTES.WALLET_CONFIRMATION, { replace: true })

    } catch (err) {
      console.error(err)
      setMessage("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
