import { useState, useEffect } from "react";

import { Shield, Clock, Zap } from "lucide-react";

import { fradium_token as token } from "declarations/fradium_token";
import { backend as backend } from "declarations/backend";

import { Button } from "@/core/components/ui/button";
import PrimaryButton from "@/core/components/Button";
import { useAuth } from "@/core/providers/AuthProvider";
import { useToast } from "@/core/hooks/use-toast";
import { formatAddress, convertE8sToToken } from "@/core/lib/canisterUtils";

export default function FaucetPage() {
  const { isAuthenticated: isConnected, handleLogin, identity } = useAuth();
  const { toast } = useToast();
  // User state
  const [walletAddress, setWalletAddress] = useState(identity ? identity.getPrincipal().toString() : "");

  const [userBalance, setUserBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const CLAIM_AMOUNT = 10;
  const COOLDOWN_HOURS = 24;

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !identity) return;

      try {
        const balance = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setUserBalance(convertE8sToToken(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();

    // Listen for balance update events
    const handleBalanceUpdate = () => {
      fetchBalance();
    };

    window.addEventListener("balance-updated", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balance-updated", handleBalanceUpdate);
    };
  }, [isConnected, identity]);

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
        setCanClaim(false); // Update status after successful claim

        // Show success toast
        toast({
          title: "Tokens Claimed Successfully!",
          description: `You have received ${CLAIM_AMOUNT} FUM tokens.`,
          variant: "default",
        });

        // Trigger balance update event for navbar
        window.dispatchEvent(new Event("balance-updated"));

        // Update local balance
        setUserBalance((prev) => prev + CLAIM_AMOUNT);

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
        // Show error toast
        toast({
          title: "Claim Failed",
          description: response.Err,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error claiming tokens:", error);
      setError("Failed to claim tokens. Please try again.");
      // Show error toast
      toast({
        title: "Claim Failed",
        description: "Failed to claim tokens. Please try again.",
        variant: "destructive",
      });
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
              <p className="text-gray-300 mb-6">Please log in to your account to claim free FUM tokens and participate in the Fradium ecosystem.</p>
              <Button onClick={handleLogin} className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg">
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
                    Get free {CLAIM_AMOUNT} FUM tokens every {COOLDOWN_HOURS} hours to participate in community voting, staking, and reporting activities.
                  </p>

                  {/* Current Balance */}
                  <div className="mb-12">
                    <div className="text-gray-400 text-sm mb-2">Your Current Balance</div>
                    <div className="text-5xl font-bold text-white mb-4">{userBalance.toLocaleString()} FUM</div>
                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                      <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {isLoading ? (
                    <div className="text-center">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
                        <Clock className="w-8 h-8 text-green-400 mx-auto mb-3 animate-spin" />
                        <h3 className="text-lg font-semibold text-green-400 mb-2">Checking Claim Status</h3>
                        <p className="text-gray-300 text-sm">Please wait while we check your claim eligibility...</p>
                      </div>
                    </div>
                  ) : canClaim ? (
                    <div className="text-center">
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      <PrimaryButton onClick={claimTokens} disabled={isClaiming} className="">
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
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Cannot Claim Yet</h3>
                        <p className="text-gray-300 text-sm">{remainingTime || "Please wait for the cooldown period to complete."}</p>
                      </div>
                      <div className="text-gray-400 text-xs">You can claim once every {COOLDOWN_HOURS} hours</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
