import { ArrowRight } from "lucide-react";
import { useState } from "react";
import NeoButton from "~components/custom-button";
import WelcomeCard from "data-base64:../../../assets/welcome_card.svg";

function Welcome() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        onClick={() => {}}
        disabled={isLoading}
      >
        {isLoading ? "Authenticating..." : "Create Wallet"}
      </NeoButton>
    </div>
  );
}

export default Welcome;
