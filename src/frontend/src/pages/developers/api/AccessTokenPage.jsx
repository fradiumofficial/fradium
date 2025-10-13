import React, { useState } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";

const AccessTokenPage = () => {
  const [showTokens, setShowTokens] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const [tokens, setTokens] = useState([
    {
      id: 1,
      name: "API Key",
      token: "fradium_live_sk_1234567890abcdef1234567890abcdef",
      created: "2024-01-10",
      lastUsed: "2024-01-15 14:30:25",
      status: "active",
      permissions: ["analyze:read", "history:read"],
    },
  ]);

  const toggleTokenVisibility = (tokenId) => {
    setShowTokens((prev) => ({
      ...prev,
      [tokenId]: !prev[tokenId],
    }));
  };

  const copyToken = async (token, tokenId) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(tokenId);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  };

  const revokeToken = (tokenId) => {
    setTokens((prev) => prev.map((token) => (token.id === tokenId ? { ...token, status: "revoked" } : token)));
  };

  const regenerateToken = (tokenId) => {
    setTokens((prev) =>
      prev.map((token) =>
        token.id === tokenId
          ? {
              ...token,
              token: `fradium_api_key_sk_${Math.random().toString(36).substring(2, 34)}`,
              lastUsed: new Date().toISOString().slice(0, 19).replace("T", " "),
            }
          : token
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/20";
      case "revoked":
        return "text-red-400 bg-red-400/20";
      case "expired":
        return "text-yellow-400 bg-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "revoked":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Tokens</h1>
          <p className="text-slate-600">Manage your API access tokens and permissions</p>
        </motion.div>

        {/* Create New Token */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 mb-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_140px_at_50%_-40px,rgba(108,140,223,0.22),rgba(45,84,184,0.14)_55%,transparent_75%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Create New Token</h2>
              <LightButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Generate Token
              </LightButton>
            </div>
            <p className="text-slate-600 text-sm">Create a new API token to access Fradium's analysis services. Each token has specific permissions and can be revoked at any time.</p>
          </div>
        </motion.div>

        {/* Tokens List */}
        <motion.div variants={itemVariants} className="space-y-6">
          {tokens.map((token) => (
            <div key={token.id} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_300px_at_50%_-60px,rgba(108,140,223,0.18),rgba(45,84,184,0.14)_55%,transparent_80%)]" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#6C8CDF]/10 rounded-lg">
                      <Key className="w-5 h-5 text-[#6C8CDF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{token.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(token.status)}
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(token.status)}`}>{token.status.charAt(0).toUpperCase() + token.status.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {token.status === "active" && (
                      <>
                        <LightButton variant="ghost" size="sm" onClick={() => regenerateToken(token.id)} leftIcon={<RefreshCw className="w-4 h-4" />}>
                          Regenerate
                        </LightButton>
                        <LightButton variant="ghost" size="sm" onClick={() => revokeToken(token.id)} leftIcon={<Trash2 className="w-4 h-4" />} className="text-red-600 hover:text-red-700">
                          Revoke
                        </LightButton>
                      </>
                    )}
                  </div>
                </div>

                {/* Token Value */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Token</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <code className="flex-1 text-sm text-slate-900 font-mono">{showTokens[token.id] ? token.token : "•".repeat(token.token.length)}</code>
                    <button onClick={() => toggleTokenVisibility(token.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                      {showTokens[token.id] ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                    </button>
                    <button onClick={() => copyToken(token.token, token.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                      {copiedToken === token.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    </button>
                  </div>
                </div>

                {/* Token Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Created</label>
                    <span className="text-sm text-slate-900">{token.created}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Last Used</label>
                    <span className="text-sm text-slate-900">{token.lastUsed}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Permissions</label>
                    <div className="flex flex-wrap gap-1">
                      {token.permissions.map((permission, index) => (
                        <span key={index} className="text-xs bg-[#6C8CDF]/20 text-[#6C8CDF] px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Security Notice */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-yellow-400/20 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_200px_at_50%_-40px,rgba(251,191,36,0.18),rgba(245,158,11,0.14)_55%,transparent_75%)]" />
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Security Notice</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Keep your API tokens secure and never share them publicly</li>
                  <li>• Use different tokens for different environments (production, development)</li>
                  <li>• Regularly rotate your tokens to maintain security</li>
                  <li>• Monitor your token usage and revoke unused tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccessTokenPage;
