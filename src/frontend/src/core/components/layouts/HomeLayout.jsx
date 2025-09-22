import React from "react";
import Navbar from "@/core/components/Navbar";
import { Outlet } from "react-router";
import { WalletProvider } from "@/core/providers/WalletProvider";

const HomeLayout = () => {
  const [hideNavbar, setHideNavbar] = React.useState(false);

  React.useEffect(() => {
    const handler = (e) => {
      try {
        const open = e?.detail?.open === true;
        setHideNavbar(open);
      } catch (_e) {}
    };
    window.addEventListener("image-modal-toggle", handler);
    return () => window.removeEventListener("image-modal-toggle", handler);
  }, []);

  return (
    <WalletProvider>
      {!hideNavbar && <Navbar />}
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </WalletProvider>
  );
};

export default HomeLayout;
