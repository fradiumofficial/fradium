import React from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";

const transactions = [
    {
        id: 1,
        type: "transfer",
        title: "Transfer to 1Egfhhasdxbbsdsd..",
        coin: "Bitcoin",
        icon: "/assets/bitcoin.svg",
        amount: -892.48,
        status: "Completed"
    },
    {
        id: 2,
        type: "received",
        title: "Received from 1Egfhhasdxbbsdsd..",
        coin: "Ethereum",
        icon: "/assets/eth.svg",
        amount: 892.48,
        status: "Completed"
    },
    {
        id: 3,
        type: "received",
        title: "Received from 1Egfhhasdxbbsdsd..",
        coin: "Fradium",
        icon: "/assets/fum.svg",
        amount: 892.48,
        status: "Pending"
    }
];

export default function TransactionHistoryPage() {
    return (
        <WalletLayout>
            <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-white text-2xl font-semibold">Transaction History</h1>
                    <p className="text-[#B0B6BE] text-base font-normal">
                        Lorem ipsum dolor sit amet lorem ipsum dolor sit amet
                    </p>
                </div>

                {/* Transaction List Section */}
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-white text-lg font-semibold">List of transaction</h2>
                        <div className="flex gap-4">
                            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
                            <img src="/assets/icons/page_info.svg" alt="Sort" className="w-5 h-5 cursor-pointer" />
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="flex flex-col">
                        {transactions.map((transaction, index) => (
                            <div key={transaction.id}>
                                <div className="flex items-center justify-between py-4">
                                    {/* Left Side - Icon and Details */}
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={transaction.icon}
                                            alt={transaction.coin}
                                            className="w-12 h-12"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-white text-base font-medium">
                                                {transaction.title}
                                            </span>
                                            <span className="text-[#B0B6BE] text-sm font-medium">
                                                {transaction.coin}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Side - Amount and Status */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-base font-medium ${transaction.amount > 0 ? 'text-[#9BE4A0]' : 'text-[#E49B9C]'
                                            }`}>
                                            {transaction.amount > 0 ? '+' : '-'} ${Math.abs(transaction.amount).toFixed(2)}
                                        </span>
                                        <div className={`px-3 py-1 rounded-xl text-sm font-medium ${transaction.status === 'Completed'
                                            ? 'text-[#9BE4A0] bg-[#9BE4A0] bg-opacity-20'
                                            : 'text-white bg-white bg-opacity-20'
                                            }`}>
                                            {transaction.status}
                                        </div>
                                    </div>
                                </div>
                                {/* Divider */}
                                {index < transactions.length - 1 && (
                                    <div className="border-b border-[#23272F]"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </WalletLayout>
    );
} 