import React from "react";
import WalletSidebar from "../WalletSidebar";

export default function WalletLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-[#0C0D14]">
            <WalletSidebar />
            <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
    );
} 