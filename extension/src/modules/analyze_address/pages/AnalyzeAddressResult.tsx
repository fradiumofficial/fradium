import { SafetyCard, DangerCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import Wallet from "../../../assets/Wallet.svg";
import NeoButton from "@/components/ui/custom-button";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import type { AnalysisResult } from "../model/AnalyzeAddressModel";

function AnalyzeAddressResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as AnalysisResult;

  // If no result data, show error and redirect
  if (!result) {
    return (
      <div className="w-[400px] h-[570px] bg-[#25262B] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">No analysis result found</p>
          <NeoButton onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}>
            Go Back
          </NeoButton>
        </div>
      </div>
    );
  }

  // Determine if address is safe or dangerous
  const isSafeAddress = result.confidence_level.toLowerCase() === 'HIGH' ? true : false;

  // Komponen untuk ikon centang (SVG)
  const CheckIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-green-400"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Komponen untuk ikon warning (SVG)
  const WarningIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-red-400"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Data untuk item pemeriksaan keamanan berdasarkan hasil analisis
  const getSecurityCheckItems = () => {
    if (isSafeAddress) {
      return [
        "No suspicious transaction patterns detected",
        "Transaction volume within normal range",
        "No connections to known malicious addresses",
        "Address activity appears legitimate"
      ];
    } else {
      return [
        "Suspicious transaction patterns detected",
        "High risk score indicates potential threats",
        "Unusual transaction behavior identified",
        "Exercise caution with this address"
      ];
    }
  };

  const checkItems = getSecurityCheckItems();

  // Detail metrics dari hasil analisis
  const getDetailMetrics = () => [
    {
      value: result.transactions_analyzed,
      label: "Transactions",
      icon: Wallet
    },
    {
      value: `${result.confidence_level}%`,
      label: "Confidence",
      icon: Wallet
    },
  ];

  const detailMetrics = getDetailMetrics();

  return (
    <div className="w-[400px] h-[804px] space-y-4 bg-[#25262B] text-white shadow-md">
      {/* Header Sections */}
      <ProfileHeader
        mainAvatarSrc="https://github.com/shadcn.png"
        mainAvatarFallback="N"
        address={result.address}
      />

      {/* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analysis Result</h1>
        
        {/* Safety/Danger Card based on analysis result */}
        {isSafeAddress ? (
          <SafetyCard confidence={result.confidence_level} title="Address" />
        ) : (
          <DangerCard confidence={result.confidence_level} />
        )}

        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Address Details</h1>
        
        {/* Analysis Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {detailMetrics.map((metric, index) => (
            <div key={index} className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{metric.value}</p>
              <div className="flex flex-row">
                <img src={metric.icon} alt={metric.label} className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Checks Section */}
      <div className="m-4">
        <div className={`w-full max-w-md ps-[2px] ${isSafeAddress ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className={`${isSafeAddress
            ? 'bg-gradient-to-r from-[#4A834C] to-[#35373E]' 
            : 'bg-gradient-to-r from-[#834A4A] to-[#3E3535]'
          } bg-slate-800 p-6 mt-[20px]`}>
            <h2 className="text-[20px] font-semibold mb-4">
              {isSafeAddress ? 'Security Checks Passed' : 'Security Warnings'}
            </h2>
            <ul className="list-disc space-y-2">
              {checkItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  {isSafeAddress ? <CheckIcon /> : <WarningIcon />}
                  <span className="ml-2 text-[14px]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Analysis Details */}
      <div className="m-4">
        <div className="bg-white/5 p-4 rounded">
          <h3 className="text-[16px] font-semibold mb-2">Technical Details</h3>
          <div className="text-[14px] text-white/80 space-y-1">
            <p>Risk Level: <span className={isSafeAddress ? 'text-green-400' : 'text-red-400'}>{result.confidence_level}</span></p>
            <p>Threshold: {result.threshold_used.toFixed(3)}</p>
            <p>Features Analyzed: {result.features?.length || 0}</p>
            <p>Analysis Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="m-4">
        <NeoButton 
          icon={Wallet} 
          onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
        >
          Analyze Another Address
        </NeoButton>  
      </div>
    </div>
  );
}

export default AnalyzeAddressResult;