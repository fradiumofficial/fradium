import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Shield, Clock, Zap } from "lucide-react";

import { fradium_token as token } from "declarations/fradium_token";
import { backend as backend } from "declarations/backend";

import { Button } from "@/core/components/ui/button";
import PrimaryButton from "@/core/components/Button";
import ButtonGreen from "@/core/components/ButtonGreen";
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
          description: `You have received ${CLAIM_AMOUNT} FRADIUM tokens.`,
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
    <div className="relative bg-[#000510] w-full overflow-hidden min-h-screen">
      <style>{`
        @keyframes fradium-float {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-12px); 
          }
        }
        .floating-slow { 
          animation: fradium-float 6s ease-in-out infinite; 
          will-change: transform;
        }
        @keyframes fradium-ring-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.15;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.25;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(153, 227, 158, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(153, 227, 158, 0.6);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000510] via-[#0a0a0a] to-[#000510]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_70%_-80px,rgba(153,227,158,0.05),transparent_65%)] opacity-60"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl mt-[8rem]">
          {!isConnected ? (
            <motion.div className="text-center py-16" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_center,rgba(153,227,158,0.1),transparent_70%)] opacity-50"></div>
                <div className="relative bg-[#000000]/60 backdrop-blur-[2px] border border-white/10 rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.40)]">
                  <Shield className="w-16 h-16 text-[#99E39E] mx-auto mb-6 animate-glow" />
                  <h2 className="text-2xl font-bold mb-4 text-white">Login Required</h2>
                  <p className="text-gray-300 mb-6">Please log in to your account to claim free FRADIUM tokens and participate in the Fradium ecosystem.</p>
                  <ButtonGreen onClick={handleLogin} size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] md:w-[23px] md:h-[23px]">
                    Login
                  </ButtonGreen>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div className="space-y-16" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* Claim Section */}
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-white animate-fade-in-up">Claim Free Tokens</h2>
                <p className="text-gray-300 mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  Get free {CLAIM_AMOUNT} FRADIUM tokens every {COOLDOWN_HOURS} hours to participate in community voting, staking, and reporting activities.
                </p>

                {/* Current Balance Card */}
                <motion.div className="mb-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                  <div className="relative bg-[#000000]/60 backdrop-blur-[2px] border border-white/10 rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.40)] card-hover">
                    <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_center,rgba(153,227,158,0.08),transparent_70%)] opacity-50 rounded-[20px]"></div>
                    <div className="relative">
                      <div className="text-[#99E39E] text-sm mb-2 font-medium">Your Current Balance</div>
                      <div className="text-5xl font-bold text-white mb-4">{userBalance.toLocaleString()} FRADIUM</div>
                      <div className="flex items-center justify-center space-x-2 text-gray-400">
                        <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Claim Button Section */}
                {isLoading ? (
                  <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                    <div className="relative bg-[#000000]/60 backdrop-blur-[2px] border border-[#99E39E]/20 rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.40)]">
                      <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_center,rgba(153,227,158,0.1),transparent_70%)] opacity-50 rounded-[20px]"></div>
                      <div className="relative">
                        <Clock className="w-8 h-8 text-[#99E39E] mx-auto mb-3 animate-spin" />
                        <h3 className="text-lg font-semibold text-[#99E39E] mb-2">Checking Claim Status</h3>
                        <p className="text-gray-300 text-sm">Please wait while we check your claim eligibility...</p>
                      </div>
                    </div>
                  </motion.div>
                ) : canClaim ? (
                  <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4 mb-6">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                    <ButtonGreen onClick={claimTokens} disabled={isClaiming} size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] md:w-[23px] md:h-[23px]">
                      {isClaiming ? <>Claiming...</> : <>Claim {CLAIM_AMOUNT} FRADIUM</>}
                    </ButtonGreen>
                  </motion.div>
                ) : (
                  <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                    <div className="relative bg-[#000000]/60 backdrop-blur-[2px] border border-red-500/20 rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.40)]">
                      <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_center,rgba(239,68,68,0.1),transparent_70%)] opacity-50 rounded-[20px]"></div>
                      <div className="relative">
                        <Clock className="w-8 h-8 text-red-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Cannot Claim Yet</h3>
                        <p className="text-gray-300 text-sm">{remainingTime || "Please wait for the cooldown period to complete."}</p>
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs mt-4">You can claim once every {COOLDOWN_HOURS} hours</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
