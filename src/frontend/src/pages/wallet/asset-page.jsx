// React & Hooks
import React, { useEffect } from "react";

// External Libraries
import { toast } from "react-toastify";

// Providers & Context
import { useWallet } from "@/core/providers/wallet-provider";

// Custom Hooks
import { useAssetPage } from "@/core/hooks/useAssetPage";

// UI Components
import TransactionButton from "@/core/components/TransactionButton";
import NeoButton from "@/core/components/SidebarButton";
import CustomButton from "@/core/components/custom-button-a";

// Modal Components
import AnalyzeProgressModal from "@/core/components/modals/AnalyzeProgressModal";
import WelcomingWalletModal from "@/core/components/modals/WelcomingWallet";

// Configuration
import { TOKENS_CONFIG } from "@/core/config/tokens.config";
import { backend } from "declarations/backend";

export default function AssetsPage() {
  const { userWallet, network, hideBalance, updateNetworkValues, networkFilters, updateNetworkFilters, createWallet, hasConfirmedWallet } = useWallet();
  const [isCreatingWallet, setIsCreatingWallet] = React.useState(false);

  useEffect(() => {
    const initWallet = async () => {
      try {
        const walletResult = await backend.get_wallet();
        if ("Err" in walletResult && hasConfirmedWallet) {
          // Hanya buat wallet jika user sudah konfirmasi
          setIsCreatingWallet(true);
          await createWallet();
          setIsCreatingWallet(false);
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
        setIsCreatingWallet(false);
      }
    };
    initWallet();
  }, [createWallet, hasConfirmedWallet]);

  const {
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
    setShowNetworkFilter,
    setOpenReceive,
    setQrDetail,
    setShowAnalyzeAddressModal,
    setQrCodeDataUrl,

    // Data
    tokens,
    receiveAddresses,
    totalPortfolioValue,
    formatTokenAmount,
  } = useAssetPage(userWallet, network, networkFilters, updateNetworkFilters, updateNetworkValues);

  // Format portfolio value for display
  const formatPortfolioValue = (value) => {
    if (hideBalance) return "••••••";
    if (isLoadingBalances) return "Loading...";
    return `$${value.toFixed(2)}`;
  };

  if (isCreatingWallet) {
    return <WelcomingWalletModal isOpen={true} />;
  }

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
                      <img src={TOKENS_CONFIG[networkName]?.icon || "/assets/unknown.svg"} alt={networkName} className="w-5 h-5" />
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
              tokens.map((token, idx) => <TokenCard key={idx} token={token} onSendClick={handleSendClick} hideBalance={hideBalance} formatTokenAmount={formatTokenAmount} />)
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
                <select className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none" value={selectedTokenForSend ? selectedTokenForSend.tokenType : ""} onChange={(e) => handleTokenSelection(e.target.value)}>
                  <option value="">Select a token</option>
                  {tokens.map((token, index) => {
                    return (
                      <option key={index} value={token.tokenType}>
                        {token.name} ({token.isLoading ? "Loading..." : hideBalance ? "••••" : formatTokenAmount(token.currentAmount, token.tokenType)})
                      </option>
                    );
                  })}
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
                    Balance: {selectedTokenForSend?.isLoading ? "Loading..." : hideBalance ? "••••" : formatTokenAmount(selectedTokenForSend?.currentAmount || 0, selectedTokenForSend?.tokenType)} {selectedTokenForSend?.name?.toUpperCase() || ""}
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
function TokenCard({ token, onSendClick, hideBalance, formatTokenAmount }) {
  const handleCardClick = () => {
    // Pass token data including current amount to send modal
    onSendClick({
      ...token,
      currentAmount: token.currentAmount,
      currentValue: token.currentValue,
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
        {token.isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9BEB83]"></div>
            <span className="text-[#B0B6BE] text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-white font-semibold text-base">{hideBalance ? "••••" : formatTokenAmount(token.currentAmount, token.tokenType)}</span>
            <span className="text-[#B0B6BE] text-sm">{hideBalance ? "••••" : token.currentValue}</span>
          </>
        )}
      </div>
    </div>
  );
}
