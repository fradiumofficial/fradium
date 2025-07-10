import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Car,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Card from "../../core/components/Card";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportPage() {
  const navigate = useNavigate();

  // Dynamic report data - can be updated from API or external source
  const [reportData, setReportData] = useState([
    {
      id: 1,
      address: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
      shortAddress: "0x742d...8D4",
      status: "Unsafe",
      totalVotes: 847,
      yesPercentage: 89,
      noPercentage: 11,
      dateReported: "2024-01-15",
      riskLevel: "High",
    },
    {
      id: 2,
      address: "0x8ba1f109551bD432803012645Hac189451b934",
      shortAddress: "0x8ba1...934",
      status: "Pending",
      totalVotes: 234,
      yesPercentage: 67,
      noPercentage: 33,
      dateReported: "2024-01-18",
      riskLevel: "Medium",
    },
    {
      id: 3,
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      shortAddress: "0x1f98...984",
      status: "Safe",
      totalVotes: 1205,
      yesPercentage: 23,
      noPercentage: 77,
      dateReported: "2024-01-12",
      riskLevel: "Low",
    },
    {
      id: 4,
      address: "0xA0b86a33E6842c8f606c3C725c6853da97d19C4A",
      shortAddress: "0xA0b8...C4A",
      status: "Unsafe",
      totalVotes: 692,
      yesPercentage: 91,
      noPercentage: 9,
      dateReported: "2024-01-16",
      riskLevel: "High",
    },
    {
      id: 5,
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      shortAddress: "0x5149...6CA",
      status: "Pending",
      totalVotes: 156,
      yesPercentage: 72,
      noPercentage: 28,
      dateReported: "2024-01-19",
      riskLevel: "Medium",
    },
    {
      id: 6,
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      shortAddress: "0x6B17...d0F",
      status: "Safe",
      totalVotes: 543,
      yesPercentage: 31,
      noPercentage: 69,
      dateReported: "2024-01-14",
      riskLevel: "Low",
    },
    {
      id: 7,
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      shortAddress: "0xdAC1...ec7",
      status: "Unsafe",
      totalVotes: 1123,
      yesPercentage: 87,
      noPercentage: 13,
      dateReported: "2024-01-13",
      riskLevel: "High",
    },
    {
      id: 8,
      address: "0xA0b86a33E6842c8f606c3C725c6853da97d19C4B",
      shortAddress: "0xA0b8...C4B",
      status: "Pending",
      totalVotes: 89,
      yesPercentage: 56,
      noPercentage: 44,
      dateReported: "2024-01-20",
      riskLevel: "Medium",
    },
  ]);

  // State for search, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateReported");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = reportData.filter((report) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        report.address.toLowerCase().includes(searchLower) ||
        report.shortAddress.toLowerCase().includes(searchLower) ||
        report.status.toLowerCase().includes(searchLower) ||
        report.riskLevel.toLowerCase().includes(searchLower)
      );
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

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />;
    }
    return (
      <ArrowUpDown
        className={`w-3 h-3 ml-2 ${
          sortOrder === "asc" ? "rotate-180" : ""
        } transition-transform`}
      />
    );
  };

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
                <motion.h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 mt-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                >
                  Community Vote Reports
                </motion.h1>
                <motion.p
                  className="text-lg sm:text-xl text-gray-300 max-w-3xl"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.2,
                    ease: "easeOut",
                  }}
                >
                  Review wallet addresses reported by the community for
                  suspicious or fraudulent activity. Help protect the Web3
                  ecosystem by participating in our decentralized security
                  network.
                </motion.p>
              </div>

              {/* Create Report Button */}
              <motion.div
                className="flex-shrink-0 mt-20 lg:mt-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                  ease: "easeOut",
                }}
              >
                <Button
                  className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white sm:flex-shrink-0"
                  onClick={() => navigate("/reports/create")}
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Create Report
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Rest of Content */}
        <div className="px-4 sm:px-6">
          <div className="container mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[
                {
                  title: "Total Reports",
                  value: reportData.length.toLocaleString(),
                  subtitle: "+12% this week",
                  icon: <AlertTriangle className="w-5 h-5 text-gray-400" />,
                  color: "text-green-400",
                },
                {
                  title: "Pending Review",
                  value: reportData.filter(
                    (report) => report.status === "Pending"
                  ).length,
                  subtitle: "Awaiting votes",
                  icon: <Clock className="w-5 h-5 text-yellow-400" />,
                  color: "text-yellow-400",
                },
                {
                  title: "Confirmed Unsafe",
                  value: reportData.filter(
                    (report) => report.status === "Unsafe"
                  ).length,
                  subtitle: "Blocked addresses",
                  icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
                  color: "text-red-400",
                },
                {
                  title: "Community Votes",
                  value: reportData
                    .reduce((sum, report) => sum + report.totalVotes, 0)
                    .toLocaleString(),
                  subtitle: "Total cast",
                  icon: <CheckCircle className="w-5 h-5 text-green-400" />,
                  color: "text-green-400",
                },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.4 + index * 0.1,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                >
                  <Card>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">
                        {card.title}
                      </span>
                      {card.icon}
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className={`text-sm ${card.color}`}>
                      {card.subtitle}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Filters and Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.8,
                ease: "easeOut",
              }}
            >
              <Card className="my-10">
                <div className="flex flex-col gap-4 items-stretch">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search addresses, status, risk level..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:bg-white/10"
                      />
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
                      ].map((sortOption, index) => (
                        <motion.div
                          key={sortOption.field}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 1.0 + index * 0.1,
                          }}
                          whileHover={{ y: -2 }}
                        >
                          <Button
                            onClick={() => handleSort(sortOption.field)}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm flex-1 sm:flex-initial"
                          >
                            {sortOption.label}
                            {getSortIcon(sortOption.field)}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Reports Cards */}
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Reported Addresses
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Community-reported wallet addresses under review for
                      potential security threats
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredAndSortedData.length)} of{" "}
                    {filteredAndSortedData.length} results
                  </div>
                </div>

                {currentData.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No reports found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    <AnimatePresence>
                      {currentData.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{
                            opacity: 0,
                            y: 40,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: 1.0 + index * 0.1,
                            ease: "easeOut",
                          }}
                          whileHover={{
                            y: -3,
                            transition: {
                              duration: 0.3,
                              ease: "easeOut",
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: -10,
                            transition: { duration: 0.3 },
                          }}
                        >
                          <Card>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                  <span className="font-mono text-base sm:text-lg font-semibold truncate">
                                    {report.shortAddress}
                                  </span>
                                  <div
                                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                      report.status
                                    )} self-start`}
                                  >
                                    {getStatusIcon(report.status)}
                                    <span>{report.status}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-400">
                                  <span>{report.riskLevel} Risk</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Reported {report.dateReported}</span>
                                </div>
                              </div>
                            </div>

                            {/* Vote Information */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-300">
                                  Community Consensus
                                </span>
                                <span className="text-sm font-semibold">
                                  {report.totalVotes.toLocaleString()} votes
                                </span>
                              </div>
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-red-400">
                                    Unsafe: {report.yesPercentage}%
                                  </span>
                                  <span className="text-green-400">
                                    Safe: {report.noPercentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    className="bg-red-400 h-2 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${report.yesPercentage}%`,
                                    }}
                                    transition={{
                                      duration: 0.8,
                                      delay: 1.2 + index * 0.1,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="text-xs text-gray-400">
                                ID: #{report.id.toString().padStart(4, "0")}
                              </div>
                              <Button
                                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm"
                                onClick={() =>
                                  navigate(`/reports/${report.id}`)
                                }
                              >
                                <Eye className="w-3 h-3 mr-2" />
                                <span className="hidden sm:inline">
                                  View Details
                                </span>
                                <span className="sm:hidden">View</span>
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pagination */}
                {filteredAndSortedData.length > 0 && (
                  <motion.div
                    className="mt-6 sm:mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 2.5,
                      ease: "easeOut",
                    }}
                  >
                    <span className="text-gray-400 text-sm text-center sm:text-left">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, filteredAndSortedData.length)} of{" "}
                      {filteredAndSortedData.length} reports
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(3, totalPages) },
                          (_, i) => {
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
                              <Button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 p-0 text-sm ${
                                  currentPage === pageNum
                                    ? "bg-white text-black"
                                    : "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4 sm:ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 2.0,
                ease: "easeOut",
              }}
            >
              <Card className="my-10">
                <h3 className="text-lg font-semibold mb-4">
                  How Community Voting Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
                  {[
                    {
                      title: "1. Report Submission",
                      description:
                        "Community members can report suspicious wallet addresses with evidence and reasoning.",
                    },
                    {
                      title: "2. Community Review",
                      description:
                        "Verified users vote on whether the reported address poses a security threat to the ecosystem.",
                    },
                    {
                      title: "3. Consensus Decision",
                      description:
                        'Addresses with 75%+ "Unsafe" votes are flagged and added to the community blocklist.',
                    },
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 2.2 + index * 0.1,
                        ease: "easeOut",
                      }}
                      whileHover={{
                        y: -2,
                        transition: { duration: 0.3 },
                      }}
                    >
                      <h4 className="font-medium text-white mb-2">
                        {step.title}
                      </h4>
                      <p>{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
