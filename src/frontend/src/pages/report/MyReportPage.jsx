// UI Components
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import PrimaryButton from "@/core/components/Button";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import Footer from "../../core/components/Footer.jsx";
import ReportCard from "@/core/components/ReportCard.jsx";

// Declarations
import { fradium_ledger as token } from "declarations/fradium_ledger";
import { backend as backend } from "declarations/backend";

// Utils
import { convertReportStatus, convertVoteType } from "@/core/lib/reportUtils";

// Icon
import { AlertTriangle, CheckCircle, Clock, Coins, Eye, FileText, Search, Vote, X, Tag, Calendar, Hash } from "lucide-react";

// React Hooks
import { useEffect, useState, useRef } from "react";

// Router
import { Link, useNavigate } from "react-router";

// Toast
import { toast } from "react-toastify";

// Auth
import { useAuth } from "@/core/providers/AuthProvider";

// Utils
import { convertE8sToToken, formatAddress } from "@/core/lib/canisterUtils";
import { formatAmount } from "@/core/lib/tokenUtils";

export default function MyReportPage() {
  const { isAuthenticated: isConnected, identity } = useAuth();
  const navigate = useNavigate();

  // Enhanced skeleton card for reports with better animations
  const SkeletonReportCard = () => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)] animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex mb-2 items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
            <div className="h-4 w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded animate-[shimmer_2s_ease-in-out_infinite]" />
            <div className="h-5 w-20 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded-full ml-3 animate-[shimmer_2s_ease-in-out_infinite]" />
          </div>
          <div className="h-5 w-64 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded mb-3 animate-[shimmer_2s_ease-in-out_infinite]" />
          <div className="h-4 w-40 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded mb-4 animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>
        <div className="h-9 w-28 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded-full animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
      <div className="flex justify-between text-xs mb-2">
        <div className="h-3 w-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded animate-[shimmer_2s_ease-in-out_infinite]" />
        <div className="h-3 w-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] rounded animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="h-2 w-1/2 bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );

  // User balance state
  const [userBalance, setUserBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState(identity ? identity.getPrincipal().toString() : "");

  // Tab state
  const [activeTab, setActiveTab] = useState("created"); // created, voted

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, unsafe, safe

  // Data state
  const [createdReports, setCreatedReports] = useState([]);
  const [votedReports, setVotedReports] = useState([]);
  const [isLoadingCreated, setIsLoadingCreated] = useState(false);
  const [isLoadingVoted, setIsLoadingVoted] = useState(false);

  // Unstake modal state
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [unstakeReport, setUnstakeReport] = useState(null);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0);
  // Helper function to convert backend data to UI format
  const convertBackendDataToUI = (backendData) => {
    return backendData.map((report) => {
      const votesYes = parseInt(report.votes_yes) || 0;
      const votesNo = parseInt(report.votes_no) || 0;
      const totalVotes = votesYes + votesNo;
      const yesPercentage = totalVotes > 0 ? Number(((votesYes / totalVotes) * 100).toFixed(2)) : 0;
      const noPercentage = totalVotes > 0 ? Number(((votesNo / totalVotes) * 100).toFixed(2)) : 0;

      // Convert nanoseconds to milliseconds and then to Date
      const createdAt = new Date(parseInt(report.created_at) / 1000000);
      const voteDeadline = new Date(parseInt(report.vote_deadline) / 1000000);

      // Minimum quorum requirement (must match backend MINIMUM_QUORUM)
      const MINIMUM_QUORUM = 3;

      // Get total voters from voted_by array (this is what backend uses for quorum check)
      const totalVoters = report.voted_by ? report.voted_by.length : 0;

      // Determine status - use backend status if available, otherwise calculate from votes
      let status = "Pending";
      if (report.status) {
        // Backend already provides status - convert it to readable string
        status = convertReportStatus(report.status);
      } else {
        // Fallback: calculate from votes if voting period ended
        if (new Date() > voteDeadline) {
          // Check if minimum quorum is met using voted_by.length (same as backend)
          if (totalVoters < MINIMUM_QUORUM) {
            status = "Not Validated";
          } else if (yesPercentage >= 75) {
            status = "Unsafe";
          } else {
            status = "Safe";
          }
        }
      }

      console.log("Report status conversion:", {
        report_id: report.report_id,
        backend_status: report.status,
        calculated_status: status,
        totalVoters,
        totalVotes,
        MINIMUM_QUORUM,
        quorumMet: totalVoters >= MINIMUM_QUORUM,
      });

      // Convert Principal objects to strings
      const reporterString = typeof report.reporter === "object" && report.reporter._arr ? report.reporter.toString() : String(report.reporter);

      // Create short address
      const shortAddress = report.address.length > 10 ? `${report.address.substring(0, 6)}...${report.address.substring(report.address.length - 4)}` : report.address;

      // Convert stake amount and reward from e8s to token
      const stakeAmount = report.stake_amount ? convertE8sToToken(report.stake_amount) : 0;
      const reward = report.reward ? convertE8sToToken(report.reward) : 0;

      // Check if report has been unstaked
      const isUnstaked = report.unstaked_at.length > 0 && report.unstaked_at !== undefined;

      // Convert vote_type from backend variant to boolean (true = Unsafe, false = Safe)
      const voteType = report.vote_type ? convertVoteType(report.vote_type, "boolean") : undefined;

      return {
        id: report.report_id,
        address: report.address,
        shortAddress: shortAddress,
        status: status,
        totalVotes: totalVotes,
        totalVoters: totalVoters, // Total unique voters (for quorum check)
        yesPercentage: yesPercentage,
        noPercentage: noPercentage,
        dateCreated: createdAt.toLocaleDateString(),
        riskLevel: report.category.charAt(0).toUpperCase() + report.category.slice(1),
        chain: report.chain,
        description: report.description,
        evidence: report.evidence || [],
        url: report.url || [],
        voteDeadline: voteDeadline,
        reporter: reporterString,
        category: report.category,
        votes: { yes: votesYes, no: votesNo, total: totalVotes },
        stakeAmount: stakeAmount,
        reward: reward,
        voteType: voteType, // Converted to boolean: true = Unsafe, false = Safe
        isUnstaked: isUnstaked,
      };
    });
  };

  // Fetch my reports
  const fetchMyReports = async () => {
    setIsLoadingCreated(true);
    try {
      const response = await backend.get_my_reports();

      console.log("response", response);
      if (response.Err) {
        toast.error(response.Err);
        setCreatedReports([]);
      } else {
        const uiData = convertBackendDataToUI(response.Ok);
        setCreatedReports(uiData);
      }
    } catch (error) {
      console.error("Error fetching my reports:", error);
      toast.error("Failed to fetch my reports");
      setCreatedReports([]);
    }
    setIsLoadingCreated(false);
  };

  // Fetch my voted reports
  const fetchMyVotedReports = async () => {
    setIsLoadingVoted(true);
    try {
      const response = await backend.get_my_votes();
      if (response.Err) {
        toast.error(response.Err);
        setVotedReports([]);
      } else {
        const uiData = convertBackendDataToUI(response.Ok);
        setVotedReports(uiData);
      }
    } catch (error) {
      console.error("Error fetching my voted reports:", error);
      toast.error("Failed to fetch my voted reports");
      setVotedReports([]);
    }
    setIsLoadingVoted(false);
  };

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !identity) return;

      try {
        const balance = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setUserBalance(convertE8sToToken(balance));
        setWalletAddress(identity.getPrincipal().toString());
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();

    // Listen for balance update events
    const handleBalanceUpdate = () => {
      fetchBalance();
    };

    window.addEventListener("balance-updated", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balance-updated", handleBalanceUpdate);
    };
  }, [isConnected, identity]);

  // Fetch data when component mounts
  useEffect(() => {
    if (isConnected) {
      fetchMyReports();
      fetchMyVotedReports();
    }
  }, [isConnected]);

  // Filter reports based on search and status
  const filterReports = (reports) => {
    let filtered = reports;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status.toLowerCase() === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((report) => report.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) || report.address.toLowerCase().includes(searchTerm.toLowerCase()) || report.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  };

  const filteredCreatedReports = filterReports(createdReports);
  const filteredVotedReports = filterReports(votedReports);

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case "Unsafe":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "Safe":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "Not Validated":
        return <X className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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
      case "Not Validated":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  // Handle unstake click
  const handleUnstakeClick = async (report, type) => {
    // Fetch latest balance before showing modal
    try {
      if (identity) {
        const balance = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        const balanceInToken = convertE8sToToken(balance);
        console.log("Fetched balance:", balanceInToken);
        setUserBalance(balanceInToken);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }

    // Use actual stake amount from backend data
    const stakedAmount = report.stakeAmount || 0;
    setStakedAmount(stakedAmount);

    console.log("Report data:", { status: report.status, type, stakedAmount, voteType: report.voteType, totalVotes: report.totalVotes, totalVoters: report.totalVoters });

    // Calculate reward based on type and status
    let reward = 0;
    let quorumMet = true;

    // Check if quorum was met (minimum 3 votes)
    if (report.status === "Not Validated") {
      quorumMet = false;
      console.log("Quorum not met - no rewards will be given");
    } else if (type === "created") {
      // For created reports, reward is given if voting period ended (status is Safe or Unsafe)
      // Valid = community voting completed and reached conclusion
      // Reward 25% for ANY completed report (Safe or Unsafe) as long as voting concluded
      if (report.status === "Unsafe" || report.status === "Safe") {
        reward = stakedAmount * 0.25; // 25% reward for valid completed reports
        console.log("Created report reward (25%):", reward, "Status:", report.status);
      } else {
        console.log("No reward - voting not completed yet. Status:", report.status);
      }
    } else if (type === "voted") {
      // For voted reports, reward is given if voted with majority
      // Status can be "Unsafe" or "Safe" (after voting period ends)
      if (report.status === "Unsafe" || report.status === "Safe") {
        // Check if user voted with majority
        const reportIsUnsafe = report.status === "Unsafe";
        const userVotedUnsafe = report.voteType === true; // true = Unsafe, false = Safe
        const votedWithMajority = reportIsUnsafe === userVotedUnsafe;

        console.log("Voting check:", { reportIsUnsafe, userVotedUnsafe, votedWithMajority });

        if (votedWithMajority) {
          reward = stakedAmount * 0.001; // 0.1% reward
          console.log("Voting reward (0.1%):", reward);
        }
      }
    }

    console.log("Final reward:", reward, "Quorum met:", quorumMet);
    setUnstakeReport({ ...report, type, reward, quorumMet });
    setShowUnstakeModal(true);
  };

  // Handle confirm unstake
  const handleConfirmUnstake = async () => {
    if (!unstakeReport) return;
    setIsUnstaking(true);
    try {
      const reportId = unstakeReport.id;
      let result;
      if (unstakeReport.type === "created") {
        result = await backend.unstake_created_report(reportId);
      } else {
        result = await backend.unstake_voted_report(reportId);
      }

      if (result && result.Err) {
        toast.error(result.Err);
      } else if (result && result.Ok) {
        toast.success(result.Ok);
        setShowUnstakeModal(false);
        setUnstakeReport(null);
        try {
          await Promise.all([fetchMyReports(), fetchMyVotedReports()]);
        } catch (_e) {}
        try {
          window.dispatchEvent(new Event("balance-updated"));
        } catch (_e) {}
      } else {
        toast.error("Unstake failed: Unknown response");
      }
    } catch (error) {
      console.error("Error during unstake:", error);
      toast.error("Failed to unstake tokens");
    } finally {
      setIsUnstaking(false);
    }
  };

  // Handle cancel unstake
  const handleCancelUnstake = () => {
    setShowUnstakeModal(false);
    setUnstakeReport(null);
  };

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--progress-width);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-progress-fill {
          animation: progressFill 0.8s ease-out;
        }
      `}</style>
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
        <main className="relative z-10 pt-24 mb-32 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl container mx-auto">
            {/* Page Header */}
            <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-medium mb-1">My Reports</h1>
                <p className="text-sm sm:text-base text-gray-300">Track your submitted reports and voting history in the community.</p>
              </div>
              <Link to="/reports/create">
                <ButtonGreen size="sm" fontWeight="medium" onClick={() => navigate("/reports/create")}>
                  Create New Report
                </ButtonGreen>
              </Link>
            </div>
            <div className="space-y-8">
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex space-x-2 rounded-full p-1">
                  <Button onClick={() => setActiveTab("created")} className={`px-4 py-2 text-sm font-medium rounded-full transition-all border inline-flex items-center gap-2 ${activeTab === "created" ? "bg-white/10 text-white border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    My Reports ({createdReports.length})
                  </Button>
                  <Button onClick={() => setActiveTab("voted")} className={`px-4 py-2 text-sm font-medium rounded-full transition-all border inline-flex items-center gap-2 ${activeTab === "voted" ? "bg-white/10 text-white border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                    <Vote className="w-4 h-4 mr-2" />
                    Voted Reports ({votedReports.length})
                  </Button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  {/* Filters (order per design) */}
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => setStatusFilter("all")} className={`text-sm rounded-full px-4 py-1.5 border ${statusFilter === "all" ? "bg-white/10 text-white border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                      All Status
                    </Button>
                    <Button onClick={() => setStatusFilter("pending")} className={`text-sm rounded-full px-4 py-1.5 border ${statusFilter === "pending" ? "bg-yellow-400 text-black border-yellow-400" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                      Pending
                    </Button>
                    <Button onClick={() => setStatusFilter("unsafe")} className={`text-sm rounded-full px-4 py-1.5 border ${statusFilter === "unsafe" ? "bg-red-400 text-white border-red-400" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                      Unsafe
                    </Button>
                    <Button onClick={() => setStatusFilter("safe")} className={`text-sm rounded-full px-4 py-1.5 border ${statusFilter === "safe" ? "bg-green-400 text-black border-green-400" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                      Safe
                    </Button>
                  </div>

                  {/* Search pill on the right */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 bg-white/5 border-white/15 text-white placeholder-gray-400 focus:bg-white/10 rounded-full w-[220px] sm:w-[260px]" />
                  </div>
                </div>
              </div>

              {/* Content based on active tab */}
              {activeTab === "created" ? (
                <div className="space-y-6">
                  <div className="rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-medium">Reported Addresses</h2>
                        <p className="text-xs text-gray-400 mt-1">Community-reported wallet addresses under review for potential security threats</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        Showing {filteredCreatedReports.length}-{filteredCreatedReports.length} of {createdReports.length} results
                      </div>
                    </div>

                    {isLoadingCreated ? (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {[0, 1, 2, 3].map((i) => (
                          <SkeletonReportCard key={i} />
                        ))}
                      </div>
                    ) : filteredCreatedReports.length === 0 ? (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-md p-12 text-center">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
                        <Search className="relative z-[1] w-10 h-10 text-white/60 mx-auto mb-4" />
                        <h3 className="relative z-[1] text-base font-medium mb-1">No reports found</h3>
                        <p className="relative z-[1] text-sm text-gray-400">{searchTerm || statusFilter !== "all" ? "Try adjusting your search terms or filters" : "You haven't created any reports yet"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {filteredCreatedReports.map((report, index) => {
                          const canUnstake = (report.status === "Unsafe" || report.status === "Safe" || report.status === "Not Validated") && !report.isUnstaked;
                          return <ReportCard key={report.id} report={report} showUnstakeButton={canUnstake} onUnstake={() => handleUnstakeClick(report, "created")} variant="myreport" />;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Reports I Voted On</h2>
                    </div>

                    {isLoadingVoted ? (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {[0, 1, 2, 3].map((i) => (
                          <SkeletonReportCard key={i} />
                        ))}
                      </div>
                    ) : filteredVotedReports.length === 0 ? (
                      <div className="text-center py-12">
                        <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No voted reports found</h3>
                        <p className="text-gray-400">{searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria" : "You haven't voted on any reports yet"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {filteredVotedReports.map((report, index) => {
                          const canUnstake = (report.status === "Unsafe" || report.status === "Safe" || report.status === "Not Validated") && !report.isUnstaked;
                          return <ReportCard key={report.id} report={report} showUnstakeButton={canUnstake} onUnstake={() => handleUnstakeClick(report, "voted")} variant="voted" />;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Unstake Modal */}
      {showUnstakeModal && unstakeReport && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
            <div className="relative bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-md mx-auto my-8">
              <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={handleCancelUnstake} aria-label="Close">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Unstake Tokens</h3>
              </div>

              <div className="space-y-6">
                {/* Report Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Report ID:</span>
                    <span className="font-mono text-white">{unstakeReport.id}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Status:</span>
                    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(unstakeReport.status)} bg-white/[0.02]`}>
                      {getStatusIcon(unstakeReport.status)}
                      <span>{unstakeReport.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Address:</span>
                    <span className="font-mono text-sm text-white">{unstakeReport.shortAddress}</span>
                  </div>
                  {unstakeReport.type === "voted" && unstakeReport.voteType !== undefined && (
                    <>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-400">Your vote:</span>
                        <span className={`text-sm font-medium ${unstakeReport.voteType === true ? "text-red-400" : "text-green-400"}`}>{unstakeReport.voteType === true ? "Unsafe" : "Safe"}</span>
                      </div>
                      {(unstakeReport.status === "Safe" || unstakeReport.status === "Unsafe") && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-400">Vote result:</span>
                          <span className={`text-sm font-medium ${unstakeReport.status === "Unsafe" ? (unstakeReport.voteType === true ? "text-green-400" : "text-orange-400") : unstakeReport.voteType === false ? "text-green-400" : "text-orange-400"}`}>{unstakeReport.status === "Unsafe" ? (unstakeReport.voteType === true ? "Correct (Voted with majority)" : "Incorrect (Voted with minority)") : unstakeReport.voteType === false ? "Correct (Voted with majority)" : "Incorrect (Voted with minority)"}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Unstake Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Your current balance:</span>
                    <span className="font-bold text-white">{formatAmount(userBalance)} FRADIUM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Staked amount:</span>
                    <span className="font-bold text-white">{formatAmount(stakedAmount)} FRADIUM</span>
                  </div>
                  {unstakeReport.type === "voted" && unstakeReport.reward > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Voting reward (0.1%):</span>
                      <span className="font-bold text-green-400">+{formatAmount(unstakeReport.reward)} FRADIUM</span>
                    </div>
                  )}
                  {unstakeReport.type === "created" && unstakeReport.reward > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Report reward (25%):</span>
                      <span className="font-bold text-green-400">+{formatAmount(unstakeReport.reward)} FRADIUM</span>
                    </div>
                  )}
                  {unstakeReport.reward === 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Reward:</span>
                      <span className="font-bold text-gray-400">{unstakeReport.quorumMet === false ? "No reward (quorum not met)" : unstakeReport.type === "created" ? "No reward (voting not completed)" : "No reward (voted with minority)"}</span>
                    </div>
                  )}
                </div>

                {/* Quorum Warning */}
                {unstakeReport.quorumMet === false && (
                  <div className="p-4 bg-orange-400/10 rounded-xl border border-orange-400/20">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-orange-400 font-medium text-sm mb-1">Insufficient Quorum</div>
                        <div className="text-xs text-orange-400/80">This report did not meet the minimum quorum requirement of 3 voters (Total voters: {unstakeReport.totalVoters || unstakeReport.totalVotes}). The voting result is not validated, and no rewards will be distributed.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className={`p-4 rounded-xl border ${unstakeReport.quorumMet === false ? "bg-gray-400/10 border-gray-400/20" : "bg-green-400/10 border-green-400/20"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${unstakeReport.quorumMet === false ? "text-gray-400" : "text-green-400"}`}>Total to receive:</span>
                    <span className={`font-bold text-lg ${unstakeReport.quorumMet === false ? "text-gray-400" : "text-green-400"}`}>{formatAmount(stakedAmount + (unstakeReport.reward || 0))} FRADIUM</span>
                  </div>
                  <div className={`text-xs mt-1 ${unstakeReport.quorumMet === false ? "text-gray-400/70" : "text-green-400/70"}`}>{unstakeReport.quorumMet === false ? "Stake only (no reward)" : unstakeReport.reward > 0 ? "Stake + reward" : "Stake only"}</div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCancelUnstake} className="py-2.5 rounded-full border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors">
                    Cancel
                  </button>
                  <ButtonGreen fullWidth onClick={handleConfirmUnstake} disabled={isUnstaking} size="md" textSize="text-base" fontWeight="medium">
                    {isUnstaking ? "Unstaking..." : "Confirm Unstake"}
                  </ButtonGreen>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
