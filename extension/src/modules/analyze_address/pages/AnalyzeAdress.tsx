import React, { useState } from "react";
import { useAddressAnalysis } from "./hook/useAnalyzeAddressHook"; // Import hook kita
import ProfileHeader from "@/components/ui/header";
import NeoButton from "@/components/ui/custom-button";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";

const isValidAddress = (addr: string): boolean => {
  return addr.trim().length > 10;
};

function AnalyzeAddress() {
  const [address, setAddress] = useState<string>('');
  // Gunakan hook untuk mendapatkan fungsi dan state
  const { startAnalysis, loading, error } = useAddressAnalysis();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidAddress(address)) return;
    
    startAnalysis(address.trim());
  };
  
  const isSubmitDisabled = loading || !isValidAddress(address);

  return (
    <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
          
          <NeoButton
            icon={AnalyzeAddressIcon}
            disabled={isSubmitDisabled}
            type="submit"
          >
            {loading ? "Analysis..." : "Analyze Address"}
          </NeoButton>
          
          {error && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {address && !isValidAddress(address) && (
            <p className="text-yellow-400 text-xs mt-1">
              Please input valid address.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default AnalyzeAddress;