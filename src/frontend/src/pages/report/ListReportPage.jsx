import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Search, AlertTriangle, CheckCircle, Clock, Eye, ArrowUpDown, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { backend } from "declarations/backend";
import { toast } from "react-toastify";
import Footer from "../../core/components/Footer.jsx";

import Card from "@/core/components/Card";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/dao-1.webp";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/dao-2.webp";

export default function ReportPage() {
  const navigate = useNavigate();

  // Dynamic report data - can be updated from API or external source
  const [reportData, setReportData] = useState([]);

  // State for search, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  // Animation helper for smooth content reveal
  const pageTransitionClass = isLoading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0";
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

      // Determine status based on deadline and votes using same logic as backend
      let status = "Ongoing";
      if (new Date() > voteDeadline) {
        const isUnsafe = isReportUnsafe(report);
        status = isUnsafe ? "Unsafe" : "Safe";
      }

      // Convert Principal objects to strings
      const reporterString = typeof report.reporter === "object" && report.reporter._arr ? report.reporter.toString() : String(report.reporter);

      // Create short address
      const shortAddress = report.address.length > 10 ? `${report.address.substring(0, 6)}...${report.address.substring(report.address.length - 4)}` : report.address;

      return {
        id: report.report_id,
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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const uiData = convertBackendDataToUI(reportData);

    const filtered = uiData.filter((report) => {
      const searchLower = searchTerm.toLowerCase();
      return report.address.toLowerCase().includes(searchLower) || report.shortAddress.toLowerCase().includes(searchLower) || report.status.toLowerCase().includes(searchLower) || report.riskLevel.toLowerCase().includes(searchLower) || report.category.toLowerCase().includes(searchLower) || report.chain.toLowerCase().includes(searchLower);
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === "dateReported") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "timestamp") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortBy === "totalVotes" || sortBy === "yesPercentage") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [reportData, searchTerm, sortBy, sortOrder]);

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
        value: uiData.filter((report) => report.status === "Ongoing").length,
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


  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Unsafe":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "Safe":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "Ongoing":
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
      case "Ongoing":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />;
    }
    return <ArrowUpDown className={`w-3 h-3 ml-2 ${sortOrder === "asc" ? "rotate-180" : ""} transition-transform`} />;
  };

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
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
    <div className="min-h-screen max-w-full mt-16 bg-[#000510] text-white ">
      {/* Main Content */}
      <main className="pt-18">
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white/90 animate-spin" />
              <div className="mt-3 h-2 w-40 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        {/* Page Header - Full Screen */}
        <div className="relative overflow-hidden mb-6 sm:mb-8 px-3 md:px-6">
          {/* Background layer (top) */}
          <div className="absolute  inset-0 z-0 pointer-events-none select-none">
            <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="high" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          {/* Content - Container */}
          <div className={`relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-16 transition-all duration-700 ease-out ${pageTransitionClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
              <div className="flex-1">
                <p className="uppercase tracking-[0.28em] text-[#99E39E] text-[12px] md:text-[14px] mb-3">Community Reports</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-3 sm:mb-4">Community Vote Reports</h1>
                <p className="text-base sm:text-base font-normal text-gray-300 max-w-4xl">Review wallet addresses reported by the community for suspicious or fraudulent activity. Your action might help protect the Web3 ecosystem by participating in our decentralized security network. <a href="#" className="underline text-[#99E39E]">How Community Voting Works?</a></p>
              </div>

              {/* Create Report Button */}
              <div className="flex-shrink-0 mt-2 md:mt-0">
                <ButtonGreen size="md" fontWeight="medium" onClick={() => navigate("/reports/create")}>Create Report</ButtonGreen>
              </div>
            </div>

            {/* Search and Filters inside background-1 */}
            <div className="mt-6">
              <div className="flex max-w-6xl mx-auto mt-16 items-stretch gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search addresses, status, risk level..." value={searchTerm} onChange={handleSearch} className="h-12 rounded-full pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:bg-white/10" />
                </div>
                <ButtonGreen size="md" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/filter.svg" onClick={() => { }}>Filter</ButtonGreen>
              </div>

              {/* Sort chips */}
              <div className="mt-4 max-w-6xl mx-auto flex items-center gap-3">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { field: "timestamp", label: "Latest" },
                    { field: "totalVotes", label: "Votes" },
                    { field: "status", label: "Status" },
                    { field: "category", label: "Category" },
                    { field: "chain", label: "Chain" },
                  ].map((sortOption) => (
                    <div key={sortOption.field}>
                      <Button onClick={() => handleSort(sortOption.field)} className="rounded-full h-9 px-4 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm">
                        {sortOption.label}
                        {getSortIcon(sortOption.field)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Removed stats cards for refactor to match design */}
          {/* Fade to base color */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
        </div>

        {/* Rest of Content - overlap up to blend with background-1 */}
        <div className={`relative md:px-6 overflow-hidden -mt-10 md:-mt-6 min-h-[900px] md:min-h-[1000px] transition-all duration-700 ease-out ${pageTransitionClass}`}>
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />
          <div className="relative z-10">
            <div className="container mx-auto">

              {/* Filters/Search moved to header */}

              {/* Reports Cards */}
              <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Reported Addresses</h2>
                    <p className="text-gray-400 text-sm">Community-reported wallet addresses under review for potential security threats</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                  </div>
                </div>

                {currentData.length === 0 ? (
                  <div className="mx-auto w-full rounded-2xl bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.30)] p-10 md:p-12 min-h-[260px] md:min-h-[260px]">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Search className="w-12 h-12 text-gray-300/80 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold mb-2">No reports found</h3>
                      <p className="text-gray-400 text-sm">Try adjusting your search terms or filters</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {currentData.map((report, index) => (
                      <div key={report.report_id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            {/* Network and Address */}
                            <div className="flex ml-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">₿</span>
                                </div>
                                <span className="text-sm text-gray-300">{report.chain} Network</span>
                              </div>
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ml-4 text-xs font-medium border ${getStatusColor(report.status)}`}>
                                {getStatusIcon(report.status)}
                                <span>{report.status}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-lg font-semibold text-white">{report.shortAddress}</span>
                            </div>

                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                              <span>{report.category}</span>
                              <span>•</span>
                              <span>Reported {report.dateReported}</span>
                            </div>
                          </div>

                          <Button className="!bg-gray-800/50 backdrop-blur-sm !border border-gray-600/50 hover:!bg-gray-700/50 text-white text-sm px-4 py-2 !rounded-full" onClick={() => navigate(`/reports/${report.id}`)}>
                            View Details
                            <ArrowUpRight className="w-3 h-3 ml-2" />
                          </Button>
                        </div>

                        {/* Vote Information */}
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-red-400">Unsafe: {report.yesPercentage}%</span>
                          <span className="text-green-400">Safe: {report.noPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-red-400 h-2 rounded-full" style={{ width: `${report.yesPercentage}%` }} />
                        </div>
                      </div>
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
                      <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4 sm:mr-1" />
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
                            <Button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 p-0 text-sm ${currentPage === pageNum ? "bg-white text-black" : "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white"}`}>
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4 sm:ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="my-16 max-w-6xl mx-auto">
                <h3 className="text-2xl font-medium mb-8 text-white">How Community Voting Works?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "1. Report Submission",
                      description: "Community members can report suspicious wallet addresses with evidence and reasoning.",
                    },
                    {
                      title: "2. Community Review",
                      description: "Verified users vote on whether the reported address poses a security threat to the ecosystem.",
                    },
                    {
                      title: "3. Consensus Decision",
                      description: 'Addresses with 75%+ "Unsafe" votes are flagged and added to the community blocklist.',
                    },
                  ].map((step, index) => (
                    <div key={index} className="bg-[#000000]/70 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
                      <h4 className="font-medium text-white mb-3 text-base">{step.title}</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
