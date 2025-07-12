import React from "react";
import WalletSidebar from "../WalletSidebarKiri";
import WalletSidebarKanan from "../WalletSidebarKanan";

export default function WalletLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-[#0F1219]">
            <WalletSidebar />
            <main className="flex-1 p-8 overflow-auto">{children}</main>
            <WalletSidebarKanan />
        </div>
    );
} 