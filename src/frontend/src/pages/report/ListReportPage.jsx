import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Search, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

import { backend } from "declarations/backend";
import { toast } from "react-toastify";
import Footer from "../../core/components/Footer.jsx";

import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import ReportCard from "@/core/components/ReportCard.jsx";

// Utils
import { convertReportStatus, convertVoteType } from "@/core/lib/reportUtils";

const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/dao-1.webp";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/dao-2.webp";

export default function ReportPage() {
  const navigate = useNavigate();

  // Dynamic report data - can be updated from API or external source
  const [reportData, setReportData] = useState([]);

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced reveal-on-scroll component with better animations
  const Reveal = ({ children, delay = 0, duration = 600 }) => {
    const ref = useRef(null);
    const [show, setShow] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShow(true);
            io.disconnect();
          }
        },
        { rootMargin: "-5% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return (
      <div
        ref={ref}
        className={`transition-opacity ease-out ${show ? "opacity-100" : "opacity-0"}`}
        style={{
          transitionDelay: `${delay}ms`,
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
    return backendData.map((report) => {
      const votesYes = parseInt(report.votes_yes) || 0;
      const votesNo = parseInt(report.votes_no) || 0;
      const totalVotes = votesYes + votesNo;
      const yesPercentage = totalVotes > 0 ? Number(((votesYes / totalVotes) * 100).toFixed(2)) : 0;
      const noPercentage = totalVotes > 0 ? Number(((votesNo / totalVotes) * 100).toFixed(2)) : 0;

      // Convert nanoseconds to milliseconds and then to Date
      const createdAt = new Date(parseInt(report.created_at) / 1000000);
      const voteDeadline = new Date(parseInt(report.vote_deadline) / 1000000);
      const timestamp = parseInt(report.created_at) / 1000000; // Add timestamp for sorting

      // Get total voters from voted_by array (for quorum check)
      const totalVoters = report.voted_by ? report.voted_by.length : 0;

      // Determine status - use backend status if available, otherwise calculate from votes
      let status = "Voting";
      if (report.status) {
        // Backend already provides status - convert it to readable string
        status = convertReportStatus(report.status);
      } else {
        // Fallback: calculate from votes if voting period ended
        if (new Date() > voteDeadline) {
          const MINIMUM_QUORUM = 3;
          if (totalVoters < MINIMUM_QUORUM) {
            status = "Not Validated";
          } else {
            const isUnsafe = isReportUnsafe(report);
            status = isUnsafe ? "Unsafe" : "Safe";
          }
        }
      }

      // Convert Principal objects to strings
      const reporterString = typeof report.reporter === "object" && report.reporter._arr ? report.reporter.toString() : String(report.reporter);

      // Create short address
      const shortAddress = report.address.length > 10 ? `${report.address.substring(0, 6)}...${report.address.substring(report.address.length - 4)}` : report.address;

      // Ensure report_id is properly converted to number
      const reportId = typeof report.report_id === "bigint" ? Number(report.report_id) : report.report_id;

      return {
        id: reportId,
        report_id: reportId, // Add both for compatibility
        address: report.address,
        shortAddress: shortAddress,
        status: status,
        totalVotes: totalVotes,
        yesPercentage: yesPercentage,
        noPercentage: noPercentage,
        dateReported: createdAt.toLocaleDateString(),
        riskLevel: report.category.charAt(0).toUpperCase() + report.category.slice(1),
        chain: report.chain,
        description: report.description,
        evidence: report.evidence || [],
        url: report.url || [],
        voteDeadline: voteDeadline,
        reporter: reporterString,
        category: report.category,
        timestamp: timestamp, // Add timestamp for sorting
      };
    });
  };

  // Filter data
  const filteredAndSortedData = useMemo(() => {
    const uiData = convertBackendDataToUI(reportData);

    const filtered = uiData.filter((report) => {
      const searchLower = searchTerm.toLowerCase();
      return report.address.toLowerCase().includes(searchLower) || report.shortAddress.toLowerCase().includes(searchLower) || report.status.toLowerCase().includes(searchLower) || report.riskLevel.toLowerCase().includes(searchLower) || report.category.toLowerCase().includes(searchLower) || report.chain.toLowerCase().includes(searchLower);
    });

    // Sort by timestamp (latest first) as default
    filtered.sort((a, b) => {
      const aValue = Number(a.timestamp);
      const bValue = Number(b.timestamp);
      return bValue - aValue; // descending order (newest first)
    });

    return filtered;
  }, [reportData, searchTerm]);

  // Stats cards data
  const statsCards = useMemo(() => {
    const uiData = convertBackendDataToUI(reportData);
    return [
      {
        title: "Total Reports",
        value: uiData.length.toLocaleString(),
        subtitle: "All reports",
        icon: <AlertTriangle className="w-5 h-5 text-gray-400" />,
        color: "text-green-400",
      },
      {
        title: "Ongoing",
        value: uiData.filter((report) => report.status === "Voting" || report.status === "Ongoing" || report.status === "Pending").length,
        subtitle: "Awaiting votes",
        icon: <Clock className="w-5 h-5 text-yellow-400" />,
        color: "text-yellow-400",
      },
      {
        title: "Confirmed Unsafe",
        value: uiData.filter((report) => report.status === "Unsafe").length,
        subtitle: "Blocked addresses",
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        color: "text-red-400",
      },
      {
        title: "Community Votes",
        value: uiData.reduce((sum, report) => sum + report.totalVotes, 0).toLocaleString(),
        subtitle: "Total cast",
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        color: "text-green-400",
      },
    ];
  }, [reportData]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);

      // Add a small delay to show loading animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await backend.get_reports();
      setIsLoading(false);

      if (response.Err) {
        toast.error(response.Err);
      } else {
        setReportData(response.Ok);
      }
    };

    fetchReports();
  }, []);

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
      <div className="min-h-screen max-w-full mt-12 md:mt-16 bg-[#000510] text-white ">
        {/* Main Content */}
        <main className="pt-18">
          {/* Loading state handled inline in list section below */}
          {/* Page Header - Full Screen */}
          <div className="relative overflow-hidden mb-6 sm:mb-8 px-3 md:px-6">
            {/* Background layer (top) */}
            <div className="absolute  inset-0 z-0 pointer-events-none select-none">
              <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="high" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
              {/* Dark overlay untuk background lebih gelap */}
              <div className="absolute inset-0 bg-black/70"></div>
            </div>
            {/* Content - Container */}
            <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 lg:py-16">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
                <div className="flex-1">
                  <p className="uppercase tracking-[0.28em] text-[#99E39E] text-[12px] md:text-[14px] mb-3">Community Reports</p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-3 sm:mb-4">Community Vote Reports</h1>
                  <p className="text-sm sm:text-base font-normal text-gray-300 max-w-4xl">
                    Review wallet addresses reported by the community for suspicious or fraudulent activity. Your action might help protect the Web3 ecosystem by participating in our decentralized security network.{" "}
                    <a href="https://fradium.gitbook.io/docs/tokenemics/staking-and-voting" target="_blank" className="underline text-[#99E39E] hover:text-[#99E39E]/80 transition-colors duration-200">
                      How Community Voting Works?
                    </a>
                  </p>
                </div>

                {/* Create Report Button */}
                <div className="flex-shrink-0 mt-2 md:mt-0">
                  <ButtonGreen size="sm" fontWeight="medium" onClick={() => navigate("/reports/create")}>
                    Create Report
                  </ButtonGreen>
                </div>
              </div>

              {/* Search inside background-1 */}
              <div className="mt-6">
                <div className="mt-8 sm:mt-12 lg:mt-16">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-200 group-focus-within:text-[#99E39E]" />
                    <Input placeholder="Search addresses, status, risk level..." value={searchTerm} onChange={handleSearch} className="h-11 sm:h-12 rounded-full pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white text-sm sm:text-base placeholder-gray-400 focus:bg-white/10 focus:border-[#99E39E]/50 focus:ring-2 focus:ring-[#99E39E]/20 transition-all duration-300 ease-out hover:bg-white/8 hover:border-white/20 group" />
                  </div>
                </div>
              </div>
            </div>
            {/* Removed stats cards for refactor to match design */}
            {/* Fade to base color */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
          </div>

          {/* Rest of Content - overlap up to blend with background-1 */}
          <div className="relative md:px-6 overflow-hidden -mt-6 md:-mt-6 min-h-[700px] md:min-h-[1000px]">
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
              <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
              {/* Dark overlay untuk background lebih gelap */}
              <div className="absolute inset-0 bg-black/70"></div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />
            <div className="relative z-10">
              <div className="container mx-auto">
                {/* Filters/Search moved to header */}

                {/* Reports Cards */}
                <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white">Reported Addresses</h2>
                      <p className="text-gray-400 text-sm">Community-reported wallet addresses under review for potential security threats</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {[0, 1, 2, 3].map((i) => (
                        <SkeletonReportCard key={i} />
                      ))}
                    </div>
                  ) : currentData.length === 0 ? (
                    <div className="mx-auto w-full rounded-2xl bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.30)] p-10 md:p-12 min-h-[260px] md:min-h-[260px] hover:bg-white/8 hover:shadow-[0_20px_56px_rgba(0,0,0,0.40)] transition-all duration-300 ease-out">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Search className="w-12 h-12 text-gray-300/80 mx-auto mb-6 animate-bounce" />
                        <h3 className="text-xl font-semibold mb-2 text-white">No reports found</h3>
                        <p className="text-gray-400 text-sm">Try adjusting your search terms or filters</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {currentData.map((report) => (
                        <ReportCard key={report.report_id} report={report} variant="list" />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {filteredAndSortedData.length > 0 && (
                    <div className="mt-6 sm:mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                      <span className="text-gray-400 text-sm text-center sm:text-left">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} reports
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out hover:shadow-lg hover:shadow-white/10">
                          <ChevronLeft className="w-4 h-4 sm:mr-1 transition-transform duration-200 hover:-translate-x-0.5" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage <= 2) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 1) {
                              pageNum = totalPages - 2 + i;
                            } else {
                              pageNum = currentPage - 1 + i;
                            }

                            return (
                              <Button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 p-0 text-sm transition-all duration-200 ease-out ${currentPage === pageNum ? "bg-white text-black shadow-lg" : "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white hover:shadow-lg hover:shadow-white/10"}`}>
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out hover:shadow-lg hover:shadow-white/10">
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-4 h-4 sm:ml-1 transition-transform duration-200 hover:translate-x-0.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
