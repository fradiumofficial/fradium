// React
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// External Libraries
import toast from "react-hot-toast";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { Key, Copy, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Components
import LightButton from "@/core/components/ui/LightButton.jsx";

// Services
import apiTokenService from "@/core/services/api/apiTokenService.js";

const GenerateTokenModal = ({ isOpen, onClose, onTokenCreated }) => {
  // State declarations
  const [tokenName, setTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdToken, setCreatedToken] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTokenName("");
      setError("");
      setCreatedToken(null);
      setShowToken(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Disable page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  // Create token function
  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      setError("Token name is required");
      return;
    }

    if (tokenName.trim().length > 50) {
      setError("Token name must be 50 characters or less");
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      const result = await apiTokenService.createToken(tokenName.trim());

      if (result.success) {
        const formattedToken = apiTokenService.formatTokenForDisplay(result.data);
        setCreatedToken(formattedToken);
        toast.success("Token created successfully!", {
          position: "bottom-center",
          duration: 3000,
          style: {
            background: "#F0FDF4",
            color: "#166534",
            border: "1px solid #BBF7D0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
          },
          icon: "✅",
        });
      } else {
        setError(result.error || "Failed to create token");
      }
    } catch (error) {
      console.error("Error creating token:", error);
      setError("Failed to create token");
    } finally {
      setIsCreating(false);
    }
  };

  // Copy token to clipboard
  const copyToken = async () => {
    if (!createdToken?.token) return;

    try {
      await navigator.clipboard.writeText(createdToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast.success("Token copied to clipboard!", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#F0FDF4",
          color: "#166534",
          border: "1px solid #BBF7D0",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "📋",
      });
    } catch (error) {
      console.error("Failed to copy token:", error);
      toast.error("Failed to copy token", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#FEF2F2",
          color: "#DC2626",
          border: "1px solid #FECACA",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "❌",
      });
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (createdToken && onTokenCreated) {
      onTokenCreated(createdToken);
    }
    onClose();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <div className="relative w-full max-w-[500px] mx-auto my-8 bg-white rounded-2xl border border-slate-200/70 shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100">
          {/* Close Button */}
          <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" onClick={handleClose} aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex flex-col items-center p-6 gap-6 h-auto">
            <div className="w-full text-center text-slate-900 text-lg font-semibold">{createdToken ? "Token Created Successfully" : "Generate New API Token"}</div>

            <AnimatePresence mode="wait">
              {!createdToken ? (
                <motion.div key="create-form" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6 w-full">
                  {/* Token Name Input */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-slate-50 border border-slate-200 p-6">
                    <div className="text-slate-900 text-sm font-medium mb-3">Token Name</div>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Enter token name (e.g., Production API Key)" className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm outline-none" disabled={isCreating} maxLength={50} />
                    </div>
                    <div className="text-slate-500 text-xs mt-2">Choose a descriptive name to identify this token</div>
                  </motion.div>

                  {/* Security Notice */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-yellow-50 border border-yellow-200 p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="text-yellow-800 font-medium text-sm mb-2">Security Notice</h3>
                        <ul className="text-yellow-700 text-xs space-y-1">
                          <li>• Keep your API tokens secure and never share them publicly</li>
                          <li>• You can regenerate or revoke tokens at any time</li>
                          <li>• Each token is tied to your account and principal</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Error Display */}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-lg bg-red-50 border border-red-200 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-800 font-medium text-sm">Error</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </motion.div>
                  )}

                  {/* Create Button */}
                  <motion.div variants={itemVariants} className="w-full">
                    <LightButton variant="primary" size="lg" fullWidth leftIcon={isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />} onClick={handleCreateToken} disabled={isCreating || !tokenName.trim()}>
                      {isCreating ? "Creating Token..." : "Generate Token"}
                    </LightButton>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="token-result" initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6 w-full">
                  {/* Token Display */}
                  <motion.div variants={itemVariants} className="w-full rounded-xl bg-slate-50 border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#6C8CDF]/10 rounded-lg">
                        <Key className="w-5 h-5 text-[#6C8CDF]" />
                      </div>
                      <div>
                        <div className="text-slate-900 font-medium">{createdToken.name}</div>
                        <div className="text-slate-500 text-sm">Created: {createdToken.created}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="text-slate-600 text-sm mb-2">Your API Token:</div>
                      <div className="flex items-center gap-2">
                        <code className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-2 rounded-lg flex-1 break-all">{showToken ? createdToken.token : "•".repeat(40)}</code>
                        <button onClick={() => setShowToken(!showToken)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          {showToken ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                        </button>
                        <button onClick={copyToken} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-blue-800 text-xs">
                          <strong>Important:</strong> This token will only be displayed once. Make sure to copy and store it securely.
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div variants={itemVariants} className="w-full">
                    <LightButton variant="primary" size="lg" fullWidth onClick={handleClose}>
                      Done
                    </LightButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GenerateTokenModal;
