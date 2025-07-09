import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import Wallet from "../assets/Wallet.svg";
import NeoButton from "@/components/ui/custom-button";

function AnalyzeAdressResult() {
  return (
    <div className="w-[400px] h-[804px] space-y-4 bg-[#25262B] text-white shadow-md">

      { /* Header Sections */}
      <ProfileHeader
          mainAvatarSrc='https://github.com/shadcn.png'
          mainAvatarFallback='N'
          title="Indra's Wallet"
          address='0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H'
          secondaryAvatarSrc='https://github.com/shadcn.png'
          secondaryAvatarFallback='CN'
        />

      { /* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Smart Contract</h1>
        <SafetyCard confidence={100} />
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Address Details</h1>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">296</p>
              <div className="flex flex-row">
                <img src={Wallet} alt="Wallet" className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Transactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NeoButton onClick={() => console.log("hai")}> Complete </NeoButton>
    </div>
  );
}

export default AnalyzeAdressResult