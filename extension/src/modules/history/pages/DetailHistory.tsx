import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useParams } from "react-router-dom";

function DetailHistory() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
      <ProfileHeader
        mainAvatarSrc='https://github.com/shadcn.png'
        mainAvatarFallback='N'
        address='0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H'
      />

      <div className="m-4">
        <h1 className="font-semibold text-[20px] text-white mb-4">Detail History</h1>
        <SafetyCard confidence={96} title={"Address"} />

        {/* Address Name */}
        <div className="flex flex-col mt-4">
          <h1 className="font-semibold text-[16px]">Address</h1>
          <p className="text-[14px] font-normal text-white/50 pt-[4px]">
            0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H {id}
          </p>
        </div>

        {/* Address Detail */}
        <div className="flex flex-col mt-4">
          <h1 className="font-semibold text-[16px] pb-[4px]">Address Detail</h1>
          <div className="flex flex-row space-x-4">
            <p className="w-35 flex font-normal text-[14px] text-white/50">Ransomeware Prob</p>
            <p className="flex-1 text-[#E49B9C] text-[14px] font-medium">0.02348%</p>
          </div>
          <div className="flex flex-row space-x-4">
            <p className="w-35 flex font-normal text-[14px] text-white/50">Confidence Level</p>
            <p className="flex-1 text-white text-[14px] font-medium">HIGH</p>
          </div>
        </div>

        <div className="w-45 h-22 flex items-end">
          <h1 className="text-white/50 font-medium text-[14px]">Reported By: Fradium AI</h1>
        </div>
      </div>
    </div>
  )
}

export default DetailHistory;