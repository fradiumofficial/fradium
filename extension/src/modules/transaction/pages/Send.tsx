import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProfileHeader from "@/components/ui/header";
import { ChevronLeft, Info } from "lucide-react";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useWallet } from "@/lib/contexts/walletContext";
import { useAuth } from "@/lib/contexts/authContext";
import {
  TokenType,
  validateAddress,
  TOKENS_CONFIG,
  detectTokenType,
} from "@/lib/utils/tokenUtils";
import {
  performComprehensiveAnalysis,
} from "@/lib/backgroundMessaging";
import { saveComprehensiveAnalysisToScanHistory } from "@/lib/localStorage";
import type { AnalysisResult } from "@/modules/analyze_address/model/AnalyzeAddressModel";

interface SendFormData {
  destinationAddress: string;
  amount: string;
  selectedToken: string;
}

interface SendErrors {
  destinationAddress?: string;
  amount?: string;
  general?: string;
  selectedToken?: string;
}

function Send() {
  const navigate = useNavigate();
  const { userWallet, network } = useWallet();
  const { identity } = useAuth();


  // Form state
  const [formData, setFormData] = useState<SendFormData>({
    destinationAddress: "",
    amount: "",
    selectedToken: "",
  });

  // UI state
  const [errors, setErrors] = useState<SendErrors>({});
  const [isLoading ] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Get available tokens for current network
  const getAvailableTokens = useCallback(() => {
    if (!userWallet?.addresses) return [];

    const networkAddresses = userWallet.addresses.filter((addressObj) => {
      if (network === "All Networks") return true;
      const addressNetwork = Object.keys(addressObj.network)[0];
      return addressNetwork.toLowerCase() === network.toLowerCase();
    });

    const tokenGroups: { [key: string]: any } = {};

    networkAddresses.forEach((addressObj) => {
      const tokenType = Object.keys(addressObj.token_type)[0];
      if (!tokenGroups[tokenType]) {
        const config = TOKENS_CONFIG[tokenType as keyof typeof TOKENS_CONFIG];
        if (config) {
          tokenGroups[tokenType] = {
            ...config,
            tokenType,
            addresses: [],
            balance: 0,
          };
        }
      }
      if (tokenGroups[tokenType]) {
        tokenGroups[tokenType].addresses.push(addressObj.address);
      }
    });

    return Object.values(tokenGroups);
  }, [userWallet?.addresses, network]);

  // Get user's balance for a specific token
  const getUserBalance = useCallback(
    async (tokenType: string) => {
      if (!userWallet?.addresses) return 0;

      const addresses = userWallet.addresses
        .filter((addr) => Object.keys(addr.token_type)[0] === tokenType)
        .map((addr) => addr.address);

      if (addresses.length === 0) return 0;

      try {
        switch (tokenType) {
          case TokenType.BITCOIN:
            // Use the balance service to get actual Bitcoin balance
            const { fetchBitcoinBalance } = await import('@/services/balanceService');
            const btcResult = await fetchBitcoinBalance(addresses[0]);
            return btcResult.balance;
          case TokenType.SOLANA:
            // Use the balance service to get actual Solana balance
            const { fetchSolanaBalance } = await import('@/services/balanceService');
            const solResult = await fetchSolanaBalance(addresses[0], identity);
            return solResult.balance;
          default:
            return 0;
        }
      } catch (error) {
        console.error(`Error fetching ${tokenType} balance:`, error);
        return 0;
      }
    },
    [userWallet?.addresses, identity]
  );

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const newErrors: SendErrors = {};

    // Validate destination address
    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = "Recipient address is required";
    } else {
      const validation = validateAddress(
        formData.destinationAddress,
        formData.selectedToken
      );
      if (!validation.isValid) {
        newErrors.destinationAddress = validation.error;
      }
    }

    // Validate amount
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const numAmount = parseFloat(formData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Please enter a valid amount";
      }
    }

    // Validate token selection
    if (!formData.selectedToken) {
      newErrors.general = "Please select a token to send";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Validate balance before sending
  const validateBalance = useCallback(async (): Promise<boolean> => {
    if (!formData.selectedToken || !formData.amount) return false;

    try {
      setIsValidating(true);
      setErrors(prev => ({ ...prev, amount: undefined })); // Clear previous errors
      
      const balance = await getUserBalance(formData.selectedToken);
      const amount = parseFloat(formData.amount);
      
      if (amount > balance) {
        setErrors(prev => ({ 
          ...prev, 
          amount: `Insufficient balance. You have ${balance.toFixed(8)} ${formData.selectedToken}` 
        }));
        return false;
      }
      
      // Clear any previous balance errors
      setErrors(prev => ({ ...prev, amount: undefined }));
      return true;
    } catch (error) {
      console.error('Error validating balance:', error);
      setErrors(prev => ({ 
        ...prev, 
        amount: 'Failed to validate balance. Please try again.' 
      }));
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [formData.selectedToken, formData.amount, getUserBalance]);

  // Handle form input changes
  const handleInputChange = (field: keyof SendFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle token selection
  const handleTokenSelection = (tokenType: string) => {
    handleInputChange("selectedToken", tokenType);
    handleInputChange("amount", ""); // Reset amount when token changes
  };

  // Set maximum amount
  const handleMaxAmount = async () => {
    if (!formData.selectedToken) return;

    const balance = await getUserBalance(formData.selectedToken);
    if (balance > 0) {
      // Convert from base unit to display unit
      const tokenConfig =
        TOKENS_CONFIG[formData.selectedToken as keyof typeof TOKENS_CONFIG];
      if (tokenConfig) {
        const displayAmount = balance / 10 ** tokenConfig.decimals;
        handleInputChange("amount", displayAmount.toString());
      }
    }
  };

  // Analyze address for security and navigate to confirmation page
  const handleAnalyzeAddress = async () => {
    if (!validateForm()) return;

    // Validate balance before proceeding
    const isBalanceValid = await validateBalance();
    if (!isBalanceValid) {
      return; // Error message already set by validateBalance
    }

    setIsAnalyzing(true);
    setErrors(prev => ({ ...prev, general: undefined })); // Clear general errors
    
    try {
      const tokenType = detectTokenType(formData.destinationAddress);

      if (tokenType === TokenType.UNKNOWN) {
        throw new Error(
          "Unsupported address format. Please provide a valid Bitcoin or Solana address."
        );
      }

      const response = await performComprehensiveAnalysis(
        formData.destinationAddress
      );

      if (!response.success) {
        throw new Error(response.error || "Analysis failed");
      }

      const finalResult: AnalysisResult = response.data;

      // Save to scan history (non-blocking)
      try {
        saveComprehensiveAnalysisToScanHistory(finalResult);
      } catch (saveError) {
        console.warn("Failed to save to scan history:", saveError);
      }

      // Navigate to confirmation page instead of modal
      navigate(ROUTES.CONFIRMATION_BALANCE, {
        state: {
          amount: formData.amount,
          destinationAddress: formData.destinationAddress,
          selectedToken: formData.selectedToken,
        }
      });

    } catch (err) {
      console.error('A critical error occurred during analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      // Do not block sending if analysis fails; show confirmation with caution
      toast.warn(`Analysis warning: ${errorMessage}`);
      navigate(ROUTES.CONFIRMATION_BALANCE, {
        state: {
          amount: formData.amount,
          destinationAddress: formData.destinationAddress,
          selectedToken: formData.selectedToken,
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm send handled in ConfirmationBalance page

  // Get available tokens
  const availableTokens = getAvailableTokens();

  // State for displaying current balance
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch current balance when token is selected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!formData.selectedToken) {
        setCurrentBalance(0);
        return;
      }

      setIsLoadingBalance(true);
      try {
        const balance = await getUserBalance(formData.selectedToken);
        setCurrentBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setCurrentBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [formData.selectedToken, getUserBalance]);

  // Helper function to get loading text for Continue button
  const getContinueButtonText = () => {
    if (isAnalyzing) return "Analyzing...";
    if (isValidating) return "Validating...";
    if (isLoadingBalance) return "Loading Balance...";
    return "Continue";
  };

  // Helper function to check if Continue button should be disabled
  const isContinueButtonDisabled = () => {
    return (
      !formData.selectedToken ||
      !formData.destinationAddress ||
      !formData.amount ||
      isLoading ||
      isAnalyzing ||
      isValidating ||
      isLoadingBalance
    );
  };

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            Send Coin
          </h1>
        </div>
      </div>

      <div className="flex flex-col px-[24px] space-y-4">
        {/* Token Selection */}
        <div>
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">
            Select Token
          </p>
          <select
            value={formData.selectedToken}
            onChange={(e) => handleTokenSelection(e.target.value)}
            className="w-full bg-white/10 border border-white/10 p-2 text-white rounded"
          >
            <option value="">Select a token</option>
            {availableTokens.map((token) => (
              <option key={token.tokenType} value={token.tokenType}>
                {token.displayName} ({token.symbol})
              </option>
            ))}
          </select>
          {errors.general && (
            <p className="text-red-400 text-xs mt-1">{errors.general}</p>
          )}
          
          {/* Current Balance Display */}
          {formData.selectedToken && (
            <div className="mt-2 p-2 bg-white/5 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[12px] text-white/60">Current Balance:</p>
                  <p className="text-[14px] text-white font-medium">
                    {isLoadingBalance ? (
                      "Loading..."
                    ) : (
                      `${currentBalance.toFixed(8)} ${formData.selectedToken}`
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev }));
                    // This will trigger the useEffect to refetch balance
                  }}
                  disabled={isLoadingBalance}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 transition-all duration-200"
                >
                  {isLoadingBalance ? (
                    <div className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "↻"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recipient Address */}
        <div>
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">
            Recipient Address
          </p>
          <input
            type="text"
            placeholder="Enter recipient address"
            value={formData.destinationAddress}
            onChange={(e) =>
              handleInputChange("destinationAddress", e.target.value)
            }
            className={`w-full bg-white/10 border p-2 text-white rounded ${
              errors.destinationAddress ? "border-red-500" : "border-white/10"
            }`}
          />
          {errors.destinationAddress && (
            <p className="text-red-400 text-xs mt-1">
              {errors.destinationAddress}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between items-center mb-[6px]">
            <p className="text-[14px] text-white/60 font-normal">
              Amount{" "}
              {formData.selectedToken
                ? `- ${formData.selectedToken.toUpperCase()}`
                : ""}
            </p>
            {formData.selectedToken && (
              <button
                onClick={handleMaxAmount}
                className="text-[#99E39E] text-xs hover:text-white transition-colors"
              >
                MAX
              </button>
            )}
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            className={`w-full bg-white/10 border p-2 text-white rounded ${
              errors.amount ? "border-red-500" : "border-white/10"
            }`}
            disabled={!formData.selectedToken}
          />
          {errors.amount && (
            <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
          )}
          
          {/* Balance Warning */}
          {formData.selectedToken && formData.amount && currentBalance > 0 && (
            <div className="mt-2 p-2 rounded text-xs">
              {parseFloat(formData.amount) > currentBalance ? (
                <p className="text-red-400">
                  ⚠️ Amount exceeds your balance of {currentBalance.toFixed(8)} {formData.selectedToken}
                </p>
              ) : (
                <p className="text-green-400">
                  ✓ Sufficient balance available
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className="flex flex-row items-center justify-center">
          <p className="text-[12px] text-white/60 font-normal">
            There will be extra steps
          </p>
          <Info className="w-[11px] h-[11px] text-[#99E39E] ml-1" />
        </div>

        {/* Continue Button */}
        <NeoButton
          onClick={handleAnalyzeAddress}
          disabled={isContinueButtonDisabled()}
          className={`w-full transition-all duration-200 ${
            isAnalyzing || isValidating || isLoadingBalance 
              ? 'opacity-80 cursor-not-allowed' 
              : 'hover:opacity-90'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {(isAnalyzing || isValidating || isLoadingBalance) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{getContinueButtonText()}</span>
          </div>
        </NeoButton>

        {/* Loading State Info */}
        {(isAnalyzing || isValidating || isLoadingBalance) && (
          <div className="text-center">
            <p className="text-[12px] text-white/60 font-normal">
              {isAnalyzing && "Analyzing address security..."}
              {isValidating && "Validating balance..."}
              {isLoadingBalance && "Loading balance..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Send;
