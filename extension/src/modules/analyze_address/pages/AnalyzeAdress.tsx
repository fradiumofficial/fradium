import React, { useState } from "react";
import { useAddressAnalysis } from "./hook/useAnalyzeAddressHook";
import { detectTokenType, TokenType } from "@/lib/utils/tokenUtils";
import ProfileHeader from "@/components/ui/header";
import NeoButton from "@/components/ui/custom-button";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Enhanced address validation function
const validateAddress = (addr: string): string | null => {
  const trimmedAddr = addr.trim();

  if (!trimmedAddr) {
    return "Address is required";
  }
  
  if (trimmedAddr.length < 10) {
    return "Address is too short";
  }

  const tokenType = detectTokenType(trimmedAddr);
  
  // Additional validation based on token type
  switch (tokenType) {
    case TokenType.BITCOIN:
      if (trimmedAddr.length < 26 || trimmedAddr.length > 62) {
        return "Invalid Bitcoin address format";
      }
      break;

    case TokenType.SOLANA:
      if (trimmedAddr.length < 36 || trimmedAddr.length > 44) {
        return "Invalid Solana address format";
      }
      break;
    case TokenType.UNKNOWN:
      return "Unsupported address format";
    default:
      break;
  }
  
  return null;
};

function AnalyzeAddress() {
  const [address, setAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const { startAnalysis, loading, error } = useAddressAnalysis();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationError = validateAddress(address);
    if (validationError) {
      setAddressError(validationError);
      return;
    }
    
    setAddressError('');
    startAnalysis(address.trim());
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (addressError) {
      setAddressError('');
    }
  };

  const isSubmitDisabled = loading || !!validateAddress(address);

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      <ProfileHeader />

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            Analyze Address
          </h1>
        </div>
      </div>

      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10 rounded"
            value={address}
            onChange={handleAddressChange}
            disabled={loading}
          />
          
          {addressError && (
            <p className="text-red-400 text-xs mt-1 mb-2">{addressError}</p>
          )}

          <NeoButton
            icon={AnalyzeAddressIcon}
            disabled={isSubmitDisabled}
            type="submit"
          >
            {loading ? "Analyzing..." : "Analyze Address"}
          </NeoButton>
          {error && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

export default AnalyzeAddress;