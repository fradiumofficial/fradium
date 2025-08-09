import NeoButton from "@/components/ui/custom-button";
import WelcomeCard from "../../assets/welcome_card.svg";
import ArrowRight from "../../assets/arrow_forward.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function Welcome() {
  const navigate = useNavigate();
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
      <NeoButton
        icon={ArrowRight}
        iconPosition="right"
        onClick={() => navigate(ROUTES.HOME)}
      >
        Create Wallet
      </NeoButton>
    </div>
  );
}

export default Welcome;
