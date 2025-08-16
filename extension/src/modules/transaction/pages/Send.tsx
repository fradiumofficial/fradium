import ProfileHeader from "@/components/ui/header";
import { ChevronLeft, Info } from "lucide-react";
import SendIcon from "../../../../public/assets/send_coin.svg";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";

function Send() {
  const navigate = useNavigate();
  
  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row">
          <ChevronLeft className="w-6 h-6" />
          <h1 className="text-[20px] font-semibold text-white px-[12px]">Send Coin</h1>
        </div>
        <img src={SendIcon} alt="Send" className="w-[120px] h-[120px] right-0 left-0 mx-auto mt-[12px]" />
      </div>

      <div className="flex flex-col px-[24px]">
        <p className="text-[14px] text-white/60 font-normal mb-[6px]">Recipient Address</p>
        <input type="text" placeholder="ex: m1psqxsfsn3efndfm1psqxsfsnfn" className="w-full bg-white/10 border border-white/10 p-2 text-white" />
      </div>

      <div className="flex flex-col px-[24px]">
        <p className="text-[14px] text-white/60 font-normal mb-[6px]">Amount - BTC</p>
        <input type="text" placeholder="0.00" className="w-full bg-white/10 border border-white/10 p-2 text-white" />
      </div>

      <div className="flex flex-col px-[24px] items-center">
        <div className="flex flex-row items-center">
          <p className="text-[12px] text-white/60 font-normal">
            There will be extra steps
          </p>
          <Info className="w-[11px] h-[11px] text-[#99E39E]" />
        </div>
      </div>

      <div className="px-[24px]">
        <NeoButton onClick={() => navigate(ROUTES.ANALYZE_PROGRESS)}>
          Continue
        </NeoButton>
      </div>
    </div>
  )
}

export default Send;