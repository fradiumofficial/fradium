// React & Hooks
import React, { useEffect, useState, useCallback, useRef } from "react";

// External Libraries
import { toast } from "react-toastify";
import QRCode from "qrcode";

// Providers & Context
import { useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";

// UI Components
import TransactionButton from "@/core/components/TransactionButton";
import NeoButton from "@/core/components/SidebarButton";
import CustomButton from "@/core/components/CustomButtonA";

// Modal Components
import AnalyzeProgressModal from "@/core/components/modals/AnalyzeProgressModal";
import WelcomingWalletModal from "@/core/components/modals/WelcomingWallet";

import { jsonStringify } from "@/core/lib/canisterUtils";
import { detectTokenType, TokenType, getPriceUSD, TOKENS_CONFIG, getAmountToken, amountToBaseUnit } from "@/core/lib/tokenUtils";
import { extractFeatures } from "@/core/services/ai/bitcoinAnalyzeService";

function isAmountExceedBalance(tokenType, sendAmount, currentAmount) {
  const amount = parseFloat(sendAmount);
  const balance = parseFloat(currentAmount);
  if (isNaN(amount) || isNaN(balance)) return false;
  if (amount <= 0) return true;
  switch (tokenType) {
    case TokenType.BITCOIN:
      return amountToBaseUnit(TokenType.BITCOIN, amount) > amountToBaseUnit(TokenType.BITCOIN, balance);
    case TokenType.SOLANA:
      return amountToBaseUnit(TokenType.SOLANA, amount) > amountToBaseUnit(TokenType.SOLANA, balance);
    case TokenType.ETHEREUM:
    case TokenType.FUM:
      return amount * 1e18 > balance * 1e18;
    default:
      return amount > balance;
  }
}

export default function AssetsPage() {
  const { identity } = useAuth();
  const { userWallet, network, hideBalance, updateNetworkValues, networkFilters, updateNetworkFilters, createWallet, hasConfirmedWallet, isCreatingWallet, setIsCreatingWallet } = useWallet();

  // ================= STATE MANAGEMENT =================

  // Modal States
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showNetworkFilter, setShowNetworkFilter] = useState(false);
  const [openReceive, setOpenReceive] = useState(false);
  const [qrDetail, setQrDetail] = useState({ open: false, coin: null });
  const [showAnalyzeAddressModal, setShowAnalyzeAddressModal] = useState(false);

  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  // Analysis States
  const [isAnalyzeAddressSafe, setIsAnalyzeAddressSafe] = useState(false);
  const [isAnalyzeAddressLoading, setIsAnalyzeAddressLoading] = useState(false);
  const [analyzeAddressData, setAnalyzeAddressData] = useState(null);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [analysisSource, setAnalysisSource] = useState("");

  // Send Form States
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [sendErrors, setSendErrors] = useState({});
  const [selectedTokenForSend, setSelectedTokenForSend] = useState(null);

  // Balance States
  const [tokenBalances, setTokenBalances] = useState({});
  const [tokenAmountValues, setTokenAmountValues] = useState({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // ================= TOKEN OPERATIONS FUNCTIONS =================

  // Validate address for different token types
  const validateAddress = (address, tokenType = null) => {
    if (!address || typeof address !== "string") {
      return { isValid: false, error: "Address is required" };
    }

    const detectedType = tokenType || detectTokenType(address);

    if (detectedType === TokenType.UNKNOWN) {
      return { isValid: false, error: "Unknown token type" };
    }

    return { isValid: true, tokenType: detectedType };
  };

  // Get balances for specific token type
  const getBalance = async (tokenType, addresses) => {
    const balances = {};
    const errors = {};

    switch (tokenType) {
      case TokenType.BITCOIN:
        for (const address of addresses) {
          try {
            const balance = await bitcoin.get_balance(address);
            balances[address] = Number(balance);
          } catch (error) {
            console.error(`Error getting Bitcoin balance for ${address}:`, error);
            errors[address] = error.message;
            balances[address] = 0;
          }
        }
        break;

      case TokenType.SOLANA:
        for (const address of addresses) {
          try {
            const balance = await solana.get_balance([address]);
            balances[address] = Number(balance);
          } catch (error) {
            console.error(`Error getting Solana balance for ${address}:`, error);
            errors[address] = error.message;
            balances[address] = 0;
          }
        }
        break;

      case TokenType.ETHEREUM:
        for (const address of addresses) {
          try {
            const balance = await ethereum.get_balance(address);
            if ("Ok" in balance) {
              balances[address] = Number(balance.Ok);
            } else {
              console.error(`Error getting Ethereum balance for ${address}:`, balance);
              errors[address] = balance.Err;
              balances[address] = 0;
            }
          } catch (error) {
            console.error(`Error getting Ethereum balance for ${address}:`, error);
            errors[address] = error.message;
            balances[address] = 0;
          }
        }
        break;

      case TokenType.FUM:
        // Placeholder for Ethereum/FUM - not implemented yet
        for (const address of addresses) {
          balances[address] = 0;
        }
        break;

      default:
        for (const address of addresses) {
          balances[address] = 0;
        }
        break;
    }

    return { balances, errors };
  };

  // Send token function
  const sendToken = async (tokenType, params) => {
    const { destinationAddress, amount, senderAddress } = params;

    // Validate destination address
    const validation = validateAddress(destinationAddress, tokenType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    switch (tokenType) {
      case TokenType.BITCOIN:
        try {
          const satoshiAmount = amountToBaseUnit(TokenType.BITCOIN, parseFloat(amount));
          const transactionId = await bitcoin.send_from_p2pkh_address({
            destination_address: destinationAddress,
            amount_in_satoshi: satoshiAmount,
          });
          return { transactionId, status: "completed", error: null };
        } catch (error) {
          throw new Error(`Bitcoin send failed: ${error.message}`);
        }

      case TokenType.SOLANA:
        try {
          const lamportAmount = amountToBaseUnit(TokenType.SOLANA, parseFloat(amount));
          const transactionId = await solana.send_sol([identity.getPrincipal()], destinationAddress, lamportAmount);
          return { transactionId, status: "completed", error: null };
        } catch (error) {
          throw new Error(`Solana send failed: ${error.message}`);
        }

      case TokenType.ETHEREUM:
      case TokenType.FUM:
        try {
          // Placeholder for Ethereum/FUM send - not implemented
          throw new Error("Ethereum transactions not yet implemented");
        } catch (error) {
          throw new Error(`Ethereum send failed: ${error.message}`);
        }

      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }
  };

  // Helper function to save analyze history
  const saveAnalyzeHistory = async (address, isSafe, analyzedType, metadata) => {
    try {
      await backend.create_analyze_history({
        address: address,
        is_safe: isSafe,
        analyzed_type: analyzedType,
        metadata: jsonStringify(metadata),
        token_type: getTokenTypeVariant(detectTokenType(address)),
      });
    } catch (historyError) {
      console.error("Failed to save analyze history:", historyError);
    }
  };

  // Helper function to perform AI analysis
  const performAIAnalysis = async (address) => {
    try {
      const tokenType = detectTokenType(address);

      switch (tokenType) {
        case TokenType.BITCOIN:
          // Bitcoin AI Analysis - Implemented
          const features = await extractFeatures(address);
          const ransomwareReport = await ai.analyze_btc_address(features, address, features.length);

          if ("Ok" in ransomwareReport) {
            return {
              isSafe: !ransomwareReport.Ok.is_ransomware,
              data: ransomwareReport.Ok,
              source: "ai",
            };
          }
          throw new Error("Bitcoin AI analysis failed");

        case TokenType.ETHEREUM:
          // Ethereum AI Analysis - NOT IMPLEMENT
          console.warn("Ethereum AI analysis not implemented yet");
          return null;

        case TokenType.SOLANA:
          // Solana AI Analysis - NOT IMPLEMENT
          console.warn("Solana AI analysis not implemented yet");
          return null;

        case TokenType.FUM:
          // Fradium AI Analysis - NOT IMPLEMENT
          console.warn("Fradium AI analysis not implemented yet");
          return null;

        default:
          // Unknown token type
          console.warn(`AI analysis not supported for token type: ${tokenType}`);
          return null;
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      return null;
    }
  };

  // Helper function to set analysis result
  const setAnalysisResult = (isSafe, data, source) => {
    setIsAnalyzeAddressSafe(isSafe);
    if (source === "community") {
      setAnalyzeAddressData(data);
    } else {
      setAiAnalysisData(data);
    }
    setAnalysisSource(source);
  };

  // Convert chain name to token type variant
  const getTokenTypeVariant = (chainName) => {
    switch (chainName) {
      case TokenType.BITCOIN:
        return { Bitcoin: null };
      case TokenType.ETHEREUM:
        return { Ethereum: null };
      case TokenType.SOLANA:
        return { Solana: null };
      case TokenType.FUM:
        return { Fum: null };
      default:
        return { Unknown: null };
    }
  };

  // ================= BALANCE MANAGEMENT =================

  // Get addresses for specific token type
  const getAddressesForToken = useCallback(
    (tokenType) => {
      if (!userWallet?.addresses) return [];

      return userWallet.addresses
        .filter((addressObj) => {
          const addressTokenType = Object.keys(addressObj.token_type)[0];
          return addressTokenType === tokenType;
        })
        .map((addressObj) => addressObj.address);
    },
    [userWallet?.addresses]
  );

  // Fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (!userWallet?.addresses) return;

    setIsLoadingBalances(true);
    const supportedTokens = Object.keys(TOKENS_CONFIG);

    try {
      for (const tokenType of supportedTokens) {
        if (networkFilters[tokenType]) {
          const addresses = getAddressesForToken(tokenType);

          if (addresses.length > 0) {
            try {
              const balanceResult = await getBalance(tokenType, addresses);

              setTokenBalances((prev) => ({
                ...prev,
                [tokenType]: balanceResult,
              }));

              const totalAmountInToken = Object.values(balanceResult.balances).reduce((sum, v) => sum + v, 0);

              // Pastikan amount dalam format yang readable
              const amount = getAmountToken(tokenType, totalAmountInToken);
              const value = await getPriceUSD(tokenType, totalAmountInToken);

              // Validate amount and value before saving
              const finalAmount = amount && amount !== "0" ? amount : "0";
              const finalValue = value && value !== "$NaN" && value !== "$0.00" ? value : "$0.00";

              const amountValueResult = {
                amount: finalAmount,
                value: finalValue,
                isLoading: false,
              };

              setTokenAmountValues((prev) => ({
                ...prev,
                [tokenType]: amountValueResult,
              }));
            } catch (error) {
              console.error(`Error fetching ${tokenType} data:`, error);
            }
          } else {
            // No addresses for this token type
            setTokenBalances((prev) => ({
              ...prev,
              [tokenType]: { balances: {}, errors: {} },
            }));
            setTokenAmountValues((prev) => ({
              ...prev,
              [tokenType]: { amount: "0", value: "$0.00", isLoading: false },
            }));
          }
        }
      }
    } finally {
      setIsLoadingBalances(false);
    }
  }, [userWallet?.addresses, networkFilters, getAddressesForToken]);

  // Get total portfolio value
  const getTotalPortfolioValue = useCallback(() => {
    let total = 0;

    for (const tokenType in tokenAmountValues) {
      const amountValue = tokenAmountValues[tokenType];
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        total += numericValue;
      }
    }

    return total;
  }, [tokenAmountValues]);

  // ================= TOKEN LIST PROCESSING =================

  const getTokenType = (addressObj) => {
    return Object.keys(addressObj.token_type)[0];
  };

  const isAddressForCurrentNetwork = (addressObj) => {
    if (network === "All Networks") {
      return true;
    }
    const addressNetwork = Object.keys(addressObj.network)[0];
    return addressNetwork.toLowerCase() === network.toLowerCase();
  };

  const getTokensForCurrentNetwork = () => {
    if (!userWallet?.addresses) return [];

    const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);
    const tokenGroups = {};

    networkAddresses.forEach((addressObj) => {
      const tokenType = getTokenType(addressObj);

      if (!networkFilters[tokenType]) {
        return;
      }

      if (!tokenGroups[tokenType]) {
        const config = TOKENS_CONFIG[tokenType];

        tokenGroups[tokenType] = {
          addresses: [],
          config,
        };
      }

      tokenGroups[tokenType].addresses.push(addressObj.address);
    });

    return Object.entries(tokenGroups).map(([tokenType, data]) => {
      const balanceResult = tokenBalances[tokenType] || { balances: {}, errors: {} };
      const amountValueResult = tokenAmountValues[tokenType] || { amount: "0", value: "$0.00", isLoading: false };

      return {
        ...data.config,
        tokenType,
        addresses: data.addresses,
        balances: balanceResult.balances,
        currentAmount: amountValueResult.amount || "0",
        currentValue: amountValueResult.value || "$0.00",
        isLoading: amountValueResult.isLoading || isLoadingBalances,
        hasError: Object.keys(balanceResult.errors || {}).length > 0,
      };
    });
  };

  // ================= EVENT HANDLERS =================

  // Wallet creation
  React.useEffect(() => {
    if (userWallet) {
      setIsCreatingWallet(false);
      return;
    }
    if (hasConfirmedWallet && !userWallet && !isCreatingWallet) {
      const create = async () => {
        setIsCreatingWallet(true);
        try {
          await createWallet();
        } catch (e) {
          console.error("Error creating wallet:", e);
        } finally {
          setIsCreatingWallet(false);
        }
      };
      create();
    }
  }, [hasConfirmedWallet, userWallet, createWallet, isCreatingWallet, setIsCreatingWallet]);

  // Send Modal Actions
  const handleSendClick = (token) => {
    const tokenWithAmount = {
      ...token,
      currentAmount: token.currentAmount || "0",
    };
    setSelectedToken(tokenWithAmount);
    setSelectedTokenForSend(tokenWithAmount);
    setShowSendModal(true);
  };

  const handleGeneralSendClick = () => {
    setSelectedToken(null);
    setSelectedTokenForSend(null);
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
    setShowSendModal(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedToken(null);
    setSelectedTokenForSend(null);
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
  };

  const handleTokenSelection = (selectedTokenType) => {
    const tokens = getTokensForCurrentNetwork();
    const token = tokens.find((t) => t.tokenType === selectedTokenType);
    if (token) {
      const tokenWithAmount = {
        ...token,
        currentAmount: token.currentAmount || "0",
      };
      setSelectedTokenForSend(tokenWithAmount);
      setSelectedToken(tokenWithAmount);
    } else {
      setSelectedTokenForSend(null);
      setSelectedToken(null);
    }
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
  };

  const handleAddressInput = (value) => {
    if (selectedTokenForSend) {
      setDestinationAddress(value);
      if (sendErrors.address) {
        setSendErrors((prev) => ({ ...prev, address: null }));
      }
    }
  };

  const handleAmountInput = (value) => {
    if (selectedTokenForSend) {
      setSendAmount(value);

      if (sendErrors.amount) {
        setSendErrors((prev) => ({ ...prev, amount: null }));
      }

      // Validate amount for Bitcoin
      if (value && !isNaN(value) && parseFloat(value) > 0) {
        if ((selectedTokenForSend?.tokenType === TokenType.BITCOIN || selectedTokenForSend?.tokenType === TokenType.SOLANA) && selectedTokenForSend?.currentAmount) {
          const requestedBase = amountToBaseUnit(selectedTokenForSend.tokenType, parseFloat(value));
          const currentBase = amountToBaseUnit(selectedTokenForSend.tokenType, parseFloat(selectedTokenForSend.currentAmount));
          if (requestedBase > currentBase) {
            setSendErrors((prev) => ({
              ...prev,
              amount: `Insufficient balance. Available: ${selectedTokenForSend.currentAmount} ${selectedTokenForSend.name}`,
            }));
          }
        }
      }
    }
  };

  const handleMaxAmount = () => {
    setSendAmount(selectedTokenForSend.currentAmount);
  };

  // Form validation
  const validateAddressField = (address) => {
    if (!address.trim()) {
      return "Recipient address is required";
    }
    const validation = validateAddress(address);
    return validation.isValid ? null : validation.error;
  };

  const validateAmountField = (amount, tokenType, balances) => {
    if (!amount.trim()) {
      return "Amount is required";
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return "Please enter a valid amount";
    }

    if (balances && Object.keys(balances).length > 0) {
      const currentAmount = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
      const requestedBase = amountToBaseUnit(tokenType, parseFloat(amount));
      if (requestedBase > currentAmount) {
        const displayAmount = getAmountToken(tokenType, currentAmount);
        return `Insufficient balance. Available: ${displayAmount} ${tokenType}`;
      }
    }
    return null;
  };

  // Network filter
  const toggleNetworkFilter = (networkName) => {
    const newFilters = {
      ...networkFilters,
      [networkName]: !networkFilters[networkName],
    };
    updateNetworkFilters(newFilters);
  };

  // Receive actions
  const handleReceiveClick = (token) => {
    setSelectedToken(token);
    setOpenReceive(true);
  };

  const receiveAddresses =
    userWallet?.addresses?.map((addressObj) => ({
      label: getTokenType(addressObj),
      address: addressObj.address,
    })) || [];

  // Address analysis
  const handleAnalyzeAddress = async () => {
    const addressError = validateAddressField(destinationAddress);
    const amountError = validateAmountField(sendAmount, selectedTokenForSend?.tokenType, selectedTokenForSend?.balances);

    // General validation for all tokens
    if (selectedTokenForSend?.currentAmount && isAmountExceedBalance(selectedTokenForSend.tokenType, sendAmount, selectedTokenForSend.currentAmount)) {
      setSendErrors((prev) => ({
        ...prev,
        amount: `Insufficient balance. Available: ${selectedTokenForSend.currentAmount} ${selectedTokenForSend.name}`,
      }));
      return;
    }

    if (addressError || amountError) {
      setSendErrors({
        address: addressError,
        amount: amountError,
      });
      return;
    }

    setShowSendModal(false);
    setIsAnalyzeAddressLoading(true);

    try {
      // Step 1: Try Community Analysis
      const communityReport = await backend.analyze_address(destinationAddress);

      if ("Ok" in communityReport) {
        const communityIsSafe = communityReport.Ok.is_safe;

        // Save community analysis history
        await saveAnalyzeHistory(destinationAddress, communityIsSafe, { CommunityVote: null }, communityReport.Ok);

        // Step 2: If community says safe, double-check with AI
        if (communityIsSafe) {
          const aiResult = await performAIAnalysis(destinationAddress);

          if (aiResult && !aiResult.isSafe) {
            // AI detected as unsafe, override community result
            await saveAnalyzeHistory(destinationAddress, false, { AIAnalysis: null }, aiResult.data);
            setAnalysisResult(false, aiResult.data, "ai");
          } else {
            // Use community result (safe)
            setAnalysisResult(true, communityReport.Ok, "community");
          }
        } else {
          // Community says unsafe, use community result
          setAnalysisResult(false, communityReport.Ok, "community");
        }
      } else {
        // Step 3: No community report, use AI analysis as fallback
        const aiResult = await performAIAnalysis(destinationAddress);

        if (aiResult) {
          await saveAnalyzeHistory(destinationAddress, aiResult.isSafe, { AIAnalysis: null }, aiResult.data);
          setAnalysisResult(aiResult.isSafe, aiResult.data, "ai");
        } else {
          // Both community and AI failed
          toast.error("Failed to analyze address. Please try again later.");
          setShowSendModal(true);
          return;
        }
      }

      setShowAnalyzeAddressModal(true);
    } catch (error) {
      console.error("Error analyzing address:", error);
      toast.error("Failed to analyze address. Please try again later.");
      setShowSendModal(true);
    } finally {
      setIsAnalyzeAddressLoading(false);
    }
  };

  // Send confirmation
  const handleConfirmSend = async () => {
    try {
      setIsSendLoading(true);

      const tokenType = selectedTokenForSend?.tokenType || detectTokenType(destinationAddress);

      const senderAddress = userWallet?.addresses?.find((addr) => {
        const addressTokenType = Object.keys(addr.token_type)[0];
        return addressTokenType === tokenType;
      })?.address;

      const sendResult = await sendToken(tokenType, {
        destinationAddress,
        amount: sendAmount,
        senderAddress,
      });

      // Create transaction history entry
      try {
        const getTokenTypeVariant = (tokenType) => {
          switch (tokenType) {
            case TokenType.BITCOIN:
              return { Bitcoin: null };
            case TokenType.ETHEREUM:
              return { Ethereum: null };
            case TokenType.SOLANA:
              return { Solana: null };
            case TokenType.FUM:
              return { Fum: null };
            default:
              return { Unknown: null };
          }
        };

        let baseAmount;
        let details;
        switch (tokenType) {
          case TokenType.BITCOIN:
            baseAmount = amountToBaseUnit(TokenType.BITCOIN, parseFloat(sendAmount));
            details = {
              Bitcoin: {
                txid: sendResult.transactionId || "pending",
                from_address: senderAddress ? [senderAddress] : [],
                to_address: destinationAddress,
                fee_satoshi: [],
                block_height: [],
              },
            };
            break;
          case TokenType.SOLANA:
            baseAmount = amountToBaseUnit(TokenType.SOLANA, parseFloat(sendAmount));
            details = {
              Solana: {
                signature: sendResult.transactionId || "pending",
                slot: [],
                sender: senderAddress || "",
                recipient: destinationAddress,
                lamports: baseAmount,
              },
            };
            break;
          default:
            // NOT IMPLEMENT
            return;
        }

        const transactionHistoryParams = {
          chain: getTokenTypeVariant(tokenType),
          direction: { Send: null },
          amount: baseAmount,
          timestamp: BigInt(Date.now() * 1000000),
          details,
          note: [`Sent ${sendAmount} ${tokenType} to ${destinationAddress.slice(0, 12)}...`],
        };

        console.log("transactionHistoryParams", jsonStringify(transactionHistoryParams));

        await backend.create_transaction_history(transactionHistoryParams);
      } catch (historyError) {
        console.error("Failed to create transaction history:", historyError);
      }

      // Reset states
      setIsSendLoading(false);
      setShowAnalyzeAddressModal(false);
      setSelectedToken(null);
      setSelectedTokenForSend(null);
      setDestinationAddress("");
      setSendAmount("");
      setSendErrors({});

      await fetchAllBalances();
      toast.success("Transaction sent successfully");
    } catch (error) {
      console.error("Error sending transaction:", error);
      if (error.message.includes("Insufficient balance")) {
        toast.error("Insufficient balance");
      } else if (error.message.includes("Invalid") && error.message.includes("address")) {
        toast.error("Invalid destination address");
      } else {
        toast.error("Error sending transaction");
      }
    } finally {
      setIsSendLoading(false);
    }
  };

  // ================= EFFECTS =================

  // Balance fetching
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Update network values
  const prevNetworkValuesRef = useRef();
  useEffect(() => {
    const networkValues = {
      "All Networks": getTotalPortfolioValue(),
      Bitcoin: 0,
      Ethereum: 0,
      Solana: 0,
      Fradium: 0,
    };

    for (const [tokenType, amountValue] of Object.entries(tokenAmountValues)) {
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        networkValues[tokenType] = numericValue;
      }
    }

    if (JSON.stringify(prevNetworkValuesRef.current) !== JSON.stringify(networkValues)) {
      updateNetworkValues(networkValues);
      prevNetworkValuesRef.current = networkValues;
    }
  }, [tokenAmountValues, updateNetworkValues, getTotalPortfolioValue]);

  // QR Code generation
  useEffect(() => {
    if (qrDetail.open && qrDetail.coin) {
      const address = receiveAddresses.find((a) => a.label === qrDetail.coin)?.address;
      if (address) {
        QRCode.toDataURL(address, {
          width: 320,
          margin: 1,
          scale: 8,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        })
          .then((url) => {
            setQrCodeDataUrl(url);
          })
          .catch((err) => {
            console.error("Error generating QR code:", err);
          });
      }
    }
  }, [qrDetail.open, qrDetail.coin, receiveAddresses]);

  // ================= RENDER HELPERS =================

  const formatPortfolioValue = (value) => {
    if (hideBalance) return "••••••";
    if (isLoadingBalances) return "Loading...";
    return `$${value.toFixed(2)}`;
  };

  const tokens = getTokensForCurrentNetwork();
  const totalPortfolioValue = getTotalPortfolioValue();

  // ================= COMPONENT RENDER =================

  if (isCreatingWallet || (!userWallet && hasConfirmedWallet)) {
    return <WelcomingWalletModal isOpen={true} />;
  }

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219] md:p-0 p-2">
        {/* Card Wallet - Sesuai Referensi */}
        <div className="relative w-full bg-white bg-opacity-5 pb-4 overflow-hidden border border-[#393E4B] md:p-0 p-2">
          {/* Pattern Background */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 md:w-80 md:h-80 w-40 h-40 z-0 pointer-events-none select-none object-cover object-right-top" />

          {/* Character Illustration - Positioned at top center */}
          <div className="relative z-10 flex justify-center mb-2">
            <img src="/assets/images/illus-wallet.png" alt="Wallet Character" className="w-full object-contain object-center" />
          </div>

          {/* Content */}
          <div className="relative z-20 text-center">
            <div className="text-white text-sm font-normal mb-1">Total Portfolio Value</div>
            <div className="text-white md:text-3xl text-2xl font-semibold mb-1">{formatPortfolioValue(totalPortfolioValue)}</div>
            <div className="text-[#9BE4A0] md:text-base text-sm font-medium md:mb-6 mb-3">{totalPortfolioValue === 0 ? "Top up your wallet to start using it!" : "Your portfolio is growing!"}</div>

            {/* Action Buttons */}
            <div className="flex md:gap-4 gap-2 w-full max-w-lg mx-auto">
              {/* Receive Button */}
              <div className="flex-1">
                <div className="relative bg-white bg-opacity-10 md:h-32 h-20 w-full md:p-4 p-2 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={() => handleReceiveClick(tokens[0])}>
                  <div className="absolute md:top-4 top-2 md:right-4 right-2">
                    <TransactionButton
                      icon="/assets/icons/received.svg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReceiveClick(tokens[0]);
                      }}
                      iconSize="md:w-6 md:h-6 w-5 h-5"
                    />
                  </div>
                  <div className="absolute md:bottom-4 bottom-2 md:left-4 left-2">
                    <div className="text-white md:text-xl text-base font-semibold">Receive</div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex-1">
                <div className="relative bg-white bg-opacity-10 md:h-32 h-20 w-full md:p-4 p-2 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={handleGeneralSendClick}>
                  <div className="absolute md:top-4 top-2 md:right-4 right-2">
                    <TransactionButton
                      icon="/assets/icons/send.svg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneralSendClick();
                      }}
                      iconSize="md:w-6 md:h-6 w-5 h-5"
                    />
                  </div>
                  <div className="absolute md:bottom-4 bottom-2 md:left-4 left-2">
                    <div className="text-white md:text-xl text-base font-semibold">Send</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="md:text-lg text-base font-semibold text-white">Tokens ({network})</h2>
            <div className="flex md:gap-4 gap-2">
              <img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4 cursor-pointer" />
              <img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4 cursor-pointer" onClick={() => setShowNetworkFilter(!showNetworkFilter)} />
            </div>
          </div>

          {/* Network Filter Toggle */}
          {showNetworkFilter && (
            <div className="mb-4 bg-[#1A1D23] border border-[#2A2D35] rounded-lg p-4">
              <div className="text-white text-sm font-medium mb-3">Network Filters</div>
              <div className="flex flex-col gap-2">
                {Object.entries(networkFilters).map(([networkName, isEnabled]) => (
                  <div key={networkName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={TOKENS_CONFIG[networkName]?.icon || "/assets/svg/tokens/unknown.svg"} alt={networkName} className="w-5 h-5" />
                      <span className="text-[#B0B6BE] text-sm">{networkName}</span>
                    </div>
                    <button onClick={() => toggleNetworkFilter(networkName)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? "bg-[#9BE4A0]" : "bg-[#393E4B]"}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isEnabled ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col divide-y divide-[#23272F]">
            {tokens.length > 0 ? (
              tokens.map((token, idx) => <TokenCard key={idx} token={token} onSendClick={handleSendClick} hideBalance={hideBalance} />)
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-[#B0B6BE] text-sm mb-2">No tokens found for {network}</div>
                  <div className="text-[#9BEB83] text-xs">Add addresses to see your tokens here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal Send Coin */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
            <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold" onClick={handleCloseSendModal} aria-label="Close">
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">Send {selectedToken?.name || "Token"}</div>
            <div className="flex flex-col items-center gap-2">
              <img src="/assets/images/image-send-coin.png" alt="Send Coin" className="w-32 h-32 object-contain" />
            </div>
            <div className="flex flex-col gap-4">
              {/* Token Selection Dropdown */}
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">Select Token</div>
                <select className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none" value={selectedTokenForSend ? selectedTokenForSend.tokenType : ""} onChange={(e) => handleTokenSelection(e.target.value)}>
                  <option value="">Select a token</option>
                  {tokens.map((token, index) => (
                    <option key={index} value={token.tokenType}>
                      {token.name} ({token.isLoading ? "Loading..." : hideBalance ? "••••" : token.currentAmount || "0"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">Recipient Address</div>
                <input type="text" className={`w-full bg-[#23272F] border rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none ${sendErrors.address ? "border-red-500" : "border-[#393E4B]"} ${!selectedTokenForSend ? "opacity-50 cursor-not-allowed" : ""}`} placeholder="Input your address" value={destinationAddress} disabled={!selectedTokenForSend} onChange={(e) => handleAddressInput(e.target.value)} />
                {sendErrors.address && <div className="text-red-400 text-xs mt-1">{sendErrors.address}</div>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[#B0B6BE] text-sm">Amount {selectedTokenForSend?.name?.toUpperCase() || ""}</div>
                  <div className="text-[#B0B6BE] text-xs">
                    Balance: {selectedTokenForSend?.isLoading ? "Loading..." : hideBalance ? "••••" : selectedTokenForSend?.currentAmount || "0"} {selectedTokenForSend?.name?.toUpperCase() || ""}
                  </div>
                </div>
                <div className="relative">
                  <input type="number" className={`w-full bg-[#23272F] border rounded px-3 py-2 pr-16 text-[#B0B6BE] text-sm outline-none ${sendErrors.amount ? "border-red-500" : "border-[#393E4B]"} ${!selectedTokenForSend ? "opacity-50 cursor-not-allowed" : ""}`} placeholder="0.00" value={sendAmount} disabled={!selectedTokenForSend} onChange={(e) => handleAmountInput(e.target.value)} />
                  <button type="button" className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium transition-colors ${selectedTokenForSend ? "text-[#9BEB83] hover:text-white cursor-pointer" : "text-[#6B7280] cursor-not-allowed"}`} onClick={handleMaxAmount} disabled={!selectedTokenForSend}>
                    MAX
                  </button>
                </div>
                {sendErrors.amount && <div className="text-red-400 text-xs mt-1">{sendErrors.amount}</div>}
              </div>
            </div>
            <CustomButton icon="/assets/icons/analyze-address-light.svg" className={`mt-2 w-full justify-center ${!selectedTokenForSend ? "opacity-50 cursor-not-allowed" : ""}`} onClick={handleAnalyzeAddress} disabled={!selectedTokenForSend}>
              Analyze Address
            </CustomButton>
          </div>
        </div>
      )}

      {/* Modal Progress Analyze Address */}
      <AnalyzeProgressModal isOpen={isAnalyzeAddressLoading} />

      {/* Modal Analyze Result */}
      {showAnalyzeAddressModal && (
        <AnalysisResultModal
          isOpen={showAnalyzeAddressModal}
          isSafe={isAnalyzeAddressSafe}
          analyzeData={analyzeAddressData}
          aiAnalysisData={aiAnalysisData}
          analysisSource={analysisSource}
          onClose={() => {
            setShowAnalyzeAddressModal(false);
          }}
          onConfirmSend={handleConfirmSend}
          isSendLoading={isSendLoading}
        />
      )}

      {/* Modal Receive Address */}
      {openReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`bg-[#23272F] px-6 py-8 w-full ${qrDetail.open ? "max-w-sm" : "max-w-md"} rounded-lg shadow-lg relative flex flex-col gap-6`}>
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => {
                setOpenReceive(false);
                setQrDetail({ open: false, coin: null });
              }}
              aria-label="Close">
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">{qrDetail.open ? `Receive ${qrDetail.coin}` : "Receive Coin"}</div>
            {qrDetail.open ? (
              // QR Detail View
              <div className="flex flex-col items-center gap-2">
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="w-full max-w-80 h-auto object-contain bg-white rounded" style={{ imageRendering: "crisp-edges" }} />}
                <div className="text-[#B0B6BE] text-sm">Scan to receive {qrDetail.coin}</div>
              </div>
            ) : (
              // Address List View
              <div className="flex flex-col gap-4">
                {receiveAddresses.map((item, idx) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="text-white text-sm font-medium">{item.label}:</div>
                    <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                      <span className="text-[#B0B6BE] text-sm truncate flex-1">{item.address}</span>
                      <img src="/assets/icons/qr_code.svg" alt="QR" className="w-5 h-5 cursor-pointer" onClick={() => setQrDetail({ open: true, coin: item.label })} />
                      <img
                        src="/assets/icons/content_copy.svg"
                        alt="Copy"
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(item.address);
                          toast.success("Address copied to clipboard!");
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {qrDetail.open && (
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">Your {qrDetail.coin && qrDetail.coin.toLowerCase()} address:</div>
                <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                  <span className="text-[#B0B6BE] text-sm truncate flex-1">{receiveAddresses.find((a) => a.label === qrDetail.coin)?.address}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              {qrDetail.open ? (
                <>
                  <CustomButton
                    icon="/assets/icons/content_copy.svg"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(receiveAddresses.find((a) => a.label === qrDetail.coin)?.address || "");
                      toast.success("Address copied to clipboard!");
                    }}>
                    Copy Address
                  </CustomButton>
                  <NeoButton
                    icon="/assets/icons/share.svg"
                    className="!w-12 !h-12 flex items-center justify-center"
                    onClick={() => {
                      /* share logic */
                    }}
                  />
                </>
              ) : (
                <CustomButton className="w-full" onClick={() => setOpenReceive(false)}>
                  Done
                </CustomButton>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Analysis Result Modal Component
function AnalysisResultModal({ isOpen, isSafe, analyzeData, aiAnalysisData, analysisSource, onClose, onConfirmSend, isSendLoading }) {
  if (!isOpen) return null;

  // Function to calculate time ago from timestamp
  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const timeDiff = now - Number(timestamp) / 1000000; // Convert nanoseconds to milliseconds
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  // Function to calculate risk score based on votes
  const calculateRiskScore = (votesYes, votesNo) => {
    const totalVotes = Number(votesYes) + Number(votesNo);
    if (totalVotes === 0) return "0/100";

    const yesPercentage = (Number(votesYes) / totalVotes) * 100;
    return `${Math.round(yesPercentage)}/100`;
  };

  const getStatusConfig = () => {
    const isCommunitySource = analysisSource === "community";
    const isAiSource = analysisSource === "ai";

    return {
      safe: {
        gradientColor: "from-[#22C55E]",
        borderColor: "border-[#9BE4A0]",
        icon: "/assets/icons/safe.png",
        title: "ADDRESS IS SAFE",
        description: isCommunitySource ? (analyzeData?.report && analyzeData.report.length > 0 ? "This address has been analyzed by the community and found to be safe" : "This address appears to be clean with no suspicious activity detected in our comprehensive database") : "This address has been analyzed by our AI system and appears to be safe with no ransomware activity detected",
        securityTitle: "Security Checks Passed",
        checkItems: isCommunitySource ? ["No links to known scam addresses", "No suspicious transaction pattern detected"] : ["No ransomware activity detected", "Passed AI security analysis"],
        riskScoreColor: "text-[#9BE4A0]",
        detectedBy: isCommunitySource ? "Detected By Community" : "Detected By AI Analysis",
      },
      danger: {
        gradientColor: "from-[#FF6B6B]",
        borderColor: "border-[#FF6B6B]",
        icon: "/assets/icons/danger.png",
        title: "ADDRESS IS NOT SAFE",
        description: isCommunitySource ? (analyzeData?.report && analyzeData.report.length > 0 ? "This address has been flagged by the community as potentially unsafe" : "This address appears to be flagged with suspicious activity detected in our comprehensive database") : "This address has been flagged by our AI system as potential ransomware with high confidence",
        securityTitle: "Security Checks Not Passed",
        checkItems: isCommunitySource ? ["Links to known scam addresses detected", "Suspicious transaction pattern detected"] : ["Ransomware activity detected", "Failed AI security analysis"],
        riskScoreColor: "text-red-400",
        detectedBy: isCommunitySource ? "Detected By Community" : "Detected By AI Analysis",
      },
    };
  };

  const config = getStatusConfig()[isSafe ? "safe" : "danger"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full bg-[#1A1D23] border border-[#2A2D35] rounded-md p-8 relative overflow-hidden max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Pattern background */}
        <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top" />

        <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold z-20" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="w-full flex flex-col gap-6 relative z-10">
          {/* Status */}
          <span className="text-[#FFFFFF] font-semibold text-xl">Analyze Address</span>
          <div className="overflow-hidden mb-2 bg-[#FFFFFF] bg-opacity-5">
            {/* Bagian atas dengan gradient */}
            <div className="relative w-full">
              <div className={`absolute top-0 left-0 w-full h-20 bg-gradient-to-b ${config.gradientColor}/15 via-${config.gradientColor}/15 via-${config.gradientColor}/15 to-transparent z-0`} />
              <div className="relative flex items-center gap-4 px-6 pt-4 pb-2 z-10">
                <img src={config.icon} alt={isSafe ? "Safe" : "Danger"} className="w-12 h-12 object-contain" />
                <div>
                  <div className="text-[#FFFFFF] font-semibold text-sm leading-tight">{config.title}</div>
                  <div className="text-[#B0B6BE] text-xs">{config.detectedBy}</div>
                </div>
              </div>
            </div>
            {/* Bagian bawah deskripsi */}
            <div className="px-6 pb-4">
              <div className="text-[#B0B6BE] text-sm font-normal">{config.description}</div>
            </div>
          </div>

          {/* Address Details */}
          <p className="text-[#FFFFFF] font-semibold text-lg">Address Details</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {analysisSource === "community" ? (
              <>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-white text-base font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? analyzeData.report[0].voted_by.length : "0"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-4 h-4" />
                    Total Voters
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? `${analyzeData.report[0].votes_yes} Yes / ${analyzeData.report[0].votes_no} No` : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-4 h-4" />
                    Vote Results
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className={`text-base font-medium ${config.riskScoreColor}`}>{analyzeData?.report && analyzeData.report.length > 0 ? calculateRiskScore(analyzeData.report[0].votes_yes, analyzeData.report[0].votes_no) : "0/100"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? getTimeAgo(analyzeData.report[0].created_at) : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-4 h-4" />
                    Report Created
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-white text-base font-medium">{aiAnalysisData?.transactions_analyzed || "0"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Transactions" className="w-4 h-4" />
                    Transactions Analyzed
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData?.confidence_level || "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Confidence" className="w-4 h-4" />
                    Confidence Level
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className={`text-base font-medium ${config.riskScoreColor}`}>{aiAnalysisData ? `${Math.round(aiAnalysisData.ransomware_probability * 100)}/100` : "0/100"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-4 h-4" />
                    Ransomware Probability
                  </span>
                </div>
                <div className="bg-[#FFFFFF0D] bg-opacity-5 px-4 py-3 flex flex-col">
                  <span className="text-[#FFFFFF] text-base font-medium">{aiAnalysisData ? aiAnalysisData.threshold_used.toFixed(2) : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Threshold" className="w-4 h-4" />
                    AI Threshold
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Security Checks */}
          <div className={`px-6 py-5 mb-2 border-l-2 ${config.borderColor} relative overflow-hidden bg-[#FFFFFF0D] bg-opacity-5`}>
            <div className={`absolute left-0 top-0 h-full w-2/5 bg-gradient-to-r ${config.gradientColor}/15 via-${config.gradientColor}/15 to-transparent pointer-events-none`} />
            <div className="relative z-10">
              <div className="text-[#FFFFFF] font-bold mb-2">{config.securityTitle}</div>
              <ul className="flex flex-col gap-1">
                {config.checkItems.map((item, idx) => (
                  <li key={idx} className={`flex items-center gap-2 ${isSafe ? "text-[#22C55E]" : "text-[#FF6B6B]"} text-sm`}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill={isSafe ? "#9BE4A0" : "#FF6B6B"} />
                      <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[#FFFFFF]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Report Details - Only show if there's a community report */}
          {analysisSource === "community" && analyzeData?.report && analyzeData.report.length > 0 && (
            <div className="px-6 py-5 mb-2 bg-[#FFFFFF0D] bg-opacity-5 relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[#FFFFFF] font-bold mb-3">Report Details</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[#B0B6BE] text-sm mb-1">Category</div>
                    <div className="text-white text-base font-medium capitalize">{analyzeData.report[0].category}</div>
                  </div>
                  <div>
                    <a href={`/reports/${analyzeData.report[0].report_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#9BEB83] text-sm font-medium hover:text-white transition-colors">
                      <span>View Full Report</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isSafe ? (
            <button className="w-full mt-2 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] hover:text-white transition" onClick={onConfirmSend} disabled={isSendLoading}>
              {isSendLoading ? "Sending..." : "Confirm Send"}
            </button>
          ) : (
            <>
              {/* Caution Warning for Unsafe Address */}
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-red-400 font-semibold text-sm mb-1">⚠️ Caution Required</div>
                    <div className="text-red-300 text-xs leading-relaxed">This address has been flagged as potentially unsafe. Proceeding with this transaction may result in loss of funds. Please verify the recipient address carefully before confirming.</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3 rounded-lg bg-[#23272F] text-[#B0B6BE] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] hover:text-white transition" onClick={onClose}>
                  Cancel
                </button>
                <button className="flex-1 py-3 rounded-lg bg-[#23272F] text-[#FF6B6B] font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition" onClick={onConfirmSend} disabled={isSendLoading}>
                  {isSendLoading ? "Sending..." : "Confirm Transaction"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Token card component using clean architecture data
function TokenCard({ token, onSendClick, hideBalance }) {
  const handleCardClick = () => {
    // Pass token data including current amount to send modal
    onSendClick({
      ...token,
      currentAmount: token.currentAmount,
      currentValue: token.currentValue,
    });
  };

  return (
    <div className="flex items-center md:px-2 px-1 md:py-4 py-2 md:gap-4 gap-2 cursor-pointer hover:bg-[#181C22] transition-colors rounded-lg" onClick={handleCardClick}>
      <img src={token.icon} alt={token.name} className="md:w-10 md:h-10 w-8 h-8" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center md:gap-2 gap-1">
          <span className="text-white md:font-semibold font-medium md:text-base text-sm">{token.name}</span>
          {token.symbol && <span className="text-[#B0B6BE] md:text-base text-xs">• {token.symbol}</span>}
        </div>
        <div className="text-[#B0B6BE] md:text-sm text-xs truncate">{token.description}</div>
        {token.hasError && <div className="text-red-400 text-xs mt-1">Error fetching balance</div>}
      </div>
      <div className="flex flex-col items-end gap-2">
        {token.isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full md:h-4 md:w-4 h-3 w-3 border-b-2 border-[#9BEB83]"></div>
            <span className="text-[#B0B6BE] md:text-sm text-xs">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-white md:font-semibold font-medium md:text-base text-sm">{hideBalance ? "••••" : token.currentAmount}</span>
            <span className="text-[#B0B6BE] md:text-sm text-xs">{hideBalance ? "••••" : token.currentValue}</span>
          </>
        )}
      </div>
    </div>
  );
}
