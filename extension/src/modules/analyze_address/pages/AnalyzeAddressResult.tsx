import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import Wallet from "../../../assets/Wallet.svg";
import NeoButton from "@/components/ui/custom-button";
import { useLocation } from "react-router-dom";
import type { AnalyzeResult } from "../model/AnalyzeAddressModel";
import { useState } from "react";

function AnalyzeAdressResult() {
  const location = useLocation();
  const result = location.state?.result as AnalyzeResult;
  const [isAddressSafe, setIsAddressSafe] = useState<boolean>(result.is_ransomware === false);
  setIsAddressSafe(result.is_ransomware);

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

  // Komponen untuk ikon centang (SVG)
  const CheckIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-green-400" // Warna ikon diatur di sini
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="w-[400px] h-] space-y-4 bg-[#25262B] text-white shadow-md">

      { /* Header Sections */}
      <ProfileHeader
          mainAvatarSrc='https://github.com/shadcn.png'
          mainAvatarFallback='N'
          address={result.address}
        />

      { /* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>
        <SafetyCard confidence={result.confidence} title={"Address"} isSafe={isAddressSafe} />
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Address Details</h1>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">296</p>
              <div className="flex flex-row">
                <img src={Wallet} alt="Wallet" className="w-5 h-5"/>
                <p className="font-normal text-[14px] text-white/60 ps-1">Transactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      { /* Security Checks Passed */}
      <div className="m-4">
        <div className="w-full max-w-md ps-[2px] bg-green-500">
          <div className="bg-gradient-to-r from-[#4A834C] to-[#35373E] bg-slate-800 p-6 mt-[20px]">
            <h2 className="text-[20px] font-semibold mb-4">Security Checks Passed</h2>
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

      { /* Action Button */}
      <div className="p-4">
        <NeoButton icon={Wallet} onClick={() => console.log("Action Button Clicked")}>Complete</NeoButton>  
      </div>
    </div>
  );
}

export default AnalyzeAdressResult