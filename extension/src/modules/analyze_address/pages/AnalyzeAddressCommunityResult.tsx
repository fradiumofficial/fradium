import NeoButton from "@/components/ui/custom-button";
import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useLocation, useNavigate } from "react-router-dom";
import Wallet from "../../../assets/Wallet.svg";
import { ROUTES } from "@/constants/routes";
import type { CommunityAnalysisResult } from "../model/AnalyzeAddressModel";
import { useEffect, useState } from "react";
import { saveAnalysisToHistory } from "@/lib/localStorage";

export default function AnalyzeAddressCommunityResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as CommunityAnalysisResult;
  const address = location.state?.address as string;

  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (result && address && !isSaved) {
      try {
        saveAnalysisToHistory(address, result, 'community');
        setIsSaved(true);
      } catch (error) {
        console.error('Failed to save community analysis to history:', error);
      }
    }
  }, [result, address, isSaved]);

  if (!result) {
    return (
      <div className="w-[400px] h-full flex items-center justify-center bg-[#25262B] text-white">
        <div className="text-center">
          <p>No analysis result found.</p>
          <button
            onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
            className="mt-2 text-[#99E39E] hover:text-white"
          >
            Analyze Another Address
          </button>
        </div>
      </div>
    );
  }

  const isAddressSafe = result.is_safe;
  const report = result.report?.[0] || null;

  const totalVotes = report ? Number(report.votes_yes) + Number(report.votes_no) : 0;
  const confidenceLevel = report ? (totalVotes > 5 ? "HIGH" : "MEDIUM") : "LOW";
  const confidencePercentage = confidenceLevel === "HIGH" ? 95 : confidenceLevel === "MEDIUM" ? 75 : 50;

  const getSecurityCheckItems = () => {
    if (isAddressSafe) {
      return [
        "No active negative reports found",
        "Address not flagged as malicious by the community",
        "Considered clean in the community database"
      ];
    } else {
      // Menambahkan optional chaining pada 'evidence' dan nilai default '0'
      const evidenceCount = report?.evidence?.length ?? 0;
      
      return [
        `Community flagged as "${report?.category}"`,
        `${report?.votes_yes} users reported suspicious activity`,
        `Evidence provided: ${evidenceCount} items`,
        "High community risk assessment"
      ];
    }
  };

  // --- PERBAIKAN DI SINI ---
  // Mengubah tipe parameter menjadi 'string' untuk mencocokkan model data baru
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    // Menggunakan BigInt untuk konversi yang aman dari string
    const date = new Date(Number(BigInt(timestamp) / 1000000n));
    return date.toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${isAddressSafe ? 'text-green-400' : 'text-red-400'}`}>
      {isAddressSafe ? (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      )}
    </svg>
  );

  return (
    <div className="w-[400px] h-full space-y-4 bg-[#25262B] text-white shadow-md">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="text-[20px] font-semibold mb-4">Analysis Result</h1>
        <div className="bg-white/5 p-3 rounded mb-4">
          <p className="text-sm font-mono break-all">{address}</p>
        </div>
        <SafetyCard 
          confidence={confidencePercentage} 
          title={"Address"} 
          isSafe={isAddressSafe} 
        />
        
        {!isAddressSafe && report && (
          <div className="mt-4 bg-white/5 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Community Report</h3>
            <p className="text-sm text-white/70 mb-3">{report.description}</p>
            <div className="flex justify-between text-xs text-white/60">
              <span>Category: <span className="font-semibold text-white">{report.category}</span></span>
              <span>Reported: <span className="font-semibold text-white">{formatTimestamp(report.created_at)}</span></span>
            </div>
          </div>
        )}

        {!isAddressSafe && report && (
          <>
            <h1 className="text-[20px] font-semibold mt-8 mb-4">Report Metrics</h1>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 text-center rounded">
                <p className="font-medium text-lg">{report.votes_yes}</p>
                <p className="text-sm text-white/60">Suspicious Votes</p>
              </div>
              <div className="bg-white/5 p-4 text-center rounded">
                <p className="font-medium text-lg">{report.votes_no}</p>
                <p className="text-sm text-white/60">Safe Votes</p>
              </div>
            </div>
          </>
        )}
        
        <div className="mt-8">
          <div className={`border-l-4 p-4 ${isAddressSafe ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
            <h2 className="text-lg font-semibold mb-3">
              {isAddressSafe ? 'Community Assessment: Safe' : 'Community Assessment: Risky'}
            </h2>
            <ul className="space-y-2">
              {getSecurityCheckItems().map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon />
                  <span className="ml-2 text-sm text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4">
        <NeoButton icon={Wallet} onClick={() => navigate(ROUTES.HOME)}>
          Complete
        </NeoButton>
      </div>
    </div>
  );
}