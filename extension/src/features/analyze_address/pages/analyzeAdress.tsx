import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { detectTokenType, TokenType } from "~lib/utils/tokenUtils";
import ProfileHeader from "~components/header";
import NeoButton from "~components/custom-button";
import { CDN } from "~lib/constant/cdn";

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
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill from prior attempt error state
  React.useEffect(() => {
    const priorAddress = (location.state as any)?.address as string | undefined;
    const errorMsg = (location.state as any)?.error as string | undefined;
    if (priorAddress) setAddress(priorAddress);
    if (errorMsg) setAddressError(errorMsg);
  }, [location.state]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationError = validateAddress(address);
    if (validationError) {
      setAddressError(validationError);
      return;
    }
    
    setAddressError('');
    navigate(ROUTES.ANALYZE_PROGRESS, { state: { address, isAnalyzing: true } });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (addressError) {
      setAddressError('');
    }
  };

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Input address here..."
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10 rounded"
            value={address}
            onChange={handleAddressChange}
            disabled={false}
          />
          
          {addressError && (
            <p className="text-red-400 text-xs mt-1 mb-2">{addressError}</p>
          )}

          <NeoButton
            icon={CDN.icons.analyzeAddress}
            disabled={false}
            type="submit"
          >
            Analyze Address
          </NeoButton>
          {false && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
              <p className="text-red-400 text-sm">{}</p>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

export default AnalyzeAddress;