import React from "react";

export default function TransactionHistoryPage() {
  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219] md:p-0 p-2">
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
            <img src="/assets/icons/search.svg" alt="Search" className="md:w-5 md:h-5 w-4 h-4 opacity-70" />
            <img src="/assets/icons/page_info.svg" alt="Filter" className="md:w-5 md:h-5 w-4 h-4 opacity-70" />
          </div>
        </div>

        {/* Empty State - Static */}
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
      </div>
    </div>
  );
}
