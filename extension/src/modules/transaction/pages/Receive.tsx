import ProfileHeader from "@/components/ui/header";
import { ChevronLeft } from "lucide-react";
import QrCodeIcon from "../../../../public/assets/qr_code.svg";
import CopyIcon from "../../../../public/assets/content_copy.svg";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";

function Receive() {
  const navigate = useNavigate();
  
  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-row items-center px-[24px]">
        <ChevronLeft className="w-6 h-6" />
        <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive Coin</h1>
      </div>

      <div className="flex flex-col px-[24px]">
        {/* Bitcoin */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Bitcoin:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input type="text" placeholder="Input address here..." className="bg-transparent outline-none flex-1"/>
          <div className="flex flex-row gap-[12px]">
            <img src={QrCodeIcon} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CopyIcon} alt="Copy" className="w-5 h-5 cursor-pointer" />
          </div>
        </div>

        {/* Ethereum */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Ethereum:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[16px]">
          <input type="text" placeholder="Input address here..." className="bg-transparent outline-none flex-1"/>
          <div className="flex flex-row gap-[12px]">
            <img src={QrCodeIcon} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CopyIcon} alt="Copy" className="w-5 h-5 cursor-pointer" />
          </div>
        </div>

        {/* Fradium */}
        <h1 className="text-[14px] font-medium text-white mb-[6px]">Fradium:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between mb-[24px]">
          <input type="text" placeholder="Input address here..." className="bg-transparent outline-none flex-1"/>
          <div className="flex flex-row gap-[12px]">
            <img src={QrCodeIcon} alt="QR Code" className="w-5 h-5 cursor-pointer" />
            <img src={CopyIcon} alt="Copy" className="w-5 h-5 cursor-pointer" />
          </div>
        </div>

        <div>
          <NeoButton onClick={() => navigate(ROUTES.HOME)}>
            Done
          </NeoButton>
      </div>
      </div>
    </div>
  )
}

export default Receive;