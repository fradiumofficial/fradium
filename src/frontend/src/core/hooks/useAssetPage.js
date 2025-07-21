// React & Hooks
import { useState, useEffect, useRef } from "react";

// External Libraries
import { toast } from "react-toastify";
import QRCode from "qrcode";

// Canister Declarations
import { backend } from "declarations/backend";

// Core Utilities
import { jsonStringify } from "@/core/lib/canisterUtils";
import { BitcoinService } from "@/core/services/tokens/implementations/BitcoinService";

// Custom Hooks
import { useTokenOperations, useTokenBalances } from "@/core/hooks/useTokenOperations";

// Services & Factories
import { TokenServiceFactory } from "@/core/services/tokens/TokenServiceFactory";

// Configuration
import { TOKENS_CONFIG } from "@/core/config/tokens.config";

export const useAssetPage = (userWallet, network, networkFilters, updateNetworkFilters, updateNetworkValues) => {
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

  // Clean Architecture Hooks
  const { sendToken, detectTokenType } = useTokenOperations();
  const { tokenBalances, tokenAmountValues, isLoading: isLoadingBalances, fetchAllBalances, getTotalPortfolioValue, networkValues: calculatedNetworkValues } = useTokenBalances(userWallet, networkFilters);

  // Synchronous token amount formatting
  const formatTokenAmount = (amount, tokenType) => {
    if (amount === 0) return "0";
    const config = TOKENS_CONFIG[tokenType];
    if (config) {
      const displayAmount = amount / config.unitConversion.factor;
      return displayAmount.toString().replace(/\.?0+$/, "");
    }
    return amount.toString().replace(/\.?0+$/, "");
  };

  // Token Type Utilities
  const getTokenType = (addressObj) => {
    return Object.keys(addressObj.token_type)[0];
  };

  const detectChain = (address) => {
    if (!address) return "Unknown";
    if (address.startsWith("0x") && address.length === 42) {
      return "Ethereum";
    } else if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) {
      return "Bitcoin";
    } else if (address.length === 44) {
      return "Solana";
    } else if (address.startsWith("cosmos")) {
      return "Cosmos";
    }
    return "Unknown";
  };

  const getTokenTypeVariant = (chainName) => {
    switch (chainName) {
      case "Bitcoin":
        return { Bitcoin: null };
      case "Ethereum":
        return { Ethereum: null };
      case "Solana":
        return { Solana: null };
      default:
        return { Unknown: null };
    }
  };

  const isAddressForCurrentNetwork = (addressObj) => {
    if (network === "All Networks") {
      return true;
    }
    const addressNetwork = Object.keys(addressObj.network)[0];
    return addressNetwork.toLowerCase() === network.toLowerCase();
  };

  // Form Validation
  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Recipient address is required";
    }
    return null;
  };

  const validateAmount = (amount, tokenType, balances) => {
    if (!amount.trim()) {
      return "Amount is required";
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return "Please enter a valid amount";
    }
    if (tokenType === "Bitcoin" && balances && Object.keys(balances).length > 0) {
      const currentAmount = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
      const requestedSatoshis = BitcoinService.btcToSatoshis(parseFloat(amount));
      if (requestedSatoshis > currentAmount) {
        return `Insufficient balance. Available: ${formatTokenAmount(currentAmount, tokenType)} ${tokenType}`;
      }
    }
    return null;
  };

  // Send Modal Actions
  const handleConfirmSend = async () => {
    try {
      setIsSendLoading(true);

      const tokenType = selectedTokenForSend?.tokenType || detectTokenType(destinationAddress);

      if (!TokenServiceFactory.isSupported(tokenType)) {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }

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
        const tokenService = await TokenServiceFactory.getService(tokenType);
        const baseAmount = tokenService.toBaseUnit(parseFloat(sendAmount));

        const transactionHistoryParams = {
          chain: tokenService.getTokenTypeVariant(),
          direction: { Send: null },
          amount: baseAmount,
          timestamp: BigInt(Date.now() * 1000000),
          details: {
            [tokenType]: {
              txid: sendResult.transactionId || "pending",
              from_address: senderAddress ? [senderAddress] : [],
              to_address: destinationAddress,
              fee_satoshi: [],
              block_height: [],
            },
          },
          note: [`Sent ${sendAmount} ${tokenType} to ${destinationAddress.slice(0, 12)}...`],
        };

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
      } else if (error.message.includes("Failed to decode address")) {
        toast.error("Invalid destination address");
      } else {
        toast.error("Error sending transaction");
      }
    } finally {
      setIsSendLoading(false);
    }
  };

  const handleMaxAmount = () => {
    if (selectedTokenForSend?.currentAmount && selectedTokenForSend?.tokenType === "Bitcoin") {
      const btcAmount = BitcoinService.satoshisToBTC(selectedTokenForSend.currentAmount);
      setSendAmount(btcAmount.toString());
    }
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedToken(null);
    setSelectedTokenForSend(null);
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
  };

  const handleSendClick = (token) => {
    const tokenWithAmount = {
      ...token,
      currentAmount: token.currentAmount || 0,
    };
    setSelectedToken(tokenWithAmount);
    setSelectedTokenForSend(tokenWithAmount);
    setShowSendModal(true);

    if (tokenWithAmount.currentAmount && tokenWithAmount.tokenType === "Bitcoin") {
      const btcAmount = BitcoinService.satoshisToBTC(tokenWithAmount.currentAmount);
      setSendAmount(btcAmount.toString());
    }
  };

  const handleGeneralSendClick = () => {
    setSelectedToken(null);
    setSelectedTokenForSend(null);
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
    setShowSendModal(true);
  };

  // Network Filter Actions
  const toggleNetworkFilter = (networkName) => {
    const newFilters = {
      ...networkFilters,
      [networkName]: !networkFilters[networkName],
    };
    updateNetworkFilters(newFilters);
  };

  // Receive Modal Actions
  const handleReceiveClick = (token) => {
    setSelectedToken(token);
    setOpenReceive(true);
  };

  const receiveAddresses =
    userWallet?.addresses?.map((addressObj) => ({
      label: getTokenType(addressObj),
      address: addressObj.address,
    })) || [];

  // Address Analysis
  const handleAnalyzeAddress = async () => {
    const addressError = validateAddress(destinationAddress);
    const amountError = validateAmount(sendAmount, selectedTokenForSend?.tokenType, selectedTokenForSend?.balances);

    // Validasi khusus Bitcoin
    if (selectedTokenForSend?.tokenType === "Bitcoin" && selectedTokenForSend?.currentAmount) {
      if (BitcoinService.btcToSatoshis(parseFloat(sendAmount)) > selectedTokenForSend.currentAmount) {
        setSendErrors((prev) => ({
          ...prev,
          amount: `Insufficient balance. Available: ${formatTokenAmount(selectedTokenForSend.currentAmount, selectedTokenForSend.tokenType)} ${selectedTokenForSend.name}`,
        }));
        return;
      }
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
      // Deteksi chain (Bitcoin, Ethereum, Solana, dst)
      const detectedChain = detectChain(destinationAddress);
      // Dapatkan variant token type untuk chain terkait
      const tokenTypeVariant = getTokenTypeVariant(detectedChain);

      // Panggil backend untuk analisis address
      const communityReport = await backend.analyze_address(destinationAddress);
      console.log("communityReport", communityReport);

      if ("Ok" in communityReport) {
        if (communityReport.Ok.is_safe) {
          setIsAnalyzeAddressSafe(true);
          setAnalyzeAddressData(communityReport.Ok);
          setAnalysisSource("community");

          // Simpan history analisis (support Bitcoin, Ethereum, Solana)
          try {
            await backend.create_analyze_history({
              address: destinationAddress,
              is_safe: true,
              analyzed_type: { CommunityVote: null },
              metadata: jsonStringify(communityReport.Ok),
              token_type: tokenTypeVariant, // Sudah support Bitcoin, Ethereum, Solana
            });
          } catch (historyError) {
            console.error("Failed to save community analysis history:", historyError);
          }
        } else {
          setIsAnalyzeAddressSafe(false);
          setAnalyzeAddressData(communityReport.Ok);
          setAnalysisSource("community");

          try {
            await backend.create_analyze_history({
              address: destinationAddress,
              is_safe: false,
              analyzed_type: { CommunityVote: null },
              metadata: jsonStringify(communityReport.Ok),
              token_type: tokenTypeVariant, // Sudah support Bitcoin, Ethereum, Solana
            });
          } catch (historyError) {
            console.error("Failed to save community analysis history:", historyError);
          }
        }
        // Tampilkan modal hasil setelah proses selesai (untuk semua chain)
        setShowAnalyzeAddressModal(true);
      } else {
        alert("Address not found in community database. No reports available for this address.");
        setShowSendModal(true);
        setIsAnalyzeAddressSafe(false);
        setAnalyzeAddressData(null);
        setAnalysisSource("");
        setShowAnalyzeAddressModal(true);
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
      alert("Error analyzing address. Please try again.");
      setShowSendModal(true);
      // Tetap tampilkan modal hasil (error)
      setIsAnalyzeAddressSafe(false);
      setAnalyzeAddressData(null);
      setAnalysisSource("");
      setShowAnalyzeAddressModal(true);
    } finally {
      setIsAnalyzeAddressLoading(false);
    }
  };

  // Token List Processing
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
        const config = TOKENS_CONFIG[tokenType] || {
          icon: "/assets/unknown.svg",
          name: tokenType.toUpperCase(),
          symbol: tokenType,
          description: `${tokenType} • Internet Computer`,
        };

        tokenGroups[tokenType] = {
          addresses: [],
          config,
        };
      }

      tokenGroups[tokenType].addresses.push(addressObj.address);
    });

    return Object.entries(tokenGroups).map(([tokenType, data]) => {
      const balanceResult = tokenBalances[tokenType] || { balances: {}, errors: {} };
      const amountValueResult = tokenAmountValues[tokenType] || { amount: 0, value: "$0.00", isLoading: false };
      // console.log("tokenType", JSON.stringify(tokenAmountValues));

      return {
        ...data.config,
        tokenType,
        addresses: data.addresses,
        balances: balanceResult.balances,
        currentAmount: amountValueResult.amount,
        currentValue: amountValueResult.value,
        isLoading: amountValueResult.isLoading || isLoadingBalances,
        hasError: balanceResult.hasErrors || false,
      };
    });
  };

  // Form Input Handlers
  const handleTokenSelection = (selectedTokenType) => {
    const tokens = getTokensForCurrentNetwork();
    const token = tokens.find((t) => t.tokenType === selectedTokenType);
    if (token) {
      const tokenWithAmount = {
        ...token,
        currentAmount: token.currentAmount || 0,
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

      if (value && !isNaN(value) && parseFloat(value) > 0) {
        if (selectedTokenForSend?.tokenType === "Bitcoin" && selectedTokenForSend?.currentAmount) {
          const requestedSatoshis = BitcoinService.btcToSatoshis(parseFloat(value));
          if (requestedSatoshis > selectedTokenForSend.currentAmount) {
            setSendErrors((prev) => ({
              ...prev,
              amount: `Insufficient balance. Available: ${formatTokenAmount(selectedTokenForSend.currentAmount, selectedTokenForSend.tokenType)} ${selectedTokenForSend.name}`,
            }));
          }
        }
      }
    }
  };

  // QR Code Generation
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

  // Balance Fetching
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Update network values
  const prevNetworkValuesRef = useRef();
  useEffect(() => {
    if (JSON.stringify(prevNetworkValuesRef.current) !== JSON.stringify(calculatedNetworkValues)) {
      updateNetworkValues(calculatedNetworkValues);
      prevNetworkValuesRef.current = calculatedNetworkValues;
    }
  }, [calculatedNetworkValues, updateNetworkValues]);

  return {
    // States
    showSendModal,
    selectedToken,
    showNetworkFilter,
    openReceive,
    qrDetail,
    showAnalyzeAddressModal,
    qrCodeDataUrl,
    isAnalyzeAddressSafe,
    isAnalyzeAddressLoading,
    analyzeAddressData,
    aiAnalysisData,
    analysisSource,
    destinationAddress,
    sendAmount,
    isSendLoading,
    sendErrors,
    selectedTokenForSend,
    isLoadingBalances,

    // Actions
    handleSendClick,
    handleGeneralSendClick,
    handleCloseSendModal,
    handleReceiveClick,
    handleConfirmSend,
    handleMaxAmount,
    handleAnalyzeAddress,
    handleTokenSelection,
    handleAddressInput,
    handleAmountInput,
    toggleNetworkFilter,

    // Modal setters
    setShowSendModal,
    setShowNetworkFilter,
    setOpenReceive,
    setQrDetail,
    setShowAnalyzeAddressModal,
    setQrCodeDataUrl,

    // Data
    tokens: getTokensForCurrentNetwork(),
    receiveAddresses,
    totalPortfolioValue: getTotalPortfolioValue(),
    formatTokenAmount,

    // Utilities
    getTokenType,
    detectChain,
    validateAddress,
    validateAmount,
  };
};
