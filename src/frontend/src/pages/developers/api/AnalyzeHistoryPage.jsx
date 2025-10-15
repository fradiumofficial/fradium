import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";
import { backend as backendCan } from "declarations/backend";
import { jsonStringify } from "@/core/lib/canisterUtils";

const AnalyzeHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Backend-sourced API credits usage history
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await backendCan.get_api_analyze_history(offset, limit);
        console.log("analyze history res", jsonStringify(res, null, 2));

        const arr = Array.isArray(res?.items) ? res.items : [];
        // Map backend records -> table-friendly objects
        const mapped = arr
          .slice()
          .sort((a, b) => {
            const aAt = typeof a.at === "bigint" ? a.at : BigInt(a.at || 0);
            const bAt = typeof b.at === "bigint" ? b.at : BigInt(b.at || 0);
            return aAt === bAt ? 0 : aAt > bAt ? -1 : 1; // latest first
          })
          .map((r, idx) => {
            const when = new Date(Number((typeof r.at === "bigint" ? r.at : BigInt(r.at || 0)) / 1_000_000n)).toLocaleString();
            const costAmount = Number(r.cost) / 1e8;
            return {
              id: `${Number(r.at || 0)}-${idx}`,
              address: String(r.route || "/analyze-address"), // reuse Address column to show route
              timestamp: when,
              status: String(r.status || "success"),
              riskScore: null,
              model: String(r.model || "community"),
              responseTime: "-",
              cost: `${costAmount} FRADIUM`,
              reason: r.reason || null,
            };
          });
        setItems(mapped);
      } catch (e) {
        console.log("error fetching analyze history", e);
        setError(e?.message || "Failed to load history");
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [offset, limit]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getRiskScoreColor = (score) => {
    if (score === null) return "text-gray-400";
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-yellow-400";
    return "text-green-400";
  };

  const filteredHistory = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || item.status === filterStatus;
        return matchesSearch && matchesFilter;
      }),
    [items, searchTerm, filterStatus]
  );

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-semibold text-black mb-2">Analyze History</h1>
          <p className="text-gray-400">View and manage your address analysis history</p>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 mb-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_140px_at_50%_-40px,rgba(108,140,223,0.22),rgba(45,84,184,0.14)_55%,transparent_75%)]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search by address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-[#6C8CDF] focus:outline-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#6C8CDF] focus:outline-none">
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              {/* Export Button */}
              <LightButton variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export
              </LightButton>
            </div>
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(800px_300px_at_50%_-60px,rgba(108,140,223,0.18),rgba(45,84,184,0.14)_55%,transparent_80%)]" />
          <div className="relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Risk Score</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    // Skeleton Loading Rows
                    [...Array(5)].map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                            <div className="h-4 bg-slate-200 rounded w-16"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-12"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-24"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-600">
                        No analyze history yet.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 font-mono">{item.address.slice(0, 20)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                              {item.reason && (
                                <span className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={item.reason}>
                                  {item.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${getRiskScoreColor(item.riskScore)}`}>{item.riskScore !== null ? `${item.riskScore}/100` : "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{item.model}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{item.cost}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{item.timestamp}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {filteredHistory.length} of {items.length} results
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 transition-colors">Previous</button>
                <button className="px-3 py-1 text-sm bg-[#6C8CDF] text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnalyzeHistoryPage;
