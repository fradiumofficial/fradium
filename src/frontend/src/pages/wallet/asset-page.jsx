import React, { useState, useEffect } from "react";
import { useAuth } from "../../core/providers/auth-provider";
import { useWallet } from "../../core/providers/wallet-provider";
import TransactionButton from "../../core/components/TransactionButton";
import NeoButton from "@/core/components/SidebarButton";
import { bitcoin } from "declarations/bitcoin";
import { satoshisToBTC, fetchBTCPrice, btcToSatoshis } from "@/core/lib/bitcoinUtils";
import { toast } from "react-toastify";
import CustomButton from "@/core/components/custom-button-a";
import AnalysisProgressModal from "@/core/components/AnalysisProgressModal";
import QRCode from "qrcode";
import { backend } from "declarations/backend";
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
  // Add more token types as needed
};

export default function AssetsPage() {
  const { userWallet, network } = useWallet();
  const [tokenBalances, setTokenBalances] = useState({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceErrors, setBalanceErrors] = useState({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

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

  // Function to check if address matches current network
  const isAddressForCurrentNetwork = (addressObj) => {
    if (network === "All Network") {
      return true; // Show all tokens when "All Network" is selected
    }
    const addressNetwork = addressObj.network;
    return addressNetwork === network;
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
      if (error.message.includes("Insufficient balance")) {
        toast.error("Insufficient balance");
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

    // Analyze address by community report
    const communityReport = await backend.analyze_address(destinationAddress);
    console.log("communityReport", communityReport);

    console.log("communityReport.Ok", jsonStringify(communityReport.Ok));
    if ("Ok" in communityReport) {
      console.log("communityReport.Ok", communityReport.Ok.is_safe);
      setIsAnalyzeAddressSafe(communityReport.Ok.is_safe);
      setAnalyzeAddressData(communityReport.Ok);
      setIsAnalyzeAddressLoading(false);
      setShowAnalyeAddressModal(true);
    }
  };

  // Fetch balances when network or addresses change
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userWallet?.addresses) return;

      const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);
      const bitcoinAddresses = networkAddresses.filter((addr) => getTokenType(addr) === "Bitcoin").map((addr) => addr.address);

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
  }, [userWallet?.addresses, network]);

  // Filter addresses by current network and group by token type
  const getTokensForCurrentNetwork = () => {
    if (!userWallet?.addresses) return [];

    const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);

    // Group addresses by token type
    const tokenGroups = {};

    networkAddresses.forEach((addressObj) => {
      const tokenType = getTokenType(addressObj);

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

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card Wallet - Sesuai Referensi */}
        <div className="relative w-full bg-white bg-opacity-5 pb-4 overflow-hidden border border-[#393E4B]">
          {/* Pattern Background */}
          <img
            src="/assets/images/pattern-topside.png"
            alt="Pattern"
            className="absolute top-0 right-0 w-full w-80 h-80 z-0 pointer-events-none select-none object-cover object-right-top"
          />

          {/* Character Illustration - Positioned at top center */}
          <div className="relative z-10 flex justify-center mb-2">
            <img
              src="/assets/images/illus-wallet.png"
              alt="Wallet Character"
              className="w-full object-contain object-center"
            />
          </div>

          {/* Content */}
          <div className="relative z-20 text-center">
            <div className="text-white text-sm font-normal mb-1">Total Portfolio Value</div>
            <div className="text-white text-3xl font-semibold mb-1">$0.00</div>
            <div className="text-[#9BE4A0] text-base font-medium mb-6">Top up your wallet to start using it!</div>

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
              <img src="/assets/icons/page_info.svg" alt="Setting" className="w-5 h-5 cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-col divide-y divide-[#23272F]">
            {tokens.length > 0 ? (
              tokens.map((token, idx) => <TokenCard key={idx} token={token} calculateTokenAmountAndValue={calculateTokenAmountAndValue} onSendClick={handleSendClick} />)
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
                        {token.name} ({token.isLoading ? "Loading..." : formatTokenAmount(currentAmount, token.tokenType)})
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
                  <div className="text-[#B0B6BE] text-sm">Amount ({selectedTokenForSend?.name?.toUpperCase() || ""})</div>
                  <div className="text-[#B0B6BE] text-xs">
                    Balance:{" "}
                    {selectedTokenForSend?.isLoading
                      ? "Loading..."
                      : (() => {
                        const currentAmount = selectedTokenForSend?.balances && Object.keys(selectedTokenForSend.balances).length > 0 ? Object.values(selectedTokenForSend.balances).reduce((sum, balance) => sum + balance, 0) : 0;
                        return formatTokenAmount(currentAmount, selectedTokenForSend?.tokenType);
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
      <AnalysisProgressModal isOpen={isAnalyzeAddressLoading} />

      {/* Modal Analyze Result */}
      {showAnalyeAddressModal && (
        <AnalysisResultModal
          isOpen={showAnalyeAddressModal}
          isSafe={isAnalyzeAddressSafe}
          analyzeData={analyzeAddressData}
          onClose={() => {
            setShowAnalyeAddressModal(false);
            setAnalyzeAddressData(null);
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
function AnalysisResultModal({ isOpen, isSafe, analyzeData, onClose, onConfirmSend, isSendLoading }) {
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

  const statusConfig = {
    safe: {
      gradientColor: "from-[#22C55E]",
      borderColor: "border-[#22C55E]",
      icon: "/assets/icons/safe.png",
      title: "ADDRESS IS SAFE",
      description: analyzeData?.report && analyzeData.report.length > 0 ? "This address has been analyzed by the community and found to be safe" : "This address appears to be clean with no suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Passed",
      checkItems: ["No links to known scam addresses", "No suspicious transaction pattern detected"],
      riskScoreColor: "text-green-400",
    },
    danger: {
      gradientColor: "from-[#F87171]",
      borderColor: "border-[#F87171]",
      icon: "/assets/icons/danger.png",
      title: "ADDRESS IS NOT SAFE",
      description: analyzeData?.report && analyzeData.report.length > 0 ? "This address has been flagged by the community as potentially unsafe" : "This address appears to be flagged with suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Not Passed",
      checkItems: ["Links to known scam addresses detected", "Suspicious transaction pattern detected"],
      riskScoreColor: "text-red-400",
    },
  };

  const config = statusConfig[isSafe ? "safe" : "danger"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-[#23272F] w-full max-w-sm rounded-lg shadow-lg">
        <button className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold z-20" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="text-white text-xl font-semibold mb-6">Send {"Bitcoin"}</div>
          <div className="w-full flex flex-col gap-6 relative z-10">
            {/* Status */}
            <div className="rounded-lg overflow-hidden mb-2 bg-white/5 w-full">
              {/* Bagian atas dengan gradient */}
              <div className="relative w-full">
                <div className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-b ${config.gradientColor} via-transparent to-transparent opacity-80 z-0`} />
                <div className="relative flex items-center gap-3 px-4 py-4 z-10">
                  <img src={config.icon} alt={isSafe ? "Safe" : "Danger"} className="w-10 h-10 object-contain" />
                  <div>
                    <div className="text-white font-bold text-base leading-tight">{config.title}</div>
                    <div className="text-[#B0B6BE] text-sm">Detected By Community</div>
                  </div>
                </div>
              </div>
              {/* Bagian bawah deskripsi */}
              <div className="px-4 pb-4">
                <div className="text-[#B0B6BE] text-xs font-normal">{config.description}</div>
              </div>
            </div>
            {/* Address Details */}
            <p className="text-white font-semibold text-lg">Address Details</p>
            <div className="rounded-lg p-4 mb-2 w-full">
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? analyzeData.report[0].voted_by.length : "0"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/wallet-grey.svg" alt="Wallet" className="w-3 h-3" />
                    Total Voters
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? `${analyzeData.report[0].votes_yes} Yes / ${analyzeData.report[0].votes_no} No` : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/total-volume.svg" alt="Votes" className="w-3 h-3" />
                    Vote Results
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className={`text-sm font-medium ${config.riskScoreColor}`}>{analyzeData?.report && analyzeData.report.length > 0 ? calculateRiskScore(analyzeData.report[0].votes_yes, analyzeData.report[0].votes_no) : "0/100"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/risk-score.svg" alt="Risk Score" className="w-3 h-3" />
                    Risk Score
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">{analyzeData?.report && analyzeData.report.length > 0 ? getTimeAgo(analyzeData.report[0].created_at) : "N/A"}</span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img src="/assets/icons/last-activity.svg" alt="Last Activity" className="w-3 h-3" />
                    Report Created
                  </span>
                </div>
              </div>
            </div>
            {/* Security Checks */}
            <div className={`rounded-lg px-4 py-4 mb-2 border-l-2 ${config.borderColor} relative overflow-hidden bg-white/5 w-full`}>
              <div className={`absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r ${config.gradientColor}/30 to-transparent pointer-events-none`} />
              <div className="relative z-10">
                <div className="text-white font-semibold mb-2 text-sm">{config.securityTitle}</div>
                <ul className="flex flex-col gap-1">
                  {config.checkItems.map((item, index) => (
                    <li key={index} className={`flex items-center gap-2 ${isSafe ? "text-[#22C55E]" : "text-[#F87171]"} text-xs`}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill={isSafe ? "#22C55E" : "#F87171"} />
                        <path d="M8 12l2 2 4-4" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Report Details - Only show if there's a report */}
            {analyzeData?.report && analyzeData.report.length > 0 && (
              <div className="rounded-lg p-4 mb-2 bg-white/5 w-full">
                <div className="text-white font-semibold mb-3 text-sm">Report Details</div>
                <div className="space-y-3 w-full">
                  <div className="w-full">
                    <div className="text-[#B0B6BE] text-xs mb-1">Category</div>
                    <div className="text-white text-sm font-medium capitalize w-full">{analyzeData.report[0].category}</div>
                  </div>
                  <div className="w-full">
                    <a href={`/reports/${analyzeData.report[0].report_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#9BEB83] text-sm font-medium hover:text-white transition-colors w-full">
                      <span>View Full Report</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
            {/* Button Confirm Send */}
            <div className="flex gap-3 mt-4 w-full">
              <CustomButton className="w-full justify-center" disabled={isSendLoading} onClick={onConfirmSend}>
                {isSendLoading ? "Sending..." : "Confirm Send"}
              </CustomButton>
              {!isSafe && analyzeData?.report && analyzeData.report.length > 0 && (
                <NeoButton className="w-full text-white justify-center" onClick={onClose}>
                  Cancel
                </NeoButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for token card to handle async calculations
function TokenCard({ token, calculateTokenAmountAndValue, onSendClick }) {
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
            <span className="text-white font-semibold text-base">{formatTokenAmount(amount, token.tokenType)}</span>
            <span className="text-[#B0B6BE] text-sm">{value}</span>
          </>
        )}
      </div>
    </div>
  );
}
