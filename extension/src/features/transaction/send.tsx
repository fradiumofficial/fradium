import { ChevronLeft, Info, AlertCircle, CheckCircle, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWallet } from "~lib/context/walletContext";
import { createHttpAgent, getTokenPriceKey } from "~lib/utils/utils";
import { useAuth } from "~lib/context/authContext";
import { ROUTES } from "~lib/constant/routes";
import { TxHistoryService } from "~service/txHistoryService";
import { Principal } from "@dfinity/principal";

type NetworkKey = "btc" | "eth" | "sol" | "icp";

function Send() {
  const navigate = useNavigate();
  const { walletActor, isAuthenticated, addresses, balances, balanceLoading, refreshAllBalances, sendIcrcTransfer, usdPrices, usdPriceLoading } = useWallet() as any;
  const { identity } = useAuth();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<"address" | "amount">("address");
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // Network selection state
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>("btc");
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);


  // Balance state - use context balances directly
  const [localBalance, setLocalBalance] = useState<string>("0.00");

  // Validation state
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Input refs
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Conservative gas buffer for ETH (Sepolia). Adjust if needed.
  const ETH_GAS_BUFFER = 0.0022; // ~0.0021255 observed in error


  // Get supported tokens based on address
  const supportedTokens = useMemo(() => {
    if (!recipientAddress.trim()) return [];
    
    // Simple address validation to determine supported tokens
    const address = recipientAddress.trim();
    
    // Check if it's a Bitcoin address
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
      return [{ id: "bitcoin", symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", icon: CDN.tokens.bitcoin }];
    }
    
    // Check if it's an Ethereum address
    if (address.startsWith('0x') && address.length === 42) {
      return [{ id: "ethereum", symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: CDN.tokens.eth }];
    }
    
    // Check if it's a Solana address
    if (address.length >= 32 && address.length <= 44 && !address.includes('-')) {
      return [{ id: "solana", symbol: "SOL", name: "Solana", chain: "Solana", icon: CDN.tokens.solana }];
    }
    
    // Check if it's an ICP Principal
    try {
      Principal.fromText(address);
      return [
        { id: "icp", symbol: "ICP", name: "Internet Computer", chain: "Internet Computer", icon: CDN.tokens.icp },
        { id: "ckbtc", symbol: "ckBTC", name: "Chain Key BTC", chain: "Internet Computer", icon: CDN.tokens.bitcoin },
        { id: "cketh", symbol: "ckETH", name: "Chain Key ETH", chain: "Internet Computer", icon: CDN.tokens.eth },
        { id: "fradium", symbol: "FUM", name: "Fradium", chain: "Internet Computer", icon: CDN.tokens.fradiumDark }
      ];
    } catch (_e) {
      // Not a valid Principal
    }
    
    return [];
  }, [recipientAddress]);

  // Current token balance and USD price
  const currentBalance = useMemo(() => {
    if (!selectedToken) return 0;
    return parseFloat(balances[selectedToken.id] || 0);
  }, [selectedToken, balances]);

  const currentUsdPrice = useMemo(() => {
    if (!selectedToken) return 0;
    
    const priceKey = getTokenPriceKey(selectedToken.id);
    return usdPrices[priceKey] || 0;
  }, [selectedToken, usdPrices]);

  const amountUsdValue = useMemo(() => {
    if (!amount || !currentUsdPrice) return 0;
    const n = parseFloat(amount);
    if (isNaN(n)) return 0;
    return n * currentUsdPrice;
  }, [amount, currentUsdPrice]);


  // Network options - only 4 main networks
  const networkOptions = [
    { key: "btc" as NetworkKey, name: "Bitcoin", symbol: "BTC", icon: CDN.tokens.bitcoin },
    { key: "eth" as NetworkKey, name: "Ethereum", symbol: "ETH", icon: CDN.tokens.eth },
    { key: "sol" as NetworkKey, name: "Solana", symbol: "SOL", icon: CDN.tokens.solana },
    { key: "icp" as NetworkKey, name: "Internet Computer", symbol: "ICP", icon: CDN.tokens.icp },
  ];

  // Get current network info
  const getCurrentNetwork = useCallback(() => {
    return networkOptions.find(network => network.key === selectedNetwork);
  }, [selectedNetwork]);

  // Get network display name
  const getNetworkDisplayName = useCallback((networkKey: NetworkKey) => {
    const network = networkOptions.find(n => n.key === networkKey);
    return network?.name || "Unknown Network";
  }, []);

  // Get currency symbol based on selected network
  const getCurrencySymbol = useCallback(() => {
    const network = getCurrentNetwork();
    return network?.symbol || "BTC";
  }, [getCurrentNetwork]);

  // Get decimal places for each network
  const getDecimalPlaces = useCallback(() => {
    switch (selectedNetwork) {
      case "btc": return 8; // Satoshi to BTC
      case "eth": return 6; // ETH displayed with up to 6 decimals
      case "sol": return 9;  // Lamports to SOL
      case "icp": return 8;  // ICP uses 8 decimal places
      default: return 8;
    }
  }, [selectedNetwork]);

  // Get balance from context based on selected network
  const getBalanceFromContext = useCallback(() => {
    return balances?.[selectedNetwork] || "0.000000";
  }, [balances, selectedNetwork]);

  // Get loading state from context
  const getLoadingFromContext = useCallback(() => {
    return balanceLoading?.[selectedNetwork] || false;
  }, [balanceLoading, selectedNetwork]);

  // Update local balance display when context balances change
  useEffect(() => {
    const contextBalance = getBalanceFromContext();
    const formattedBalance = parseFloat(contextBalance).toFixed(getDecimalPlaces());
    setLocalBalance(formattedBalance);
  }, [getBalanceFromContext, getDecimalPlaces]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isNetworkDropdownOpen && !(event.target as Element).closest('.network-dropdown')) {
        setIsNetworkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNetworkDropdownOpen]);

  // Step navigation handlers
  const handleTokenSelect = useCallback((token: any) => {
    setSelectedToken(token);
    setCurrentStep("amount");
    setAddressError(null);
    setAmountError(null);
    setError(null);
  }, []);

  const handleBackToAddress = useCallback(() => {
    setCurrentStep("address");
    setSelectedToken(null);
    setAmount("");
    setAmountError(null);
  }, []);

  // Network selection handlers
  const handleNetworkSelect = useCallback((networkKey: NetworkKey) => {
    setSelectedNetwork(networkKey);
    setIsNetworkDropdownOpen(false);
    // Clear form errors when network changes
    setAddressError(null);
    setAmountError(null);
    setError(null);
    setSuccess(null);
    // Trigger ICP balance refresh when selecting ICP to ensure latest and show loading
    if (networkKey === "icp") {
      try { refreshAllBalances?.() } catch {}
    }
  }, [refreshAllBalances]);

  // Validate recipient address
  const validateAddress = useCallback((address: string) => {
    if (!address.trim()) {
      setAddressError("Recipient address is required");
      return false;
    }

    // Check if address matches any supported token format
    const tokens = supportedTokens;
    if (tokens.length === 0) {
      setAddressError("Invalid address format for supported networks");
      return false;
    }

    setAddressError(null);
    return true;
  }, [supportedTokens]);

  // Validate amount
  const validateAmount = useCallback((amountStr: string) => {
    const numAmount = parseFloat(amountStr);

    if (!amountStr.trim()) {
      setAmountError("Amount is required");
      return false;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Please enter a valid positive amount");
      return false;
    }

    const balanceNum = currentBalance;
    if (numAmount > balanceNum) {
      setAmountError(`Insufficient balance. Available: ${balanceNum.toFixed(6)} ${selectedToken?.symbol || ""}`);
      return false;
    }

    // For ETH, ensure user leaves some balance for gas fees
    if (selectedToken?.id === "ethereum") {
      const maxSendable = Math.max(0, balanceNum - ETH_GAS_BUFFER);
      if (numAmount > maxSendable) {
        setAmountError(`Leave ~${ETH_GAS_BUFFER} ETH for gas. Max: ${maxSendable.toFixed(6)} ETH`);
        return false;
      }
    }

    setAmountError(null);
    return true;
  }, [currentBalance, selectedToken, ETH_GAS_BUFFER]);

  // Handle address input change
  const handleAddressChange = useCallback((value: string) => {
    setRecipientAddress(value);
    if (addressError) {
      validateAddress(value);
    }
  }, [addressError, validateAddress]);

  // Handle amount input change
  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    if (amountError) {
      validateAmount(value);
    }
  }, [amountError, validateAmount]);

  // Convert amount to blockchain units
  const convertToBlockchainUnits = useCallback((amountStr: string): bigint => {
    const amount = parseFloat(amountStr);

    switch (selectedNetwork) {
      case "btc":
        return BigInt(Math.floor(amount * 100000000)); // BTC to satoshi
      case "eth":
        return BigInt(Math.floor(amount * Math.pow(10, 18))); // ETH to wei
      case "sol":
        return BigInt(Math.floor(amount * 1000000000)); // SOL to lamports
      case "icp":
        return BigInt(Math.floor(amount * Math.pow(10, 8))); // ICP to smallest unit (8 decimals)
      default:
        return BigInt(0);
    }
  }, [selectedNetwork]);

  // Send transaction
  const handleSend = useCallback(async () => {
    if (!identity) {
      setError("Wallet not connected");
      return;
    }

    if (!selectedToken) {
      setError("Please select a token");
      return;
    }

    // Validate input before analysis
    const isAddressValid = validateAddress(recipientAddress);
    const isAmountValid = validateAmount(amount);
    if (!isAddressValid || !isAmountValid) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if this is an ICRC token that can use direct transfer
      const isIcrcToken = ["icp", "ckbtc", "cketh", "fradium"].includes(selectedToken.id);
      
      if (isIcrcToken) {
        // For ICRC tokens, use direct transfer with AI analysis
        navigate(ROUTES.ANALYZE_PROGRESS, { 
          state: { 
            address: recipientAddress, 
            isAnalyzing: true, 
            sendContext: { 
              amount: parseFloat(amount), 
              selectedNetwork: selectedToken.id,
              tokenType: selectedToken.id,
              isIcrcTransfer: true
            } 
          } 
        });
      } else {
        // For other tokens (BTC, ETH, SOL), use existing analyze flow
        navigate(ROUTES.ANALYZE_PROGRESS, { 
          state: { 
            address: recipientAddress, 
            isAnalyzing: true, 
            sendContext: { 
              amount, 
              selectedNetwork: selectedToken.id
            } 
          } 
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate transfer");
    } finally {
      setIsLoading(false);
    }
  }, [identity, recipientAddress, amount, selectedToken, validateAddress, validateAmount, navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  return (
    <div className="w-[375px] text-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-col px-[24px] pt-6 pb-4">
        <div className="flex flex-row items-center mb-4">
          <button
            onClick={currentStep === "address" ? handleBack : handleBackToAddress}
            className="p-1 hover:bg-white/10 rounded transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            {currentStep === "address" ? "Send to" : `Send ${selectedToken?.symbol || ""}`}
          </h1>
        </div>

        <img
          src={CDN.icons.sendCoin}
          alt="Send"
          className="w-[120px] h-[120px] right-0 left-0 mx-auto mt-[12px]"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col px-[24px] space-y-4 pb-6">
        {currentStep === "address" ? (
          <>
            {/* Address Input */}
            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="text-white/90 text-[13px] font-medium mb-2">Destination address</div>
              <div className="rounded-full border border-white/10 pl-4 pr-4 py-2.5">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Enter public address or name"
                  className="w-full bg-transparent text-white placeholder:text-white/40 text-sm outline-none font-mono"
                />
              </div>
              {addressError && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {addressError}
                </p>
              )}
            </div>

            {/* Supported Tokens */}
            {recipientAddress.trim() && (
              <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                <div className="text-[#B0B6BE] text-sm mb-2">Supported tokens</div>
                <div className="flex flex-col gap-2">
                  {supportedTokens.length === 0 ? (
                    <div className="rounded-lg p-4 text-center bg-[#1D222B] border border-[#2F3541] text-[#B0B6BE] text-xs">
                      No supported tokens detected for this address
                    </div>
                  ) : (
                    supportedTokens.map((token) => (
                      <button
                        key={token.id}
                        className="flex items-center gap-3 bg-[#1D222B] hover:bg-[#242A34] border border-[#2F3541] rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 hover:border-[#9BE4A0]/30"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <img src={token.icon} alt={token.name} className="w-6 h-6" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{token.name}</div>
                          <div className="text-[#B0B6BE] text-xs">
                            {token.symbol} • {token.chain}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#9BE4A0]" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Selected Token Card */}
            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="flex items-center gap-3">
                <img src={selectedToken?.icon} alt={selectedToken?.name} className="w-7 h-7" />
                <div className="flex-1">
                  <div className="text-white font-medium">{selectedToken?.name}</div>
                  <div className="text-[#B0B6BE] text-xs">
                    {selectedToken?.symbol} • {selectedToken?.chain}
                  </div>
                </div>
                <button
                  className="text-xs text-[#9BEB83] hover:text-white px-3 py-1 border border-[#9BEB83]/30 rounded hover:bg-[#9BEB83]/10 transition-colors"
                  onClick={handleBackToAddress}
                >
                  Change
                </button>
              </div>
            </div>

            {/* Balance Display */}
            <div className="text-center">
              <p className="text-[14px] text-white/60 font-normal mb-[6px]">Available Balance</p>
              <div className="flex items-center justify-center gap-2">
                {balanceLoading[selectedToken?.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-[18px] font-semibold text-white">
                    {currentBalance.toFixed(6)} {selectedToken?.symbol || ""}
                  </span>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white/90 text-[13px] font-medium">Amount</div>
                <div className="text-[#B0B6BE] text-xs">
                  Balance: {currentBalance.toFixed(6)} {selectedToken?.symbol || ""}
                </div>
              </div>
              <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {amount && (
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[#B0B6BE] text-xs">USD Value:</span>
                  <span className="text-[#9BE4A0] text-xs font-mono">
                    ${amountUsdValue.toFixed(2)}
                  </span>
                </div>
              )}
              {amountError && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {amountError}
                </p>
              )}
            </div>

            {/* Network Fee Info */}
            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-[#9BE4A0]" />
                <span className="text-white text-sm font-medium">Network Fee</span>
              </div>
              <div className="text-[#B0B6BE] text-xs">
                {selectedToken?.id === "ethereum" 
                  ? `~${ETH_GAS_BUFFER} ETH for gas fees`
                  : selectedToken?.id === "bitcoin"
                  ? "~0.00001 BTC network fee"
                  : selectedToken?.id === "solana"
                  ? "~0.000005 SOL network fee"
                  : "~0.0001 ICP network fee"
                }
              </div>
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !recipientAddress || !amount || !selectedToken}
              className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2 self-stretch flex-grow-0 hover:shadow-[0px_8px_12px_-4px_rgba(153,227,158,0.9),0px_0px_0px_1px_#C0DDB5] hover:from-[#A8E8A8] hover:to-[#5BBF65] active:scale-95 transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#99E39E] focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:active:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="w-auto h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
                    Sending...
                  </span>
                </span>
              ) : (
                <span className="w-auto h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
                  Continue
                </span>
              )}
            </button>
          </>
        )}

        {/* Success/Error Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Send;