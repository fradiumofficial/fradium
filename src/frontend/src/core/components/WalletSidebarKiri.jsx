import React from "react";
import SidebarButton from "./SidebarButton";

const menu = [
    { label: "Transactions", icon: "/assets/icons/wallet.svg", active: true },
    { label: "Analyse Address", icon: "/assets/icons/analyze_address.svg" },
    { label: "Analyse Contract", icon: "/assets/icons/analyze_contract.svg" },
    { label: "Transaction History", icon: "/assets/icons/transaction-history.svg" },
    { label: "Scan History", icon: "/assets/icons/history.svg" },
    { label: "Setting", icon: "/assets/icons/setting-wallet.svg" },
    { label: "Logout", icon: "/assets/icons/logout.svg" },
];

export default function WalletSidebar() {
    return (
        <aside className="h-screen w-300 bg-[#0F1219] flex flex-col justify-between py-8 px-6 border-r border-[#23272F]">
            {/* Logo dan Brand */}
            <div>
                <div className="flex items-center gap-3 mb-12">
                    <img src="/logo.svg" alt="Fradium Logo" />
                </div>
                {/* Menu */}
                <nav className="flex flex-col gap-1">
                    {menu.map((item, idx) => (
                        item.active ? (
                            <SidebarButton
                                key={item.label}
                                icon={item.icon}
                                className={idx === 0 ? "mt-0" : "mt-1"}
                            >
                                {item.label}
                            </SidebarButton>
                        ) : (
                            <button
                                key={item.label}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-all relative
                                    text-white hover:bg-[#181C22] hover:text-[#9BEB83]
                                    ${idx === 0 ? "mt-0" : "mt-1"}
                                `}
                            >
                                <img src={item.icon} alt={item.label} className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        )
                    ))}
                </nav>
            </div>
            {/* Bottom icons */}
            <div className="flex gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded bg-[#181C22] hover:bg-[#23282f]">
                    <img src="/assets/GithubLogo.svg" alt="Github" className="w-6 h-6" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded bg-[#181C22] hover:bg-[#23282f]">
                    <img src="/assets/XLogo.svg" alt="X" className="w-6 h-6" />
                </button>
            </div>
        </aside>
    );
} 