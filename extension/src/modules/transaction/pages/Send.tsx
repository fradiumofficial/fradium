import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProfileHeader from "@/components/ui/header";
import { ChevronLeft, Info, AlertCircle } from "lucide-react";
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
import SendService from "@/services/sendService";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Analysis state
  const [analysisResult ] = useState<{
    isSafe: boolean;
    data: any;
    source: string;
  } | null>(null);

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
      const balance = await getUserBalance(formData.selectedToken);
      const amount = parseFloat(formData.amount);
      
      if (amount > balance) {
        setErrors(prev => ({ ...prev, amount: `Insufficient balance. You have ${balance.toFixed(8)} ${formData.selectedToken}` }));
        return false;
      }
      
      // Clear any previous balance errors
      setErrors(prev => ({ ...prev, amount: undefined }));
      return true;
    } catch (error) {
      console.error('Error validating balance:', error);
      setErrors(prev => ({ ...prev, amount: 'Failed to validate balance' }));
      return false;
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

  // Analyze address for security
  const handleAnalyzeAddress = async () => {
    if (!validateForm()) return;

    // Validate balance before proceeding
    const isBalanceValid = await validateBalance();
    if (!isBalanceValid) {
      return; // Error message already set by validateBalance
    }

    setIsAnalyzing(true);
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

      // 2. Save to scan history and navigate to result page
      console.log(
        "Analysis successful. Saving to scan history and navigating to result page."
      );
      try {
        saveComprehensiveAnalysisToScanHistory(finalResult);
      } catch (saveError) {
        console.warn("Failed to save to scan history:", saveError);
      }

      setShowConfirmation(true);

    } catch (err) {
      console.error('A critical error occurred during analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      // Do not block sending if analysis fails; show confirmation with caution
      toast.warn(`Analysis warning: ${errorMessage}`);
      setShowConfirmation(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and send transaction
  const handleConfirmSend = async () => {
    if (!validateForm() || !identity) return;

    setIsLoading(true);
    try {
      // Get sender address for the selected token
      const senderAddress = userWallet?.addresses?.find((addr) => {
        const addressTokenType = Object.keys(addr.token_type)[0];
        return addressTokenType === formData.selectedToken;
      })?.address;

      if (!senderAddress) {
        throw new Error("No sender address found for selected token");
      }

      // Send transaction using the service
      const result = await SendService.sendTransaction(
        {
          tokenType: formData.selectedToken,
          destinationAddress: formData.destinationAddress,
          amount: formData.amount,
          senderAddress,
        },
        identity
      );

      if (result.success) {
        toast.success("Transaction sent successfully!");
        navigate(ROUTES.WALLET_HOME); // Navigate back to wallet home page
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send transaction";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded disabled:opacity-50"
                >
                  ↻
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
          disabled={
            !formData.selectedToken ||
            !formData.destinationAddress ||
            !formData.amount ||
            isLoading ||
            isAnalyzing
          }
          className="w-full"
        >
          {isAnalyzing ? "Analyzing..." : "Continue"}
        </NeoButton>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => setShowConfirmation(false)}
            >
              ×
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Address Analysis Complete
              </h3>
              <p className="text-[#B0B6BE] text-sm">
                {analysisResult?.isSafe
                  ? "The address appears to be safe. You can proceed with the transaction."
                  : "The address has been flagged as potentially unsafe. Proceed with caution."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-[#1A1D23] p-3 rounded">
                <p className="text-[#B0B6BE] text-xs">Amount</p>
                <p className="text-white font-medium">
                  {formData.amount} {formData.selectedToken}
                </p>
              </div>

              <div className="bg-[#1A1D23] p-3 rounded">
                <p className="text-[#B0B6BE] text-xs">To</p>
                <p className="text-white font-medium text-sm break-all">
                  {formData.destinationAddress}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 rounded-lg bg-[#393E4B] text-[#B0B6BE] font-semibold hover:bg-[#4A4F58] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  analysisResult?.isSafe
                    ? "bg-[#99E39E] text-black hover:bg-[#8BD88B]"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isLoading ? "Sending..." : "Confirm Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Send;
