import React from "react";

const scanActivities = [
  {
    id: 1,
    address: "m1psqxsfsnfndf...",
    type: "Ransomeware - AI",
    coin: "Bitcoin",
    icon: "/assets/bitcoin.svg",
    date: "24/04/35",
  },
  {
    id: 2,
    address: "m1psqxsfsnfndf...",
    type: "Phising - Community",
    coin: "Ethereum",
    icon: "/assets/eth.svg",
    date: "24/04/35",
  },
  {
    id: 3,
    address: "m1psqxsfsnfndf...",
    type: "Phising - Community",
    coin: "Bitcoin",
    icon: "/assets/bitcoin.svg",
    date: "24/04/35",
  },
  {
    id: 4,
    address: "m1psqxsfsnfndf...",
    type: "Ransomeware - AI",
    coin: "Ethereum",
    icon: "/assets/eth.svg",
    date: "24/04/35",
  },
];

export default function ScanHistoryPage() {
  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-white text-2xl font-semibold">Scan History</h1>
        <p className="text-[#B0B6BE] text-base font-normal">Lorem ipsum dolor sit amet lorem ipsum dolor sit amet</p>
      </div>

      {/* Scan Activity List Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">List of scan activity</h2>
          <div className="flex gap-4">
            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
            <img src="/assets/icons/page_info.svg" alt="Sort" className="w-5 h-5 cursor-pointer" />
          </div>
        </div>

        {/* Scan Activities */}
        <div className="flex flex-col">
          {scanActivities.map((activity, index) => (
            <div key={activity.id}>
              <div className="flex items-center justify-between py-4">
                {/* Left Side - Icon and Details */}
                <div className="flex items-center gap-4">
                  <img src={activity.icon} alt={activity.coin} className="w-12 h-12" />
                  <div className="flex flex-col">
                    <span className="text-white text-base font-medium">{activity.address}</span>
                    <span className="text-[#B0B6BE] text-sm font-medium">{activity.type}</span>
                  </div>
                </div>

                {/* Right Side - Date */}
                <div className="flex flex-col items-end">
                  <span className="text-[#B0B6BE] text-base font-medium">{activity.date}</span>
                </div>
              </div>
              {/* Divider */}
              {index < scanActivities.length - 1 && <div className="border-b border-[#23272F]"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
