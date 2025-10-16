import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ButtonGreen from "./ButtonGreen.jsx";

const FirstTimeModal = ({ onClose, onSkip, onScrollToProducts }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Delay untuk animasi masuk yang smooth
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleSkip = () => {
        setIsVisible(false);
        setTimeout(() => {
            onSkip();
        }, 300);
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const [isButtonLoading, setIsButtonLoading] = useState(false);

    const handleSeeHowItWorks = () => {
        setIsButtonLoading(true);
        setIsVisible(false);

        // Delay untuk memberikan efek loading yang terlihat
        setTimeout(() => {
            onScrollToProducts();
        }, 500);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: isButtonLoading ? 0.6 : 0.3 }
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{
                        opacity: isVisible ? 1 : 0,
                        scale: isVisible ? 1 : 0.9,
                        y: isVisible ? 0 : 20
                    }}
                    exit={{
                        opacity: 0,
                        scale: isButtonLoading ? 1.05 : 0.9,
                        y: isButtonLoading ? -10 : 20,
                        transition: { duration: 0.4, ease: "easeOut" }
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative w-full max-w-lg mx-auto bg-[#171A1C] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-6 pb-4">
                        <h2 className="text-lg font-normal text-white">
                            What's New in Fradium?
                        </h2>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="px-2 pb-6">
                        {/* Image */}
                        <div className="relative mb-6">
                            <img
                                src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/modal-enter.webp"
                                alt="Fradium Escrow and Paylink"
                                className="w-full h-auto rounded-lg"
                                draggable={false}
                            />
                        </div>

                        {/* Text Content - Center Aligned */}
                        <div className="mb-8 text-center">
                            <h3 className="text-lg font-semibold text-white mb-3">
                                Introducing Fradium Escrow and Paylink
                            </h3>
                            <p className="text-sm text-white/80 leading-relaxed max-w-md mx-auto">
                                Fradium Escrow secures your transfers by verifying recipient safety, while Fradium Paylink enables instant, address-free payments through secure links. All backed by Fradium's protection layer.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex px-2 gap-4">
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-6 py-1.5 rounded-full bg-[#232527] border border-gray-500/50 text-white text-sm font-medium hover:bg-gray-700/70 transition-colors"
                            >
                                Skip this
                            </button>
                            <div className="flex-1">
                                <ButtonGreen
                                    size="sm"
                                    fullWidth
                                    loading={isButtonLoading}
                                    onClick={handleSeeHowItWorks}
                                >
                                    {isButtonLoading ? "Loading..." : "See how it works"}
                                </ButtonGreen>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FirstTimeModal;
