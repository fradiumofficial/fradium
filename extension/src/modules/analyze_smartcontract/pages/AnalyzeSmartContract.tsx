import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeSmartContractIcon from "../../../assets/analyze_contract.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function AnalyzeSmartContract() {
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
      <h1 className="text-[20px] font-semibold">Analyze Smart Contract</h1>
      <textarea
        name="smartcontract" 
        id="smartcontract" 
        placeholder="Input address here..."
        className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10"
      />
      <NeoButton icon={AnalyzeSmartContractIcon} onClick={() => navigate(ROUTES.ANALYZE_SMART_CONTRACT_RESULT)} >Analyze Smart Contract</NeoButton>
    </div>
  </div>
  )
}

export default AnalyzeSmartContract