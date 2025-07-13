import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import { useState } from "react";
import { useAnalyzeAddress } from "../hooks/useAnalyzeAddress";

function AnalyzeAddress() {
  const [address, setAddress] = useState("");
  const { isLoading, error, analyze } = useAnalyzeAddress();

  const handleSubmit = () => {
    analyze(address);
  }

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

        {/* 4. Bind the input to the state */}
        <input 
          type="address" 
          name="address" 
          id="address" 
          placeholder="Input address here..."
          className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isLoading}
        />
        {/* 5. Update the button to call the new handler and reflect loading state */}
        <NeoButton 
          icon={AnalyzeAddressIcon} 
          onClick={handleSubmit} 
          disabled={isLoading || !address}
        >
          {isLoading ? "Analyzing..." : "Analyze Address"}
        </NeoButton>
          
        {/* 6. Optionally, display any error messages */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      </div>
  </div>
  )
}

export default AnalyzeAddress