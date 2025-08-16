import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NeoButton from '@/components/ui/custom-button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/lib/authContext';
import { useWallet } from '@/lib/walletContext';

function CreateWallet() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { principal, isAuthenticated } = useAuth();
  const { 
    createWallet, 
    isCreatingWallet, 
    userWallet, 
    hasConfirmedWallet,
    isLoading 
  } = useWallet();

  // Check if user already has a wallet or if one is being created automatically
  useEffect(() => {
    if (userWallet && hasConfirmedWallet) {
      console.log("CreateWallet: User already has wallet, redirecting to wallet home");
      navigate(ROUTES.WALLET_HOME);
    } else if (isCreatingWallet && !userWallet) {
      console.log("CreateWallet: Wallet is being created automatically, showing progress");
      setStep(2); // Show creating step
    }
  }, [userWallet, hasConfirmedWallet, isCreatingWallet, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log("CreateWallet: User not authenticated, redirecting to welcome");
      navigate(ROUTES.WELCOME);
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleCreateWallet = async () => {
    if (!isAuthenticated || !principal) {
      setError("Please authenticate first");
      return;
    }

    try {
      setError(null);
      setStep(2); // Show creating step
      
      console.log("CreateWallet: Starting wallet creation...");
      await createWallet();
      
      setStep(3); // Show success step
      
      console.log("CreateWallet: Wallet created successfully, navigating to wallet home");
      // Navigate to wallet/home after creation
      setTimeout(() => {
        navigate(ROUTES.WALLET_HOME);
      }, 1500);
      
    } catch (error) {
      console.error('CreateWallet: Error creating wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to create wallet');
      setStep(1); // Go back to initial step
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-[#9BE4A0] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Create Your Wallet</h1>
              <p className="text-white/70 text-sm">
                Set up your secure multi-chain wallet to start protecting your crypto transactions
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#9BE4A0] rounded-full"></div>
                  <span className="text-white text-sm">Multi-chain support (Bitcoin, Ethereum, Solana)</span>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#9BE4A0] rounded-full"></div>
                  <span className="text-white text-sm">Real-time fraud detection</span>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#9BE4A0] rounded-full"></div>
                  <span className="text-white text-sm">Smart contract analysis</span>
                </div>
              </div>
            </div>

            {principal && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                <div className="text-xs text-white/50">Connected Identity:</div>
                <div className="text-xs text-white font-mono break-all">
                  {principal.slice(0, 20)}...{principal.slice(-10)}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <NeoButton
              onClick={handleCreateWallet}
              disabled={isCreatingWallet || !isAuthenticated}
              className="w-full"
            >
              {isCreatingWallet ? 'Creating Wallet...' : 'Create Wallet'}
            </NeoButton>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto border-4 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold text-white">Creating Your Wallet</h2>
            <p className="text-white/70 text-sm">
              Setting up your secure multi-chain wallet...
            </p>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-[#9BE4A0] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Wallet Created Successfully!</h2>
            <p className="text-white/70 text-sm">
              Your secure multi-chain wallet is ready. Redirecting to your wallet...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white p-8 flex flex-col justify-center">
      {renderStep()}
    </div>
  );
}

export default CreateWallet;
