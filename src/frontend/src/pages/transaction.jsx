import React from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";

const tokens = [
    {
        icon: "/assets/bitcoin.svg",
        name: "BTC",
        desc: "Bitcoin • Internet Computer • Base",
        amount: 0,
        value: "$0.00",
    },
    {
        icon: "/assets/eth.svg",
        name: "BTC",
        desc: "Bitcoin • Internet Computer • Base",
        amount: 0,
        value: "$0.00",
    },
];

export default function TransactionPage() {
    return (
        <WalletLayout>
            <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
                {/* Card Wallet pakai gambar utuh */}
                <div className="relative flex justify-center items-center">
                    <img
                        src="/assets/images/card-wallet.png"
                        alt="Wallet Card"
                        className="block w-full h-auto select-none pointer-events-none"
                        draggable="false"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="mb-2">
                            <span className="text-4xl font-bold text-white">$404.18</span>
                        </div>
                        <div className="mb-6">
                            <span className="text-green-400 font-medium text-lg">+12.44%</span>
                        </div>
                        <div className="flex gap-6">
                            <button className="px-8 py-3 rounded-full bg-[#23282F] text-[#9BEB83] font-semibold text-lg flex items-center gap-2 hover:bg-[#2d343c] transition">
                                Receive
                            </button>
                            <button className="px-8 py-3 rounded-full bg-[#23282F] text-[#9BEB83] font-semibold text-lg flex items-center gap-2 hover:bg-[#2d343c] transition">
                                Send
                            </button>
                        </div>
                    </div>
                </div>
                {/* Token List */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Tokens</h2>
                    <div className="flex flex-col gap-2">
                        {tokens.map((token, idx) => (
                            <div key={idx} className="flex items-center bg-[#181C22] rounded-xl px-6 py-4 gap-4 shadow border border-[#23272F]">
                                <img src={token.icon} alt={token.name} className="w-10 h-10" />
                                <div className="flex-1">
                                    <div className="text-white font-semibold text-base">{token.name}</div>
                                    <div className="text-[#B0B6BE] text-sm">{token.desc}</div>
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