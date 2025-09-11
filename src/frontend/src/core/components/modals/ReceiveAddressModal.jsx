// React
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// External Libraries
import QRCode from "qrcode";
import toast from "react-hot-toast";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

// Wallet Provider
import { useWallet } from "@/core/providers/WalletProvider";

// Skeleton Component
import SkeletonReceiveModal from "@/pages/wallet/SkeletonReceiveModal";

const ReceiveAddressModal = ({ isOpen, onClose }) => {
  // Use Wallet Provider for addresses
  const { addresses, fetchAddresses, getAddressesLoadingState } = useWallet();

  // Fetch addresses using WalletProvider
  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen, fetchAddresses]);

  // Handle address errors and validation
  useEffect(() => {
    if (addresses) {
      const newErrors = {};

      // Check each address and set error if empty or invalid
      Object.keys(addresses).forEach((key) => {
        const address = addresses[key];
        if (!address || address.trim() === "") {
          newErrors[key] = "Address not available";
        } else {
          newErrors[key] = null;
        }
      });

      setAddressErrors(newErrors);
    }
  }, [addresses]);

  // QR Code states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [qrDetail, setQrDetail] = useState({ open: false, coin: null, address: null });

  // Address error states
  const [addressErrors, setAddressErrors] = useState({
    bitcoin: null,
    ethereum: null,
    solana: null,
    icp_principal: null,
    icp_account: null,
  });

  // QR Code generation
  useEffect(() => {
    if (qrDetail.open && qrDetail.address) {
      QRCode.toDataURL(qrDetail.address, {
        width: 320,
        margin: 1,
        scale: 8,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [qrDetail.open, qrDetail.address]);

  // Copy address to clipboard
  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#23272F",
          color: "#9BE4A0",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "📋",
      });
    } catch (error) {
      console.error("Failed to copy address:", error);
      toast.error("Failed to copy address", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#23272F",
          color: "#FF6B6B",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "❌",
      });
    }
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
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Address Item Component with Framer Motion Animation
  const AddressItem = ({ title, description, address, error, onCopy, onQrClick }) => {
    const hasError = error || !address;
    const displayText = hasError ? error || "Address not available" : address;
    const isError = hasError;

    return (
      <motion.div className="flex flex-col gap-2" variants={itemVariants} initial="hidden" animate="visible">
        {/* Title */}
        <motion.div className="text-white/90 text-[13px] font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {title}
        </motion.div>

        {/* Description */}
        {description && (
          <motion.div className="text-[#B0B6BE] text-[11px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {description}
          </motion.div>
        )}

        {/* Address pill */}
        <motion.div className={`rounded-full border pl-4 pr-2 py-2.5 ${isError ? "border-red-500/50 bg-red-500/10" : "border-white/10"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="flex items-center gap-1">
            <motion.span className={`text-[13px] truncate flex-1 font-mono ${isError ? "text-red-400" : "text-white"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              {displayText}
            </motion.span>
            {!isError && (
              <>
                <motion.button type="button" className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/[0.1] transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} onClick={() => onQrClick(title, address)} aria-label="Show QR">
                  <img src="/assets/icons/qr_code.svg" alt="QR Code" className="w-4 h-4 opacity-80" />
                </motion.button>
                <motion.button type="button" className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/[0.1] transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} onClick={() => onCopy(address)} aria-label="Copy Address">
                  <img src="/assets/icons/content_copy.svg" alt="Copy" className="w-4 h-4 opacity-80" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  // QR Code handler
  const handleQrClick = (coin, address) => {
    setQrDetail({ open: true, coin, address });
  };

  // Close QR view
  const handleCloseQr = () => {
    setQrDetail({ open: false, coin: null, address: null });
    setQrCodeDataUrl("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-md p-4">
      <div className={`relative w-full ${qrDetail.open ? "max-w-sm" : "max-w-[480px]"} bg-[#171A1C] rounded-[24px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]`}>
        <div className="pointer-events-none absolute -inset-x-8 -top-8 h-20 bg-[#A6F3AE]/10 blur-3xl opacity-25 rounded-full" />
        <button
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          onClick={() => {
            if (qrDetail.open) {
              handleCloseQr();
            } else {
              onClose();
            }
          }}
          aria-label="Close">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-5 sm:p-6">
          <div className="text-white text-[16px] pl-4 sm:text-[16px] font-medium leading-tight mb-4">{qrDetail.open ? `Receive ${qrDetail.coin}` : "Copy or scan barcode here to Receive Coin"}</div>
          <AnimatePresence mode="wait">
            {getAddressesLoadingState() ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <SkeletonReceiveModal />
              </motion.div>
            ) : qrDetail.open ? (
              // QR Detail View
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-3 w-full">
                <div className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-5 flex flex-col items-center">
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="w-full max-w-56 h-auto object-contain rounded" style={{ imageRendering: "crisp-edges" }} />}
                  <div className="text-[#B0B6BE] text-sm mt-3">Scan to receive {qrDetail.coin}</div>
                </div>
              </motion.div>
            ) : (
              // Address List View
              <motion.div key="addresses" initial="hidden" animate="visible" variants={containerVariants} transition={{ duration: 0.2 }}>
                <div className="rounded-[20px] bg-white/[0.03] border border-white/5 p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    {/* Define address items with their configurations */}
                    {[
                      { key: "bitcoin", title: "Bitcoin:", address: addresses.bitcoin, error: addressErrors.bitcoin },
                      { key: "ethereum", title: "Ethereum:", address: addresses.ethereum, error: addressErrors.ethereum },
                      { key: "solana", title: "Solana:", address: addresses.solana, error: addressErrors.solana },
                      {
                        key: "icp_principal",
                        title: "ICP Principal:",
                        description: "Use for receiving ICRC-1 tokens in the ICP network, such as SNS, ck tokens, etc.",
                        address: addresses.icp_principal,
                        error: addressErrors.icp_principal,
                      },
                      {
                        key: "icp_account",
                        title: "ICP Account (for exchanges):",
                        description: "Use for receiving ICP on centralized exchanges and legacy transfers.",
                        address: addresses.icp_account,
                        error: addressErrors.icp_account,
                      },
                    ].map((item) => (
                      <AddressItem key={item.key} title={item.title} description={item.description} address={item.address} error={item.error} onCopy={copyToClipboard} onQrClick={handleQrClick} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {qrDetail.open ? (
            // QR View Actions
            <div className="mt-4">
              <div className="text-[#B0B6BE] text-sm mb-1">Your {qrDetail.coin} address:</div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 mb-3">
                <span className="text-white text-sm truncate flex-1">{qrDetail.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="py-2.5 rounded-full border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors" onClick={() => copyToClipboard(qrDetail.address)}>
                  Copy Address
                </button>
                <ButtonGreen fullWidth className="rounded-full" onClick={handleCloseQr} size="md" textSize="text-base" fontWeight="medium">
                  Share
                </ButtonGreen>
              </div>
            </div>
          ) : (
            // Address List Actions
            <div className="mt-4">
              <ButtonGreen fullWidth onClick={onClose} size="md" textSize="text-base" fontWeight="medium">
                Done
              </ButtonGreen>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReceiveAddressModal;
