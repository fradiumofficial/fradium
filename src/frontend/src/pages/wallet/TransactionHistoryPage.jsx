import React, { useState } from "react";
import { TOKENS_CONFIG } from "@/core/lib/tokenUtils";

function getIconByChain(chain) {
  const token = TOKENS_CONFIG.find((t) => t.chain.toLowerCase() === chain.toLowerCase());
  return token ? `/${token.imageUrl}` : "/assets/images/coins/bitcoin.webp";
}

export default function TransactionHistoryPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) setSearchQuery("");
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Demo data; ganti dengan data asli nanti. Jika array kosong, empty state akan tampil.
  const transactions = [
    { chain: "Bitcoin", title: "Transfer to 1Egfhhasdxbbsd..", amount: -892.48, status: "Completed" },
    { chain: "Ethereum", title: "Received from 1Egfhhasdxbbsd..", amount: 892.48, status: "Completed" },
    { chain: "Fradium", title: "Received from 1Egfhhasdxbbsd..", amount: 892.48, status: "Pending" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full md:p-0 p-2">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-white md:text-2xl text-lg font-semibold">Transaction History</h1>
        <p className="text-[#B0B6BE] md:text-base text-sm font-normal">Track every move, stay in control. Your complete transaction timeline with real-time updates and intelligent status detection.</p>
      </div>

      {/* Transaction List Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-white md:text-lg text-base font-semibold">List of transactions</h2>
          <div className="flex gap-4">
            <img
              src="/assets/icons/search.svg"
              alt="Search"
              className="md:w-5 md:h-5 w-4 h-4 opacity-70 cursor-pointer hover:opacity-100"
              onClick={handleSearchToggle}
            />
            <img
              src="/assets/icons/page_info.svg"
              alt="Filter"
              className="md:w-5 md:h-5 w-4 h-4 opacity-70 cursor-pointer hover:opacity-100"
              onClick={() => console.log("filter clicked")}
            />
          </div>
        </div>

        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-[#23272F] border border-[#393E4B] rounded-lg px-4 py-2 text-white text-sm placeholder-[#B0B6BE] outline-none focus:border-[#9BE4A0] transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0B6BE] hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
        {transactions.length === 0 ? (
          /* Empty State - jangan dihapus */
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#B0B6BE]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B0B6BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">No transactions yet</p>
                <p className="text-[#B0B6BE] text-sm mt-1">Start sending or receiving crypto to see your activity here</p>
              </div>
            </div>
          </div>
        ) : (
          /* List items */
          <div className="flex flex-col">
            {transactions.map((tx, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between px-3 sm:px-4 py-4 sm:py-5 rounded-xl transition-colors group-hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <img src={getIconByChain(tx.chain)} alt={tx.chain} className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col">
                      <div className="text-white text-base font-medium leading-tight max-w-[360px] truncate">{tx.title}</div>
                      <div className="text-white/60 text-sm">{tx.chain}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-base font-semibold ${tx.amount < 0 ? "text-[#F1999B]" : "text-[#9BE4A0]"}`}>
                      {tx.amount < 0 ? "- " : "+ "}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${tx.status === "Completed" ? "bg-[#1C2A22] text-[#9BE4A0]" : "bg-[#2A2A2A] text-white/80"}`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
                {idx !== transactions.length - 1 && <div className="h-px bg-white/10 mx-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
