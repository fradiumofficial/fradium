import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";

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

  const analyzeHistory = [
    {
      id: 1,
      address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      timestamp: "2024-01-15 14:30:25",
      status: "success",
      riskScore: 85,
      model: "AI Model",
      responseTime: "245ms",
      cost: "0.01 FUM",
    },
    {
      id: 2,
      address: "0x8ba1f109551bD432803012645Hac136c",
      timestamp: "2024-01-15 14:25:18",
      status: "success",
      riskScore: 42,
      model: "Community Model",
      responseTime: "189ms",
      cost: "0.003 FUM",
    },
    {
      id: 3,
      address: "0x1234567890abcdef1234567890abcdef12345678",
      timestamp: "2024-01-15 14:20:12",
      status: "error",
      riskScore: null,
      model: "AI Model",
      responseTime: "5000ms",
      cost: "0.01 FUM",
    },
    {
      id: 4,
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      timestamp: "2024-01-15 14:15:05",
      status: "success",
      riskScore: 78,
      model: "AI Model",
      responseTime: "267ms",
      cost: "0.01 FUM",
    },
    {
      id: 5,
      address: "0x9876543210fedcba9876543210fedcba98765432",
      timestamp: "2024-01-15 14:10:58",
      status: "success",
      riskScore: 15,
      model: "Community Model",
      responseTime: "156ms",
      cost: "0.003 FUM",
    },
  ];

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

  const filteredHistory = analyzeHistory.filter((item) => {
    const matchesSearch = item.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Analyze History</h1>
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Response Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-mono">{item.address.slice(0, 20)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getRiskScoreColor(item.riskScore)}`}>{item.riskScore !== null ? `${item.riskScore}/100` : "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.model}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.responseTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.cost}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.timestamp}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="flex items-center gap-1 text-[#6C8CDF] hover:text-[#6C8CDF]/80 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing 1-{filteredHistory.length} of {analyzeHistory.length} results
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
