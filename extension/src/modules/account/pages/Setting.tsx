import ProfileHeader from "@/components/ui/header";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/contexts/authContext";
import { shortenIcId } from "@/lib/utils/utils";
import CopyIcon from "../../../../public/assets/content_copy.svg";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Setting() {
  const { principal, sessionInfo, refreshSessionInfo } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopyAddress = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedAddress(principal);
      setTimeout(() => setCopiedAddress(null), 2000); // Clear after 2 seconds
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white overflow-y-auto pb-20">
      <ProfileHeader />

      {/* Title and Subtitle */}
      <div className="px-4 pt-5">
        <h1 className="text-[20px] font-semibold leading-tight">Setting</h1>
        <p className="text-white/70 text-[14px] font-normal mt-2 leading-relaxed">
          Adjust wallet, security, and extension preferences
        </p>
      </div>

      {/* General Card */}
      <div className="px-4 mt-6">
        <div className="border border-white/10 bg-white/5">
          <div className="p-5">
            <div className="text-white text-[14px] font-semibold">General</div>

            {/* Principal */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-white/80 font-normal text-[14px]">
                  Your Principal
                </span>
                <img
                  src="/assets/help.svg"
                  alt="help"
                  className="w-5 h-5 ml-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-normal">
                  {shortenIcId(principal ?? "error")}
                </span>
                <div className="relative">
                  <img
                    src={CopyIcon}
                    alt="Copy"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => principal && handleCopyAddress(principal)}
                  />
                  {copiedAddress === principal && (
                    <div className="absolute -top-8 -left-4 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Duration */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-white/80 text-[14px] font-normal">
                  Session Duration
                </div>
                <button
                  onClick={refreshSessionInfo}
                  className="text-white/60 hover:text-white"
                  title="Refresh session info"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {sessionInfo ? (
                <div className="mt-2 space-y-1">
                  <div
                    className={`text-[14px] font-normal ${
                      sessionInfo.isValid
                        ? sessionInfo.remainingTime < 10 * 60 * 1000
                          ? "text-orange-400"
                          : "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {sessionInfo.remainingTimeFormatted}
                  </div>

                  {sessionInfo.createdAt && (
                    <div className="text-white/50 text-[12px]">
                      Started: {sessionInfo.createdAt.toLocaleTimeString()}
                    </div>
                  )}

                  {sessionInfo.expiresAt && (
                    <div className="text-white/50 text-[12px]">
                      Expires: {sessionInfo.expiresAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-white/50 text-[14px] font-normal mt-2">
                  Loading session info...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List of scan activity */}
      <div className="px-4 mt-4 mb-6">
        <div className=" border border-white/10 bg-white/5">
          <div className="p-5">
            <div className="text-white text-[14px] font-semibold">
              List of scan activity
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-white/80 text-[14px] font-normal">
                  Active Networks
                </span>
                <img
                  src="/assets/help.svg"
                  alt="help"
                  className="w-5 h-5 ml-2"
                />
              </div>
              <div className="flex items-center gap-4">
                <img
                  src="/assets/images/Icon-coins.png"
                  alt="coins"
                  className="w-[68px] h-[20px]"
                />
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.MANAGE_NETWORK)}
                  className="text-[#9BE4A0] text-[14px] font-medium flex items-center gap-2"
                >
                  Edit <span className="inline-block">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setting;
