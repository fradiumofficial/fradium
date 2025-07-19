import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import React, { useState } from "react";
import { analyzeAddress } from "../api/AnalyzeAddressApi";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function AnalyzeAddress() {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiResult = await analyzeAddress(address);
      console.log("API Result:", apiResult);
      navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { state: { result: apiResult, address } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
   <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
    { /* Header Sections */}
    <ProfileHeader />

    { /* Analyze Address Section */}
    <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        {/* 4. Bind the input to the state */}
        <form onSubmit={handleSubmit}>
          <input 
            type="address" 
            name="address" 
            id="address" 
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
          {/* 5. Update the button to call the new handler and reflect loading state */}
          <NeoButton
            icon={AnalyzeAddressIcon}
            disabled={loading || !address}
          >
            {loading ? "Analyzing..." : "Analyze Address"}
          </NeoButton>
          
          {/* 6. Optionally, display any error messages */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
  </div>
  )
}

export default AnalyzeAddress