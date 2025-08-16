import ProfileHeader from "@/components/ui/header";
import { ChevronLeft } from "lucide-react";
import SendIcon from "../../../../public/assets/send_coin.svg";

function Send() {
  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-row items-center px-[24px]">
        <ChevronLeft className="w-6 h-6" />
        <h1 className="text-[20px] font-semibold text-white px-[12px]">Send Coin</h1>
        <img src={SendIcon} alt="Send" className="w-[120px] h-[120px]absolute right-0" />
      </div>
    </div>
  )
}

export default Send;