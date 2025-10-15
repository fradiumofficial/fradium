import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/WalletProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { LoadingState } from "@/core/components/ui/LoadingState";
import { BarChart3, History, Key, BookOpen, Coins } from "lucide-react";
import Container from "@/core/components/ui/Container.jsx";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { formatAmount } from "@/core/lib/tokenUtils";
import ProfileDropdown from "@/core/components/common/ProfileDropdown.jsx";

import WelcomingWalletModal from "../modals/WelcomingWallet";
import { SocialLinksSidebar } from "@/core/components/common/SocialLinks.jsx";

// Removed MotionLink as framer-motion is not needed here

function APILayoutContent() {
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const { logout, user, identity } = useAuth();
  const navigate = useNavigate();
  const { isLoading, isCreatingWallet, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, addresses, balances, usdPrices } = useWallet();
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);

  // Helper function to normalize path (same as WalletLayout)
  const normalize = (path) => {
    return path.replace(/\/+$/, "");
  };

  // Helper: map sidebar label to Lucide React icon component
  const getSidebarIcon = (label) => {
    const iconMap = {
      Overview: BarChart3,
      "Analyze History": History,
      "Access Token": Key,
      "API Credits": Coins,
      Docs: BookOpen,
    };
    return iconMap[label] || BarChart3;
  };

  // Handle hide balance toggle
  const handleToggleHideBalance = () => {
    const newHideBalance = !contextHideBalance;
    setContextHideBalance(newHideBalance);

    // Save to localStorage
    try {
      localStorage.setItem("hideBalance", JSON.stringify(newHideBalance));
    } catch (error) {
      console.error("Error saving hide balance setting:", error);
    }
  };

  // Load hide balance setting from localStorage
  const loadHideBalance = () => {
    try {
      const saved = localStorage.getItem("hideBalance");
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error("Error loading hide balance:", error);
      return false;
    }
  };

  // ProfileDropdown handles outside-click internally

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingState type="spinner" size="lg" color="primary" />
          <div className="text-slate-900 text-lg">Loading API dashboard...</div>
        </div>
      </div>
    );
  }

  // Menu configuration for API
  const menu = [
    { label: "Overview", icon: "overview", path: "/developer" },
    { label: "Analyze History", icon: "analyze-history", path: "/developer/analyze-history" },
    { label: "Access Token", icon: "access-token", path: "/developer/access-token" },
    { label: "API Credits", icon: "api-credits", path: "/developer/api-credits" },
    { label: "Docs", icon: "api-documentation", path: "/developer/api-documentation" },
  ];

  // Load hide balance setting from localStorage on component mount and user change
  React.useEffect(() => {
    const loadSavedHideBalance = () => {
      try {
        setContextHideBalance(loadHideBalance());
        setHasLoadedHideBalance(true);
      } catch (error) {
        console.error("Error loading hide balance:", error);
        setHasLoadedHideBalance(true);
      }
    };

    if (!hasLoadedHideBalance) {
      if (user?.identity?.getPrincipal()) {
        loadSavedHideBalance();
      } else {
        loadSavedHideBalance();
      }
    }
  }, [user?.identity?.getPrincipal()?.toString(), hasLoadedHideBalance]);

  // Listen for localStorage changes from other components
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "hideBalance") {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : false;
          setContextHideBalance(newValue);
        } catch (error) {
          console.error("Error parsing hide balance from storage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <>
      <WelcomingWalletModal isOpen={isCreatingWallet} />

      <div className="relative block md:flex min-h-screen bg-transparent w-full max-w-full">
        {/* Fixed background layers */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none bg-white">
          <img
            src="/assets/background-2.png"
            alt="bg-2"
            className="absolute inset-x-0 bottom-0 w-full h-full object-cover opacity-30"
            style={{
              maskImage: "linear-gradient(to top, black 70%, transparent)",
              WebkitMaskImage: "linear-gradient(to top, black 70%, transparent)",
            }}
          />
        </div>

        {/* Fixed blur overlays */}
        <div className="fixed inset-x-0 top-0 h-20 sm:h-24 md:h-28 z-[5] pointer-events-none">
          <div className="h-full bg-gradient-to-b from-white/90 via-white/60 to-transparent backdrop-blur-sm md:backdrop-blur-md" />
        </div>

        <div className="fixed inset-x-0 bottom-0 h-10 z-[5] pointer-events-none">
          <div className="h-full bg-gradient-to-t from-white/90 via-white/60 to-transparent backdrop-blur-sm md:backdrop-blur-md" />
        </div>

        {/* Removed ManageNetworksModal - networks not used in API layout */}

        {/* Topbar khusus mobile */}
        <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b border-slate-200">
          {/* Logo Fradium kiri */}
          <Link to="/">
            <img src="/assets/logo/fradium-developer-light.svg" alt="Fradium Logo" className="w-10 h-10" />
          </Link>
          {/* User dropdown kanan menggunakan ProfileDropdown */}
          <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={false} logout={logout} color="#000000" background="light" showHideBalance={false} />
        </div>

        {/* ===== START: SIDEBAR KIRI (Desktop) ===== */}
        <aside className="fixed left-0 top-0 z-20 w-[200px] lg:w-[240px] xl:w-[320px] bg-white/20 backdrop-blur-md flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-slate-200 hidden md:flex h-screen">
          {/* Logo dan Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <Link to="/">
                <img src="/assets/logo/fradium-developer-light.svg" alt="Fradium Logo" />
              </Link>
            </div>
            {/* Menu */}
            <nav className="flex flex-col gap-2">
              {menu.map((item, idx) => {
                const isActive = normalize(location.pathname) === normalize(item.path);
                const IconComponent = getSidebarIcon(item.label, isActive);
                return isActive ? (
                  <Link key={item.label} to={item.path} className="relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all">
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/10 via-black/5 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-black shadow-[0_0_12px_rgba(0,0,0,0.35)]" />
                    <IconComponent className="w-5 h-5 relative z-10 text-black" />
                    <span className="relative z-10 text-slate-900 font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <Link key={item.label} to={item.path} className="flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all hover:bg-white/10 rounded-lg">
                    <IconComponent className="w-5 h-5 text-slate-700" />
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Bottom icons - fixed at bottom */}
          <SocialLinksSidebar color="#000000" />
        </aside>
        {/* ===== END: SIDEBAR KIRI ===== */}

        {/* ===== START: MAIN CONTENT ===== */}
        <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 overflow-visible pb-28 md:pb-8 pt-20 md:pt-7 flex flex-col md:pl-[15%] lg:pl-[16%] xl:pl-[18%] xl:pr-[20%]">
          {/* Topbar User for md screens - placed above Outlet to avoid content shrink */}
          <div className="hidden md:flex xl:hidden w-full items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {/* FRADIUM balance pill */}
              {(() => {
                const fradiumToken = TOKENS_CONFIG.find((t) => t.symbol === "FRADIUM");
                const fradiumId = fradiumToken?.id;
                if (!fradiumId) return null;
                const bal = parseFloat(balances?.[fradiumId] || 0);
                const price = parseFloat(usdPrices?.[fradiumId] || 0);
                const balanceText = contextHideBalance ? "••••" : formatAmount(bal);
                const usdText = contextHideBalance ? "" : ` · $${(bal * price).toFixed(2)}`;
                return (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <img src="/assets/images/coins/fradium.webp" alt="FRADIUM" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">FRADIUM:</span>
                    <span className="text-sm font-medium text-slate-900">{balanceText}</span>
                    <span className="text-xs text-slate-500">{usdText}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={false} logout={logout} color="#000000" background="light" showHideBalance={false} />
            </div>
          </div>
          <Container>
            <Outlet />
          </Container>
        </main>
        {/* ===== END: MAIN CONTENT ===== */}

        {/* ===== START: SIDEBAR KANAN (Desktop) ===== */}
        <aside className="fixed right-0 top-0 z-20 w-100 h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 hidden xl:flex">
          <div className="flex flex-col gap-4 w-full z-10 mb-auto">
            <div className="flex gap-3 w-full justify-between items-center">
              {/* Left: FRADIUM balance pill for xl */}
              <div className="flex items-center gap-3">
                {(() => {
                  const fradiumToken = TOKENS_CONFIG.find((t) => t.symbol === "FRADIUM");
                  const fradiumId = fradiumToken?.id;
                  if (!fradiumId) return null;
                  const bal = parseFloat(balances?.[fradiumId] || 0);
                  const price = parseFloat(usdPrices?.[fradiumId] || 0);
                  const balanceText = contextHideBalance ? "••••" : formatAmount(bal);
                  const usdText = contextHideBalance ? "" : ` · $${(bal * price).toFixed(2)}`;
                  return (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img src="/assets/images/coins/fradium.webp" alt="FRADIUM" className="w-4 h-4" />
                      <span className="text-sm text-slate-700">FRADIUM:</span>
                      <span className="text-sm font-medium text-slate-900">{balanceText}</span>
                      <span className="text-xs text-slate-500">{usdText}</span>
                    </div>
                  );
                })()}
              </div>
              {/* Right: Profile dropdown */}
              <div className="flex items-center gap-3">
                <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={false} logout={logout} color="#000000" background="light" showHideBalance={false} />
              </div>
            </div>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KANAN ===== */}
      </div>

      {/* Bottom Navigation: hanya tampil di mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 flex md:hidden justify-between px-1 py-3" style={{ height: "80px" }}>
        {menu.map((item, idx) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          const IconComponent = getSidebarIcon(item.label, isActive);
          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center justify-center flex-1 mx-1 transition-all duration-150 ${isActive ? "text-black bg-white/20 rounded-sm" : "text-slate-700"}`} style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "6px 0" }}>
              <IconComponent className={`w-5 h-5 mb-0.5 ${isActive ? "text-black" : "text-slate-700"}`} />
              <span className="leading-tight text-center text-xs" style={{ fontWeight: 400 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default function APILayout() {
  return (
    <WalletProvider>
      <APILayoutContent />
    </WalletProvider>
  );
}
