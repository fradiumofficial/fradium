// UI Components
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import PrimaryButton from "@/core/components/Button";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import Footer from "../../core/components/Footer.jsx";

// Declarations
import { fradium_token as token } from "declarations/fradium_token";
import { backend as backend } from "declarations/backend";

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

export default function MyReportPage() {
  const { isAuthenticated: isConnected, identity } = useAuth();
  const navigate = useNavigate();

  // Simple reveal component without complex intersection observer
  const Reveal = ({ children, delay = 0, duration = 300 }) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }, [delay]);

    return (
      <div
        className={`transition-all ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        style={{
          transitionDuration: `${duration}ms`,
        }}>
        {children}
      </div>
    );
  };

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

      // Determine status based on deadline and votes
      let status = "Pending";
      if (new Date() > voteDeadline) {
        if (yesPercentage >= 75) {
          status = "Unsafe";
        } else {
          status = "Safe";
        }
      }

      // Convert Principal objects to strings
      const reporterString = typeof report.reporter === "object" && report.reporter._arr ? report.reporter.toString() : String(report.reporter);

      // Create short address
      const shortAddress = report.address.length > 10 ? `${report.address.substring(0, 6)}...${report.address.substring(report.address.length - 4)}` : report.address;

      // Convert stake amount and reward from e8s to token
      const stakeAmount = report.stake_amount ? convertE8sToToken(report.stake_amount) : 0;
      const reward = report.reward ? convertE8sToToken(report.reward) : 0;

      // Check if report has been unstaked
      const isUnstaked = report.unstaked_at.length > 0 && report.unstaked_at !== undefined;

      return {
        id: report.report_id,
        address: report.address,
        shortAddress: shortAddress,
        status: status,
        totalVotes: totalVotes,
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
        voteType: report.vote_type, // Only for voted reports
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
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  // Handle unstake click
  const handleUnstakeClick = async (report, type) => {
    // Use actual stake amount from backend data
    const stakedAmount = report.stakeAmount || 0;
    setStakedAmount(stakedAmount);

    // Calculate reward based on type and status
    let reward = 0;
    if (type === "created" && report.status === "Validated") {
      // 25% reward for validated created reports
      reward = stakedAmount * 0.25;
    } else if (type === "voted" && report.status === "Validated") {
      // 10% reward for validated voted reports
      reward = stakedAmount * 0.1;
    }

    setUnstakeReport({ ...report, type, reward });
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
        </div>
        {/* Soft fade at top edge to blend with navbar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 md:h-28 bg-gradient-to-b from-[#000510] to-transparent z-0" />

        {/* Main Content */}
        <main className="relative z-10 pt-24 mb-32 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl container mx-auto">
            {/* Page Header */}
            <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Reveal delay={0} duration={300}>
                  <h1 className="text-3xl sm:text-4xl font-medium mb-1">My Reports</h1>
                </Reveal>
                <Reveal delay={50} duration={300}>
                  <p className="text-sm sm:text-base text-gray-300">Track your submitted reports and voting history in the community.</p>
                </Reveal>
              </div>
              <Reveal delay={100} duration={300}>
                <Link to="/reports/create">
                  <ButtonGreen size="sm" fontWeight="medium" onClick={() => navigate("/reports/create")}>
                    Create New Report
                  </ButtonGreen>
                </Link>
              </Reveal>
            </div>
            <div className="space-y-8">
              {/* Tabs */}
              <Reveal delay={150} duration={300}>
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
              </Reveal>

              {/* Content based on active tab */}
              {activeTab === "created" ? (
                <div className="space-y-6">
                  <div className="rounded-2xl">
                    <Reveal delay={200} duration={300}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-medium">Reported Addresses</h2>
                          <p className="text-xs text-gray-400 mt-1">Community-reported wallet addresses under review for potential security threats</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          Showing {filteredCreatedReports.length}-{filteredCreatedReports.length} of {createdReports.length} results
                        </div>
                      </div>
                    </Reveal>

                    {isLoadingCreated ? (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {[0, 1, 2, 3].map((i) => (
                          <Reveal key={i} delay={i * 50} duration={300}>
                            <SkeletonReportCard />
                          </Reveal>
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
                          const canUnstake = (report.status === "Validated" || report.status === "Unsafe") && !report.isUnstaked;
                          return (
                            <Reveal key={report.id} delay={index * 30} duration={300}>
                              <div className="group">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)] hover:bg-white/8 hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.30)] hover:scale-[1.02] transition-all duration-300 ease-out group cursor-pointer">
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                      {/* Network and Address */}
                                      <div className="flex mb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg group-hover:shadow-orange-500/30">
                                            <span className="text-white text-xs font-bold group-hover:scale-110 transition-transform duration-200">₿</span>
                                          </div>
                                          <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-200">{report.chain} Network</span>
                                        </div>
                                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ml-4 text-xs font-medium border transition-all duration-200 group-hover:scale-105 ${getStatusColor(report.status)}`}>
                                          <span className="group-hover:animate-pulse">{getStatusIcon(report.status)}</span>
                                          <span className="group-hover:text-white transition-colors duration-200">{report.status}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-lg font-semibold text-white group-hover:text-[#99E39E] transition-colors duration-200">{report.shortAddress}</span>
                                      </div>

                                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                                        <span className="group-hover:text-gray-300 transition-colors duration-200">{report.category}</span>
                                        <span className="group-hover:animate-pulse">•</span>
                                        <span className="group-hover:text-gray-300 transition-colors duration-200">Reported {report.dateCreated}</span>
                                        {report.isUnstaked && (
                                          <>
                                            <span className="group-hover:animate-pulse">•</span>
                                            <CheckCircle className="w-4 h-4 text-blue-400" />
                                            <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors duration-200">Unstaked</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {canUnstake && (
                                        <Button onClick={() => handleUnstakeClick(report, "created")} className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 hover:from-green-500/30 hover:to-green-600/30 hover:border-green-400/50 text-green-400 text-sm font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                                          <Coins className="w-3 h-3 mr-1" />
                                          Unstake
                                        </Button>
                                      )}
                                      <Button className="!bg-gray-800/50 backdrop-blur-sm !border border-gray-600/50 hover:!bg-gray-700/50 hover:scale-105 active:scale-95 text-white text-sm px-4 py-2 !rounded-full transition-all duration-200 ease-out group-hover:!bg-[#99E39E]/20 group-hover:!border-[#99E39E]/50 group-hover:text-[#99E39E]" onClick={() => navigate(`/reports/${report.id}`)}>
                                        View Details
                                        <Eye className="w-3 h-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Vote Information */}
                                  <div className="flex justify-between text-xs mb-2">
                                    <span className="text-red-400 transition-colors duration-200 group-hover:text-red-300">Unsafe: {report.yesPercentage}%</span>
                                    <span className="text-green-400 transition-colors duration-200 group-hover:text-green-300">Safe: {report.noPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full transition-all duration-500 ease-out group-hover:from-red-300 group-hover:to-red-400"
                                      style={{
                                        width: `${report.yesPercentage}%`,
                                        "--progress-width": `${report.yesPercentage}%`,
                                      }}
                                    />
                                  </div>

                                  {/* Additional Info */}
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                                    <div className="flex items-center space-x-4">
                                      <span>ID: #{report.id.toString().padStart(4, "0")}</span>
                                      <span>Evidence: {report.evidence.length}</span>
                                      <span>
                                        Staked: <span className="text-yellow-400 font-semibold">{report.stakeAmount} FRADIUM</span>
                                      </span>
                                    </div>
                                    {report.reward > 0 && <span className="text-green-400 font-semibold">Reward: +{report.reward.toFixed(3)} FRADIUM</span>}
                                  </div>
                                </div>
                              </div>
                            </Reveal>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl p-6 sm:p-8">
                    <Reveal delay={200} duration={300}>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Reports I Voted On</h2>
                      </div>
                    </Reveal>

                    {isLoadingVoted ? (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {[0, 1, 2, 3].map((i) => (
                          <Reveal key={i} delay={i * 50} duration={300}>
                            <SkeletonReportCard />
                          </Reveal>
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
                          const canUnstake = (report.status === "Validated" || report.status === "Unsafe") && !report.isUnstaked;
                          return (
                            <Reveal key={report.id} delay={index * 30} duration={300}>
                              <div className="group">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)] hover:bg-white/8 hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.30)] hover:scale-[1.02] transition-all duration-300 ease-out group cursor-pointer">
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                      {/* Network and Address */}
                                      <div className="flex mb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg group-hover:shadow-blue-500/30">
                                            <Vote className="w-3 h-3 text-white" />
                                          </div>
                                          <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-200">{report.chain} Network</span>
                                        </div>
                                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ml-4 text-xs font-medium border transition-all duration-200 group-hover:scale-105 ${getStatusColor(report.status)}`}>
                                          <span className="group-hover:animate-pulse">{getStatusIcon(report.status)}</span>
                                          <span className="group-hover:text-white transition-colors duration-200">{report.status}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-lg font-semibold text-white group-hover:text-[#99E39E] transition-colors duration-200">{report.shortAddress}</span>
                                      </div>

                                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                                        <span className="group-hover:text-gray-300 transition-colors duration-200">{report.category}</span>
                                        <span className="group-hover:animate-pulse">•</span>
                                        <span className="group-hover:text-gray-300 transition-colors duration-200">Voted {report.dateCreated}</span>
                                        {report.voteType !== undefined && (
                                          <>
                                            <span className="group-hover:animate-pulse">•</span>
                                            <div className={`w-2 h-2 rounded-full ${report.voteType ? "bg-red-400" : "bg-green-400"}`} />
                                            <span className={`font-medium ${report.voteType ? "text-red-400" : "text-green-400"} group-hover:${report.voteType ? "text-red-300" : "text-green-300"} transition-colors duration-200`}>Voted: {report.voteType ? "Unsafe" : "Safe"}</span>
                                          </>
                                        )}
                                        {report.isUnstaked && (
                                          <>
                                            <span className="group-hover:animate-pulse">•</span>
                                            <CheckCircle className="w-4 h-4 text-blue-400" />
                                            <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors duration-200">Unstaked</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {canUnstake && (
                                        <Button onClick={() => handleUnstakeClick(report, "voted")} className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 hover:from-green-500/30 hover:to-green-600/30 hover:border-green-400/50 text-green-400 text-sm font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                                          <Coins className="w-3 h-3 mr-1" />
                                          Unstake
                                        </Button>
                                      )}
                                      <Button className="!bg-gray-800/50 backdrop-blur-sm !border border-gray-600/50 hover:!bg-gray-700/50 hover:scale-105 active:scale-95 text-white text-sm px-4 py-2 !rounded-full transition-all duration-200 ease-out group-hover:!bg-[#99E39E]/20 group-hover:!border-[#99E39E]/50 group-hover:text-[#99E39E]" onClick={() => navigate(`/reports/${report.id}`)}>
                                        View Details
                                        <Eye className="w-3 h-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Vote Information */}
                                  <div className="flex justify-between text-xs mb-2">
                                    <span className="text-red-400 transition-colors duration-200 group-hover:text-red-300">Unsafe: {report.yesPercentage}%</span>
                                    <span className="text-green-400 transition-colors duration-200 group-hover:text-green-300">Safe: {report.noPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full transition-all duration-500 ease-out group-hover:from-red-300 group-hover:to-red-400"
                                      style={{
                                        width: `${report.yesPercentage}%`,
                                        "--progress-width": `${report.yesPercentage}%`,
                                      }}
                                    />
                                  </div>

                                  {/* Additional Info */}
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                                    <div className="flex items-center space-x-4">
                                      <span>ID: #{report.id.toString().padStart(4, "0")}</span>
                                      <span>Evidence: {report.evidence.length}</span>
                                      <span>
                                        Staked: <span className="text-yellow-400 font-semibold">{report.stakeAmount} FRADIUM</span>
                                      </span>
                                    </div>
                                    {report.reward > 0 && <span className="text-green-400 font-semibold">Reward: +{report.reward.toFixed(3)} FRADIUM</span>}
                                  </div>
                                </div>
                              </div>
                            </Reveal>
                          );
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
                    <div className="flex items_center justify_between mt-2">
                      <span className="text-sm text-gray-400">Your vote:</span>
                      <span className={`text-sm font-medium ${unstakeReport.voteType ? "text-red-400" : "text-green-400"}`}>{unstakeReport.voteType ? "Unsafe" : "Safe"}</span>
                    </div>
                  )}
                </div>

                {/* Unstake Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Your current balance:</span>
                    <span className="font-bold text-white">{userBalance.toLocaleString()} FRADIUM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm sm:text-base">Staked amount:</span>
                    <span className="font-bold text-white">{stakedAmount.toLocaleString()} FRADIUM</span>
                  </div>
                  {unstakeReport.type === "voted" && unstakeReport.reward > 0 && unstakeReport.status === "Validated" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Voting reward (10%):</span>
                      <span className="font-bold text-green-400">+{unstakeReport.reward.toFixed(2)} FRADIUM</span>
                    </div>
                  )}
                  {unstakeReport.type === "created" && unstakeReport.reward > 0 && unstakeReport.status === "Validated" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Validation reward (25%):</span>
                      <span className="font-bold text-green-400">+{unstakeReport.reward.toFixed(2)} FRADIUM</span>
                    </div>
                  )}
                  {unstakeReport.status !== "Validated" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">Reward:</span>
                      <span className="font-bold text-gray-400">No reward (report not validated)</span>
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="p-4 bg-green-400/10 rounded-xl border border-green-400/20">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-medium">Total to receive:</span>
                    <span className="font-bold text-green-400 text-lg">{(stakedAmount + (unstakeReport.reward || 0)).toFixed(2)} FRADIUM</span>
                  </div>
                  <div className="text-xs text-green-400/70 mt-1">{unstakeReport.status === "Validated" ? `${unstakeReport.type === "created" ? "Stake + 25% validation reward" : "Stake + 10% voting reward"}` : "Stake only (no reward - report not validated)"}</div>
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
