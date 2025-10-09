import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function NetworkDropdown({ isOpen, setIsOpen, network, getNetworkValue, getAvailableNetworks, handleNetworkChange }) {
  React.useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest(".network-dropdown")) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [setIsOpen]);

  return (
    <div className="relative network-dropdown">
      <button onClick={() => setIsOpen(!isOpen)} className="relative flex items-center gap-3 h-12 px-5 rounded-full text-white font-medium bg-white/5 text-base hover:opacity-95 transition-colors border border-white/10">
        <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
        <span className="text-white pr-2 capitalize">{network}</span>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-3 w-[300px] rounded-2xl border border-white/10 z-[9999] overflow-hidden"
            style={{
              right: "0px",
              background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(10px)",
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            <div className="py-2">
              <button onClick={() => handleNetworkChange("All Networks")} className="w-full text-base">
                <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === "All Networks" ? "bg-white/8" : "hover:bg-white/5"}`}>
                  <div className="flex items-center gap-3">
                    {network === "All Networks" ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <span className="text-white">All Networks</span>
                  </div>
                  <span className="text-[#9CA3AF]">{getNetworkValue("All Networks")}</span>
                </div>
              </button>

              <div className="h-px bg-white/10 mx-4 my-1" />

              {getAvailableNetworks().map((net, index) => (
                <div key={net.key}>
                  <button onClick={() => handleNetworkChange(net.name)} className="w-full text-base">
                    <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === net.name ? "bg-white/8" : "hover:bg-white/5"}`}>
                      <div className="flex items-center gap-3">
                        {network === net.name ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                            <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className="text-white text-left">{net.name}</span>
                      </div>
                      <span className="text-[#9CA3AF]">{net.value}</span>
                    </div>
                  </button>
                  {index < getAvailableNetworks().length - 1 && <div className="h-px bg-white/10 mx-4" />}
                </div>
              ))}

              <div className="h-px bg-white/10 mx-4 my-2" />

              <button
                className="w-full flex items-center gap-3 px-6 py-3 text-[#9BEB83] hover:bg-white/5 transition-colors"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("openManageNetworks"));
                }}>
                <img src="/assets/icons/construction.svg" alt="Manage Networks" className="w-5 h-5" />
                <span className="font-medium">Manage Networks</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
