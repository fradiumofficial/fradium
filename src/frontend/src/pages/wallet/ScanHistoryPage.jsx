import React from "react";

export default function ScanHistoryPage() {
  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219] md:p-0 p-2">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-white md:text-2xl text-lg font-semibold">Scan History</h1>
        <p className="text-[#B0B6BE] md:text-base text-sm font-normal">Your complete address analysis history with community reports and AI-powered security scans.</p>
      </div>

      {/* Scan Activity List Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-white md:text-lg text-base font-semibold">List of scan activity</h2>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">No scan history yet</p>
              <p className="text-[#B0B6BE] text-sm mt-1">Start analyzing addresses to see your security scan records here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
