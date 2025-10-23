import { Button } from "@/core/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink, Copy, ChevronLeft, ChevronRight, Calendar, User, ImageIcon, Hash, Tag, X } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";
import { Input } from "@/core/components/ui/input";
import Card from "../../core/components/Card";
import toast from "react-hot-toast";
import { useAuth } from "@/core/providers/AuthProvider";
import { getExplorerUrl, getExplorerName, getExplorerIcon } from "@/core/lib/chainExplorers";
import { convertE8sToToken } from "@/core/lib/canisterUtils";
import { Principal } from "@dfinity/principal";
import ButtonPurple from "@/core/components/ButtonPurple";
import ButtonGreen from "@/core/components/ButtonGreen";
import { backend } from "declarations/backend";
import { fradium_ledger as token } from "declarations/fradium_ledger";
import Footer from "@/core/components/Footer";
import { convertReportStatus } from "@/core/lib/reportUtils";

const backendCanisterId = process.env.CANISTER_ID_BACKEND;

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
  const [imageLoading, setImageLoading] = useState({});
  const [thumbnailLoading, setThumbnailLoading] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

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
    const MINIMUM_QUORUM = 3; // Same as backend

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
    console.log("backendData:", backendData);
    if (!backendData) return null;

    const votesYes = parseInt(backendData.votes_yes) || 0;
    const votesNo = parseInt(backendData.votes_no) || 0;
    const totalVotes = votesYes + votesNo;
    const yesPercentage = totalVotes > 0 ? Number(((votesYes / totalVotes) * 100).toFixed(2)) : 0;
    const noPercentage = totalVotes > 0 ? Number(((votesNo / totalVotes) * 100).toFixed(2)) : 0;

    // Convert nanoseconds to milliseconds and then to Date
    const createdAt = new Date(parseInt(backendData.created_at) / 1000000);
    const voteDeadline = new Date(parseInt(backendData.vote_deadline) / 1000000);

    // Get total voters from voted_by array (for quorum check)
    const totalVoters = backendData.voted_by ? backendData.voted_by.length : 0;

    // Determine status - use backend status if available, otherwise calculate from votes
    let status = "Voting";
    if (backendData.status) {
      // Backend already provides status - convert it to readable string
      status = convertReportStatus(backendData.status);
    } else {
      // Fallback: calculate from votes if voting period ended
      if (new Date() > voteDeadline) {
        const MINIMUM_QUORUM = 3;
        if (totalVoters < MINIMUM_QUORUM) {
          status = "Not Validated";
        } else {
          const isUnsafe = isReportUnsafe(backendData);
          status = isUnsafe ? "Unsafe" : "Safe";
        }
      }
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
      case "Voting":
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "Not Validated":
        return <X className="w-5 h-5 text-gray-400" />;
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
      case "Voting":
      case "Pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Not Validated":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
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

  const handleImageLoad = (index, type = "main") => {
    if (type === "main") {
      setImageLoading((prev) => ({ ...prev, [index]: false }));
    } else {
      setThumbnailLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleImageError = (index, type = "main") => {
    if (type === "main") {
      setImageLoading((prev) => ({ ...prev, [index]: false }));
    } else {
      setThumbnailLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setShowImageModal(true);
    try {
      window.dispatchEvent(new CustomEvent("image-modal-toggle", { detail: { open: true } }));
    } catch (_e) {}
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    try {
      window.dispatchEvent(new CustomEvent("image-modal-toggle", { detail: { open: false } }));
    } catch (_e) {}
  };

  const navigateModalImage = (direction) => {
    if (!uiData || !uiData.evidence || uiData.evidence.length === 0) return;
    if (direction === "next") {
      setModalImageIndex((prev) => (prev + 1) % uiData.evidence.length);
    } else {
      setModalImageIndex((prev) => (prev - 1 + uiData.evidence.length) % uiData.evidence.length);
    }
  };

  useEffect(() => {
    if (!showImageModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeImageModal();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateModalImage("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateModalImage("prev");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showImageModal, uiData]);

  useEffect(() => {
    // Lock body scroll when image modal is open
    if (showImageModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
        try {
          window.dispatchEvent(new CustomEvent("image-modal-toggle", { detail: { open: false } }));
        } catch (_e) {}
      };
    }
  }, [showImageModal]);

  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
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

      // Convert stake amount to e8s (8 decimal places)
      const stakeAmountE8s = BigInt(Math.floor(Number.parseFloat(stakeAmount) * 1e8));

      // Approve allowance (ICRC-2) for backend canister before voting
      const approvalAmount = stakeAmountE8s + BigInt(50000000); // +0.5 $FRADIUM buffer

      const approveResult = await token.icrc2_approve({
        from_subaccount: [],
        spender: {
          owner: Principal.fromText(backendCanisterId),
          subaccount: [],
        },
        amount: approvalAmount,
        fee: [],
        memo: [],
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
      });

      if (!approveResult || approveResult.Err) {
        if (approveResult?.Err?.InsufficientFunds) {
          throw new Error("Insufficient funds. Please top up your balance.");
        } else if (approveResult?.Err?.InsufficientAllowance) {
          throw new Error("Insufficient allowance. Please try again.");
        } else if (approveResult?.Err?.BadFee) {
          throw new Error(`Bad fee. Expected: ${approveResult.Err.BadFee.expected_fee}`);
        } else if (approveResult?.Err?.AllowanceChanged) {
          throw new Error(`Allowance changed. Current: ${approveResult.Err.AllowanceChanged.current_allowance}`);
        } else if (approveResult?.Err?.GenericError) {
          throw new Error(approveResult.Err.GenericError.message || "Approve failed");
        } else {
          throw new Error("Failed to approve tokens");
        }
      }

      // Call backend vote_report function
      const voteParams = {
        report_id: parseInt(uiData.id),
        stake_amount: stakeAmountE8s,
        vote_type: voteType === "yes" ? { Unsafe: null } : { Safe: null }, // variant type: #Unsafe or #Safe
      };

      const result = await backend.vote_report(voteParams);

      if (result.Err) {
        throw new Error(result.Err);
      }

      // Success - close modal and show success
      setShowVoteModal(false);
      setShowSuccessModal(true);

      // Fetch updated report data without page reload
      try {
        const reportId = parseInt(id);
        const response = await backend.get_report(reportId);
        if (response.Ok) {
          setReportData(response.Ok);
        }
      } catch (error) {
        console.error("Error refreshing report data:", error);
      }

      // Refresh balance
      try {
        const balance = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setUserBalance(balance);

        // Trigger balance update event for navbar
        window.dispatchEvent(new Event("balance-updated"));
      } catch (error) {
        console.error("Error refreshing balance:", error);
      }
    } catch (error) {
      console.error("Vote submission error:", error);
      toast.error(error.message || "Failed to submit vote");
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

  // Disable page scroll when vote modal is open (match other modals)
  useEffect(() => {
    if (showVoteModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [showVoteModal]);

  // Disable page scroll when success modal is open
  useEffect(() => {
    if (showSuccessModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [showSuccessModal]);

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
        console.log("Fetching report with ID:", id, "Type:", typeof id);

        // First, try to get all reports to see what's available
        console.log("Getting all reports to debug...");
        const allReportsResponse = await backend.get_reports();
        console.log("All reports response:", allReportsResponse);

        if (allReportsResponse.Ok && allReportsResponse.Ok.length > 0) {
          console.log(
            "Available report IDs:",
            allReportsResponse.Ok.map((r) => r.report_id)
          );
          console.log("Looking for report ID:", id, "in available IDs");

          // Try to find the report by different ID comparisons
          let foundReport = allReportsResponse.Ok.find((r) => r.report_id.toString() === id);
          if (!foundReport) {
            foundReport = allReportsResponse.Ok.find((r) => Number(r.report_id) === Number(id));
          }
          if (!foundReport) {
            foundReport = allReportsResponse.Ok.find((r) => r.report_id === parseInt(id));
          }

          if (foundReport) {
            console.log("Found report by search:", foundReport);
            setReportData(foundReport);
            // Initialize loading states for images
            if (foundReport.evidence && foundReport.evidence.length > 0) {
              const initialImageLoading = {};
              const initialThumbnailLoading = {};
              foundReport.evidence.forEach((_, index) => {
                initialImageLoading[index] = true;
                initialThumbnailLoading[index] = true;
              });
              setImageLoading(initialImageLoading);
              setThumbnailLoading(initialThumbnailLoading);
            }
            return;
          }
        }

        // If not found in all reports, try direct backend call
        console.log("Trying direct backend call...");
        const reportId = parseInt(id);
        console.log("Converted to parseInt:", reportId);

        let response = await backend.get_report(reportId);
        console.log("Backend response:", response);

        if (response.Err) {
          console.log("parseInt failed, trying with Number:", Number(id));
          response = await backend.get_report(Number(id));
        }

        if (response.Err) {
          console.log("Number failed, trying with BigInt:", BigInt(id));
          response = await backend.get_report(BigInt(id));
        }

        console.log("Final backend response:", response);
        if (response.Err) {
          console.error("All methods failed. Report not found error:", response.Err);
          toast.error("Report not found. Please check the URL or try again.");
        } else {
          console.log("Report data received successfully:", response.Ok);
          setReportData(response.Ok);
          // Initialize loading states for images
          if (response.Ok.evidence && response.Ok.evidence.length > 0) {
            const initialImageLoading = {};
            const initialThumbnailLoading = {};
            response.Ok.evidence.forEach((_, index) => {
              initialImageLoading[index] = true;
              initialThumbnailLoading[index] = true;
            });
            setImageLoading(initialImageLoading);
            setThumbnailLoading(initialThumbnailLoading);
          }
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error("Failed to fetch report");
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
          <p className="text-gray-500 mb-4 text-sm">Report ID: {id}</p>
          <Link to="/reports" className="inline-flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#000510] text-white relative overflow-hidden min-h-screen">
      {/* Background layer - starts from bottom with natural height */}
      <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="w-full h-auto object-contain object-bottom" />
        {/* Dark overlay untuk background lebih gelap */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      {/* Soft fade at top edge to blend with navbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 md:h-28 bg-gradient-to-b from-[#000510] to-transparent z-0" />

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
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-medium mb-4 capitalize">{uiData.category} Report</h1>
                <p className="text-gray-300 text-sm sm:text-base mb-6">Help protect the community by reporting suspicious wallet addresses and fraudulent activities.</p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(uiData.status)} h-8`}>
                    {getStatusIcon(uiData.status)}
                    <span>{uiData.status}</span>
                  </div>
                  <div className="inline-flex items-center justify-center px-4 py-2 bg-red-400/10 text-red-400 rounded-full text-sm font-medium h-8">{uiData.riskLevel} Risk</div>
                </div>
              </div>

              {/* FLAGGED ADDRESS Card */}
              <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-400/20 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-red-400 text-sm font-medium mb-2 uppercase tracking-wider">FLAGGED ADDRESS</div>
                    <div className="font-mono text-xl sm:text-2xl font-bold mb-2 text-white">{uiData.shortAddress}</div>
                    <div className="text-sm text-gray-400 capitalize">
                      {uiData.category} • Reported {uiData.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard(uiData.address)} className="bg-white/5 border border-white/50 hover:bg-gray-700/80 text-white self-start sm:self-center px-4 py-2 rounded-full shadow-md transition-colors flex items-center gap-2">
                    {copiedAddress ? (
                      <svg className="w-4 h-4 text-[#9BE4A0]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedAddress ? "Copied!" : "Copy"}
                  </button>
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
                    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden aspect-video">
                      {uiData.evidence[currentImageIndex] ? (
                        <>
                          {/* Loading Skeleton */}
                          {imageLoading[currentImageIndex] && (
                            <div className="absolute inset-0 bg-gray-800 animate-pulse">
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2 animate-pulse"></div>
                                  <div className="w-24 h-4 bg-gray-600 rounded mx-auto mb-1 animate-pulse"></div>
                                  <div className="w-16 h-3 bg-gray-600 rounded mx-auto animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actual Image */}
                          <img
                            src={uiData.evidence[currentImageIndex]}
                            alt={`Evidence ${currentImageIndex + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading[currentImageIndex] ? "opacity-0" : "opacity-100"} cursor-zoom-in`}
                            onLoad={() => handleImageLoad(currentImageIndex, "main")}
                            onError={(e) => {
                              handleImageError(currentImageIndex, "main");
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                            onClick={() => openImageModal(currentImageIndex)}
                          />
                        </>
                      ) : null}

                      {/* Fallback for missing or broken images */}
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400" style={{ display: uiData.evidence[currentImageIndex] ? "none" : "flex" }}>
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Evidence {currentImageIndex + 1}</p>
                          <p className="text-xs text-gray-500">No image available</p>
                        </div>
                      </div>
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
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {uiData.evidence.map((image, index) => (
                      <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${index === currentImageIndex ? "border-white" : "border-white/20 hover:border-white/40"}`}>
                        {image ? (
                          <>
                            {/* Thumbnail Loading Skeleton */}
                            {thumbnailLoading[index] && (
                              <div className="absolute inset-0 bg-gray-700 animate-pulse">
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
                                </div>
                              </div>
                            )}

                            {/* Actual Thumbnail Image */}
                            <img
                              src={image}
                              alt={`Evidence thumbnail ${index + 1}`}
                              className={`w-full h-full object-cover transition-opacity duration-300 ${thumbnailLoading[index] ? "opacity-0" : "opacity-100"}`}
                              onLoad={() => handleImageLoad(index, "thumbnail")}
                              onError={(e) => {
                                handleImageError(index, "thumbnail");
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          </>
                        ) : null}

                        {/* Fallback for missing thumbnails */}
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400" style={{ display: image ? "none" : "flex" }}>
                          <ImageIcon className="w-6 h-6 opacity-50" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Community Vote Panel - Aligned with FLAGGED ADDRESS card */}
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg mt-16">
                <h3 className="text-lg font-semibold mb-4 text-white">Community Vote</h3>

                {/* Timer */}
                <div className="text-sm text-gray-400 mb-6 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {timeRemaining}
                </div>

                {/* Vote Progress Circle */}
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${uiData.yesPercentage * 2.51} 251`} className="text-red-400" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{uiData.yesPercentage}%</div>
                      <div className="text-sm text-red-400 font-medium">Unsafe</div>
                    </div>
                  </div>
                </div>

                {/* Vote Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Unsafe: {uiData.yesPercentage}%</span>
                    <span className="text-green-400">Safe: {uiData.noPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full transition-all duration-300" style={{ width: `${uiData.yesPercentage}%` }}></div>
                  </div>
                </div>

                {/* Vote Buttons */}
                {(uiData.status === "Voting" || uiData.status === "Pending") && !uiData.hasUserVoted && isAuthenticated && !uiData.isUserReporter && (
                  <div className="space-y-4 mt-6">
                    <button onClick={() => handleVoteClick("yes")} className={`w-full py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${userVote === "yes" ? "bg-red-400 text-white" : "bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400"}`}>
                      <AlertTriangle className="w-4 h-4" />
                      Vote Unsafe
                    </button>
                    <button onClick={() => handleVoteClick("no")} className={`w-full py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${userVote === "no" ? "bg-green-400 text-black" : "bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 text-green-400"}`}>
                      <CheckCircle className="w-4 h-4" />
                      Vote Safe
                    </button>
                  </div>
                )}

                {/* Show message if user has already voted */}
                {(uiData.status === "Voting" || uiData.status === "Pending") && uiData.hasUserVoted && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">You have already voted on this report</p>
                  </div>
                )}

                {/* Show message if user is the reporter */}
                {(uiData.status === "Voting" || uiData.status === "Pending") && isAuthenticated && uiData.isUserReporter && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">You cannot vote on your own report</p>
                  </div>
                )}

                {/* Show message if user is not authenticated */}
                {(uiData.status === "Voting" || uiData.status === "Pending") && !isAuthenticated && (
                  <div className="text-center py-4 px-6">
                    <p className="text-gray-400 text-sm mb-3">Please login to vote on this report</p>
                    <ButtonPurple size="sm" fullWidth onClick={() => handleLogin()} fontWeight="medium" iconSize="w-5 h-5" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg">
                      Login to Vote
                    </ButtonPurple>
                  </div>
                )}
              </div>

              {/* Reports Note */}
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-lg">
                <h3 className="text-2xl font-medium mb-6 text-white">Reports Note</h3>
                <div className="space-y-5">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Chain</div>
                      <div className="text-base font-medium text-white">{uiData.chain}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Category</div>
                      <div className="text-base font-medium text-white capitalize">{uiData.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Reporter</div>
                      <div className="text-base font-medium text-white font-mono truncate">{uiData.reporterShort}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-400">Created</div>
                      <div className="text-base font-medium text-white">{uiData.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View on Blockcharm Button */}
              {getExplorerName(uiData.chain) !== "Explorer" && (
                <a href={getExplorerUrl(uiData.chain, uiData.address)} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white font-semibold py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View on {getExplorerName(uiData.chain)}
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Vote Modal */}
        {showVoteModal && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10">
                <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={handleCancelVote} aria-label="Close">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex flex-col items-center p-4 gap-4 h-auto">
                  <div className={`w-full text-center text-lg font-medium bg-clip-text text-transparent ${voteType === "yes" ? "bg-gradient-to-r from-red-400/80 via-red-300/80 to-red-400/80" : "bg-gradient-to-r from-green-400/80 via-green-300/80 to-green-400/80"}`}>Vote {voteType === "yes" ? "Unsafe" : "Safe"}</div>

                  <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white/90 text-[13px] font-medium">Your current balance</span>
                      <span className="text-white text-sm font-mono">{isBalanceLoading ? "Loading..." : userBalance ? `${convertE8sToToken(userBalance)} $FRADIUM` : "0 $FRADIUM"}</span>
                    </div>
                  </div>

                  <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="text-white/90 text-[13px] font-medium mb-2">Enter amount of $FRADIUM to stake</div>
                    <div className="rounded-full border border-white/10 pl-4 pr-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0" min="0" max={userBalance ? convertE8sToToken(userBalance) : 0} className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none font-mono" />
                        {stakeAmount && (
                          <button type="button" className="text-xs font-medium text-[#9BEB83] hover:text-white transition-colors" onClick={() => setStakeAmount("")}>
                            CLEAR
                          </button>
                        )}
                        <button type="button" className="text-xs font-medium text-[#9BE4A0] hover:text-white transition-colors px-2 py-1 border border-[#9BE4A0]/30 rounded-full hover:bg-[#9BE4A0]/10" onClick={() => userBalance && setStakeAmount(convertE8sToToken(userBalance).toString())} disabled={!userBalance || convertE8sToToken(userBalance) <= 0}>
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/90 text-[13px] font-medium">Your vote weight</span>
                        <span className="text-white text-sm font-mono">{calculateVoteWeight()}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-[#B0B6BE] text-xs">If your vote is correct, estimated reward</span>
                        <span className="text-white text-sm font-mono">+{calculateEstimatedReward()} $FRADIUM</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full px-2 sm:px-3 pb-2">
                    <ButtonGreen fullWidth disabled={isSubmitting || !stakeAmount || Number.parseFloat(stakeAmount) <= 0 || Number.parseFloat(stakeAmount) > (userBalance ? convertE8sToToken(userBalance) : 0)} onClick={handleSubmit} size="md" textSize="text-base" fontWeight="medium">
                      {isSubmitting ? "Submitting..." : "Confirm Vote"}
                    </ButtonGreen>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10">
                <div className="flex flex-col items-center p-4 gap-4 h-auto text-center">
                  <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-white text-lg font-medium mb-2">Vote Submitted!</div>
                  <div className="text-[#B0B6BE] text-sm">Your vote has been submitted successfully!</div>

                  <div className="w-full px-2 sm:px-3 pb-2">
                    <ButtonGreen fullWidth onClick={handleSuccessModalClose} size="md" textSize="text-base" fontWeight="medium">
                      Continue
                    </ButtonGreen>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Fullscreen Modal */}
        {showImageModal && uiData && uiData.evidence && uiData.evidence.length > 0 && (
          <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black" onClick={closeImageModal}></div>
            <div className="relative z-[10000] w-full h-full flex items-center justify-center p-4">
              <div className="absolute top-4 right-4">
                <Button onClick={closeImageModal} className="bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Navigation Buttons */}
              {uiData.evidence.length > 1 && (
                <>
                  <Button onClick={() => navigateModalImage("prev")} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3">
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button onClick={() => navigateModalImage("next")} className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3">
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Counter */}
              <div className="absolute top-4 left-4 text-white/80 text-sm bg-white/10 rounded px-2 py-1 border border-white/20">
                {modalImageIndex + 1} / {uiData.evidence.length}
              </div>

              {/* Image */}
              <div className="max-w-[92vw] max-h-[86vh]">
                <img src={uiData.evidence[modalImageIndex]} alt={`Evidence fullscreen ${modalImageIndex + 1}`} className="w-auto h-auto max-w-full max-h-[86vh] object-contain select-none" draggable={false} />
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
