import { Button } from "@/core/components/ui/button";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar,
  User,
  LinkIcon,
  ImageIcon,
  Hash,
  Tag,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { Input } from "@/core/components/ui/input";
import Card from "../../core/components/Card";

export default function DetailReportPage() {
  // Sample report data - would come from API/backend
  const reportData = {
    id: "RPT-2024-0001",
    reporter: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
    reporterShort: "0x742d...8D4",
    chain: "Ethereum",
    reportedAddress: "0x8ba1f109551bD432803012645Hac189451b934",
    reportedAddressShort: "0x8ba1...934",
    category: "Phishing",
    description: `This wallet address has been involved in multiple phishing attacks targeting DeFi users. The address has been observed creating fake websites that mimic popular DeFi protocols like Uniswap and Compound, stealing user credentials and private keys.

    The attacker uses sophisticated social engineering techniques, including fake airdrops and governance proposals to lure victims. Multiple community members have reported losing funds after interacting with contracts deployed by this address.

    Evidence includes screenshots of fake websites, transaction logs showing suspicious patterns, and victim testimonials. The address has been active for approximately 3 months and has stolen an estimated $2.3M in various tokens.

    This address poses a significant threat to the DeFi ecosystem and should be flagged as unsafe to protect other users from falling victim to these sophisticated attacks.`,
    evidence: [
      "https://vibeaudio.co.uk/wp-content/uploads/2024/08/placeholder-2-768x512.png",
      "https://vibeaudio.co.uk/wp-content/uploads/2024/08/placeholder-2-768x512.png",
      "https://vibeaudio.co.uk/wp-content/uploads/2024/08/placeholder-2-768x512.png",
      "https://vibeaudio.co.uk/wp-content/uploads/2024/08/placeholder-2-768x512.png",
      "https://vibeaudio.co.uk/wp-content/uploads/2024/08/placeholder-2-768x512.png",
    ],
    referenceUrl:
      "https://etherscan.io/address/0x8ba1f109551bD432803012645Hac189451b934",
    status: "Pending",
    votes: {
      yes: 67,
      no: 23,
      total: 90,
    },
    voteDeadline: "2024-01-28T15:30:00Z", // Updated to show more realistic countdown
    createdAt: "2024-01-18T10:30:00Z",
    votedBy: [
      { address: "0x1234...5678", vote: "yes" },
      { address: "0x9abc...def0", vote: "no" },
      { address: "0x2468...ace0", vote: "yes" },
      { address: "0x1357...bdf9", vote: "yes" },
      { address: "0x8642...9ce1", vote: "no" },
      { address: "0x7531...8db2", vote: "yes" },
    ],
    riskLevel: "High",
  };

  // State for image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVoters, setShowVoters] = useState(false);
  const [userVote, setUserVote] = useState(null); // null, 'yes', 'no'
  const [timeRemaining, setTimeRemaining] = useState("");

  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState(null); // 'yes' or 'no'
  const [stakeAmount, setStakeAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // User data - would come from API/backend
  const userData = {
    balance: 93,
    contributionScore: 4,
  };

  // Calculate vote percentages
  const yesPercentage = Math.round(
    (reportData.votes.yes / reportData.votes.total) * 100
  );
  const noPercentage = Math.round(
    (reportData.votes.no / reportData.votes.total) * 100
  );

  // Calculate time remaining with real-time updates
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const deadline = new Date(reportData.voteDeadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining("Voting ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(
          `${days} day${days > 1 ? "s" : ""}, ${hours} hour${
            hours !== 1 ? "s" : ""
          } remaining`
        );
      } else if (hours > 0) {
        setTimeRemaining(
          `${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} minute${
            minutes !== 1 ? "s" : ""
          } remaining`
        );
      } else {
        setTimeRemaining(
          `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`
        );
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [reportData.voteDeadline]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Unsafe":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "Safe":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Unsafe":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "Safe":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const handleImageNavigation = (direction) => {
    if (direction === "next") {
      setCurrentImageIndex((prev) => (prev + 1) % reportData.evidence.length);
    } else {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + reportData.evidence.length) % reportData.evidence.length
      );
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const calculateVoteWeight = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return amount * userData.contributionScore;
  };

  const calculateEstimatedReward = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return Math.round(amount * 0.15); // 15% reward if vote is correct
  };

  const handleVoteClick = (vote) => {
    setVoteType(vote);
    setShowVoteModal(true);
    setStakeAmount("");
  };

  const handleConfirmVote = () => {
    setUserVote(voteType);
    setShowVoteModal(false);
    setShowSuccessModal(true);
    // Here you would typically send the vote to your backend
    console.log(`Voted: ${voteType}, Staked: ${stakeAmount} FUM`);
  };

  const handleCancelVote = () => {
    setShowVoteModal(false);
    setVoteType(null);
    setStakeAmount("");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Subtle Green Background Splash - Fixed to follow scroll */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Link
              to="/reports"
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              {/* Report Title & Status */}
              <Card>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 space-y-4 lg:space-y-0">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                      Phishing Report
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div
                        className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          reportData.status
                        )} h-8`}
                      >
                        {getStatusIcon(reportData.status)}
                        <span>{reportData.status}</span>
                      </div>
                      <div className="inline-flex items-center justify-center px-4 py-2 bg-red-400/10 text-red-400 rounded-full text-sm font-medium h-8">
                        {reportData.riskLevel} Risk
                      </div>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-sm text-gray-400 mb-1">Report ID</div>
                    <div className="font-mono text-lg">{reportData.id}</div>
                  </div>
                </div>

                {/* Reported Address - Hero Style */}
                <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-400/20 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-red-400 text-sm font-medium mb-2">
                        FLAGGED ADDRESS
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold mb-2 break-all">
                        {reportData.reportedAddressShort}
                      </div>
                      <div className="font-mono text-sm text-gray-400 break-all">
                        {reportData.reportedAddress}
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        copyToClipboard(reportData.reportedAddress)
                      }
                      className="bg-red-400/20 border border-red-400/30 hover:bg-red-400/30 text-red-400 self-start sm:self-center"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Description */}
              <Card>
                <h2 className="text-xl sm:text-2xl font-semibold mb-6">
                  Threat Analysis
                </h2>
                <div className="prose prose-invert max-w-none">
                  {reportData.description
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-gray-300 leading-relaxed mb-4 text-base sm:text-lg"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </Card>

              {/* Evidence Gallery */}
              <Card>
                <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center">
                  <ImageIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-3" />
                  Evidence Gallery
                </h2>

                {/* Main Image Display */}
                <div className="relative mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden aspect-video">
                    <img
                      src={
                        reportData.evidence[currentImageIndex] ||
                        "/placeholder.svg"
                      }
                      alt={`Evidence ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Navigation Overlay */}
                  {reportData.evidence.length > 1 && (
                    <>
                      <Button
                        onClick={() => handleImageNavigation("prev")}
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full"
                      >
                        <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                      </Button>
                      <Button
                        onClick={() => handleImageNavigation("next")}
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full"
                      >
                        <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm">
                    {currentImageIndex + 1} of {reportData.evidence.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2">
                  {reportData.evidence.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-white"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Evidence thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Voting Panel */}
              <Card>
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Community Vote
                  </h3>
                  <div className="text-sm text-gray-400 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {timeRemaining}
                  </div>
                </div>

                {/* Vote Progress Circle */}
                <div className="relative w-28 sm:w-32 h-28 sm:h-32 mx-auto mb-6">
                  <svg
                    className="w-28 sm:w-32 h-28 sm:h-32 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${yesPercentage * 2.51} 251`}
                      className="text-red-400"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-red-400">
                        {yesPercentage}%
                      </div>
                      <div className="text-xs text-gray-400">Unsafe</div>
                    </div>
                  </div>
                </div>

                {/* Vote Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-400">
                      {reportData.votes.yes}
                    </div>
                    <div className="text-sm text-gray-400">Unsafe</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {reportData.votes.no}
                    </div>
                    <div className="text-sm text-gray-400">Safe</div>
                  </div>
                </div>

                {/* Vote Buttons */}
                {reportData.status === "Pending" && (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleVoteClick("yes")}
                      className={`w-full ${
                        userVote === "yes"
                          ? "bg-red-400 text-white"
                          : "bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Vote Unsafe
                    </Button>
                    <Button
                      onClick={() => handleVoteClick("no")}
                      className={`w-full ${
                        userVote === "no"
                          ? "bg-green-400 text-black"
                          : "bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 text-green-400"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Vote Safe
                    </Button>
                  </div>
                )}

                {/* Voters Toggle */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Button
                    onClick={() => setShowVoters(!showVoters)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm"
                  >
                    {showVoters ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showVoters ? "Hide" : "Show"} Voters (
                    {reportData.votedBy.length})
                  </Button>

                  {showVoters && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {reportData.votedBy.map((voter, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                        >
                          <span className="font-mono text-xs truncate flex-1 mr-2">
                            {voter.address}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                              voter.vote === "yes"
                                ? "bg-red-400/10 text-red-400"
                                : "bg-green-400/10 text-green-400"
                            }`}
                          >
                            {voter.vote === "yes" ? "Unsafe" : "Safe"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Report Details */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Report Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Chain</div>
                      <div className="font-medium">{reportData.chain}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Category</div>
                      <div className="font-medium">{reportData.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Reporter</div>
                      <div className="font-mono text-sm truncate">
                        {reportData.reporterShort}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Created</div>
                      <div className="text-sm">
                        {new Date(reportData.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Reference Link */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Reference
                </h3>
                <Link
                  href={reportData.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Etherscan
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
        {/* Vote Modal */}
        {showVoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black"
              onClick={handleCancelVote}
            ></div>
            <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">
                  Vote {voteType === "yes" ? "Unsafe" : "Safe"}
                </h3>
                <Button
                  onClick={handleCancelVote}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* User Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">
                      Your current balance:
                    </span>
                    <span className="font-bold text-white">
                      {userData.balance} FUM
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">
                      Your contribution score:
                    </span>
                    <span className="font-bold text-white">
                      {userData.contributionScore}
                    </span>
                  </div>
                </div>

                {/* Stake Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter amount of FUM to stake
                  </label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={userData.balance}
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10"
                  />
                </div>

                {/* Live Calculations */}
                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">
                      Your vote weight:
                    </span>
                    <span className="font-bold text-white">
                      {calculateVoteWeight()}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-300 text-sm sm:text-base">
                      If your vote is correct, estimated reward:
                    </span>
                    <span className="font-bold text-green-400">
                      +{calculateEstimatedReward()} FUM
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={handleCancelVote}
                    className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmVote}
                    disabled={
                      !stakeAmount ||
                      Number.parseFloat(stakeAmount) <= 0 ||
                      Number.parseFloat(stakeAmount) > userData.balance
                    }
                    className={`flex-1 ${
                      voteType === "yes"
                        ? "bg-red-400 hover:bg-red-500 text-white"
                        : "bg-green-400 hover:bg-green-500 text-black"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Confirm Vote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black"
              onClick={handleSuccessModalClose}
            ></div>
            <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  Vote Submitted!
                </h3>
                <p className="text-gray-300">
                  Your vote has been submitted successfully!
                </p>
              </div>

              <Button
                onClick={handleSuccessModalClose}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
