import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { detectTokenType, TokenType } from "~lib/utils/tokenUtils";
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
    <div className="w-[375px] h-[460px] flex flex-col items-start p-5 gap-7 text-white overflow-y-auto">
      <div className="w-[335px] h-[376px] flex flex-col items-start gap-5">
        {/* Card */}
        <div className="w-[335px] h-[298px] box-border flex flex-col items-start p-3 gap-3 bg-white/2 backdrop-blur-[14.5px] rounded-[24px] self-stretch flex-grow-0">
          {/* Content */}
          <div className="w-[311px] h-[274px] flex flex-col items-start gap-3 self-stretch flex-grow-0">
            {/* Image Placeholder */}
            <div className="w-[311px] h-[79px] relative bg-white/3 rounded-[6.32px] self-stretch flex-grow-0">
              {/* F logo overlay */}
              <div className="absolute w-[110.48px] h-[157.83px] left-[-62.15px] top-[-47.93px] opacity-[0.03] transform rotate-[18.24deg]">
                <div className="absolute w-[98.5px] h-[143.49px] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[18.24deg]">
                  <div className="absolute left-[31.39%] right-[-20.54%] top-[2.38%] bottom-[44.79%] bg-white transform rotate-[18.24deg]"></div>
                  <div className="absolute left-[33.2%] right-[4.1%] top-[32.36%] bottom-[24.83%] bg-white/50 transform rotate-[18.24deg]"></div>
                  <div className="absolute left-[35%] right-[28.76%] top-[62.35%] bottom-[4.87%] bg-white/25 transform rotate-[18.24deg]"></div>
                </div>
              </div>
              {/* Placeholder for image */}
              <div className="absolute w-[67.41px] h-[67.41px] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-600 rounded-full">
                <img src={CDN.icons.searchAnalyze} alt="Analyze Address" className="w-[67.41px] h-[67.41px]" />
              </div>
            </div>

            {/* Title Section */}
            <div className="w-[311px] h-[183px] flex flex-col justify-end items-start p-1 gap-6 self-stretch flex-grow-0">
              {/* Title */}
              <div className="w-[303px] h-[59px] flex flex-col items-start gap-2 self-stretch flex-grow-0">
                <h1 className="w-[303px] h-[19px] font-sans font-semibold text-[16px] leading-[120%] text-center text-white self-stretch flex-grow-0">
                  Analyze Address
                </h1>
                <p className="w-[303px] h-[32px] font-sans font-normal text-[12px] leading-[130%] text-center tracking-[-0.01em] text-white/80 self-stretch flex-grow-0">
                  Check the risk level of a wallet address based on its transaction history and known fraud reports
                </p>
              </div>

              {/* Input Section */}
              <div className="w-[303px] h-[92px] flex flex-col justify-center items-start gap-2 self-stretch flex-grow-0">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="w-[303px] h-[44px] box-border flex flex-col items-start p-[12px_20px] gap-4 bg-white/5 border border-white/10 rounded-[99px] self-stretch flex-grow-0">
                    <input
                      type="text"
                      placeholder="Input address here..."
                      className="w-[263px] h-[20px] font-sans font-normal text-[14px] leading-[140%] text-white/60 bg-transparent border-none outline-none self-stretch flex-grow-0"
                      value={address}
                      onChange={handleAddressChange}
                    />
                  </div>

                  {/* Primary Button */}
                  <button
                    type="submit"
                    disabled={false}
                    className="w-[303px] h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2 self-stretch flex-grow-0"
                  >
                    {/* Icon placeholder */}
                    <div className="w-[20px] h-[20px] relative">
                      <div className="absolute w-[15.14px] h-[17px] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <img src={CDN.icons.policyAlert} alt="Analyze Address" className="w-[15.14px] h-[17px]" />
                      </div>
                    </div>
                    <span className="w-[51px] h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
                      Analyze
                    </span>
                  </button>
                </form>

                {addressError && (
                  <p className="text-red-400 text-xs mt-1 mb-2">{addressError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="w-[335px] h-[58px] box-border flex flex-col items-start p-4 gap-3 bg-gradient-radial from-[#4A834C] via-[#080E17] to-[#080E17] border-l border-[#99E39E] backdrop-blur-[14.5px] rounded-[16px] self-stretch flex-grow-0" style={{background: 'radial-gradient(107.65% 196.43% at -22.63% 50%, #4A834C 0%, #080E17 51.21%, #080E17 100%)'}}>
          <div className="w-[303px] h-[26px] flex flex-col items-start gap-[6px] self-stretch flex-grow-0">
            <div className="w-[303px] h-[26px] flex flex-row items-start gap-2 self-stretch flex-grow-0">
              {/* Info Icon */}
              <div className="w-[20px] h-[20px] relative">
                <div className="absolute left-[9.38%] right-[9.37%] top-[9.38%] bottom-[9.37%]">
                  <img src={CDN.icons.info} alt="Analyze Address" className="w-[25px] h-[25px]" />
                </div>
              </div>
              <p className="w-[275px] h-[26px] font-sans font-normal text-[10px] leading-[130%] text-white/70 self-stretch flex-grow">
                Please enter a valid blockchain wallet address and make sure you input the correct format to receive an accurate analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeAddress;