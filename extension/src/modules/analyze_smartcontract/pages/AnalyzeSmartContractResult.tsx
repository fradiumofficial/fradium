import { SafetyCard } from "@/components/ui/custom-card";
import ProfileHeader from "@/components/ui/header";
import Wallet from "../../../assets/Wallet.svg";
import NeoButton from "@/components/ui/custom-button";
import type { Root as AnalysisReport } from "../model/AnalyzeSmartContractModel";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getHistoryItemById } from "@/lib/localStorage";
import { ROUTES } from "@/constants/routes";

interface LocationState {
  result: AnalysisReport;
  address: string;
  historyId: string;
}

function AnalyzeSmartContractResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<{
    result: AnalysisReport;
    address: string;
  } | null>(null);

  useEffect(() => {
    const state = location.state as LocationState;

    if (state && state.result && state.address) {
      setAnalysisData({
        result: state.result,
        address: state.address
      });
    } else if (state && state.historyId) {
      // Try to get from localStorage if direct state not available
      const historyItem = getHistoryItemById(state.historyId);
      if (historyItem && historyItem.analysisType === 'smartcontract') {
        setAnalysisData({
          result: historyItem.result as AnalysisReport,
          address: historyItem.address
        });
      } else {
        // Redirect back if no valid data available
        navigate(ROUTES.ANALYZE_SMART_CONTRACT);
      }
    } else {
      // Redirect back if no state available
      navigate(ROUTES.ANALYZE_SMART_CONTRACT);
    }
  }, [location.state, navigate]);

  if (!analysisData) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md flex items-center justify-center">
        <div className="text-center">
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  const { result, address } = analysisData;
  const { issues } = result;

  // Calculate summary from issues
  const summary = {
    total_issues: issues.length,
    high: issues.filter(issue => issue.severity.toLowerCase() === 'high').length,
    medium: issues.filter(issue => issue.severity.toLowerCase() === 'medium').length,
    low: issues.filter(issue => issue.severity.toLowerCase() === 'low').length,
    info: issues.filter(issue => issue.severity.toLowerCase() === 'info').length,
  };

  const contractDetails = [
    { label: 'Total Issues', value: summary.total_issues, icon: Wallet },
    { label: 'High Severity', value: summary.high, icon: Wallet },
    { label: 'Medium Severity', value: summary.medium, icon: Wallet },
    { label: 'Low Severity', value: summary.low, icon: Wallet },
  ];

  const isSafe = summary.high === 0;

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

  // Komponen untuk ikon peringatan (SVG)
  const WarningIcon: React.FC = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-red-400"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="w-[375px] h-[600px] overflow-y-auto pb-20 bg-[#25262B] text-white">

      { /* Header Sections */}
      <ProfileHeader />

      { /* Analyze Address Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Smart Contract</h1>
        <div className="mb-4 mt-4">
          <p className="text-xs break-all bg-white/5 p-2 rounded">{address}</p>
        </div>

        <SafetyCard
          confidence={isSafe ? 95 : 25}
          title={"Smart Contract"}
          isSafe={isSafe}
        />

        <h1 className="text-[20px] font-semibold mt-[32px] mb-[20px]">Contract Details</h1>
        <div className="grid grid-cols-2 gap-4">
          {contractDetails.map((detail, index) => (
            <div key={index} className="bg-white/5 flex-1 items-center gap-2 p-4">
              <p className="font-medium text-[18px] pb-2">{detail.value}</p>
              <div className="flex flex-row">
                <img src={detail.icon} alt="Icon" className="w-5 h-5" />
                <p className="font-normal text-[14px] text-white/60 ps-1">{detail.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      { /* Issues List */}
      {issues.length > 0 && (
        <div className="m-4">
          <h2 className="text-[20px] font-semibold mb-4">Security Issues Found</h2>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {issues.map((issue, index) => (
              <div key={index} className="bg-white/5 p-4 rounded">
                <div className="flex items-center mb-2">
                  <WarningIcon />
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${issue.severity.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-300' :
                      issue.severity.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}>
                    {issue.severity}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{issue.title}</h3>
                <p className="text-xs text-white/70 mb-2">Function: {issue.function}</p>
                {issue['swc-url'] && (
                  <a
                    href={issue['swc-url']}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Learn more (SWC-{issue['swc-id']})
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      { /* Security Checks Passed */}
      {isSafe && (
        <div className="m-4">
          <div className="w-full max-w-md ps-[2px] bg-green-500">
            <div className="bg-gradient-to-r from-[#4A834C] to-[#35373E] bg-slate-800 p-6 mt-[20px]">
              <h2 className="text-[20px] font-semibold mb-4">Security Checks Passed</h2>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">No high severity vulnerabilities detected</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">Contract appears to be safe for interaction</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span className="ml-2">No critical security flaws found</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      { /* Action Button */}
      <div className="p-4">
        <NeoButton
          icon={Wallet}
          onClick={() => navigate(ROUTES.HOME)}
        >
          Complete
        </NeoButton>
      </div>
    </div>
  );
}

export default AnalyzeSmartContractResult