import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { ArrowLeft, Search, AlertTriangle, CheckCircle, Clock, Eye, FileText, Vote } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import PrimaryButton from "@/core/components/Button";
import { backend } from "declarations/backend";
import { toast } from "react-toastify";

export default function MyReportPage() {
  // Authentication state
  const [isConnected, setIsConnected] = useState(true);
  const [currentUserAddress, setCurrentUserAddress] = useState("");
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState("created"); // created, voted

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, unsafe, safe

  // Data state
  const [createdReports, setCreatedReports] = useState([]);
  const [votedReports, setVotedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
      };
    });
  };

  // Fetch my reports
  const fetchMyReports = async () => {
    setIsLoading(true);
    try {
      const response = await backend.get_my_reports();
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
    setIsLoading(false);
  };

  // Fetch my voted reports
  const fetchMyVotedReports = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  // Check wallet connection
  useEffect(() => {
    const checkWalletConnection = () => {
      const mockWallet = localStorage.getItem("mockWallet");
      if (mockWallet) {
        setIsConnected(true);
        setCurrentUserAddress(mockWallet);
      }
    };

    checkWalletConnection();
  }, []);

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

  // Format address
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate vote percentages
  const getVotePercentages = (votes) => {
    const yesPercentage = Math.round((votes.yes / votes.total) * 100);
    const noPercentage = Math.round((votes.no / votes.total) * 100);
    return { yesPercentage, noPercentage };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">My Reports</h1>
            <p className="text-lg sm:text-xl text-gray-300">Track your submitted reports and voting history in the community.</p>
          </div>
          <div className="space-y-8">
            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-1">
                <Button onClick={() => setActiveTab("created")} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "created" ? "bg-white text-black" : "text-gray-300 hover:text-white hover:bg-white/10"}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  My Reports ({createdReports.length})
                </Button>
                <Button onClick={() => setActiveTab("voted")} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "voted" ? "bg-white text-black" : "text-gray-300 hover:text-white hover:bg-white/10"}`}>
                  <Vote className="w-4 h-4 mr-2" />
                  Voted Reports ({votedReports.length})
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10" />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={() => setStatusFilter("all")} className={`text-sm ${statusFilter === "all" ? "bg-white text-black" : "bg-white/10 border border-white/20 hover:bg-white/20 text-white"}`}>
                    All
                  </Button>
                  <Button onClick={() => setStatusFilter("pending")} className={`text-sm ${statusFilter === "pending" ? "bg-yellow-400 text-black" : "bg-white/10 border border-white/20 hover:bg-white/20 text-white"}`}>
                    Pending
                  </Button>
                  <Button onClick={() => setStatusFilter("unsafe")} className={`text-sm ${statusFilter === "unsafe" ? "bg-red-400 text-white" : "bg-white/10 border border-white/20 hover:bg-white/20 text-white"}`}>
                    Unsafe
                  </Button>
                  <Button onClick={() => setStatusFilter("safe")} className={`text-sm ${statusFilter === "safe" ? "bg-green-400 text-black" : "bg-white/10 border border-white/20 hover:bg-white/20 text-white"}`}>
                    Safe
                  </Button>
                </div>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "created" ? (
              <div className="space-y-6">
                <div className="rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Reports I Created</h2>
                    <Link to="/reports/create">
                      <PrimaryButton onClick={() => navigate("/reports/create")}>
                        <FileText className="w-4 h-4 mr-2" />
                        Create New Report
                      </PrimaryButton>
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2">Loading reports...</h3>
                      <p className="text-gray-400">Please wait while we fetch your reports</p>
                    </div>
                  ) : filteredCreatedReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                      <p className="text-gray-400">{searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria" : "You haven't created any reports yet"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 sm:gap-6">
                      {filteredCreatedReports.map((report, index) => (
                        <div key={report.id}>
                          <div className="rounded-xl p-4">
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
                                  <span>Reported {report.dateCreated}</span>
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
                          </div>
                        </div>
                      ))}
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

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2">Loading voted reports...</h3>
                      <p className="text-gray-400">Please wait while we fetch your voted reports</p>
                    </div>
                  ) : filteredVotedReports.length === 0 ? (
                    <div className="text-center py-12">
                      <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No voted reports found</h3>
                      <p className="text-gray-400">{searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria" : "You haven't voted on any reports yet"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 sm:gap-6">
                      {filteredVotedReports.map((report, index) => (
                        <div key={report.id}>
                          <div className="rounded-xl p-4">
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
                                  <span>Voted {report.dateCreated}</span>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
