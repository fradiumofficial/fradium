// React
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// External Libraries
import QRCode from "qrcode";
import toast from "react-hot-toast";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

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

  // QR Code states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [qrDetail, setQrDetail] = useState({ open: false, coin: null, address: null });

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
  const AddressItem = ({ title, description, address, onCopy, onQrClick }) => (
    <motion.div className="flex flex-col gap-3" variants={itemVariants} initial="hidden" animate="visible">
      {/* Title */}
      <motion.div className="text-white text-sm font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {title}
      </motion.div>

      {/* Description */}
      {description && (
        <motion.div className="text-[#B0B6BE] text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {description}
        </motion.div>
      )}

      {/* Address container */}
      <motion.div
        className="bg-[#23272F] border border-[#393E4B] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.2,
        }}>
        <div className="flex items-center gap-2">
          <motion.span className="text-[#B0B6BE] text-sm truncate flex-1 font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {address || "Not available"}
          </motion.span>
          <motion.img
            src="/assets/icons/qr_code.svg"
            alt="QR Code"
            className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.2,
            }}
            onClick={() => onQrClick(title, address)}
          />
          <motion.img
            src="/assets/icons/content_copy.svg"
            alt="Copy"
            className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.2,
            }}
            onClick={() => onCopy(address)}
          />
        </div>
      </motion.div>
    </motion.div>
  );

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`bg-[#23272F] px-6 py-8 w-full ${qrDetail.open ? "max-w-sm" : "max-w-md"} rounded-lg shadow-lg relative flex flex-col gap-6`}>
        <button
          className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
          onClick={() => {
            if (qrDetail.open) {
              handleCloseQr();
            } else {
              onClose();
            }
          }}
          aria-label="Close">
          ×
        </button>
        <div className="text-white text-xl font-semibold mb-2">{qrDetail.open ? `Receive ${qrDetail.coin}` : "Receive Crypto"}</div>
        <AnimatePresence mode="wait">
          {getAddressesLoadingState() ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <SkeletonReceiveModal />
            </motion.div>
          ) : qrDetail.open ? (
            // QR Detail View
            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-2">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="w-full max-w-80 h-auto object-contain bg-white rounded" style={{ imageRendering: "crisp-edges" }} />}
              <div className="text-[#B0B6BE] text-sm">Scan to receive {qrDetail.coin}</div>
            </motion.div>
          ) : (
            // Address List View
            <motion.div key="addresses" className="flex flex-col gap-4" initial="hidden" animate="visible" variants={containerVariants} transition={{ duration: 0.2 }}>
              <AddressItem title="Bitcoin (BTC):" address={addresses.bitcoin} onCopy={copyToClipboard} onQrClick={handleQrClick} />
              <AddressItem title="Ethereum (ETH):" address={addresses.ethereum} onCopy={copyToClipboard} onQrClick={handleQrClick} />
              <AddressItem title="Solana (SOL):" address={addresses.solana} onCopy={copyToClipboard} onQrClick={handleQrClick} />
              <AddressItem title="ICP Principal:" description="Use for receiving ICRC-1 tokens in the ICP network, such as SNS, ck tokens, etc." address={addresses.icp_principal} onCopy={copyToClipboard} onQrClick={handleQrClick} />
              <AddressItem title="ICP Account (for exchanges):" description="Use for receiving ICP on centralized exchanges and legacy transfers." address={addresses.icp_account} onCopy={copyToClipboard} onQrClick={handleQrClick} />
            </motion.div>
          )}
        </AnimatePresence>
        {qrDetail.open ? (
          // QR View Actions
          <div>
            <div className="text-[#B0B6BE] text-sm mb-1">Your {qrDetail.coin} address:</div>
            <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 mb-4">
              <span className="text-[#B0B6BE] text-sm truncate flex-1">{qrDetail.address}</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 rounded-lg bg-[#23272F] text-[#9BE4A0] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] hover:text-white transition" onClick={() => copyToClipboard(qrDetail.address)}>
                <img src="/assets/icons/content_copy.svg" alt="Copy" className="w-5 h-5" />
                Copy Address
              </button>
              <button className="flex-1 py-3 rounded-lg bg-[#23272F] text-[#B0B6BE] font-semibold flex items-center justify-center gap-2 hover:bg-[#23282f] hover:text-white transition" onClick={handleCloseQr}>
                Back to List
              </button>
            </div>
          </div>
        ) : (
          // Address List Actions
          <button className="w-full bg-[#9BE4A0] text-black font-semibold py-3 rounded-lg hover:bg-[#8FD391] transition-colors" onClick={onClose}>
            Done
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ReceiveAddressModal;
