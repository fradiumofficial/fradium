import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import React, { useState } from "react";
import { analyzeAddress, analyzeAddressCommunity } from "../api/AnalyzeAddressApi";
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
      console.log('Starting analysis for address:', address);
      
      // Immediately navigate to progress page
      navigate(ROUTES.ANALYZE_PROGRESS, { 
        state: { 
          address,
          isAnalyzing: true,
          step: 'community' // Track current step
        } 
      });

      // Step 1: Community Analysis
      console.log('Step 1: Starting community analysis...');
      let apiCommunityResult;
      
      try {
        apiCommunityResult = await analyzeAddressCommunity(address);
        console.log("Community Analysis Result:", apiCommunityResult);
      } catch (communityError) {
        console.error("Community analysis failed:", communityError);
        // If community analysis fails, continue with ICP analysis
        console.log("Continuing with ICP analysis despite community failure...");
      }

      // Step 2: Check community result
      if (apiCommunityResult) {
        console.log('Community result is_safe:', apiCommunityResult.is_safe);
        
        // If community analysis shows address is NOT SAFE, show community result
        if (apiCommunityResult.is_safe === false) {
          console.log('Address flagged by community, showing community result');
          navigate(ROUTES.ANALYZE_ADDRESS_COMMUNITY_RESULT, {
            state: {
              result: apiCommunityResult,
              address
            },
            replace: true
          });
          return;
        }
      }

      // Step 3: ICP Analysis (if community is safe or failed)
      console.log('Step 2: Starting ICP analysis...');
      const apiResult = await analyzeAddress(address);
      console.log("ICP Analysis Result:", apiResult);

      // Navigate to ICP result page
      navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { 
        state: { 
          result: apiResult, 
          address 
        },
        replace: true
      });

    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Navigate to failed page with error details
      navigate(ROUTES.FAILED, {
        state: { 
          error: errorMessage,
          address 
        },
        replace: true
      });
    } finally {
      setLoading(false);
    }
  }

  // Input validation
  const isValidAddress = (addr: string): boolean => {
    // Basic validation - you can make this more specific based on your needs
    return addr.length > 10 && addr.trim() !== '';
  };

  return (
   <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
    {/* Header Sections */}
    <ProfileHeader />

    {/* Analyze Address Section */}
    <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="address" 
            id="address" 
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
          
          <NeoButton
            icon={AnalyzeAddressIcon}
            disabled={loading || !address || !isValidAddress(address)}
            type="submit"
          >
            {loading ? "Starting Analysis..." : "Analyze Address"}
          </NeoButton>
          
          {error && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Address validation feedback */}
          {address && !isValidAddress(address) && (
            <p className="text-yellow-400 text-xs mt-1">
              Please enter a valid address
            </p>
          )}
        </form>
      </div>
  </div>
  )
}

export default AnalyzeAddress