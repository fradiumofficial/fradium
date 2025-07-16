import React, { useState, useEffect } from "react";
import { useWallet } from "@/core/providers/wallet-provider";
import NeoButton from "@/core/components/SidebarButton";
import { bitcoin } from "declarations/bitcoin";
import {
  satoshisToBTC,
  formatSatoshisToBTC,
  fetchBTCPrice,
  btcToSatoshis,
  isValidBitcoinAddress,
} from "../../core/lib/bitcoinUtils";
import { toast } from "react-toastify";
import CustomButton from "@/core/components/custom-button-a";
import AnalysisProgressModal from "@/core/components/AnalysisProgressModal";
import { CloudCog, Timer } from "lucide-react";
import QRCode from "qrcode";

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
  const [tokenPrices, setTokenPrices] = useState({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendResultSafe, setShowSendResultSafe] = useState(false);
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

  // Send Modal States
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [sendErrors, setSendErrors] = useState({});

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
  const calculateTokenAmountAndValue = async (
    tokenType,
    addresses,
    balances
  ) => {
    switch (tokenType) {
      case "Bitcoin":
        if (!balances || Object.keys(balances).length === 0) {
          return { amount: 0, value: "$0.00" };
        }

        // Calculate total satoshis
        const totalSatoshis = Object.values(balances).reduce(
          (sum, balance) => sum + balance,
          0
        );

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
  const handleSendConfirm = async () => {
    // Reset errors
    setSendErrors({});

    // Validation
    const newErrors = {};

    if (!destinationAddress.trim()) {
      newErrors.address = "Destination address is required";
    } else if (!isValidBitcoinAddress(destinationAddress)) {
      newErrors.address = "Invalid Bitcoin address format";
    }

    if (!sendAmount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(sendAmount) || parseFloat(sendAmount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    } else if (
      selectedToken?.tokenType === "Bitcoin" &&
      selectedToken?.currentAmount
    ) {
      // Check if amount exceeds available balance
      const requestedSatoshis = btcToSatoshis(parseFloat(sendAmount));
      if (requestedSatoshis > selectedToken.currentAmount) {
        newErrors.amount = "Insufficient balance";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setSendErrors(newErrors);
      return;
    }

    setIsSendLoading(true);
    try {
      // Call handleSend function
      await handleSend();

      // Close modal on success
      handleCloseSendModal();
    } catch (error) {
      console.error("Error sending transaction:", error);
      setSendErrors({
        general: "Failed to send transaction. Please try again.",
      });
    } finally {
      setIsSendLoading(false);
    }
  };

  const handleSend = async () => {
    setIsSendLoading(true);
    console.log("data", {
      destination_address: destinationAddress,
      amount_in_satoshi: btcToSatoshis(parseFloat(sendAmount)),
    });
    const sendResponse = await bitcoin.send_from_p2pkh_address({
      destination_address: destinationAddress,
      amount_in_satoshi: btcToSatoshis(parseFloat(sendAmount)),
    });
    setIsSendLoading(false);

    console.log("sendResponse", sendResponse);

    toast.success("Transaction sent successfully");
  };

  const handleMaxAmount = () => {
    if (
      selectedToken?.currentAmount &&
      selectedToken?.tokenType === "Bitcoin"
    ) {
      const btcAmount = satoshisToBTC(selectedToken.currentAmount);
      setSendAmount(btcAmount.toString());
    }
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedToken(null);
    setDestinationAddress("");
    setSendAmount("");
    setSendErrors({});
  };

  const handleCloseReceiveModal = () => {
    setOpenReceive(false);
  };

  const handleSendClick = (token) => {
    setSelectedToken(token);
    setShowSendModal(true);

    // Set initial amount based on token's current balance
    if (token.currentAmount && token.tokenType === "Bitcoin") {
      const btcAmount = satoshisToBTC(token.currentAmount);
      setSendAmount(btcAmount.toString());
    }
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
      const address = receiveAddresses.find(
        (a) => a.label === qrDetail.coin
      )?.address;
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
    if (!isValidBitcoinAddress(address)) {
      return "Invalid Bitcoin address format";
    }
    return null;
  };

  const validateAmount = (amount, tokenType, currentAmount) => {
    if (!amount.trim()) {
      return "Amount is required";
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return "Please enter a valid amount";
    }
    if (tokenType === "Bitcoin" && currentAmount) {
      const requestedSatoshis = btcToSatoshis(parseFloat(amount));
      if (requestedSatoshis > currentAmount) {
        return "Insufficient balance";
      }
    }
    return null;
  };

  const handleAnalyzeAddress = () => {
    const addressError = validateAddress(destinationAddress);
    const amountError = validateAmount(
      sendAmount,
      selectedToken?.tokenType,
      selectedToken?.currentAmount
    );

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

    setTimeout(() => {
      setIsAnalyzeAddressSafe(Math.random() < 0.5);
      setIsAnalyzeAddressLoading(false);
      setShowAnalyeAddressModal(true);
    }, 1000);
  };

  // Fetch balances when network or addresses change
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userWallet?.addresses) return;

      const networkAddresses = userWallet.addresses.filter(
        isAddressForCurrentNetwork
      );
      const bitcoinAddresses = networkAddresses
        .filter((addr) => getTokenType(addr) === "Bitcoin")
        .map((addr) => addr.address);

      if (bitcoinAddresses.length === 0) {
        setTokenBalances({});
        setBalanceErrors({});
        return;
      }

      setIsLoadingBalances(true);
      setBalanceErrors({});

      try {
        const { balances, errors } = await fetchBitcoinBalances(
          bitcoinAddresses
        );

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

    const networkAddresses = userWallet.addresses.filter(
      isAddressForCurrentNetwork
    );

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
        hasError:
          balanceErrors[tokenType] &&
          Object.keys(balanceErrors[tokenType]).length > 0,
      };
    });
  };

  const tokens = getTokensForCurrentNetwork();

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
        {/* Card Wallet pakai gambar utuh */}
        <div className="relative items-center w-full mx-auto">
          <img
            src="/assets/cek-card-wallet.png"
            alt="Wallet Card"
            className="block w-full max-w-full h-auto select-none pointer-events-none"
            draggable="false"
          />
          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-20 pb-8">
            <div className="text-white text-xs md:text-xs font-normal mb-1">
              Total Portofolio Value
            </div>
            <div className="text-white text-4xl md:text-4xl font-semibold mb-1">
              $0.00
            </div>
            <div className="text-green-400 text-sm font-medium mb-6 text-center">
              Top up your wallet to start using it!
            </div>
            <div className="flex gap-8 w-full max-w-lg justify-center">
              {/* Receive */}
              <div className="flex flex-col flex-1">
                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                  <div className="absolute top-4 right-4">
                    <NeoButton
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="11"
                            height="11"
                            fill="#0E1117"
                          />
                        </svg>
                      }
                      className="!w-10 !h-10 p-0 flex items-center justify-center"
                      onClick={() => handleReceiveClick(tokens[0])}
                    />
                  </div>
                  <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">
                    Receive
                  </div>
                </div>
              </div>
              {/* Send */}
              <div className="flex flex-col flex-1">
                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                  <div className="absolute top-4 right-4">
                    <NeoButton
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <mask
                            id="mask-send"
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="15"
                            height="15"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="15"
                              height="15"
                              fill="#fff"
                            />
                          </mask>
                          <g mask="url(#mask-send)">
                            <path
                              d="M12 3V10H10.8V5.8L3.5 13.1L2.9 12.5L10.2 5.2H5V3H12Z"
                              fill="#0E1117"
                            />
                          </g>
                        </svg>
                      }
                      className="!w-10 !h-10 p-0 flex items-center justify-center"
                      onClick={() => handleSendClick(tokens[0])}
                    />
                  </div>
                  <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">
                    Send
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Token List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Tokens ({network})
            </h2>
            <div className="flex gap-4">
              <img
                src="/assets/icons/search.svg"
                alt="Search"
                className="w-5 h-5 cursor-pointer"
              />
              <img
                src="/assets/icons/page_info.svg"
                alt="Setting"
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex flex-col divide-y divide-[#23272F]">
            {tokens.length > 0 ? (
              tokens.map((token, idx) => (
                <TokenCard
                  key={idx}
                  token={token}
                  calculateTokenAmountAndValue={calculateTokenAmountAndValue}
                  onSendClick={handleSendClick}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-[#B0B6BE] text-sm mb-2">
                    No tokens found for {network}
                  </div>
                  <div className="text-[#9BEB83] text-xs">
                    Add addresses to see your tokens here
                  </div>
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
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => setShowSendModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">
              Send {selectedToken.name}
            </div>
            <div className="flex flex-col items-center gap-2">
              <img
                src="/assets/images/image-send-coin.png"
                alt="Send Coin"
                className="w-32 h-32 object-contain"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">
                  Recipient Address
                </div>
                <input
                  type="text"
                  className={`w-full bg-[#23272F] border rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none ${
                    sendErrors.address ? "border-red-500" : "border-[#393E4B]"
                  }`}
                  placeholder="ex: m1psqxsfsn3efndfm1psqxsfsnfn"
                  value={destinationAddress}
                  onChange={(e) => {
                    setDestinationAddress(e.target.value);
                    if (sendErrors.address) {
                      setSendErrors((prev) => ({ ...prev, address: null }));
                    }
                  }}
                />
                {sendErrors.address && (
                  <div className="text-red-400 text-xs mt-1">
                    {sendErrors.address}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">
                  Amount ({selectedToken?.name?.toUpperCase() || ""})
                </div>
                <input
                  type="number"
                  className={`w-full bg-[#23272F] border rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none ${
                    sendErrors.amount ? "border-red-500" : "border-[#393E4B]"
                  }`}
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => {
                    setSendAmount(e.target.value);
                    if (sendErrors.amount) {
                      setSendErrors((prev) => ({ ...prev, amount: null }));
                    }
                  }}
                />
                {sendErrors.amount && (
                  <div className="text-red-400 text-xs mt-1">
                    {sendErrors.amount}
                  </div>
                )}
              </div>
            </div>
            <CustomButton
              icon="/assets/icons/analyze-address-light.svg"
              className="mt-2 w-full justify-center"
              onClick={handleAnalyzeAddress}
            >
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
          onClose={() => {
            setShowAnalyeAddressModal(false);
          }}
          onConfirmSend={() => {
            setShowAnalyeAddressModal(false);
          }}
        />
      )}

      {/* Modal Receive Address */}
      {openReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className={`bg-[#23272F] px-6 py-8 w-full ${
              qrDetail.open ? "max-w-sm" : "max-w-md"
            } rounded-lg shadow-lg relative flex flex-col gap-6`}
          >
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => {
                setOpenReceive(false);
                setQrDetail({ open: false, coin: null });
                setQrCodeDataUrl("");
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">
              {qrDetail.open ? `Receive ${qrDetail.coin}` : "Receive Coin"}
            </div>
            {qrDetail.open ? (
              // QR Detail View
              <div className="flex flex-col items-center gap-2">
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR"
                    className="w-full max-w-80 h-auto object-contain bg-white rounded"
                    style={{ imageRendering: "crisp-edges" }}
                  />
                )}
                <div className="text-[#B0B6BE] text-sm">
                  Scan to receive {qrDetail.coin}
                </div>
              </div>
            ) : (
              // Address List View
              <div className="flex flex-col gap-4">
                {receiveAddresses.map((item, idx) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="text-white text-sm font-medium">
                      {item.label}:
                    </div>
                    <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                      <span className="text-[#B0B6BE] text-sm truncate flex-1">
                        {item.address}
                      </span>
                      <img
                        src="/assets/icons/qr_code.svg"
                        alt="QR"
                        className="w-5 h-5 cursor-pointer"
                        onClick={() =>
                          setQrDetail({ open: true, coin: item.label })
                        }
                      />
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
                <div className="text-[#B0B6BE] text-sm mb-1">
                  Your {qrDetail.coin && qrDetail.coin.toLowerCase()} address:
                </div>
                <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                  <span className="text-[#B0B6BE] text-sm truncate flex-1">
                    {
                      receiveAddresses.find((a) => a.label === qrDetail.coin)
                        ?.address
                    }
                  </span>
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
                      navigator.clipboard.writeText(
                        receiveAddresses.find((a) => a.label === qrDetail.coin)
                          ?.address || ""
                      );
                      toast.success("Address copied to clipboard!");
                    }}
                  >
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
                <CustomButton
                  className="w-full"
                  onClick={() => setOpenReceive(false)}
                >
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
function AnalysisResultModal({ isOpen, isSafe, onClose, onConfirmSend }) {
  if (!isOpen) return null;

  const statusConfig = {
    safe: {
      gradientColor: "from-[#22C55E]",
      borderColor: "border-[#22C55E]",
      icon: "/assets/icons/safe.png",
      title: "ADDRESS IS SAFE",
      description:
        "This bitcoin address appears to be clean with no suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Passed",
      checkItems: [
        "No links to known scam addressed",
        "No suspicious transaction pattern detected",
      ],
      transactions: "296",
      totalVolume: "89.98 BTC",
      riskScore: "17/100",
      riskScoreColor: "text-green-400",
      lastActivity: "17 Days Ago",
    },
    danger: {
      gradientColor: "from-[#F87171]",
      borderColor: "border-[#F87171]",
      icon: "/assets/icons/danger.png",
      title: "ADDRESS IS NOT SAFE",
      description:
        "This bitcoin address appears to be flagged with suspicious activity detected in our comprehensive database",
      securityTitle: "Security Checks Not Passed",
      checkItems: [
        "No link to known scam addressed",
        "Suspicious transaction pattern detected",
      ],
      transactions: "1",
      totalVolume: "0.8 BTC",
      riskScore: "89/100",
      riskScoreColor: "text-red-400",
      lastActivity: "329 Days Ago",
    },
  };

  const config = statusConfig[isSafe ? "safe" : "danger"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-[#23272F] w-full max-w-sm rounded-lg shadow-lg">
        <button
          className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold z-20"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="text-white text-xl font-semibold mb-6">
            Send {"Bitcoin"}
          </div>
          <div className="w-full flex flex-col gap-6 relative z-10">
            {/* Status */}
            <div className="rounded-lg overflow-hidden mb-2 bg-white/5">
              {/* Bagian atas dengan gradient */}
              <div className="relative w-full">
                <div
                  className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-b ${config.gradientColor} via-transparent to-transparent opacity-80 z-0`}
                />
                <div className="relative flex items-center gap-3 px-4 py-4 z-10">
                  <img
                    src={config.icon}
                    alt={isSafe ? "Safe" : "Danger"}
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <div className="text-white font-bold text-base leading-tight">
                      {config.title}
                    </div>
                    <div className="text-[#B0B6BE] text-sm">
                      Confidence: 96%
                    </div>
                  </div>
                </div>
              </div>
              {/* Bagian bawah deskripsi */}
              <div className="px-4 pb-4">
                <div className="text-[#B0B6BE] text-xs font-normal">
                  {config.description}
                </div>
              </div>
            </div>
            {/* Address Details */}
            <p className="text-white font-semibold text-lg">Address Details</p>
            <div className="rounded-lg p-4 mb-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">
                    {config.transactions}
                  </span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img
                      src="/assets/icons/wallet-grey.svg"
                      alt="Wallet"
                      className="w-3 h-3"
                    />
                    Transactions
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">
                    {config.totalVolume}
                  </span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img
                      src="/assets/icons/total-volume.svg"
                      alt="Total Volume"
                      className="w-3 h-3"
                    />
                    Total Volume
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span
                    className={`text-sm font-medium ${config.riskScoreColor}`}
                  >
                    {config.riskScore}
                  </span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img
                      src="/assets/icons/risk-score.svg"
                      alt="Risk Score"
                      className="w-3 h-3"
                    />
                    Risk Score
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 flex flex-col">
                  <span className="text-white text-sm font-medium">
                    {config.lastActivity}
                  </span>
                  <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                    <img
                      src="/assets/icons/last-activity.svg"
                      alt="Last Activity"
                      className="w-3 h-3"
                    />
                    Last Activity
                  </span>
                </div>
              </div>
            </div>
            {/* Security Checks */}
            <div
              className={`rounded-lg px-4 py-4 mb-2 border-l-2 ${config.borderColor} relative overflow-hidden bg-white/5`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r ${config.gradientColor}/30 to-transparent pointer-events-none`}
              />
              <div className="relative z-10">
                <div className="text-white font-semibold mb-2 text-sm">
                  {config.securityTitle}
                </div>
                <ul className="flex flex-col gap-1">
                  {config.checkItems.map((item, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 ${
                        isSafe ? "text-[#22C55E]" : "text-[#F87171]"
                      } text-xs`}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill={isSafe ? "#22C55E" : "#F87171"}
                        />
                        <path
                          d="M8 12l2 2 4-4"
                          stroke="#23272F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Button Confirm Send */}
            <div className="flex gap-3 mt-4">
              <CustomButton
                className="w-full justify-center"
                onClick={onConfirmSend}
              >
                Confirm Send
              </CustomButton>
              {!isSafe && (
                <NeoButton
                  className="w-full text-white justify-center"
                  onClick={onClose}
                >
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
        const result = await calculateTokenAmountAndValue(
          token.tokenType,
          token.addresses,
          token.balances
        );
        setAmount(result.amount);
        setValue(result.value);
      } catch (error) {
        console.error(
          `Error calculating ${token.tokenType} amount and value:`,
          error
        );
        setAmount(0);
        setValue("$0.00");
      } finally {
        setIsCalculating(false);
      }
    };

    calculateAmountAndValue();
  }, [
    token.balances,
    token.tokenType,
    token.addresses,
    calculateTokenAmountAndValue,
  ]);

  const handleCardClick = () => {
    // Pass token data including current amount to send modal
    onSendClick({
      ...token,
      currentAmount: amount,
      currentValue: value,
    });
  };

  return (
    <div
      className="flex items-center px-2 py-4 gap-4 cursor-pointer hover:bg-[#181C22] transition-colors rounded-lg"
      onClick={handleCardClick}
    >
      <img src={token.icon} alt={token.name} className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">
            {token.name}
          </span>
          {token.symbol && (
            <span className="text-[#B0B6BE] text-base">• {token.symbol}</span>
          )}
        </div>
        <div className="text-[#B0B6BE] text-sm truncate">{token.desc}</div>
        {token.hasError && (
          <div className="text-red-400 text-xs mt-1">
            Error fetching balance
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        {token.isLoading || isCalculating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9BEB83]"></div>
            <span className="text-[#B0B6BE] text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-white font-semibold text-base">
              {formatTokenAmount(amount, token.tokenType)}
            </span>
            <span className="text-[#B0B6BE] text-sm">{value}</span>
          </>
        )}
      </div>
    </div>
  );
}
