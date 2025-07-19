import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import Wallet from "../../../assets/Wallet.svg";
import NeoButton from "@/components/ui/custom-button";
import { useLocation, useNavigate } from "react-router-dom";
import type { ICPAnalysisResult } from "../model/AnalyzeAddressModel";
import { useState, useEffect } from "react";
import { ROUTES } from "@/constants/routes";

function AnalyzeAdressResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as ICPAnalysisResult;
  const address = location.state?.address as string;
  
  // Inisialisasi state dengan nilai yang benar langsung
  const [isAddressSafe, setIsAddressSafe] = useState<boolean>(() => {
    return result?.is_ransomware === false;
  });

  // Gunakan useEffect untuk update state jika result berubah
  useEffect(() => {
    if (result) {
      setIsAddressSafe(result.is_ransomware === false);
    }
  }, [result]);

  const getSecurityCheckItems = () => {
    if (isAddressSafe) {
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

  // Komponen untuk ikon centang/warning (SVG)
  const CheckIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 ${isAddressSafe ? 'text-green-400' : 'text-red-400'}`}
    >
      {isAddressSafe ? (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );

  // Guard clause untuk menangani case ketika result tidak ada
  if (!result) {
    return (
      <div className="w-[400px] h-full flex items-center justify-center bg-[#25262B] text-white">
        <p>No analysis result found</p>
      </div>
    );
  }

  // Convert confidence level to percentage for display
  const confidencePercentage = Math.round((result.confidence_level === "HIGH" ? 95 : result.confidence_level === "MEDIUM" ? 75 : 50));

  return (
    <div className="w-[400px] h-full space-y-4 bg-[#25262B] text-white shadow-md">

      {/* Header Sections */}
      <ProfileHeader />

      {/* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>
        
        {/* Display analyzed address */}
        <div className="mt-4 bg-white/5 p-3  rounded">
          <p className="text-sm font-mono break-all">{address}</p>
        </div>

        <SafetyCard 
          confidence={confidencePercentage} 
          title={"Address"} 
          isSafe={isAddressSafe} 
        />
        
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Analysis Details</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{result.transactions_analyzed}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Transactions" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Transactions</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{(result.ransomware_probability * 100).toFixed(2)}%</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Risk" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Risk Score</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{result.confidence_level}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Confidence" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Confidence</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{result.threshold_used.toString().substring(0, 4)}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Threshold" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Threshold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Checks */}
      <div className="m-4">
        <div className={`w-full max-w-md ps-[2px] ${isAddressSafe ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className={`bg-gradient-to-r ${isAddressSafe ? 'from-[#4A834C] to-[#35373E]' : 'from-[#8B4A4C] to-[#3E3537]'} bg-slate-800 p-6 mt-[20px]`}>
            <h2 className="text-[20px] font-semibold mb-4">
              {isAddressSafe ? 'Security Checks Passed' : 'Security Warnings'}
            </h2>
            <ul className="list-disc space-y-2">
              {checkItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Analysis Info */}
      {/* <div className="m-4">
        <div className="bg-white/5 p-4 rounded">
          <h3 className="text-[16px] font-semibold mb-2">Analysis Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Address Status:</span>
              <span className={`font-medium ${isAddressSafe ? 'text-green-400' : 'text-red-400'}`}>
                {isAddressSafe ? 'CLEAN' : 'SUSPICIOUS'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Ransomware Probability:</span>
              <span className={`font-medium ${result.ransomware_probability > 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                {(result.ransomware_probability * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Analysis Confidence:</span>
              <span className="font-medium text-white">{result.confidence_level}</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Action Button */}
      <div className="p-4">
        <NeoButton icon={Wallet} onClick={() => navigate(ROUTES.HOME)}>
          Complete
        </NeoButton>  
      </div>
    </div>
  );
}

export default AnalyzeAdressResult;