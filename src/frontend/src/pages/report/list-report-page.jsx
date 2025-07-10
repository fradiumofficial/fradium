import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Search, AlertTriangle, CheckCircle, Clock, Eye, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Car } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import Card from "../../core/components/Card";

import { backend } from "declarations/backend";
import { toast } from "react-toastify";
import { getExplorerUrl, getExplorerName, getExplorerIcon } from "@/core/lib/chainExplorers";

export default function ReportPage() {
  const navigate = useNavigate();

  // Dynamic report data - can be updated from API or external source
  const [reportData, setReportData] = useState([]);

  // State for search, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateReported");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  // Helper function to convert backend data to UI format
  const convertBackendDataToUI = (backendData) => {
    return backendData.map((report) => {
      const votesYes = parseInt(report.votes_yes) || 0;
      const votesNo = parseInt(report.votes_no) || 0;
      const totalVotes = votesYes + votesNo;
      const yesPercentage = totalVotes > 0 ? Math.round((votesYes / totalVotes) * 100) : 0;
      const noPercentage = totalVotes > 0 ? Math.round((votesNo / totalVotes) * 100) : 0;

      // Convert nanoseconds to milliseconds and then to Date
      const createdAt = new Date(parseInt(report.created_at) / 1000000);
      const voteDeadline = new Date(parseInt(report.vote_deadline) / 1000000);

      // Determine status based on deadline and votes
      let status = "Ongoing";
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
    <div className="min-h-screen bg-black text-white ">
      {/* Main Content */}
      <main className="pt-18 pb-16">
        {/* Page Header - Full Screen */}
        <div className="relative overflow-hidden mb-6 sm:mb-8">
          {/* Content - Container */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 mt-20">Community Vote Reports</h1>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl">Review wallet addresses reported by the community for suspicious or fraudulent activity. Help protect the Web3 ecosystem by participating in our decentralized security network.</p>
              </div>

              {/* Create Report Button */}
              <div className="flex-shrink-0 mt-20 lg:mt-0">
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white sm:flex-shrink-0" onClick={() => navigate("/reports/create")}>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Create Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of Content */}
        <div className="px-4 sm:px-6">
          <div className="container mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {isLoading
                ? // Loading skeleton
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index}>
                      <Card>
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                          <div className="h-5 w-5 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 bg-gray-600 rounded w-16 animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-600 rounded w-24 animate-pulse"></div>
                      </Card>
                    </div>
                  ))
                : statsCards.map((card, index) => (
                    <div key={index}>
                      <Card>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">{card.title}</span>
                          {card.icon}
                        </div>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <div className={`text-sm ${card.color}`}>{card.subtitle}</div>
                      </Card>
                    </div>
                  ))}
            </div>

            {/* Filters and Search */}
            <div>
              <Card className="my-10">
                <div className="flex flex-col gap-4 items-stretch">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input placeholder="Search addresses, status, risk level..." value={searchTerm} onChange={handleSearch} className="pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:bg-white/10" />
                    </div>
                    <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white sm:flex-shrink-0">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <span className="text-gray-400 text-sm">Sort by:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { field: "dateReported", label: "Date" },
                        { field: "totalVotes", label: "Votes" },
                        { field: "status", label: "Status" },
                        { field: "category", label: "Category" },
                        { field: "chain", label: "Chain" },
                      ].map((sortOption, index) => (
                        <div key={sortOption.field}>
                          <Button onClick={() => handleSort(sortOption.field)} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm flex-1 sm:flex-initial">
                            {sortOption.label}
                            {getSortIcon(sortOption.field)}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Reports Cards */}
            <div className="space-y-6">
              <Card>
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
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-gray-400">Try adjusting your search terms or filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {currentData.map((report, index) => (
                      <div key={report.id}>
                        <Card>
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                <span className="font-mono text-base sm:text-lg font-semibold truncate">{report.shortAddress}</span>
                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)} self-start`}>
                                  {getStatusIcon(report.status)}
                                  <span>{report.status}</span>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-400">
                                <span>{report.category}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Reported {report.dateReported}</span>
                              </div>
                            </div>
                          </div>

                          {/* Vote Information */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-300">{report.chain} Network</span>
                              <span className="text-sm font-semibold">{report.totalVotes.toLocaleString()} votes</span>
                            </div>
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-400">Unsafe: {report.yesPercentage}%</span>
                                <span className="text-green-400">Safe: {report.noPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${report.yesPercentage}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>ID: #{report.id.toString().padStart(4, "0")}</span>
                              <span>Evidence: {report.evidence.length}</span>
                            </div>
                            <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm" onClick={() => navigate(`/reports/${report.id}`)}>
                              <Eye className="w-3 h-3 mr-2" />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          </div>
                        </Card>
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
              </Card>
            </div>

            {/* Info Section */}
            <div>
              <Card className="my-10">
                <h3 className="text-lg font-semibold mb-4">How Community Voting Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
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
                    <div key={index}>
                      <h4 className="font-medium text-white mb-2">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
