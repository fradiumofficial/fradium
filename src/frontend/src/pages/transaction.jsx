import React from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";
import NeoButton from "../core/components/SidebarButton";

const tokens = [
    {
        icon: "/assets/bitcoin.svg",
        name: "BTC",
        symbol: "Bitcoin",
        desc: "Bitcoin • Internet Computer",
        amount: 0,
        value: "$0.00",
    },
    {
        icon: "/assets/eth.svg",
        name: "ETH",
        symbol: "Ethereum",
        desc: "Ethereum • Internet Computer • Base",
        amount: 0,
        value: "$0.00",
    },
    {
        icon: "/assets/fum.svg",
        name: "FUM",
        symbol: "Fradium",
        desc: "Ethereum • Internet Computer • Base",
        amount: 0,
        value: "$0.00",
    },
];

export default function TransactionPage() {
    return (
        <WalletLayout>
            <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
                {/* Card Wallet pakai gambar utuh */}
                <div className="relative items-center w-full mx-auto">
                    <img
                        src="/assets/cek-card-wallet.png"
                        alt="Wallet Card"
                        className="block w-full max-w-full h-auto select-none pointer-events-none"
                        draggable="false"
                    />
                    {/* Overlay Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-20 pb-8">
                        <div className="text-white text-xs md:text-xs font-normal mb-1">Total Portofolio Value</div>
                        <div className="text-white text-4xl md:text-4xl font-semibold mb-1">$0.00</div>
                        <div className="text-green-400 text-sm font-medium mb-6 text-center">Top up your wallet to start using it!</div>
                        <div className="flex gap-8 w-full max-w-lg justify-center">
                            {/* Receive */}
                            <div className="flex flex-col flex-1">
                                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                                    <div className="absolute top-4 right-4">
                                        <NeoButton
                                            icon={
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="2" y="2" width="11" height="11" fill="#0E1117" />
                                                </svg>
                                            }
                                            className="!w-10 !h-10 p-0 flex items-center justify-center"
                                        />
                                    </div>
                                    <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Receive</div>
                                </div>
                            </div>
                            {/* Send */}
                            <div className="flex flex-col flex-1">
                                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                                    <div className="absolute top-4 right-4">
                                        <NeoButton
                                            icon={
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <mask id="mask-send" maskUnits="userSpaceOnUse" x="0" y="0" width="15" height="15">
                                                        <rect x="0" y="0" width="15" height="15" fill="#fff" />
                                                    </mask>
                                                    <g mask="url(#mask-send)">
                                                        <path d="M12 3V10H10.8V5.8L3.5 13.1L2.9 12.5L10.2 5.2H5V3H12Z" fill="#0E1117" />
                                                    </g>
                                                </svg>
                                            }
                                            className="!w-10 !h-10 p-0 flex items-center justify-center"
                                        />
                                    </div>
                                    <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Send</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Token List */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Tokens</h2>
                        <div className="flex gap-4">
                            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
                            <img src="/assets/icons/page_info.svg" alt="Setting" className="w-5 h-5 cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex flex-col divide-y divide-[#23272F]">
                        {tokens.map((token, idx) => (
                            <div key={idx} className="flex items-center px-2 py-4 gap-4">
                                <img src={token.icon} alt={token.name} className="w-10 h-10" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold text-base">{token.name}</span>
                                        {token.symbol && <span className="text-[#B0B6BE] text-base">• {token.symbol}</span>}
                                        {token.fullname && <span className="text-[#B0B6BE] text-base">• {token.fullname}</span>}
                                    </div>
                                    <div className="text-[#B0B6BE] text-sm truncate">{token.desc}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-white font-semibold text-base">{token.amount}</span>
                                    <span className="text-[#B0B6BE] text-sm">{token.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </WalletLayout>
    );
} 