import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ButtonGreen from "../ButtonGreen";
import { NETWORK_CONFIG } from "@/core/lib/tokenUtils";
import toast from "react-hot-toast";

export default function ManageNetworksModal({ isOpen, onClose, networkFilters, updateNetworkFilters, currentNetwork, setNetwork }) {
  const [tempNetworkFilters, setTempNetworkFilters] = useState({});

  // Initialize temp state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempNetworkFilters({ ...networkFilters });
    }
  }, [isOpen, networkFilters]);

  const handleToggleNetwork = (networkName) => {
    setTempNetworkFilters((prev) => ({
      ...prev,
      [networkName]: !prev[networkName],
    }));
  };

  const handleSave = () => {
    // Update the actual network filters
    updateNetworkFilters(tempNetworkFilters);

    // Check if current selected network is disabled, if so switch to "All Networks"
    if (currentNetwork !== "All Networks") {
      const currentNetworkName = currentNetwork.toLowerCase();
      const network = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === currentNetworkName);

      if (network && !tempNetworkFilters[network.name]) {
        setNetwork("All Networks");
      }
    }

    onClose();
    toast.success("Network settings saved successfully!", {
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
      icon: "✅",
    });
  };

  const handleCancel = () => {
    // Reset temp state to original
    setTempNetworkFilters({ ...networkFilters });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 pl-4 pr-4 bg-black/60 backdrop-blur-sm" onClick={handleCancel}>
          <div className="w-full max-w-[500px] mx-auto" onClick={(e) => e.stopPropagation()}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col items-center p-4 gap-4 h-auto bg-[#171A1C] rounded-2xl border border-white/10">
              {/* Title */}
              <div className="w-full text-center text-white text-lg font-medium">Active Networks</div>

              {/* Card content */}
              <div className="mx-2 sm:mx-3 w-full mb-2 rounded-xl bg-[#FFFFFF08] border-white/10 p-6">
                <div className="divide-y divide-white/10">
                  {NETWORK_CONFIG.map((network) => (
                    <motion.div key={network.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <img src={network.icon} alt={network.name} className="w-7 h-7" />
                        <span className="text-white text-lg font-medium">{network.name}</span>
                      </div>
                      {/* Custom Switch */}
                      <button className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 ${tempNetworkFilters[network.name] ? "bg-[#9BE4A0]" : "bg-[#23272F]"}`} onClick={() => handleToggleNetwork(network.name)}>
                        <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${tempNetworkFilters[network.name] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="w-full px-2 sm:px-3 pb-2">
                <ButtonGreen onClick={handleSave} fullWidth fontWeight="medium">
                  Save
                </ButtonGreen>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
