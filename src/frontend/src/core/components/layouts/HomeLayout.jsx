import React from "react";
import Navbar from "@/core/components/Navbar";
import { Outlet } from "react-router";
import { WalletProvider } from "@/core/providers/WalletProvider";

const HomeLayout = () => {
  return (
    <WalletProvider>
      <Navbar />
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </WalletProvider>
  );
};

export default HomeLayout;
