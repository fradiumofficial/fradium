// React
import React from "react";
import { createPortal } from "react-dom";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, Trash2, Key } from "lucide-react";

// Components
import LightButton from "@/core/components/ui/LightButton.jsx";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, action, tokenName, isLoading = false }) => {
  // Disable page scroll when modal is open
  React.useEffect(() => {
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

  // Get action details
  const getActionDetails = () => {
    switch (action) {
      case "regenerate":
        return {
          icon: <RefreshCw className="w-6 h-6 text-blue-600" />,
          title: "Regenerate Token",
          message: `Are you sure you want to regenerate the token "${tokenName}"?`,
          description: "This will create a new token string and invalidate the current one. You'll need to update any applications using this token.",
          confirmText: "Regenerate Token",
          confirmVariant: "primary",
          confirmClassName: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      case "revoke":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
          title: "Revoke Token",
          message: `Are you sure you want to revoke the token "${tokenName}"?`,
          description: "This will disable the token and prevent it from being used for API calls. You can delete it permanently later.",
          confirmText: "Revoke Token",
          confirmVariant: "primary",
          confirmClassName: "bg-orange-600 hover:bg-orange-700 text-white",
        };
      case "delete":
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          title: "Delete Token",
          message: `Are you sure you want to permanently delete the token "${tokenName}"?`,
          description: "This action cannot be undone. The token will be permanently removed from the system.",
          confirmText: "Delete Token",
          confirmVariant: "primary",
          confirmClassName: "bg-red-600 hover:bg-red-700 text-white",
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          title: "Confirm Action",
          message: `Are you sure you want to perform this action on "${tokenName}"?`,
          description: "Please confirm this action.",
          confirmText: "Confirm",
          confirmVariant: "primary",
          confirmClassName: "bg-gray-600 hover:bg-gray-700 text-white",
        };
    }
  };

  const actionDetails = getActionDetails();

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
          <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose} aria-label="Close" disabled={isLoading}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex flex-col items-center p-6 gap-6 h-auto">
            <div className="w-full text-center text-slate-900 text-lg font-semibold">{actionDetails.title}</div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-6 w-full">
              {/* Icon and Message */}
              <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-slate-50 border border-slate-200">{actionDetails.icon}</div>
                <div className="text-center">
                  <p className="text-slate-900 font-medium text-base mb-2">{actionDetails.message}</p>
                  <p className="text-slate-600 text-sm">{actionDetails.description}</p>
                </div>
              </motion.div>

              {/* Warning Notice */}
              <motion.div variants={itemVariants} className="w-full rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-800 font-medium text-sm mb-1">Important Notice</h3>
                    <ul className="text-yellow-700 text-xs space-y-1">
                      {action === "regenerate" && (
                        <>
                          <li>• The current token will become invalid immediately</li>
                          <li>• Update your applications with the new token</li>
                          <li>• This action cannot be undone</li>
                        </>
                      )}
                      {action === "revoke" && (
                        <>
                          <li>• The token will be disabled but not deleted</li>
                          <li>• You can delete it permanently later</li>
                          <li>• Applications using this token will fail</li>
                        </>
                      )}
                      {action === "delete" && (
                        <>
                          <li>• This action cannot be undone</li>
                          <li>• The token will be permanently removed</li>
                          <li>• All associated data will be lost</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="w-full flex gap-3">
                <LightButton variant="ghost" size="lg" fullWidth onClick={onClose} disabled={isLoading} className="h-12 flex items-center justify-center">
                  Cancel
                </LightButton>
                <LightButton variant="primary" size="lg" fullWidth onClick={onConfirm} disabled={isLoading} className={`h-12 flex items-center justify-center ${actionDetails.confirmClassName}`}>
                  {isLoading ? "Processing..." : actionDetails.confirmText}
                </LightButton>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
