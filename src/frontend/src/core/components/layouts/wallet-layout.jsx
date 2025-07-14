import React from "react";
import { Outlet } from "react-router-dom";
import WalletSidebar from "../WalletSidebarKiri";
import WalletSidebarKanan from "../WalletSidebarKanan";

export default function WalletLayout() {
  return (
    <div className="flex min-h-screen bg-[#0F1219]">
      <WalletSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
      <WalletSidebarKanan />
    </div>
  );
}
