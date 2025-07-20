import NeoButton from "@/components/ui/custom-button";
import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import { useLocation, useNavigate } from "react-router-dom";
import Wallet from "../../../assets/Wallet.svg";
import { ROUTES } from "@/constants/routes";
import type { ICPAnalysisCommunityResult } from "../model/AnalyzeAddressModel";
import { useEffect, useState } from "react";
import { 
  getSafetyReport, 
  calculateRiskScore,
  formatReportDate,
  isReportExpired,
} from "../model/AnalyzeAddressModel";
import { saveAnalysisToHistory } from "@/lib/localStorage";

export default function AnalyzeAddressCommunityResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as ICPAnalysisCommunityResult;
  const address = location.state?.address as string;

  const [isAddressSafe, setIsAddressSafe] = useState<boolean>(() => {
    return result?.is_safe === true;
  });
  
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [safetyReport, setSafetyReport] = useState<any>(null);

  // Gunakan useEffect untuk update state jika result berubah
  useEffect(() => {
    if (result) {
      setIsAddressSafe(result.is_safe === true);
      
      // Generate safety report using helper function
      const report = getSafetyReport(result);
      setSafetyReport(report);
    }
  }, [result]);

  // Auto-save to history when component mounts
  useEffect(() => {
    if (result && address && !isSaved) {
      try {
        const historyItem = saveAnalysisToHistory(address, result, 'community');
        setIsSaved(true);
        console.log('Community analysis saved to history:', historyItem);
      } catch (error) {
        console.error('Failed to save community analysis to history:', error);
      }
    }
  }, [result, address, isSaved]);

  const getSecurityCheckItems = () => {
    if (!result.report) {
      return isAddressSafe ? [
        "No community reports found",
        "Address not flagged by users",
        "No suspicious activity reported",
        "Address appears clean in community database"
      ] : [
        "Address status unknown",
        "Limited community data available",
        "Exercise standard caution",
        "Consider additional verification"
      ];
    }

    const report = result.report;
    if (isAddressSafe) {
      return [
        "Community has verified this address",
        `Reported as ${report.category} but votes indicate safe`,
        `${report.votes_no} users voted this as safe`,
        "Low community risk assessment"
      ];
    } else {
      return [
        `Community flagged as ${report.category}`,
        `${report.votes_yes} users reported suspicious activity`,
        `Evidence provided: ${report.evidence.length} items`,
        "High community risk assessment"
      ];
    }
  };

  // Komponen untuk ikon centang/warning
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
        <div className="text-center">
          <p>No community analysis result found</p>
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

  // Calculate metrics for display
  const report = result.report;
  const totalReports = report ? 1 : 0;
  const riskScore = report ? calculateRiskScore(report) : 0;
  const confidenceLevel = report ? (report.votes_yes + report.votes_no > 5 ? "HIGH" : "MEDIUM") : "LOW";
  const totalVotes = report ? report.votes_yes + report.votes_no : 0;
  const confidencePercentage = confidenceLevel === "HIGH" ? 95 : confidenceLevel === "MEDIUM" ? 75 : 50;

  const handleComplete = () => {
    navigate(ROUTES.HOME);
  };

  const handleViewHistory = () => {
    navigate(ROUTES.HISTORY);
  };

  return (
    <div className="w-[400px] h-full space-y-4 bg-[#25262B] text-white shadow-md">
      {/* Header Sections */}
      <ProfileHeader />

      {/* Analyze Address Section */}
      <div className="m-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[20px] font-semibold">Community Analysis</h1>
          {isSaved && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              ✓ Saved
            </span>
          )}
        </div>
        
        {/* Display analyzed address */}
        <div className="mt-4 bg-white/5 p-3 rounded">
          <p className="text-sm font-mono break-all">{address}</p>
        </div>

        <SafetyCard 
          confidence={confidencePercentage} 
          title={"Address"} 
          isSafe={isAddressSafe} 
        />
        
        {/* Show community report details if available */}
        {report && (
          <div className="mt-4 bg-white/5 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Community Report</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                report.category === 'scam' || report.category === 'phishing' || report.category === 'ransomware' 
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {report.category.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-white/70 mb-2">{report.description}</p>
            <div className="flex justify-between text-xs text-white/60">
              <span>Chain: {report.chain}</span>
              <span>Reported: {formatReportDate(report.created_at)}</span>
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Report ID: {report.report_id}</span>
              <span className={isReportExpired(report) ? 'text-red-400' : 'text-green-400'}>
                {isReportExpired(report) ? 'Voting Ended' : 'Voting Active'}
              </span>
            </div>
          </div>
        )}
        
        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Analysis Details</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{totalReports}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Reports" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Reports</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{riskScore.toFixed(1)}%</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Risk" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Risk Score</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{confidenceLevel}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Confidence" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Confidence</p>
            </div>
          </div>
          
          <div className="bg-white/5 flex-1 items-center gap-2 p-4">
            <p className="font-medium text-[18px] pb-2">{totalVotes}</p>
            <div className="flex flex-row">
              <img src={Wallet} alt="Votes" className="w-5 h-5"/>
              <p className="font-normal text-[14px] text-white/60 ps-1">Total Votes</p>
            </div>
          </div>
        </div>

        {/* Voting breakdown if report exists */}
        {report && totalVotes > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
              <div className="text-center">
                <p className="text-red-400 font-semibold text-lg">{report.votes_yes}</p>
                <p className="text-xs text-white/60">Suspicious Votes</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
              <div className="text-center">
                <p className="text-green-400 font-semibold text-lg">{report.votes_no}</p>
                <p className="text-xs text-white/60">Safe Votes</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Checks */}
      <div className="m-4">
        <div className={`w-full max-w-md ps-[2px] ${isAddressSafe ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className={`bg-gradient-to-r ${isAddressSafe ? 'from-[#4A834C] to-[#35373E]' : 'from-[#8B4A4C] to-[#3E3537]'} bg-slate-800 p-6 mt-[20px]`}>
            <h2 className="text-[20px] font-semibold mb-4">
              {isAddressSafe ? 'Community Assessment: Safe' : 'Community Assessment: Risky'}
            </h2>
            <ul className="list-disc space-y-2">
              {getSecurityCheckItems().map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <NeoButton icon={Wallet} onClick={handleComplete}>
          Complete
        </NeoButton>
        
        <button 
          onClick={handleViewHistory}
          className="w-full px-4 py-2 text-sm text-[#99E39E] hover:text-white bg-transparent border border-[#99E39E]/30 hover:border-[#99E39E] rounded transition-colors"
        >
          View Analysis History
        </button>
      </div>
    </div>
  );
}