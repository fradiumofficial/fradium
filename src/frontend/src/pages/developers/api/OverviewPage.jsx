import React from "react";
import { motion } from "framer-motion";
import LightButton from "@/core/components/ui/LightButton.jsx";

const OverviewPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const stats = [
    {
      title: "Total API Calls",
      value: "12,847",
      change: "+12.5",
      changeType: "positive",
    },
    {
      title: "Success Rate",
      value: "99.8",
      change: "+0.2",
      changeType: "positive",
    },
    {
      title: "Active Tokens",
      value: "3",
      change: "0",
      changeType: "neutral",
    },
    {
      title: "Avg Response Time",
      value: "245ms",
      change: "-15ms",
      changeType: "positive",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "analyze",
      address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      timestamp: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "analyze",
      address: "0x8ba1f109551bD432803012645Hac136c",
      timestamp: "5 minutes ago",
      status: "success",
    },
    {
      id: 3,
      type: "analyze",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      timestamp: "8 minutes ago",
      status: "success",
    },
    {
      id: 4,
      type: "token",
      action: "Token regenerated",
      timestamp: "1 hour ago",
      status: "info",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">API Dashboard</h1>
          <p className="text-slate-600">Monitor your API usage and performance metrics</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            return (
              <div key={stat.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">{stat.change}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-1">{stat.value}</h3>
                  <p className="text-slate-600 text-sm">{stat.title}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                <button className="text-slate-600 text-sm hover:text-slate-900 transition-colors">View All</button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <div>
                        <p className="text-slate-900 text-sm font-medium">{activity.type === "analyze" ? "Address Analysis" : activity.action}</p>
                        {activity.address && <p className="text-slate-600 text-xs font-mono">{activity.address.slice(0, 20)}...</p>}
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* API Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">API Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">All Systems</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="text-slate-600 text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Response Time</span>
                  <span className="text-slate-900 text-sm font-medium">245ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Uptime</span>
                  <span className="text-slate-900 text-sm font-medium">99.9%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <LightButton variant="ghost" size="sm" className="w-full justify-start">
                  Generate New Token
                </LightButton>
                <LightButton variant="ghost" size="sm" className="w-full justify-start">
                  View Documentation
                </LightButton>
                <LightButton variant="ghost" size="sm" className="w-full justify-start">
                  Support
                </LightButton>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewPage;
