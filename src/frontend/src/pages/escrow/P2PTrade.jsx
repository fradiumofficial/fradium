// React
import React from "react";

// Framer Motion
import { motion } from "framer-motion";

export default function P2PTrade() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">P2P Payment</h1>
        <p className="text-gray-400">Peer-to-peer payment dengan proteksi escrow</p>
      </div>

      {/* Content Area - Blank untuk sekarang */}
      <div className="bg-[#181C22] rounded-lg border border-[#23272F] p-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">💳</div>
          <h3 className="text-white text-lg font-medium mb-2">P2P Payment</h3>
          <p className="text-gray-400">Fitur P2P payment akan ditambahkan di sini</p>
        </div>
      </div>
    </motion.div>
  );
}
