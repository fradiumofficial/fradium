import { Button } from "@/core/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink, Copy, ChevronLeft, ChevronRight, Calendar, User, ImageIcon, Hash, Tag, X } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";
import { Input } from "@/core/components/ui/input";
import Card from "../../core/components/Card";
import { toast } from "react-toastify";
import { useAuth } from "@/core/providers/AuthProvider";
import { getExplorerUrl, getExplorerName, getExplorerIcon } from "@/core/lib/chainExplorers";
import { convertE8sToToken } from "@/core/lib/canisterUtils";
import { Principal } from "@dfinity/principal";
import PrimaryButton from "@/core/components/Button";

export default function DetailReportPage() {
  const { id } = useParams();
  const { identity, isAuthenticated, handleLogin } = useAuth();

  // State for report data
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userVote, setUserVote] = useState(null); // null, 'yes', 'no'
  const [timeRemaining, setTimeRemaining] = useState("");

  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState(null); // 'yes' or 'no'
  const [stakeAmount, setStakeAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User data - would come from API/backend
  const [userBalance, setUserBalance] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  // Helper function to check if a vote is correct based on majority and quorum (same logic as backend)
  const isVoteCorrect = (report, voteType) => {
    const MINIMUM_QUORUM = 1; // Same as backend

    // Check if minimum quorum is met
    const totalVoters = report.voted_by.length;
    if (totalVoters < MINIMUM_QUORUM) {
      return false; // Not enough voters to determine result
    }

    // Calculate total weight for yes and no votes
    let totalYesWeight = 0;
    let totalNoWeight = 0;

    for (const voter of report.voted_by) {
      const weight = Number(voter.vote_weight);
      if (voter.vote === true) {
        totalYesWeight += weight;
      } else {
        totalNoWeight += weight;
      }
    }

    // Check if YES votes > NO votes (majority rule)
    const isYesMajority = totalYesWeight > totalNoWeight;

    // Vote is correct if:
    // - voteType = true (unsafe) and YES is majority (report marked as unsafe)
    // - voteType = false (safe) and NO is majority (report marked as safe)
    const isVoteCorrect = isYesMajority ? voteType === true : voteType === false;

    return isVoteCorrect;
  };

  // Helper function to determine if report is unsafe using same logic as backend
  const isReportUnsafe = (report) => {
    const currentTime = Date.now() * 1000000; // Convert to nanoseconds
    const voteDeadline = parseInt(report.vote_deadline);

    if (currentTime > voteDeadline) {
      // Use isVoteCorrect function to determine if report is unsafe (voteType = true)
      return isVoteCorrect(report, true);
    } else {
      // If voting is still ongoing, assume safe
      return false;
    }
  };

  // Helper function to convert backend data to UI format
  const convertBackendDataToUI = (backendData) => {
    if (!backendData) return null;

    const votesYes = parseInt(backendData.votes_yes) || 0;
    const votesNo = parseInt(backendData.votes_no) || 0;
    const totalVotes = votesYes + votesNo;
    const yesPercentage = totalVotes > 0 ? Number(((votesYes / totalVotes) * 100).toFixed(2)) : 0;
    const noPercentage = totalVotes > 0 ? Number(((votesNo / totalVotes) * 100).toFixed(2)) : 0;

    // Convert nanoseconds to milliseconds and then to Date
    const createdAt = new Date(parseInt(backendData.created_at) / 1000000);
    const voteDeadline = new Date(parseInt(backendData.vote_deadline) / 1000000);

    // Determine status based on deadline and votes using same logic as backend
    let status = "Pending";
    if (new Date() > voteDeadline) {
      const isUnsafe = isReportUnsafe(backendData);
      status = isUnsafe ? "Unsafe" : "Safe";
    }

    // Convert Principal objects to strings
    const reporterString = typeof backendData.reporter === "object" && backendData.reporter._arr ? backendData.reporter.toString() : String(backendData.reporter);

    // Create short addresses
    const shortAddress = backendData.address.length > 10 ? `${backendData.address.substring(0, 6)}...${backendData.address.substring(backendData.address.length - 4)}` : backendData.address;
    const reporterShort = reporterString.length > 10 ? `${reporterString.substring(0, 6)}...${reporterString.substring(reporterString.length - 4)}` : reporterString;

    // Check if current user has already voted
    const currentUserPrincipal = isAuthenticated ? identity.getPrincipal().toString() : null;
    const hasUserVoted = backendData.voted_by.some((voter) => {
      const voterString = typeof voter.voter === "object" && voter.voter._arr ? voter.voter.toString() : String(voter.voter);
      return voterString === currentUserPrincipal;
    });

    // Check if current user is the reporter
    const isUserReporter = currentUserPrincipal === reporterString;

    return {
      id: backendData.report_id,
      reporter: reporterString,
      reporterShort: reporterShort,
      chain: backendData.chain,
      address: backendData.address,
      shortAddress: shortAddress,
      category: backendData.category,
      description: backendData.description,
      evidence: backendData.evidence || [],
      url: backendData.url || null,
      status: status,
      votes: {
        yes: votesYes,
        no: votesNo,
        total: totalVotes,
      },
      yesPercentage: yesPercentage,
      noPercentage: noPercentage,
      voteDeadline: voteDeadline,
      createdAt: createdAt,
      hasUserVoted: hasUserVoted,
      isUserReporter: isUserReporter,
      riskLevel: backendData.category.charAt(0).toUpperCase() + backendData.category.slice(1),
    };
  };

  // Calculate vote percentages from converted data
  const uiData = convertBackendDataToUI(reportData);
  const yesPercentage = uiData ? uiData.yesPercentage : 0;
  const noPercentage = uiData ? uiData.noPercentage : 0;

  // Calculate time remaining with real-time updates
  useEffect(() => {
    if (!uiData) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const deadline = uiData.voteDeadline;
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining("Voting ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""} remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} minute${minutes !== 1 ? "s" : ""} remaining`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes !== 1 ? "s" : ""} remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [uiData]);

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
    if (!uiData || !uiData.evidence) return;

    if (direction === "next") {
      setCurrentImageIndex((prev) => (prev + 1) % uiData.evidence.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + uiData.evidence.length) % uiData.evidence.length);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const calculateVoteWeight = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return amount;
  };

  const calculateEstimatedReward = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return amount * 0.1; // 10% reward if vote is correct
  };

  const handleVoteClick = (vote) => {
    setVoteType(vote);
    setShowVoteModal(true);
    setStakeAmount("");
  };

  const handleSubmit = async () => {
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0 || Number.parseFloat(stakeAmount) > (userBalance ? convertE8sToToken(userBalance) : 0)) {
      toast.error("Invalid stake amount");
      return;
    }

    try {
      setIsSubmitting(true);

      throw new Error("Not implemented");
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVote = () => {
    setShowVoteModal(false);
    setVoteType(null);
    setStakeAmount("");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isAuthenticated) return;

      setIsBalanceLoading(true);
      try {
        const balance = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setUserBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast.error("Failed to fetch balance");
      } finally {
        setIsBalanceLoading(false);
      }
    };
    fetchBalance();
  }, [identity, isAuthenticated]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await backend.get_report(parseInt(id));
        if (response.Err) {
          toast.error(response.Err);
        } else {
          setReportData(response.Ok);
        }
      } catch (error) {
        toast.error("Failed to fetch report");
        console.error("Error fetching report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!uiData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-gray-400 mb-4">The report you're looking for doesn't exist or has been removed.</p>
          <Link to="/reports" className="inline-flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Subtle Green Background Splash - Fixed to follow scroll */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <main className="pt-24 mb-32 pb-16 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Link to="/reports" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              {/* Report Title & Status */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">{uiData.category} Report</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(uiData.status)} h-8`}>
                      {getStatusIcon(uiData.status)}
                      <span>{uiData.status}</span>
                    </div>
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-red-400/10 text-red-400 rounded-full text-sm font-medium h-8">{uiData.riskLevel} Risk</div>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <div className="text-sm text-gray-400 mb-1">Report ID</div>
                  <div className="font-mono text-lg">#{uiData.id.toString().padStart(4, "0")}</div>
                </div>
              </div>

              {/* Reported Address - Hero Style */}
              <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-400/20 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-red-400 text-sm font-medium mb-2">FLAGGED ADDRESS</div>
                    <div className="font-mono text-xl sm:text-2xl font-bold mb-2 break-all">{uiData.shortAddress}</div>
                    <div className="font-mono text-sm text-gray-400 break-all">{uiData.address}</div>
                  </div>
                  <Button onClick={() => copyToClipboard(uiData.address)} className="bg-red-400/20 border border-red-400/30 hover:bg-red-400/30 text-red-400 self-start sm:self-center">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 mt-10">Threat Analysis</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed mb-4 text-base sm:text-lg">{uiData.description}</p>
              </div>

              {/* Evidence Gallery */}
              {uiData.evidence && uiData.evidence.length > 0 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center">
                    <ImageIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-3" />
                    Evidence Gallery ({uiData.evidence.length})
                  </h2>

                  {/* Main Image Display */}
                  <div className="relative mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden aspect-video">
                      <img src={uiData.evidence[currentImageIndex] || "/placeholder.svg"} alt={`Evidence ${currentImageIndex + 1}`} className="w-full h-full object-cover" />
                    </div>

                    {/* Navigation Overlay */}
                    {uiData.evidence.length > 1 && (
                      <>
                        <Button onClick={() => handleImageNavigation("prev")} className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full">
                          <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                        </Button>
                        <Button onClick={() => handleImageNavigation("next")} className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full">
                          <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm">
                      {currentImageIndex + 1} of {uiData.evidence.length}
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2">
                    {uiData.evidence.map((image, index) => (
                      <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? "border-white" : "border-white/20 hover:border-white/40"}`}>
                        <img src={image || "/placeholder.svg"} alt={`Evidence thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Voting Panel */}
              <Card>
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Community Vote</h3>
                  <div className="text-sm text-gray-400 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {timeRemaining}
                  </div>
                </div>

                {/* Vote Progress Circle */}
                <div className="relative w-28 sm:w-32 h-28 sm:h-32 mx-auto mb-6">
                  <svg className="w-28 sm:w-32 h-28 sm:h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${yesPercentage * 2.51} 251`} className="text-red-400" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-red-400">{yesPercentage}%</div>
                      <div className="text-xs text-gray-400">Unsafe</div>
                    </div>
                  </div>
                </div>

                {/* Vote Stats */}
                <div className="mb-6 px-6">
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400">Unsafe: {uiData.yesPercentage}%</span>
                      <span className="text-green-400">Safe: {uiData.noPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full transition-all duration-300" style={{ width: `${uiData.yesPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Vote Buttons */}
                {uiData.status === "Pending" && !uiData.hasUserVoted && isAuthenticated && !uiData.isUserReporter && (
                  <div className="space-y-3">
                    <Button onClick={() => handleVoteClick("yes")} className={`w-full ${userVote === "yes" ? "bg-red-400 text-white" : "bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400"}`}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Vote Unsafe
                    </Button>
                    <Button onClick={() => handleVoteClick("no")} className={`w-full ${userVote === "no" ? "bg-green-400 text-black" : "bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 text-green-400"}`}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Vote Safe
                    </Button>
                  </div>
                )}

                {/* Show message if user has already voted */}
                {uiData.status === "Pending" && uiData.hasUserVoted && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">You have already voted on this report</p>
                  </div>
                )}

                {/* Show message if user is the reporter */}
                {uiData.status === "Pending" && isAuthenticated && uiData.isUserReporter && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">You cannot vote on your own report</p>
                  </div>
                )}

                {/* Show message if user is not authenticated */}
                {uiData.status === "Pending" && !isAuthenticated && (
                  <div className="text-center py-4 px-6">
                    <p className="text-gray-400 text-sm mb-3">Please login to vote on this report</p>
                    <PrimaryButton className="w-full" onClick={() => handleLogin()}>
                      Login to Vote
                    </PrimaryButton>
                  </div>
                )}
              </Card>

              {/* Report Details */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Report Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Chain</div>
                      <div className="font-medium">{uiData.chain}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Category</div>
                      <div className="font-medium">{uiData.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Reporter</div>
                      <div className="font-mono text-sm truncate">{uiData.reporterShort}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Created</div>
                      <div className="text-sm">{uiData.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chain Explorer Link */}
              {getExplorerName(uiData.chain) !== "Explorer" && (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">{getExplorerIcon(uiData.chain)}</span>
                    {getExplorerName(uiData.chain)}
                  </h3>
                  <a href={getExplorerUrl(uiData.chain, uiData.address)} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on {getExplorerName(uiData.chain)}
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Vote Modal */}
        {showVoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black" onClick={handleCancelVote}></div>
            <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Vote {voteType === "yes" ? "Unsafe" : "Safe"}</h3>
                <Button onClick={handleCancelVote} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* User Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Your current balance:</span>
                    <span className="font-bold text-white">{isBalanceLoading ? "Loading..." : userBalance ? `${convertE8sToToken(userBalance)} FUM` : "0 FUM"}</span>
                  </div>
                </div>

                {/* Stake Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Enter amount of FUM to stake</label>
                  <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0" min="0" max={userBalance ? convertE8sToToken(userBalance) : 0} className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10" />
                </div>

                {/* Live Calculations */}
                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Your vote weight:</span>
                    <span className="font-bold text-white">{calculateVoteWeight()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-300 text-sm sm:text-base">If your vote is correct, estimated reward:</span>
                    <span className="font-bold text-green-400">+{calculateEstimatedReward()} FUM</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button onClick={handleCancelVote} className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !stakeAmount || Number.parseFloat(stakeAmount) <= 0 || Number.parseFloat(stakeAmount) > (userBalance ? convertE8sToToken(userBalance) : 0)} className={`flex-1 ${voteType === "yes" ? "bg-red-400 hover:bg-red-500 text-white" : "bg-green-400 hover:bg-green-500 text-black"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isSubmitting ? "Submitting..." : "Confirm Vote"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black" onClick={handleSuccessModalClose}></div>
            <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Vote Submitted!</h3>
                <p className="text-gray-300">Your vote has been submitted successfully!</p>
              </div>

              <Button onClick={handleSuccessModalClose} className="w-full bg-white text-black hover:bg-gray-200">
                Continue
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
