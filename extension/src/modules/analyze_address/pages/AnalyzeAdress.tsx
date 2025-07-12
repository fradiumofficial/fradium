import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function AnalyzeAddress() {
    const navigate = useNavigate();

    return (
     <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
      { /* Header Sections */}
      <ProfileHeader
          mainAvatarSrc='https://github.com/shadcn.png'
          mainAvatarFallback='N'
          address='0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H'
        />
      
      { /* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

          <input 
            type="address" 
            name="address" 
            id="address" 
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10"
          />
          <NeoButton icon={AnalyzeAddressIcon} onClick={() => navigate(ROUTES.ANALYZE_ADDRESS_RESULT)} >Analyze Address</NeoButton>

      </div>

    </div>
    )
}

export default AnalyzeAddress