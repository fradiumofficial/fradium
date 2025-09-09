import React from "react";
import { motion } from "framer-motion";
import { TOKENS_CONFIG } from "@/core/lib/tokenUtils";

function getIconByChain(chain) {
  const token = TOKENS_CONFIG.find((t) => t.chain.toLowerCase() === chain.toLowerCase());
  return token ? `/${token.imageUrl}` : "/assets/images/coins/bitcoin.webp";
}

export default function ScanHistoryPage() {
  const items = [
    { chain: "Bitcoin", address: "m1psqxsf...f", label: "Ransomware - AI", date: "24/04/35" },
    { chain: "Ethereum", address: "0x9a23...d1", label: "Phising - Community", date: "24/04/35" },
    { chain: "Bitcoin", address: "bc1q8...3k", label: "Phising - Community", date: "24/04/35" },
    { chain: "Ethereum", address: "0x7fe2...ab", label: "Ransomware - AI", date: "24/04/35" },
  ];

  return (
    <motion.div
      className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header Section */}
      <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
        <h1 className="text-white text-2xl font-semibold">Scan History</h1>
        <p className="text-white/60 text-sm">List of previously scanned addresses and smart contracts</p>
      </motion.div>

      {/* Scan Activity List Section */}
      <div className="w-full">
        <motion.div className="mb-4 flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}>
          <h2 className="text-white text-base font-semibold">List of scan activity</h2>
          <div className="flex gap-4">
            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
            <img src="/assets/icons/page_info.svg" alt="Filter" className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
        </motion.div>

        {/* List - no borders, larger items */}
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              className="group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 + idx * 0.06 }}
            >
              <div className="flex items-center justify-between px-6 py-5 rounded-xl transition-colors group-hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <img src={getIconByChain(item.chain)} alt={item.chain} className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col">
                    <div className="text-white text-base font-medium leading-tight max-w-[300px] truncate">{item.address}</div>
                    <div className="text-white/70 text-sm">{item.label}</div>
                  </div>
                </div>
                <div className="text-white/70 text-sm">{item.date}</div>
              </div>
              {idx !== items.length - 1 && <div className="h-px bg-white/10 mx-6 transition-colors group-hover:bg-white/15" />}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
