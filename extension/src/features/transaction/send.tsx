import { ChevronLeft, Info, AlertCircle, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "~lib/context/walletContext";
import { createHttpAgent } from "~lib/utils/utils";
import { useAuth } from "~lib/context/authContext";
import { ROUTES } from "~lib/constant/routes";
import { TxHistoryService } from "~service/txHistoryService";
import { Principal } from "@dfinity/principal";

type NetworkKey = "btc" | "eth" | "sol" | "icp" | "fra";

function Send() {
  const navigate = useNavigate();
  const { walletActor, isAuthenticated, addresses, balances, balanceLoading, refreshAllBalances } = useWallet() as any;
  const { identity } = useAuth();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Network selection state
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>("btc");
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  // Balance state - use context balances directly
  const [localBalance, setLocalBalance] = useState<string>("0.00");

  // Validation state
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Conservative gas buffer for ETH (Sepolia). Adjust if needed.
  const ETH_GAS_BUFFER = 0.0022; // ~0.0021255 observed in error

  // Network options
  const networkOptions = [
    { key: "btc" as NetworkKey, name: "Bitcoin", symbol: "BTC", icon: CDN.tokens.bitcoin },
    { key: "eth" as NetworkKey, name: "Ethereum", symbol: "ETH", icon: CDN.tokens.eth },
    { key: "sol" as NetworkKey, name: "Solana", symbol: "SOL", icon: CDN.tokens.solana },
    { key: "icp" as NetworkKey, name: "Internet Computer", symbol: "ICP", icon: CDN.tokens.icp },
    { key: "fra" as NetworkKey, name: "Fradium", symbol: "FUM", icon: CDN.tokens.fradiumDark },
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
      case "fra": return 8;  // Fradium uses 8 decimal places
      default: return 8;
    }
  }, [selectedNetwork]);

  // Get balance from context based on selected network
  const getBalanceFromContext = useCallback(() => {
    const tokenId = selectedNetwork === "fra" ? "fradium" : selectedNetwork;
    return balances?.[tokenId] || "0.000000";
  }, [balances, selectedNetwork]);

  // Get loading state from context
  const getLoadingFromContext = useCallback(() => {
    const tokenId = selectedNetwork === "fra" ? "fradium" : selectedNetwork;
    return balanceLoading?.[tokenId] || false;
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

    // Basic validation based on network
    switch (selectedNetwork) {
      case "btc":
        // Bitcoin address validation (simplified)
        if (!address.startsWith('1') && !address.startsWith('3') && !address.startsWith('bc1')) {
          setAddressError("Invalid Bitcoin address format");
          return false;
        }
        break;
      case "eth":
        // Ethereum address validation
        if (!address.startsWith('0x') || address.length !== 42) {
          setAddressError("Invalid Ethereum address format");
          return false;
        }
        break;
      case "sol":
        // Solana address validation (simplified)
        if (address.length < 32 || address.length > 44) {
          setAddressError("Invalid Solana address format");
          return false;
        }
        break;
      case "icp":
        // Require a valid Principal for ICRC transfer
        try {
          Principal.fromText(address);
        } catch (_e) {
          setAddressError("Enter a valid ICP Principal ID (not account ID)");
          return false;
        }
        break;
      case "fra":
        // Fradium Principal/Account validation (similar to ICP)
        if (address.length < 27 || address.length > 64) {
          setAddressError("Invalid Fradium Principal or Account ID format");
          return false;
        }
        // Additional validation for Fradium format (basic check)
        if (!address.includes('-') && !address.startsWith('aaaaa-aa')) {
          setAddressError("Invalid Fradium address format");
          return false;
        }
        break;
    }

    setAddressError(null);
    return true;
  }, [selectedNetwork]);

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

    const balanceNum = parseFloat(localBalance);
    if (numAmount > balanceNum) {
      setAmountError(`Insufficient balance. Available: ${localBalance} ${getCurrencySymbol()}`);
      return false;
    }

    // For ETH, ensure user leaves some balance for gas fees
    if (selectedNetwork === "eth") {
      const maxSendable = Math.max(0, balanceNum - ETH_GAS_BUFFER);
      if (numAmount > maxSendable) {
        setAmountError(`Leave ~${ETH_GAS_BUFFER} ETH for gas. Max: ${maxSendable.toFixed(6)} ETH`);
        return false;
      }
    }

    setAmountError(null);
    return true;
  }, [localBalance, getCurrencySymbol]);

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
      case "fra":
        return BigInt(Math.floor(amount * Math.pow(10, 8))); // Fradium to smallest unit (8 decimals)
      default:
        return BigInt(0);
    }
  }, [selectedNetwork]);

  // Send transaction
  const handleSend = useCallback(async () => {
    if (!walletActor || !identity) {
      setError("Wallet not connected");
      return;
    }

    // Validate input before analysis
    const isAddressValid = validateAddress(recipientAddress);
    const isAmountValid = validateAmount(amount);
    if (!isAddressValid || !isAmountValid) return;

    // Navigate to analyze flow for all tokens (including ICP)
    navigate(ROUTES.ANALYZE_PROGRESS, { state: { address: recipientAddress, isAnalyzing: true, sendContext: { amount, selectedNetwork } } });
  }, [walletActor, identity, recipientAddress, amount, selectedNetwork, validateAddress, validateAmount, convertToBlockchainUnits, navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto">
      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center mb-4">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-white/10 rounded transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            Send {getNetworkDisplayName(selectedNetwork)}
          </h1>
        </div>

        <img
          src={CDN.icons.sendCoin}
          alt="Send"
          className="w-[120px] h-[120px] right-0 left-0 mx-auto mt-[12px]"
        />

        {/* Balance Display */}
        <div className="text-center mt-4">
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">Available Balance</p>
          <div className="flex items-center justify-center gap-2">
            {getLoadingFromContext() ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-[18px] font-semibold text-white">
                {localBalance} {getCurrencySymbol()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-[24px] space-y-4">
        {/* Network Selection */}
        <div>
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">Select Network</p>
          <div className="relative network-dropdown">
            <button
              type="button"
              onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
              className="w-full bg-white/10 border border-white/10 p-3 text-white rounded flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <div className="flex items-center gap-3">
                <img
                  src={getCurrentNetwork()?.icon}
                  alt={getCurrentNetwork()?.name}
                  className="w-6 h-6"
                />
                <span>{getNetworkDisplayName(selectedNetwork)}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isNetworkDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-[#1F2025] border border-white/10 rounded shadow-lg z-10">
                {networkOptions.map((network) => (
                  <button
                    key={network.key}
                    type="button"
                    onClick={() => handleNetworkSelect(network.key)}
                    className={`w-full p-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 first:rounded-t last:rounded-b cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 ${
                      selectedNetwork === network.key ? 'bg-[#9BE4A0]/20 border-l-2 border-[#9BE4A0]' : ''
                    }`}
                  >
                    <img
                      src={network.icon}
                      alt={network.name}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="text-white font-medium">{network.name}</div>
                      <div className="text-white/60 text-sm">{network.symbol}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Recipient Address */}
        <div>
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">Recipient Address</p>
          <input
            type="text"
            placeholder={`Enter ${getNetworkDisplayName(selectedNetwork)} address`}
            className={`w-full bg-white/10 border p-3 text-white rounded ${
              addressError ? 'border-red-500' : 'border-white/10'
            }`}
            value={recipientAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => validateAddress(recipientAddress)}
          />
          {addressError && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {addressError}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <p className="text-[14px] text-white/60 font-normal mb-[6px]">
            Amount - {getCurrencySymbol()}
          </p>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            className={`w-full bg-white/10 border p-3 text-white rounded ${
              amountError ? 'border-red-500' : 'border-white/10'
            }`}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onBlur={() => validateAmount(amount)}
          />
          {amountError && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {amountError}
            </p>
          )}
          {selectedNetwork === "eth" && !amountError && (
            <p className="text-white/50 text-xs mt-1">
              Tip: Leave about {ETH_GAS_BUFFER} ETH for gas fees.
            </p>
          )}
        </div>

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

        {/* Info Message */}
        <div className="flex flex-row items-center justify-center gap-2">
          <p className="text-[12px] text-white/60 font-normal">
            Transaction will be processed on {getNetworkDisplayName(selectedNetwork)} network
          </p>
          <Info className="w-[11px] h-[11px] text-[#99E39E]" />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !recipientAddress || !amount}
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
              {`Send ${getCurrencySymbol()}`}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Send;