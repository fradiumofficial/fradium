import { useState, useEffect } from "react";
import NeoButton from "@/components/ui/custom-button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useWalletApi } from "@/modules/wallet/api/WalletApi";
import ArrowRight from "../../assets/arrow_forward.svg";

function WalletConfirmation() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userWallet, isLoading: walletLoading, hasConfirmedWallet, createWallet, isCreatingWallet } = useWallet();
  const { deleteWallet } = useWalletApi();
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("WalletConfirmation: User not authenticated, redirecting to welcome");
      navigate(ROUTES.WELCOME, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Redirect if user already has a wallet
  useEffect(() => {
    if (!walletLoading && userWallet && hasConfirmedWallet) {
      console.log("WalletConfirmation: User already has wallet, redirecting to home");
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [userWallet, hasConfirmedWallet, walletLoading, navigate]);

  const handleCreateWallet = async () => {
    try {
      setMessage("Creating your secure wallet...");
      console.log("WalletConfirmation: Starting wallet creation...");
      
      await createWallet();
      
      setMessage("Wallet created successfully! Redirecting...");
      console.log("WalletConfirmation: Wallet created successfully");
      
      // Navigate to home after successful creation
      setTimeout(() => {
        navigate(ROUTES.HOME, { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("WalletConfirmation: Error creating wallet:", error);
      setMessage(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSkip = () => {
    // For now, we'll still navigate to home but user won't have wallet functionality
    console.log("WalletConfirmation: User chose to skip wallet creation");
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleDeleteAndRecreate = async () => {
    try {
      setIsDeleting(true);
      setMessage("Deleting old wallet...");
      
      const deleteResult = await deleteWallet();
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || "Failed to delete wallet");
      }
      
      setMessage("Creating new wallet with real addresses...");
      await createWallet();
      
      setMessage("New wallet created successfully! Redirecting...");
      setTimeout(() => {
        navigate(ROUTES.HOME, { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("WalletConfirmation: Error deleting and recreating wallet:", error);
      setMessage(`Failed to recreate wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || walletLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user already has a wallet with mock data
  const hasMockWallet = userWallet && userWallet.addresses.some(addr => 
    addr.address.includes('Mock') || addr.address.includes('mock')
  );

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white p-8 flex flex-col justify-center">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-[#9BE4A0] rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {hasMockWallet ? "Update Your Wallet" : "Create Your Wallet"}
          </h1>
          <p className="text-white/70 text-sm">
            {hasMockWallet 
              ? "We detected you have an old wallet with test data. Let's update it with real addresses from our canisters."
              : "To access all features of Fradium, you need to create a secure wallet. This will enable you to:"
            }
          </p>
        </div>

        {hasMockWallet && (
          <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-yellow-400 mt-0.5">⚠️</div>
              <div>
                <h3 className="text-yellow-200 text-sm font-medium">Mock Data Detected</h3>
                <p className="text-yellow-300/70 text-xs mt-1">
                  Your current wallet contains test addresses. Click "Update Wallet" to get real addresses from our Bitcoin and Solana canisters.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">Multi-Chain Support</h3>
                <p className="text-white/60 text-xs">Bitcoin, Ethereum, Solana, and Fradium tokens</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">Real-Time Protection</h3>
                <p className="text-white/60 text-xs">AI-powered scam and fraud detection</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">Smart Contract Analysis</h3>
                <p className="text-white/60 text-xs">Deep analysis of contracts before interaction</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#9BE4A0] rounded-full mt-2"></div>
              <div>
                <h3 className="text-white text-sm font-medium">Secure Transactions</h3>
                <p className="text-white/60 text-xs">Send and receive crypto with confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="text-center p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-xs">{message}</p>
          </div>
        )}

        <div className="space-y-3">
          {hasMockWallet ? (
            <NeoButton
              icon={(isCreatingWallet || isDeleting) ? undefined : ArrowRight}
              iconPosition="right"
              onClick={handleDeleteAndRecreate}
              disabled={isCreatingWallet || isDeleting}
              className="w-full"
            >
              {isDeleting ? "Updating Wallet..." : isCreatingWallet ? "Creating Wallet..." : "Update Wallet Now"}
            </NeoButton>
          ) : (
            <NeoButton
              icon={isCreatingWallet ? undefined : ArrowRight}
              iconPosition="right"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
              className="w-full"
            >
              {isCreatingWallet ? "Creating Wallet..." : "Create Wallet Now"}
            </NeoButton>
          )}
          
          <button
            onClick={handleSkip}
            disabled={isCreatingWallet || isDeleting}
            className="w-full py-3 text-white/70 text-sm hover:text-white transition-colors disabled:opacity-50"
          >
            Skip for now (Limited functionality)
          </button>
        </div>
      </div>
    </div>
  );
}

export default WalletConfirmation;
