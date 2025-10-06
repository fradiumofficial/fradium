import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CreditCard, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { generateTransakUrl, validateTransakConfig, getSupportedCurrencies, TRANSAK_CONFIG } from "@/core/config/transak";
import { useWallet } from "@/core/providers/WalletProvider";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #393E4B;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4a5568;
  }
`;

const TransakModal = ({ isOpen, onClose }) => {
    const { addresses } = useWallet();
    const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
    const [selectedCrypto, setSelectedCrypto] = useState("ETH");
    const [fiatAmount, setFiatAmount] = useState(100);
    const [transakUrl, setTransakUrl] = useState("");
    const [showIframe, setShowIframe] = useState(false);

    // Get wallet address based on selected network
    const getWalletAddress = () => {
        switch (selectedNetwork) {
            case "ethereum":
                return addresses?.ethereum || "";
            case "solana":
                return addresses?.solana || "";
            case "bitcoin":
                return addresses?.bitcoin || "";
            default:
                return "";
        }
    };

    // Validate configuration on mount
    useEffect(() => {
        if (isOpen && !validateTransakConfig()) {
            toast.error("Transak not configured. Please contact support.");
        }
    }, [isOpen]);

    // Generate Transak URL when parameters change
    useEffect(() => {
        const walletAddress = getWalletAddress();
        if (walletAddress && selectedCrypto && fiatAmount > 0) {
            const url = generateTransakUrl(walletAddress, selectedCrypto, fiatAmount, selectedNetwork);
            setTransakUrl(url);
            console.log("Transak URL generated:", url);
        }
    }, [selectedNetwork, selectedCrypto, fiatAmount, addresses]);

    // Update crypto when network changes
    useEffect(() => {
        const supportedCurrencies = getSupportedCurrencies(selectedNetwork);
        if (supportedCurrencies.length > 0 && !supportedCurrencies.includes(selectedCrypto)) {
            setSelectedCrypto(supportedCurrencies[0]);
        }
    }, [selectedNetwork]);

    const handleOpenTransak = () => {
        const walletAddress = getWalletAddress();

        if (!walletAddress) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (fiatAmount < 10) {
            toast.error("Minimum amount is $10");
            return;
        }

        if (!transakUrl) {
            toast.error("Unable to generate Transak URL");
            return;
        }

        // Open Transak in new window
        const width = 500;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            transakUrl,
            "Transak",
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        toast.success("Transak window opened");
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <>
                <style>{scrollbarStyles}</style>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-[#23272F] rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col border border-[#393E4B]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#393E4B]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-[#9BE4A0] to-[#83d36f] rounded-xl shadow-[0_0_20px_rgba(155,228,160,0.3)]">
                                    <CreditCard className="w-6 h-6 text-[#0c0d14]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white font-['General_Sans',sans-serif]">Buy Crypto</h2>
                                    <p className="text-sm text-[#B0B6BE] font-['General_Sans',sans-serif]">
                                        {TRANSAK_CONFIG.environment === "STAGING" ? "Test Mode" : "Purchase with card"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#393E4B] rounded-lg transition-colors group"
                            >
                                <X className="w-5 h-5 text-[#B0B6BE] group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Network Selection */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3 font-['General_Sans',sans-serif]">
                                    Select Network
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["ethereum", "solana", "bitcoin"].map((network) => {
                                        const isSelected = selectedNetwork === network;
                                        const hasAddress = network === "ethereum" ? addresses?.ethereum :
                                            network === "solana" ? addresses?.solana :
                                                addresses?.bitcoin;

                                        return (
                                            <button
                                                key={network}
                                                onClick={() => hasAddress && setSelectedNetwork(network)}
                                                disabled={!hasAddress}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                    ? "border-[#9BE4A0] bg-[#9BE4A0]/10 shadow-[0_0_20px_rgba(155,228,160,0.2)]"
                                                    : "border-[#393E4B] hover:border-[#9BE4A0]/50 hover:bg-[#393E4B]/50"
                                                    } ${!hasAddress ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                <div className="text-center">
                                                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${isSelected ? "bg-[#9BE4A0]" : "bg-[#393E4B]"
                                                        }`}>
                                                        <Wallet className={`w-4 h-4 ${isSelected ? "text-[#0c0d14]" : "text-[#B0B6BE]"
                                                            }`} />
                                                    </div>
                                                    <div className="text-sm font-medium text-white capitalize font-['General_Sans',sans-serif]">
                                                        {network}
                                                    </div>
                                                    {!hasAddress && (
                                                        <div className="text-xs text-[#ff6b6b] mt-1 font-['General_Sans',sans-serif]">
                                                            No address
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Crypto Selection */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3 font-['General_Sans',sans-serif]">
                                    Select Cryptocurrency
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {getSupportedCurrencies(selectedNetwork).map((crypto) => (
                                        <button
                                            key={crypto}
                                            onClick={() => setSelectedCrypto(crypto)}
                                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedCrypto === crypto
                                                ? "border-[#9BE4A0] bg-[#9BE4A0]/10 shadow-[0_0_20px_rgba(155,228,160,0.2)]"
                                                : "border-[#393E4B] hover:border-[#9BE4A0]/50 hover:bg-[#393E4B]/50"
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-white font-['General_Sans',sans-serif]">
                                                    {crypto}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3 font-['General_Sans',sans-serif]">
                                    Amount (USD)
                                </label>
                                <input
                                    type="number"
                                    value={fiatAmount}
                                    onChange={(e) => setFiatAmount(parseFloat(e.target.value) || 0)}
                                    min="10"
                                    max="10000"
                                    step="10"
                                    className="w-full px-4 py-3 bg-[#393E4B] border border-[#393E4B] rounded-xl text-white placeholder-[#B0B6BE] focus:outline-none focus:ring-2 focus:ring-[#9BE4A0] focus:border-[#9BE4A0] transition-all font-['General_Sans',sans-serif]"
                                    placeholder="Enter amount"
                                />
                                <div className="text-xs text-[#B0B6BE] mt-2 font-['General_Sans',sans-serif]">
                                    Min: $10, Max: $10,000
                                </div>
                            </div>

                            {/* Wallet Address Display */}
                            {getWalletAddress() && (
                                <div className="p-4 bg-[#393E4B] rounded-xl border border-[#393E4B]">
                                    <div className="text-sm text-white mb-2 font-['General_Sans',sans-serif]">
                                        Receiving Address:
                                    </div>
                                    <div className="text-sm text-[#B0B6BE] font-mono break-all font-['General_Sans',sans-serif]">
                                        {getWalletAddress()}
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <ButtonGreen
                                onClick={handleOpenTransak}
                                disabled={!getWalletAddress() || fiatAmount < 10}
                                fullWidth
                                icon={<CreditCard className="w-4 h-4" />}
                                textSize="text-sm"
                            >
                                {TRANSAK_CONFIG.environment === "STAGING" ? "Open Test Widget" : "Buy Now"}
                            </ButtonGreen>
                        </div>

                        {/* Footer - Fixed at bottom */}
                        <div className="flex-shrink-0 p-6 border-t border-[#393E4B] bg-[#393E4B]/30">
                            <div className="text-xs text-[#B0B6BE] text-center font-['General_Sans',sans-serif]">
                                {TRANSAK_CONFIG.environment === "STAGING" && (
                                    <div className="text-[#9BE4A0] font-semibold mb-2">
                                        🧪 STAGING MODE - No real money will be charged
                                    </div>
                                )}
                                Powered by Transak. Secure fiat-to-crypto gateway.
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </>
        </AnimatePresence>,
        document.body
    );
};

export default TransakModal;
