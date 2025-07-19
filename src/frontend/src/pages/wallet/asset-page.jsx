import React, { useState, useEffect } from "react";
import { useAuth } from "../../core/providers/auth-provider";
import { useWallet } from "../../core/providers/wallet-provider";
import TransactionButton from "../../core/components/TransactionButton";
import NeoButton from "@/core/components/SidebarButton";
import { bitcoin } from "declarations/bitcoin";
import { satoshisToBTC, fetchBTCPrice, btcToSatoshis } from "@/core/lib/bitcoinUtils";
import { toast } from "react-toastify";
import CustomButton from "@/core/components/custom-button-a";
import AnalyzeProgressModal from "@/core/components/modals/AnalyzeProgressModal";
import QRCode from "qrcode";
import { backend } from "declarations/backend";
import { ransomware_detector } from "declarations/ransomware_detector";
import { jsonStringify } from "../../core/lib/canisterUtils";

// Function to format token amount by removing trailing zeros
const formatTokenAmount = (amount, tokenType) => {
  if (tokenType === "Bitcoin") {
    // Convert satoshis to BTC first
    const btcAmount = satoshisToBTC(amount);

    if (btcAmount === 0) {
      return "0";
    }

    return btcAmount.toString().replace(/\.?0+$/, "");
  } else {
    if (amount === 0) {
      return "0";
    }

    // For other tokens, just remove trailing zeros
    return amount.toString().replace(/\.?0+$/, "");
  }
};

// Token configuration mapping
const tokenConfig = {
  Bitcoin: {
    icon: "/assets/bitcoin.svg",
    name: "BTC",
    symbol: "Bitcoin",
    desc: "Bitcoin • Internet Computer",
  },
  Ethereum: {
    icon: "/assets/eth.svg",
    name: "ETH",
    symbol: "Ethereum",
    desc: "Ethereum • Internet Computer",
  },
  Solana: {
    icon: "/assets/solana.svg", // Assuming you have solana.svg
    name: "SOL",
    symbol: "Solana",
    desc: "Solana • Internet Computer",
  },
  Fradium: {
    icon: "/assets/fum.svg",
    name: "FUM",
    symbol: "Fradium",
    desc: "Fradium • Internet Computer",
  },
  // Add more token types as needed
};

export default function AssetsPage() {
  const { userWallet, network, hideBalance, updateNetworkValues, networkFilters, updateNetworkFilters } = useWallet();
  const [tokenBalances, setTokenBalances] = useState({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceErrors, setBalanceErrors] = useState({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // Show network filter state
  const [showNetworkFilter, setShowNetworkFilter] = useState(false);

  // Receive Modal States
  const [openReceive, setOpenReceive] = useState(false);
  const [qrDetail, setQrDetail] = useState({ open: false, coin: null });

  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  // Analyze Address Modal States
  const [showAnalyeAddressModal, setShowAnalyeAddressModal] = useState(false);
  const [isAnalyzeAddressSafe, setIsAnalyzeAddressSafe] = useState(false);
  const [isAnalyzeAddressLoading, setIsAnalyzeAddressLoading] = useState(false);
  const [analyzeAddressData, setAnalyzeAddressData] = useState(null);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(""); // "community" | "ai"

  // Portfolio calculation states
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isCalculatingPortfolio, setIsCalculatingPortfolio] = useState(false);

  // Send Modal States
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [sendErrors, setSendErrors] = useState({});
  const [selectedTokenForSend, setSelectedTokenForSend] = useState(null);

  // Function to get token type from address object
  const getTokenType = (addressObj) => {
    if (addressObj.token_type?.Bitcoin == null) return "Bitcoin";
    if (addressObj.token_type?.Ethereum == null) return "Ethereum";
    if (addressObj.token_type?.Solana == null) return "Solana";
    return "Unknown";
  };

  // Auto-detect blockchain network from address (from create-report-page.jsx)
  const detectChain = (address) => {
    if (!address) return "Unknown";

    // Simple chain detection based on address format
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

  // Convert chain name to token type variant
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

  // Function to check if address matches current network
  const isAddressForCurrentNetwork = (addressObj) => {
    if (network === "All Networks") {
      return true; // Show all tokens when "All Network" is selected
    }

    const addressNetwork = Object.keys(addressObj.network)[0];
    return addressNetwork.toLowerCase() === network.toLowerCase();
  };

  // Function to fetch Bitcoin balance for a single address
  const fetchBitcoinBalance = async (address) => {
    try {
      const balance = await bitcoin.get_balance(address);
      return Number(balance);
    } catch (error) {
      console.error(`Error fetching Bitcoin balance for ${address}:`, error);
      throw error;
    }
  };

  // Function to fetch balances for all Bitcoin addresses
  const fetchBitcoinBalances = async (addresses) => {
    const balances = {};
    const errors = {};

    for (const address of addresses) {
      try {
        const balance = await fetchBitcoinBalance(address);
        balances[address] = balance;
      } catch (error) {
        errors[address] = error.message || "Failed to fetch balance";
        balances[address] = 0;
      }
    }

    return { balances, errors };
  };

  // Function to calculate token amount and value based on token type
  const calculateTokenAmountAndValue = async (tokenType, addresses, balances) => {
    switch (tokenType) {
      case "Bitcoin":
        if (!balances || Object.keys(balances).length === 0) {
          return { amount: 0, value: "$0.00" };
        }

        // Calculate total satoshis
        const totalSatoshis = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

        // Get current BTC price
        const btcPrice = await fetchBTCPrice();

        // Calculate BTC amount and USD value
        const btcAmount = satoshisToBTC(totalSatoshis);
        const usdValue = btcAmount * btcPrice;

        return {
          amount: totalSatoshis, // Keep as satoshis for formatting
          value: `$${usdValue.toFixed(2)}`,
        };

      case "Ethereum":
        // TODO: Implement Ethereum balance fetching
        // For now, return placeholder values
        return {
          amount: 0,
          value: "$0.00",
        };

      case "Solana":
        // TODO: Implement Solana balance fetching
        // For now, return placeholder values
        return {
          amount: 0,
          value: "$0.00",
        };

      default:
        return {
          amount: 0,
          value: "$0.00",
        };
    }
  };

  // Send Modal Functions
  const handleConfirmSend = async () => {
    try {
      setIsSendLoading(true);
      console.log("sendAmount", sendAmount);

      // Get sender Bitcoin address
      const bitcoinAddress = userWallet?.addresses?.find((addr) => addr.network === "Bitcoin" && addr.token_type?.Bitcoin !== undefined)?.address;

      const sendResponse = await bitcoin.send_from_p2pkh_address({
        destination_address: destinationAddress,
        amount_in_satoshi: btcToSatoshis(parseFloat(sendAmount)),
      });

      console.log("sendResponse", sendResponse);

      // Create transaction history entry with pending status
      try {
        const transactionHistoryParams = {
          chain: { Bitcoin: null },
          direction: { Send: null },
          amount: btcToSatoshis(parseFloat(sendAmount)),
          timestamp: BigInt(Date.now() * 1000000), // Convert to nanoseconds
          details: {
            Bitcoin: {
              txid: sendResponse,
              from_address: bitcoinAddress ? [bitcoinAddress] : [],
              to_address: destinationAddress,
              fee_satoshi: [],
              block_height: [],
            },
          },
          note: [`Sent ${sendAmount} Bitcoin to ${destinationAddress.slice(0, 12)}...`],
        };

        const historyResult = await backend.create_transaction_history(transactionHistoryParams);
        console.log("Transaction history created:", historyResult);
      } catch (historyError) {
        console.error("Failed to create transaction history:", historyError);
        // Don't fail the whole transaction if history creation fails
      }

      setIsSendLoading(false);
      setShowAnalyeAddressModal(false);
      setSelectedToken(null);
      setSelectedTokenForSend(null);
      setDestinationAddress("");
      setSendAmount("");
      setSendErrors({});
      toast.success("Transaction sent successfully");
    } catch (error) {
      console.log("error", error);
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
    if (selectedTokenForSend?.balances && Object.keys(selectedTokenForSend.balances).length > 0 && selectedTokenForSend?.tokenType === "Bitcoin") {
      const currentAmount = Object.values(selectedTokenForSend.balances).reduce((sum, balance) => sum + balance, 0);
      const btcAmount = satoshisToBTC(currentAmount);
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
    // Pass token data including current amount to send modal
    const tokenWithAmount = {
      ...token,
      currentAmount: token.currentAmount || 0,
    };
    setSelectedToken(tokenWithAmount);
    setSelectedTokenForSend(tokenWithAmount);
    setShowSendModal(true);

    // Set initial amount based on token's current balance
    if (token.currentAmount && token.tokenType === "Bitcoin") {
      const btcAmount = satoshisToBTC(token.currentAmount);
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

  const toggleNetworkFilter = (networkName) => {
    const newFilters = {
      ...networkFilters,
      [networkName]: !networkFilters[networkName],
    };
    updateNetworkFilters(newFilters);
  };

  const handleReceiveClick = (token) => {
    setSelectedToken(token);
    setOpenReceive(true);
  };

  // Create receive addresses array for modal
  const receiveAddresses =
    userWallet?.addresses?.map((addressObj) => ({
      label: getTokenType(addressObj),
      address: addressObj.address,
    })) || [];

  // Generate QR Code when QR detail is opened
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

  // Validation functions
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
      const requestedSatoshis = btcToSatoshis(parseFloat(amount));
      if (requestedSatoshis > currentAmount) {
        return `Insufficient balance. Available: ${formatTokenAmount(currentAmount, tokenType)} ${tokenType}`;
      }
    }
    return null;
  };

  const handleAnalyzeAddress = async () => {
    const addressError = validateAddress(destinationAddress);
    const amountError = validateAmount(sendAmount, selectedTokenForSend?.tokenType, selectedTokenForSend?.balances);

    // Prevent lanjut jika amount melebihi saldo
    if (selectedTokenForSend?.tokenType === "Bitcoin" && selectedTokenForSend?.balances && Object.keys(selectedTokenForSend.balances).length > 0) {
      const currentAmount = Object.values(selectedTokenForSend.balances).reduce((sum, balance) => sum + balance, 0);
      if (btcToSatoshis(parseFloat(sendAmount)) > currentAmount) {
        setSendErrors((prev) => ({
          ...prev,
          amount: `Insufficient balance. Available: ${formatTokenAmount(currentAmount, selectedTokenForSend.tokenType)} ${selectedTokenForSend.name}`,
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

    // If validation passes, show result modal
    setShowSendModal(false);
    setIsAnalyzeAddressLoading(true);

    try {
      // Analyze address by community report
      const communityReport = await backend.analyze_address(destinationAddress);
      console.log("communityReport", communityReport);

      if ("Ok" in communityReport) {
        if (communityReport.Ok.is_safe) {
          console.log("communityReport.Ok.is_safe", communityReport.Ok.is_safe);
          // If safe by community, also check AI analysis
          const ransomwareReport = await ransomware_detector.analyze_address(destinationAddress);
          console.log("ransomwareReport", jsonStringify(ransomwareReport));

          if ("Ok" in ransomwareReport) {
            if (ransomwareReport.Ok.is_ransomware) {
              // AI detected as unsafe
              setIsAnalyzeAddressSafe(false);
              setAiAnalysisData(ransomwareReport.Ok);
              setAnalysisSource("ai");

              // Create analyze history for AI analysis (unsafe)
              try {
                await backend.create_analyze_history({
                  address: destinationAddress,
                  is_safe: false,
                  analyzed_type: { AIAnalysis: null },
                  metadata: jsonStringify(ransomwareReport.Ok),
                  token_type: getTokenTypeVariant(detectChain(destinationAddress)),
                });
                console.log("AI analysis history (unsafe) saved successfully");
              } catch (historyError) {
                console.error("Failed to save AI analysis history:", historyError);
              }
            } else {
              // AI detected as safe, but use community result
              setIsAnalyzeAddressSafe(true);
              setAnalyzeAddressData(communityReport.Ok);
              setAnalysisSource("community");

              // Create analyze history for Community analysis (safe)
              try {
                await backend.create_analyze_history({
                  address: destinationAddress,
                  is_safe: true,
                  analyzed_type: { CommunityVote: null },
                  metadata: jsonStringify(communityReport.Ok),
                  token_type: getTokenTypeVariant(detectChain(destinationAddress)),
                });
                console.log("Community analysis history (safe) saved successfully");
              } catch (historyError) {
                console.error("Failed to save community analysis history:", historyError);
              }
            }
          } else {
            // Fall back to community result (safe)
            setIsAnalyzeAddressSafe(true);
            setAnalyzeAddressData(communityReport.Ok);
            setAnalysisSource("community");

            // Create analyze history for Community analysis (safe)
            try {
              await backend.create_analyze_history({
                address: destinationAddress,
                is_safe: true,
                analyzed_type: { CommunityVote: null },
                metadata: jsonStringify(communityReport.Ok),
                token_type: getTokenTypeVariant(detectChain(destinationAddress)),
              });
              console.log("Community analysis history (safe) saved successfully");
            } catch (historyError) {
              console.error("Failed to save community analysis history:", historyError);
            }
          }
        } else {
          // If not safe by community, use community result
          setIsAnalyzeAddressSafe(false);
          setAnalyzeAddressData(communityReport.Ok);
          setAnalysisSource("community");

          // Create analyze history for Community analysis (unsafe)
          try {
            await backend.create_analyze_history({
              address: destinationAddress,
              is_safe: false,
              analyzed_type: { CommunityVote: null },
              metadata: jsonStringify(communityReport.Ok),
              token_type: getTokenTypeVariant(detectChain(destinationAddress)),
            });
            console.log("Community analysis history (unsafe) saved successfully");
          } catch (historyError) {
            console.error("Failed to save community analysis history:", historyError);
          }
        }
      } else {
        // If no community report, try AI analysis
        const ransomwareReport = await ransomware_detector.analyze_address(destinationAddress);
        console.log("ransomwareReport", jsonStringify(ransomwareReport));

        if ("Ok" in ransomwareReport) {
          const isSafe = !ransomwareReport.Ok.is_ransomware;
          setIsAnalyzeAddressSafe(isSafe);
          setAiAnalysisData(ransomwareReport.Ok);
          setAnalysisSource("ai");

          // Create analyze history for AI analysis
          try {
            await backend.create_analyze_history({
              address: destinationAddress,
              is_safe: isSafe,
              analyzed_type: { AIAnalysis: null },
              metadata: jsonStringify(ransomwareReport.Ok),
              token_type: getTokenTypeVariant(detectChain(destinationAddress)),
            });
            console.log(`AI analysis history (${isSafe ? "safe" : "unsafe"}) saved successfully`);
          } catch (historyError) {
            console.error("Failed to save AI analysis history:", historyError);
          }
        } else {
          // If AI also fails, default to safe but no analysis source
          setIsAnalyzeAddressSafe(true);
          setAnalyzeAddressData(null);
          setAnalysisSource("");
          console.log("No analysis available, defaulting to safe");
        }
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
      // Default to safe if analysis fails
      setIsAnalyzeAddressSafe(true);
      setAnalyzeAddressData(null);
      setAnalysisSource("");
    } finally {
      setIsAnalyzeAddressLoading(false);
      setShowAnalyeAddressModal(true);
    }
  };

  // Fetch balances when network or addresses change
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userWallet?.addresses) return;

      const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);
      const bitcoinAddresses = networkAddresses
        .filter((addr) => getTokenType(addr) === "Bitcoin")
        .filter((addr) => networkFilters.Bitcoin) // Only fetch if Bitcoin is enabled
        .map((addr) => addr.address);

      if (bitcoinAddresses.length === 0) {
        setTokenBalances({});
        setBalanceErrors({});
        return;
      }

      setIsLoadingBalances(true);
      setBalanceErrors({});

      try {
        const { balances, errors } = await fetchBitcoinBalances(bitcoinAddresses);

        setTokenBalances((prev) => ({
          ...prev,
          Bitcoin: balances,
        }));

        if (Object.keys(errors).length > 0) {
          setBalanceErrors((prev) => ({
            ...prev,
            Bitcoin: errors,
          }));
        }
      } catch (error) {
        console.error("Error fetching Bitcoin balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [userWallet?.addresses, network, networkFilters]);

  // Filter addresses by current network and group by token type
  const getTokensForCurrentNetwork = () => {
    if (!userWallet?.addresses) return [];

    const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);

    // Group addresses by token type
    const tokenGroups = {};

    networkAddresses.forEach((addressObj) => {
      const tokenType = getTokenType(addressObj);

      // Apply network filter - skip if this token type is disabled
      if (!networkFilters[tokenType]) {
        return;
      }

      if (!tokenGroups[tokenType]) {
        tokenGroups[tokenType] = {
          addresses: [],
          config: tokenConfig[tokenType] || {
            icon: "/assets/unknown.svg",
            name: tokenType.toUpperCase(),
            symbol: tokenType,
            desc: `${tokenType} • Internet Computer`,
          },
        };
      }

      tokenGroups[tokenType].addresses.push(addressObj.address);
    });

    // Convert to array format for rendering
    return Object.entries(tokenGroups).map(([tokenType, data]) => {
      const balances = tokenBalances[tokenType] || {};

      return {
        ...data.config,
        tokenType,
        addresses: data.addresses,
        balances: balances,
        isLoading: isLoadingBalances && tokenType === "Bitcoin",
        hasError: balanceErrors[tokenType] && Object.keys(balanceErrors[tokenType]).length > 0,
      };
    });
  };

  const tokens = getTokensForCurrentNetwork();

  // Function to calculate total portfolio value and network values
  const calculateTotalPortfolioValue = async () => {
    if (!userWallet?.addresses) {
      setTotalPortfolioValue(0);
      updateNetworkValues({
        "All Networks": 0,
        Bitcoin: 0,
        Ethereum: 0,
        Fradium: 0,
      });
      return;
    }

    setIsCalculatingPortfolio(true);
    let totalValue = 0;
    const networkTotals = {
      Bitcoin: 0,
      Ethereum: 0,
      Fradium: 0,
    };

    try {
      // Calculate values for all networks, not just current one
      const allNetworks = ["Bitcoin", "Ethereum", "Fradium"];

      for (const networkName of allNetworks) {
        // Skip if this network is filtered out
        if (!networkFilters[networkName]) {
          continue;
        }

        // Get addresses for this specific network
        const networkAddresses = userWallet.addresses.filter((addressObj) => {
          const addressNetwork = Object.keys(addressObj.network)[0];
          return addressNetwork.toLowerCase() === networkName.toLowerCase();
        });

        if (networkAddresses.length > 0) {
          // Group addresses by token type for this network
          const tokenGroups = {};
          networkAddresses.forEach((addressObj) => {
            const tokenType = getTokenType(addressObj);
            if (!tokenGroups[tokenType]) {
              tokenGroups[tokenType] = [];
            }
            tokenGroups[tokenType].push(addressObj.address);
          });

          // Calculate value for each token type in this network
          for (const [tokenType, addresses] of Object.entries(tokenGroups)) {
            const balances = tokenBalances[tokenType] || {};
            if (Object.keys(balances).length > 0) {
              const result = await calculateTokenAmountAndValue(tokenType, addresses, balances);
              const numericValue = parseFloat(result.value.replace("$", "").replace(",", "")) || 0;
              networkTotals[networkName] += numericValue;
            }
          }
        }
      }

      // Calculate total across all networks
      totalValue = Object.values(networkTotals).reduce((sum, value) => sum + value, 0);

      setTotalPortfolioValue(totalValue);
      updateNetworkValues({
        "All Networks": totalValue,
        ...networkTotals,
      });
    } catch (error) {
      console.error("Error calculating portfolio values:", error);
      setTotalPortfolioValue(0);
      updateNetworkValues({
        "All Networks": 0,
        Bitcoin: 0,
        Ethereum: 0,
        Fradium: 0,
      });
    } finally {
      setIsCalculatingPortfolio(false);
    }
  };

  // Calculate total portfolio value when balances change
  React.useEffect(() => {
    calculateTotalPortfolioValue();
  }, [tokenBalances, userWallet?.addresses, networkFilters]);

  // Format portfolio value for display
  const formatPortfolioValue = (value) => {
    if (hideBalance) return "••••••";
    if (isCalculatingPortfolio) return "Loading...";
    return `$${value.toFixed(2)}`;
  };

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card Wallet - Sesuai Referensi */}
        <div className="relative w-full bg-white bg-opacity-5 pb-4 overflow-hidden border border-[#393E4B]">
          {/* Pattern Background */}
          <img src="/assets/images/pattern-topside.png" alt="Pattern" className="absolute top-0 right-0 w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top" />

          {/* Character Illustration - Positioned at top center */}
          <div className="relative z-10 flex justify-center mb-2">
            <img src="/assets/images/illus-wallet.png" alt="Wallet Character" className="w-full object-contain object-center" />
          </div>

          {/* Content */}
          <div className="relative z-20 text-center">
            <div className="text-white text-sm font-normal mb-1">Total Portfolio Value</div>
            <div className="text-white text-3xl font-semibold mb-1">{formatPortfolioValue(totalPortfolioValue)}</div>
            <div className="text-[#9BE4A0] text-base font-medium mb-6">{totalPortfolioValue === 0 ? "Top up your wallet to start using it!" : "Your portfolio is growing!"}</div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full max-w-lg mx-auto">
              {/* Receive Button */}
              <div className="flex-1">
                <div className="relative bg-white bg-opacity-10 h-32 w-full p-4 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={() => handleReceiveClick(tokens[0])}>
                  <div className="absolute top-4 right-4">
                    <TransactionButton
                      icon="/assets/icons/received.svg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReceiveClick(tokens[0]);
                      }}
                      iconSize="w-6 h-6"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="text-white text-xl font-semibold">Receive</div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex-1">
                <div className="relative bg-white bg-opacity-10 h-32 w-full p-4 hover:bg-opacity-15 transition-all cursor-pointer group border border-[#4A4F58]" onClick={handleGeneralSendClick}>
                  <div className="absolute top-4 right-4">
                    <TransactionButton
                      icon="/assets/icons/send.svg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneralSendClick();
                      }}
                      iconSize="w-6 h-6"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="text-white text-xl font-semibold">Send</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Token List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tokens ({network})</h2>
            <div className="flex gap-4">
              <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
              <img src="/assets/icons/page_info.svg" alt="Filter" className="w-5 h-5 cursor-pointer" onClick={() => setShowNetworkFilter(!showNetworkFilter)} />
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
                      <img src={tokenConfig[networkName]?.icon || "/assets/unknown.svg"} alt={networkName} className="w-5 h-5" />
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
              tokens.map((token, idx) => <TokenCard key={idx} token={token} calculateTokenAmountAndValue={calculateTokenAmountAndValue} onSendClick={handleSendClick} hideBalance={hideBalance} />)
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

        {/* Send Modal */}
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
                <select
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none"
                  value={selectedTokenForSend ? selectedTokenForSend.tokenType : ""}
                  onChange={(e) => {
                    const selectedTokenType = e.target.value;
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
                  }}>
                  <option value="">Select a token</option>
                  {tokens.map((token, index) => {
                    // Calculate current amount for this token
                    const currentAmount = token.balances && Object.keys(token.balances).length > 0 ? Object.values(token.balances).reduce((sum, balance) => sum + balance, 0) : 0;

                    return (
                      <option key={index} value={token.tokenType}>
                        {token.name} ({token.isLoading ? "Loading..." : hideBalance ? "••••" : formatTokenAmount(currentAmount, token.tokenType)})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">Recipient Address</div>
                <input
                  type="text"
                  className={`w-full bg-[#23272F] border rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none ${sendErrors.address ? "border-red-500" : "border-[#393E4B]"} ${!selectedTokenForSend ? "opacity-50 cursor-not-allowed" : ""}`}
                  placeholder="ex: m1p2... or 1..."
                  value={destinationAddress}
                  disabled={!selectedTokenForSend}
                  onChange={(e) => {
                    if (selectedTokenForSend) {
                      setDestinationAddress(e.target.value);
                      if (sendErrors.address) {
                        setSendErrors((prev) => ({ ...prev, address: null }));
                      }
                    }
                  }}
                />
                {sendErrors.address && <div className="text-red-400 text-xs mt-1">{sendErrors.address}</div>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[#B0B6BE] text-sm">Amount {selectedTokenForSend?.name?.toUpperCase() || ""}</div>
                  <div className="text-[#B0B6BE] text-xs">
                    Balance:{" "}
                    {selectedTokenForSend?.isLoading
                      ? "Loading..."
                      : (() => {
                          const currentAmount = selectedTokenForSend?.balances && Object.keys(selectedTokenForSend.balances).length > 0 ? Object.values(selectedTokenForSend.balances).reduce((sum, balance) => sum + balance, 0) : 0;
                          return hideBalance ? "••••" : formatTokenAmount(currentAmount, selectedTokenForSend?.tokenType);
                        })()}{" "}
                    {selectedTokenForSend?.name?.toUpperCase() || ""}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    className={`w-full bg-[#23272F] border rounded px-3 py-2 pr-16 text-[#B0B6BE] text-sm outline-none ${sendErrors.amount ? "border-red-500" : "border-[#393E4B]"} ${!selectedTokenForSend ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="0.00"
                    value={sendAmount}
                    disabled={!selectedTokenForSend}
                    onChange={(e) => {
                      if (selectedTokenForSend) {
                        const value = e.target.value;
                        setSendAmount(value);

                        // Clear amount error when user starts typing
                        if (sendErrors.amount) {
                          setSendErrors((prev) => ({ ...prev, amount: null }));
                        }

                        // Validate amount in real-time
                        if (value && !isNaN(value) && parseFloat(value) > 0) {
                          if (selectedTokenForSend?.tokenType === "Bitcoin" && selectedTokenForSend?.balances && Object.keys(selectedTokenForSend.balances).length > 0) {
                            const currentAmount = Object.values(selectedTokenForSend.balances).reduce((sum, balance) => sum + balance, 0);
                            const requestedSatoshis = btcToSatoshis(parseFloat(value));
                            if (requestedSatoshis > currentAmount) {
                              setSendErrors((prev) => ({
                                ...prev,
                                amount: `Insufficient balance. Available: ${formatTokenAmount(currentAmount, selectedTokenForSend.tokenType)} ${selectedTokenForSend.name}`,
                              }));
                            }
                          }
                        }
                      }
                    }}
                  />
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
      {showAnalyeAddressModal && (
        <AnalysisResultModal
          isOpen={showAnalyeAddressModal}
          isSafe={isAnalyzeAddressSafe}
          analyzeData={analyzeAddressData}
          aiAnalysisData={aiAnalysisData}
          analysisSource={analysisSource}
          onClose={() => {
            setShowAnalyeAddressModal(false);
            setAnalyzeAddressData(null);
            setAiAnalysisData(null);
            setAnalysisSource("");
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
                setQrCodeDataUrl("");
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

// Separate component for token card to handle async calculations
function TokenCard({ token, calculateTokenAmountAndValue, onSendClick, hideBalance }) {
  const [amount, setAmount] = useState(0);
  const [value, setValue] = useState("$0.00");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const calculateAmountAndValue = async () => {
      if (!token.balances || Object.keys(token.balances).length === 0) {
        setAmount(0);
        setValue("$0.00");
        return;
      }

      setIsCalculating(true);
      try {
        const result = await calculateTokenAmountAndValue(token.tokenType, token.addresses, token.balances);
        setAmount(result.amount);
        setValue(result.value);
      } catch (error) {
        console.error(`Error calculating ${token.tokenType} amount and value:`, error);
        setAmount(0);
        setValue("$0.00");
      } finally {
        setIsCalculating(false);
      }
    };

    calculateAmountAndValue();
  }, [token.balances, token.tokenType, token.addresses, calculateTokenAmountAndValue]);

  const handleCardClick = () => {
    // Pass token data including current amount to send modal
    onSendClick({
      ...token,
      currentAmount: amount,
      currentValue: value,
    });
  };

  return (
    <div className="flex items-center px-2 py-4 gap-4 cursor-pointer hover:bg-[#181C22] transition-colors rounded-lg" onClick={handleCardClick}>
      <img src={token.icon} alt={token.name} className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{token.name}</span>
          {token.symbol && <span className="text-[#B0B6BE] text-base">• {token.symbol}</span>}
        </div>
        <div className="text-[#B0B6BE] text-sm truncate">{token.desc}</div>
        {token.hasError && <div className="text-red-400 text-xs mt-1">Error fetching balance</div>}
      </div>
      <div className="flex flex-col items-end gap-2">
        {token.isLoading || isCalculating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9BEB83]"></div>
            <span className="text-[#B0B6BE] text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-white font-semibold text-base">{hideBalance ? "••••" : formatTokenAmount(amount, token.tokenType)}</span>
            <span className="text-[#B0B6BE] text-sm">{hideBalance ? "••••" : value}</span>
          </>
        )}
      </div>
    </div>
  );
}
