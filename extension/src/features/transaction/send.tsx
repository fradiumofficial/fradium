import ProfileHeader from "~components/header";
import { ChevronLeft, Info, AlertCircle, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "~lib/context/walletContext";
import { useAuth } from "~lib/context/authContext";

type NetworkKey = "btc" | "eth" | "sol" | "fra";

function Send() {
  const navigate = useNavigate();
  const { walletActor, isAuthenticated, addresses } = useWallet();
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

  // Balance state
  const [balance, setBalance] = useState<string>("0.00");
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  // Validation state
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Network options
  const networkOptions = [
    { key: "btc" as NetworkKey, name: "Bitcoin", symbol: "BTC", icon: CDN.tokens.bitcoin },
    { key: "eth" as NetworkKey, name: "Ethereum", symbol: "ETH", icon: CDN.tokens.eth },
    { key: "sol" as NetworkKey, name: "Solana", symbol: "SOL", icon: CDN.tokens.solana },
    { key: "fra" as NetworkKey, name: "Fradium", symbol: "FUM", icon: CDN.tokens.fum },
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
      case "eth": return 18; // Wei to ETH
      case "sol": return 9;  // Lamports to SOL
      case "fra": return 8;  // FUM decimals
      default: return 8;
    }
  }, [selectedNetwork]);

  // Fetch balance from wallet canister
  const fetchBalance = useCallback(async () => {
    if (!walletActor || !identity) return;

    setIsFetchingBalance(true);
    try {
      let balanceValue: string = "0.00";

      switch (selectedNetwork) {
        case "btc":
          const btcBalance = await walletActor.bitcoin_balance();
          const btcValue = Number(btcBalance) / 100000000; // Convert satoshi to BTC
          balanceValue = btcValue.toFixed(getDecimalPlaces());
          break;
        case "eth":
          const ethBalance = await walletActor.ethereum_balance();
          balanceValue = ethBalance; // Already formatted as string
          break;
        case "sol":
          const solBalance = await walletActor.solana_balance();
          const solValue = Number(solBalance) / 1000000000; // Convert lamports to SOL
          balanceValue = solValue.toFixed(getDecimalPlaces());
          break;
        case "fra":
          // Fradium balance - would need to be implemented
          balanceValue = "0.00";
          break;
      }

      setBalance(balanceValue);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
    } finally {
      setIsFetchingBalance(false);
    }
  }, [walletActor, identity, selectedNetwork, getDecimalPlaces]);

  // Fetch balance when network changes or component mounts
  useEffect(() => {
    if (isAuthenticated && walletActor) {
      fetchBalance();
    } else {
      setBalance("0.00");
    }
  }, [selectedNetwork, isAuthenticated, walletActor, fetchBalance]);

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
  }, []);

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

    const balanceNum = parseFloat(balance);
    if (numAmount > balanceNum) {
      setAmountError(`Insufficient balance. Available: ${balance} ${getCurrencySymbol()}`);
      return false;
    }

    setAmountError(null);
    return true;
  }, [balance, getCurrencySymbol]);

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
      case "fra":
        return BigInt(Math.floor(amount * Math.pow(10, 8))); // FUM to smallest unit
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

    // Validate all inputs
    const isAddressValid = validateAddress(recipientAddress);
    const isAmountValid = validateAmount(amount);

    if (!isAddressValid || !isAmountValid) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let txResult: string;

      const blockchainAmount = convertToBlockchainUnits(amount);

      switch (selectedNetwork) {
        case "btc":
          const btcRequest = {
            destination_address: recipientAddress,
            amount_in_satoshi: blockchainAmount
          };
          txResult = await walletActor.bitcoin_send(btcRequest);
          break;

        case "eth":
          txResult = await walletActor.ethereum_send(recipientAddress, blockchainAmount);
          break;

        case "sol":
          txResult = await walletActor.solana_send(recipientAddress, blockchainAmount);
          break;

        default:
          throw new Error("Network not supported for sending");
      }

      setSuccess(`Transaction successful! TX: ${txResult}`);

      // Reset form
      setRecipientAddress("");
      setAmount("");

      // Refresh balance
      await fetchBalance();

    } catch (error) {
      console.error("Send transaction failed:", error);
      setError(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  }, [walletActor, identity, recipientAddress, amount, selectedNetwork, validateAddress, validateAmount, convertToBlockchainUnits, fetchBalance]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center mb-4">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-white/10 rounded"
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
            {isFetchingBalance ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-[18px] font-semibold text-white">
                {balance} {getCurrencySymbol()}
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
              className="w-full bg-white/10 border border-white/10 p-3 text-white rounded flex items-center justify-between hover:bg-white/5 transition-colors"
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
                    className={`w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 first:rounded-t last:rounded-b ${
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
        <NeoButton
          onClick={handleSend}
          disabled={isLoading || !recipientAddress || !amount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            `Send ${getCurrencySymbol()}`
          )}
        </NeoButton>
      </div>
    </div>
  );
}

export default Send;