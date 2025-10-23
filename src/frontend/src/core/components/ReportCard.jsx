import { AlertTriangle, CheckCircle, Clock, Eye, ArrowUpRight, Coins, X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";
import { getIconByChain } from "@/core/lib/tokenUtils";
import { useNavigate } from "react-router";

const ReportCard = ({ report, showUnstakeButton = false, onUnstake, variant = "list" }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case "Unsafe":
        return <AlertTriangle className="w-4 h-4 text-red-400 transition-all duration-200 group-hover:text-red-300" />;
      case "Safe":
        return <CheckCircle className="w-4 h-4 text-green-400 transition-all duration-200 group-hover:text-green-300" />;
      case "Voting":
      case "Ongoing":
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-400 transition-all duration-200 group-hover:text-yellow-300" />;
      case "Not Validated":
        return <X className="w-4 h-4 text-gray-400 transition-all duration-200 group-hover:text-gray-300" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400 transition-all duration-200" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Unsafe":
        return "text-red-400 bg-red-400/10 border-red-400/20 group-hover:bg-red-400/20 group-hover:border-red-400/30 transition-all duration-200";
      case "Safe":
        return "text-green-400 bg-green-400/10 border-green-400/20 group-hover:bg-green-400/20 group-hover:border-green-400/30 transition-all duration-200";
      case "Voting":
      case "Ongoing":
      case "Pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 group-hover:bg-yellow-400/20 group-hover:border-yellow-400/30 transition-all duration-200";
      case "Not Validated":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20 group-hover:bg-gray-400/20 group-hover:border-gray-400/30 transition-all duration-200";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20 group-hover:bg-gray-400/20 group-hover:border-gray-400/30 transition-all duration-200";
    }
  };

  const canUnstake = showUnstakeButton && (report.status === "Unsafe" || report.status === "Safe" || report.status === "Not Validated") && !report.isUnstaked;

  const reportId = report.report_id || report.id;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)] hover:bg-white/8 hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.30)] transition-all duration-300 ease-out group cursor-pointer">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          {/* Network and Address */}
          <div className="flex flex-wrap items-center mb-2 gap-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white/5 transition-transform duration-200 group-hover:scale-110">
                {report.chain && report.chain.toLowerCase() !== "unknown" ? (
                  <img
                    src={getIconByChain(report.chain)}
                    alt={`${report.chain} icon`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/question-mark.svg";
                    }}
                  />
                ) : (
                  <img src="https://www.svgrepo.com/show/376230/status-notfound.svg" alt="Unknown network" className="w-3 h-3 sm:w-4 sm:h-4 object-contain opacity-60" />
                )}
              </div>
              <span className="text-xs sm:text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-200">{report.chain && report.chain.toLowerCase() !== "unknown" ? `${report.chain} Network` : "Unknown Network"}</span>
            </div>
            <div className={`inline-flex items-center space-x-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full ml-3 sm:ml-4 text-[10px] sm:text-xs font-medium border transition-all duration-200 ${getStatusColor(report.status)}`}>
              <span className="group-hover:animate-pulse">{getStatusIcon(report.status)}</span>
              <span className="group-hover:text-white transition-colors duration-200">{report.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-base sm:text-lg font-semibold text-white group-hover:text-[#99E39E] transition-colors duration-200">{report.shortAddress}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
            <span className="text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-200">{report.category}</span>
            <span className="group-hover:animate-pulse">•</span>
            <span className="text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-200">{variant === "myreport" ? `Reported ${report.dateCreated || report.dateReported}` : `Reported ${report.dateReported || report.dateCreated}`}</span>
            {report.voteType !== undefined && variant === "voted" && (
              <>
                <span className="group-hover:animate-pulse">•</span>
                <div className={`w-2 h-2 rounded-full ${report.voteType === true ? "bg-red-400" : "bg-green-400"}`} />
                <span className={`font-medium ${report.voteType === true ? "text-red-400" : "text-green-400"} group-hover:${report.voteType === true ? "text-red-300" : "text-green-300"} transition-colors duration-200`}>You voted: {report.voteType === true ? "Unsafe" : "Safe"}</span>
              </>
            )}
            {report.isUnstaked && (
              <>
                <span className="group-hover:animate-pulse">•</span>
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors duration-200">Unstaked</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {canUnstake && onUnstake && (
            <ButtonPurple
              size="sm"
              fontWeight="medium"
              icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg"
              iconSize="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                onUnstake(report);
              }}>
              Unstake
            </ButtonPurple>
          )}
          <Button
            className="!bg-gray-800/50 backdrop-blur-sm !border border-gray-600/50 hover:!bg-gray-700/50 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 !rounded-full transition-all duration-200 ease-out group-hover:!bg-[#99E39E]/20 group-hover:!border-[#99E39E]/50 group-hover:text-[#99E39E]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/${reportId}`);
            }}>
            View Details
            {variant === "list" ? <ArrowUpRight className="w-3 h-3 ml-2 inline-block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" /> : <Eye className="w-3 h-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />}
          </Button>
        </div>
      </div>

      {/* Vote Information */}
      <div className="flex justify-between text-[11px] sm:text-xs mb-2">
        <span className="text-red-400 transition-colors duration-200 group-hover:text-red-300">Unsafe: {report.yesPercentage}%</span>
        <span className="text-green-400 transition-colors duration-200 group-hover:text-green-300">Safe: {report.noPercentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden relative">
        {/* Unsafe bar (red) from left */}
        <div
          className="absolute left-0 top-0 bg-gradient-to-r from-red-400 to-red-500 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out group-hover:from-red-300 group-hover:to-red-400"
          style={{
            width: `${report.yesPercentage}%`,
          }}
        />
        {/* Safe bar (green) from right */}
        <div
          className="absolute right-0 top-0 bg-gradient-to-l from-green-400 to-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out group-hover:from-green-300 group-hover:to-green-400"
          style={{
            width: `${report.noPercentage}%`,
          }}
        />
      </div>

      {/* Additional Info for MyReport variant */}
      {variant !== "list" && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>ID: #{reportId.toString().padStart(4, "0")}</span>
            <span>Evidence: {report.evidence?.length || 0}</span>
            {report.stakeAmount !== undefined && (
              <span>
                Staked: <span className="text-yellow-400 font-semibold">{report.stakeAmount} FRADIUM</span>
              </span>
            )}
            {/* Show vote result for voted reports */}
            {variant === "voted" && report.voteType !== undefined && (report.status === "Safe" || report.status === "Unsafe") && (
              <span>
                Result: <span className={`font-semibold ${report.status === "Unsafe" ? (report.voteType === true ? "text-green-400" : "text-red-400") : report.voteType === false ? "text-green-400" : "text-red-400"}`}>{report.status === "Unsafe" ? (report.voteType === true ? "Correct ✓" : "Incorrect ✗") : report.voteType === false ? "Correct ✓" : "Incorrect ✗"}</span>
              </span>
            )}
          </div>
          {report.reward > 0 && <span className="text-green-400 font-semibold">Reward: +{report.reward.toFixed(3)} FRADIUM</span>}
        </div>
      )}
    </div>
  );
};

export default ReportCard;
