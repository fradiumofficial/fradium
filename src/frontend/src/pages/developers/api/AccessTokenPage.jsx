import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";
import apiTokenService from "@/core/services/api/apiTokenService.js";
import GenerateTokenModal from "@/core/components/modals/GenerateTokenModal.jsx";
import ConfirmationModal from "@/core/components/modals/ConfirmationModal.jsx";

const AccessTokenPage = () => {
  const [showTokens, setShowTokens] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load tokens on component mount
  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiTokenService.getTokens();

      if (result.success) {
        const formattedTokens = result.data.map((token) => apiTokenService.formatTokenForDisplay(token));
        setTokens(formattedTokens);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      setError("Failed to load tokens");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Handle token created from modal
  const handleTokenCreated = async (newToken) => {
    // Reload tokens to show the new one
    await loadTokens();
  };

  // Show confirmation modal for actions
  const showConfirmation = (action, token) => {
    setConfirmationAction(action);
    setSelectedToken(token);
    setShowConfirmationModal(true);
  };

  // Handle confirmation
  const handleConfirmation = async () => {
    if (!selectedToken || !confirmationAction) return;

    try {
      setIsActionLoading(true);
      setError(null);

      let result;
      switch (confirmationAction) {
        case "regenerate":
          result = await apiTokenService.regenerateToken(selectedToken.id);
          break;
        case "revoke":
          result = await apiTokenService.revokeToken(selectedToken.id);
          break;
        case "delete":
          result = await apiTokenService.deleteToken(selectedToken.id);
          break;
        default:
          throw new Error("Unknown action");
      }

      if (result.success) {
        await loadTokens(); // Reload tokens
        setShowConfirmationModal(false);
        setConfirmationAction(null);
        setSelectedToken(null);
      } else {
        setError(result.error || `Failed to ${confirmationAction} token`);
      }
    } catch (error) {
      console.error(`Error ${confirmationAction}ing token:`, error);
      setError(`Failed to ${confirmationAction} token`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationAction(null);
    setSelectedToken(null);
  };

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
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 mb-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_140px_at_50%_-40px,rgba(108,140,223,0.22),rgba(45,84,184,0.14)_55%,transparent_75%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Create New Token</h2>
              <LightButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerateModal(true)}>
                Generate Token
              </LightButton>
            </div>
            <p className="text-slate-600 text-sm">Create a new API token to access Fradium's analysis services. Each token has specific permissions and can be revoked at any time.</p>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-red-600 hover:text-red-800 text-sm underline">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Tokens Table */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_300px_at_50%_-60px,rgba(108,140,223,0.18),rgba(45,84,184,0.14)_55%,transparent_80%)]" />
          <div className="relative z-10">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#6C8CDF]" />
                <span className="ml-3 text-slate-600">Loading tokens...</span>
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Key className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No API Tokens</h3>
                <p className="text-slate-600 text-center">You haven't created any API tokens yet. Create your first token to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Token</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tokens.map((token) => (
                      <tr key={token.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#6C8CDF]/10 rounded-lg">
                              <Key className="w-4 h-4 text-[#6C8CDF]" />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{token.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-slate-900 font-mono bg-slate-100 px-3 py-2 rounded-lg flex-1 max-w-xs truncate">{showTokens[token.id] ? token.token : "•".repeat(20)}</code>
                            <button onClick={() => toggleTokenVisibility(token.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                              {showTokens[token.id] ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                            </button>
                            <button onClick={() => copyToken(token.token, token.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                              {copiedToken === token.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-900">{token.created}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(token.status)}
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(token.status)}`}>{token.status.charAt(0).toUpperCase() + token.status.slice(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {token.status === "active" && (
                              <>
                                <LightButton variant="ghost" size="sm" onClick={() => showConfirmation("regenerate", token)} leftIcon={<RefreshCw className="w-4 h-4" />}>
                                  Regenerate
                                </LightButton>
                                <LightButton variant="ghost" size="sm" onClick={() => showConfirmation("revoke", token)} leftIcon={<Trash2 className="w-4 h-4" />} className="text-red-600 hover:text-red-700">
                                  Revoke
                                </LightButton>
                              </>
                            )}
                            {token.status === "revoked" && (
                              <LightButton variant="ghost" size="sm" onClick={() => showConfirmation("delete", token)} leftIcon={<Trash2 className="w-4 h-4" />} className="text-red-600 hover:text-red-700">
                                Delete
                              </LightButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-yellow-400/20 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
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

      {/* Generate Token Modal */}
      <GenerateTokenModal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} onTokenCreated={handleTokenCreated} />

      {/* Confirmation Modal */}
      <ConfirmationModal isOpen={showConfirmationModal} onClose={handleCancelConfirmation} onConfirm={handleConfirmation} action={confirmationAction} tokenName={selectedToken?.name} isLoading={isActionLoading} />
    </div>
  );
};

export default AccessTokenPage;
