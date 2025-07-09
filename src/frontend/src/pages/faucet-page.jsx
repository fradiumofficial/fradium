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

export default function FaucetPage() {
  const { isAuthenticated: isConnected, handleLogin, identity } = useAuth();
  // User state
  const [walletAddress, setWalletAddress] = useState(
    identity.getPrincipal().toString() ? identity.getPrincipal().toString() : ""
  );
  const [userBalance, setUserBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaimTime, setLastClaimTime] = useState(null);
  const [claimHistory, setClaimHistory] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  // Faucet configuration
  const CLAIM_AMOUNT = 100; // FUM tokens per claim
  const COOLDOWN_HOURS = 24; // 24 hours between claims
  const MAX_DAILY_CLAIMS = 1;

  // Calculate time remaining for next claim
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Simulate checking if wallet is connected
    const checkWalletConnection = () => {
      // In a real app, this would check MetaMask or other wallet connections
      const mockWallet = localStorage.getItem("mockWallet");
      if (mockWallet) {
        setIsConnected(true);
        setWalletAddress(mockWallet);
        setUserBalance(
          Number.parseInt(localStorage.getItem("userBalance") || "0")
        );

        const lastClaim = localStorage.getItem("lastClaimTime");
        if (lastClaim) {
          setLastClaimTime(new Date(lastClaim));
        }

        const history = localStorage.getItem("claimHistory");
        if (history) {
          setClaimHistory(JSON.parse(history));
        }
      }
    };

    checkWalletConnection();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!lastClaimTime) return;

    const updateTimer = () => {
      const now = new Date();
      const nextClaimTime = new Date(
        lastClaimTime.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000
      );
      const diff = nextClaimTime - now;

      if (diff <= 0) {
        setTimeRemaining("");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastClaimTime]);

  // Connect wallet simulation
  const connectWallet = () => {
    const mockAddress = "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4";
    setWalletAddress(mockAddress);
    setIsConnected(true);
    localStorage.setItem("mockWallet", mockAddress);
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    localStorage.removeItem("mockWallet");
  };

  // Check if user can claim
  const canClaim = () => {
    if (!lastClaimTime) return true;

    const now = new Date();
    const nextClaimTime = new Date(
      lastClaimTime.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000
    );

    return now >= nextClaimTime;
  };

  // Claim tokens
  const claimTokens = async () => {
    if (!canClaim() || isClaiming) return;

    setIsClaiming(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const now = new Date();
    const newBalance = userBalance + CLAIM_AMOUNT;
    const newClaim = {
      id: Date.now(),
      amount: CLAIM_AMOUNT,
      timestamp: now.toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    };

    setUserBalance(newBalance);
    setLastClaimTime(now);
    setClaimHistory((prev) => [newClaim, ...prev.slice(0, 9)]); // Keep last 10 claims
    setClaimedAmount(CLAIM_AMOUNT);
    setShowSuccessModal(true);

    // Save to localStorage
    localStorage.setItem("userBalance", newBalance.toString());
    localStorage.setItem("lastClaimTime", now.toISOString());
    localStorage.setItem(
      "claimHistory",
      JSON.stringify([newClaim, ...claimHistory.slice(0, 9)])
    );

    setIsClaiming(false);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                  {canClaim() ? (
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
                  ) : (
                    <div className="space-y-4">
                      <PrimaryButton
                        disabled
                        className="bg-gray-600 text-gray-400 px-12 py-4 text-lg font-semibold cursor-not-allowed"
                      >
                        <Clock className="w-5 h-5 mr-2" />
                        Claim Available In
                      </PrimaryButton>
                      <div className="text-3xl font-mono text-yellow-400">
                        {timeRemaining}
                      </div>
                      <p className="text-gray-400">
                        You can claim {CLAIM_AMOUNT} FUM tokens every{" "}
                        {COOLDOWN_HOURS} hours
                      </p>
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
