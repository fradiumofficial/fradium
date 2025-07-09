import { Button } from "@/core/components/ui/button";
import PrimaryButton from "@/core/components/Button";
import {
  Shield,
  ArrowLeft,
  Coins,
  Clock,
  CheckCircle,
  Copy,
  Zap,
  Users,
  Vote,
  FileText,
  CookingPot,
  CloudCog,
} from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/core/providers/auth-provider";
import { backend } from "declarations/backend";
import { formatAddress } from "@/core/lib/canisterUtils";

export default function FaucetPage() {
  const { isAuthenticated: isConnected, handleLogin, identity } = useAuth();
  // User state
  const [walletAddress, setWalletAddress] = useState(
    identity ? identity.getPrincipal().toString() : ""
  );

  const [userBalance, setUserBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [canClaim, setCanClaim] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const CLAIM_AMOUNT = 10;
  const COOLDOWN_HOURS = 24;

  useEffect(() => {
    const checkClaim = async () => {
      if (!isConnected) return;

      setIsLoading(true);
      try {
        const response = await backend.check_faucet_claim();
        if ("Ok" in response) {
          setCanClaim(true);
          setRemainingTime(null);
        } else if ("Err" in response) {
          setCanClaim(false);
          setRemainingTime(response.Err);
        }
      } catch (error) {
        console.error("Error checking faucet claim:", error);
        setCanClaim(false);
        setRemainingTime("Error checking claim status");
      } finally {
        setIsLoading(false);
      }
    };

    checkClaim();
  }, [isConnected]);

  // Claim tokens
  const claimTokens = async () => {
    setIsClaiming(true);
    setError("");

    try {
      const response = await backend.claim_faucet();
      console.log(response);

      if ("Ok" in response) {
        setShowSuccessModal(true);
        setCanClaim(false); // Update status after successful claim
        // Re-check claim status after a short delay
        setTimeout(() => {
          const checkClaim = async () => {
            try {
              const response = await backend.check_faucet_claim();
              if ("Ok" in response) {
                setCanClaim(true);
                setRemainingTime(null);
              } else if ("Err" in response) {
                setCanClaim(false);
                setRemainingTime(response.Err);
              }
            } catch (error) {
              console.error("Error re-checking claim status:", error);
            }
          };
          checkClaim();
        }, 2000);
      } else if ("Err" in response) {
        setError(response.Err);
      }
    } catch (error) {
      console.error("Error claiming tokens:", error);
      setError("Failed to claim tokens. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="pb-20 mb-20 bg-black text-white">
      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl mt-[8rem]">
          {!isConnected ? (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Login Required</h2>
              <p className="text-gray-300 mb-6">
                Please log in to your account to claim free FUM tokens and
                participate in the Fradium ecosystem.
              </p>
              <Button
                onClick={handleLogin}
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg"
              >
                Login
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-16">
                {/* Claim Section */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Claim Free Tokens</h2>
                  <p className="text-gray-300 mb-12">
                    Get free {CLAIM_AMOUNT} FUM tokens every {COOLDOWN_HOURS}{" "}
                    hours to participate in community voting, staking, and
                    reporting activities.
                  </p>

                  {/* Current Balance */}
                  <div className="mb-12">
                    <div className="text-gray-400 text-sm mb-2">
                      Your Current Balance
                    </div>
                    <div className="text-5xl font-bold text-white mb-4">
                      {userBalance.toLocaleString()} FUM
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                      <span className="font-mono text-sm">
                        {formatAddress(walletAddress)}
                      </span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {isLoading ? (
                    <div className="text-center">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
                        <Clock className="w-8 h-8 text-green-400 mx-auto mb-3 animate-spin" />
                        <h3 className="text-lg font-semibold text-green-400 mb-2">
                          Checking Claim Status
                        </h3>
                        <p className="text-gray-300 text-sm">
                          Please wait while we check your claim eligibility...
                        </p>
                      </div>
                    </div>
                  ) : canClaim ? (
                    <div className="text-center">
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      <PrimaryButton
                        onClick={claimTokens}
                        disabled={isClaiming}
                        className=""
                      >
                        {isClaiming ? (
                          <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Claim {CLAIM_AMOUNT} FUM
                          </>
                        )}
                      </PrimaryButton>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                        <Clock className="w-8 h-8 text-red-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-400 mb-2">
                          Cannot Claim Yet
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {remainingTime ||
                            "Please wait for the cooldown period to complete."}
                        </p>
                      </div>
                      <div className="text-gray-400 text-xs">
                        You can claim once every {COOLDOWN_HOURS} hours
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black"
              onClick={() => setShowSuccessModal(false)}
            ></div>
            <div className="relative bg-black border border-white/20 rounded-xl p-8 w-full max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Tokens Claimed!</h3>
                <p className="text-gray-300 mb-4">
                  You have successfully claimed {claimedAmount} FUM tokens.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">New Balance</div>
                  <div className="text-2xl font-bold text-white">
                    {userBalance.toLocaleString()} FUM
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                >
                  Continue
                </Button>
                <Link to="/reports" className="flex-1">
                  <Button className="w-full bg-white text-black hover:bg-gray-200">
                    Start Voting
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
