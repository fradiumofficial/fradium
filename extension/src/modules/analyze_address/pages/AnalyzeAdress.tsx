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
      // Immediately navigate to progress page
      navigate(ROUTES.ANALYZE_PROGRESS, { 
        state: { 
          address,
          isAnalyzing: true 
        } 
      });

      // Start the analysis in background
      const apiResult = await analyzeAddress(address);
      console.log("API Result:", apiResult);
      
      // Navigate to result page after analysis is complete
      navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { 
        state: { 
          result: apiResult, 
          address 
        },
        replace: true // Replace progress page in history
      });
    } catch (err) {
      setError((err as Error).message);
      // Navigate back to address form on error
      navigate(ROUTES.FAILED, {
        state: { 
          error: (err as Error).message,
          address 
        },
        replace: true
      });
    } finally {
      setLoading(false);
    }
  }

  return (
   <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
    {/* Header Sections */}
    <ProfileHeader />

    {/* Analyze Address Section */}
    <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

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
          
          <NeoButton
            icon={AnalyzeAddressIcon}
            disabled={loading || !address}
            type="submit"
          >
            {loading ? "Starting Analysis..." : "Analyze Address"}
          </NeoButton>
          
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
  </div>
  )
}

export default AnalyzeAddress