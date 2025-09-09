import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

export default function SuccesSendModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pt-16 pl-4 pr-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[370px] mx-auto">
                <div className="flex flex-col items-center p-4 gap-4 h-auto bg-[#171A1C] rounded-2xl border border-white/10">
                    {/* Title */}
                    <div className="w-full text-center text-white text-lg font-medium">Send Coin</div>

                    {/* Card content */}
                    <div className="mx-2 sm:mx-3 w-full mb-2 rounded-xl bg-[#FFFFFF08]  border-white/10 p-6 flex flex-col items-center text-center">
                        {/* Centered floating image (no circular animation) */}
                        <div className="relative w-full flex items-center justify-center mb-4" style={{ minHeight: 160 }}>
                            <motion.img
                                src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/analyze-address/send.webp"
                                alt="Success Send"
                                className="w-32 h-32 object-contain"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                                draggable={false}
                            />
                        </div>

                        <div className="text-[#9BE4A0] text-lg font-extrabold tracking-wide mb-1">SUCCESS SEND!</div>
                        <div className="text-white/60 text-xs">YOUR TRANSACTION WAS SUCCESSFULL!</div>
                    </div>

                    {/* CTA */}
                    <div className="w-full px-2 sm:px-3 pb-2">
                        <ButtonGreen fullWidth fontWeight="medium" onClick={onClose}>
                            Done
                        </ButtonGreen>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}


