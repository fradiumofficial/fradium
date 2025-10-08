import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/WalletProvider";
import SidebarButton from "../SidebarButton";
import { useAuth } from "@/core/providers/AuthProvider";
import { LoadingState } from "@/core/components/ui/LoadingState";
import { NETWORK_CONFIG } from "@/core/config/tokenConfig.js";
// toast not used for copy feedbacks anymore
import { motion, AnimatePresence } from "framer-motion";

import WelcomingWalletModal from "../modals/WelcomingWallet";
import AIAssistantWidget from "@/core/components/assistant/AIAssistantWidget";
import ManageNetworksModal from "../modals/ManageNetworksModal";

const MotionLink = motion(Link);

function EscrowRightActions({ isDropdownOpen, setIsDropdownOpen, isProfileDropdownOpen, setIsProfileDropdownOpen, network, getNetworkValue, getAvailableNetworks, handleNetworkChange, handleToggleHideBalance, contextHideBalance, navigate, logout, icpPrincipal }) {
  const [copiedPrincipal, setCopiedPrincipal] = React.useState(false);
  return (
    <>
      <div className="relative network-dropdown">
        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative flex items-center gap-3 h-12 px-5 rounded-full text-white font-medium bg-white/5 text-base hover:opacity-95 transition-colors border border-white/10">
          <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
          <span className="text-white pr-2 capitalize">{network}</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
            <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div className="absolute top-full mt-3 w-[300px] rounded-2xl border border-white/10 z-[9999] overflow-hidden" style={{ right: "0px", background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))", boxShadow: "0 12px 40px rgba(0,0,0,0.45)", backdropFilter: "blur(10px)" }} initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <div className="py-2">
                <button onClick={() => handleNetworkChange("All Networks")} className="w-full text-base">
                  <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === "All Networks" ? "bg-white/8" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      {network === "All Networks" ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-white">All Networks</span>
                    </div>
                    <span className="text-[#9CA3AF]">{getNetworkValue("All Networks")}</span>
                  </div>
                </button>

                <div className="h-px bg-white/10 mx-4 my-1" />

                {getAvailableNetworks().map((net, index) => (
                  <div key={net.key}>
                    <button onClick={() => handleNetworkChange(net.name)} className="w-full text-base">
                      <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === net.name ? "bg-white/8" : "hover:bg-white/5"}`}>
                        <div className="flex items-center gap-3">
                          {network === net.name ? (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                              <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className="text-white text-left">{net.name}</span>
                        </div>
                        <span className="text-[#9CA3AF]">{net.value}</span>
                      </div>
                    </button>
                    {index < getAvailableNetworks().length - 1 && <div className="h-px bg-white/10 mx-4" />}
                  </div>
                ))}

                <div className="h-px bg-white/10 mx-4 my-2" />

                <button
                  className="w-full flex items-center gap-3 px-6 py-3 text-[#9BEB83] hover:bg-white/5 transition-colors"
                  onClick={() => {
                    // This will be handled by the parent component
                    window.dispatchEvent(new CustomEvent("openManageNetworks"));
                  }}>
                  <img src="/assets/icons/construction.svg" alt="Manage Networks" className="w-5 h-5" />
                  <span className="font-medium">Manage Networks</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative profile-dropdown">
        <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="group flex items-center justify-center bg-[#161B22] w-11 h-11 rounded-full border border-white/10 hover:bg-[#2A2F36] transition-all duration-200 ease-out cursor-pointer hover:border-white/20">
          <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
        </button>

        <AnimatePresence>
          {isProfileDropdownOpen && (
            <motion.div className="absolute top-full right-0 mt-3 w-[270px] rounded-3xl font-normal border border-white/10 z-[9999] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))", boxShadow: "0 12px 40px rgba(0,0,0,0.45)", backdropFilter: "blur(10px)" }} initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <div className="py-4">
                <button className="w-full text-sm transition-colors group" onClick={handleToggleHideBalance}>
                  <div className="mx-5 mb-3 flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5">
                    <img src="/assets/icons/eye.svg" alt="Hide Balance" className="w-5 h-5" />
                    <span className="text-white">{contextHideBalance ? "Show Balance" : "Hide Balance"}</span>
                  </div>
                </button>

                <div className="h-px bg-white/10 mx-5 mb-3" />

                <div className="mx-5 mb-3">
                  <div className="text-xs text-[#9CA3AF] mb-2">Your Principal</div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                    <code className="text-xs text-white font-mono flex-1 truncate">{icpPrincipal}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(icpPrincipal);
                        setCopiedPrincipal(true);
                        setTimeout(() => setCopiedPrincipal(false), 2000);
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors">
                      {copiedPrincipal ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <img src="/assets/icons/copy.svg" alt="Copy" className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/10 mx-5 mb-3" />

                <button
                  className="w-full flex items-center gap-3 px-6 py-3 text-[#FF6B6B] hover:bg-white/5 transition-colors"
                  onClick={() => {
                    navigate("/");
                    logout();
                  }}>
                  <img src="/assets/icons/logout-dark.svg" alt="Logout" className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function EscrowLayoutContent() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { isLoading, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue, networkFilters, updateNetworkFilters, addresses } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = React.useState(false);
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);

  // Get networks from tokenUtils configuration
  const NETWORKS = NETWORK_CONFIG.map((network) => ({
    key: network.id,
    name: network.name,
    icon: network.icon,
  }));

  // Helper: map sidebar label to icon URL (active/inactive)
  const getSidebarIconUrl = (label, active) => {
    const iconMap = {
      Escrow: active ? "/assets/icons/wallet-active.svg" : "/assets/icons/wallet.svg",
      "P2P Payment": active ? "/assets/icons/transaction-history-active.svg" : "/assets/icons/transaction-history.svg",
      "Escrow History": active ? "/assets/icons/history-active.svg" : "/assets/icons/history.svg",
    };
    return iconMap[label] || "/assets/icons/wallet.svg";
  };

  // Helper function to normalize path (same as WalletLayout)
  const normalize = (path) => {
    return path.replace(/\/+$/, "");
  };

  // Handle network change
  const handleNetworkChange = (selectedNetwork) => {
    setNetwork(selectedNetwork);
    setIsDropdownOpen(false);
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

  // Filter available networks based on active networks
  const getAvailableNetworks = () => {
    return NETWORK_CONFIG.filter((network) => networkFilters[network.name]).map((network) => ({
      key: network.id,
      name: network.name,
      value: getNetworkValue(network.name),
    }));
  };

  // Listen for manage networks event
  React.useEffect(() => {
    const handleOpenManageNetworks = () => {
      setShowManageNetworks(true);
    };

    window.addEventListener("openManageNetworks", handleOpenManageNetworks);
    return () => window.removeEventListener("openManageNetworks", handleOpenManageNetworks);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingState type="spinner" size="lg" color="primary" />
          <div className="text-white text-lg">Loading your escrow...</div>
        </div>
      </div>
    );
  }

  // Menu configuration for escrow
  const menu = [
    { label: "Escrow", icon: "escrow", path: "/escrow/dashboard" },
    { label: "Create P2P Trade", icon: "p2p-payment", path: "/escrow/dashboard/p2p-payment" },
    { label: "P2P Trade", icon: "p2p-trade", path: "/escrow/dashboard/p2p-trade" },
    { label: "My Escrow", icon: "escrow-history", path: "/escrow/dashboard/my-escrow" },
    { label: "Escrow History", icon: "escrow-history", path: "/escrow/dashboard/history" },
  ];

  // Load hide balance setting from localStorage on component mount and user change
  React.useEffect(() => {
    const loadSavedHideBalance = () => {
      try {
        setContextHideBalance(loadHideBalance()); // Load and set hide balance
        setHasLoadedHideBalance(true); // Mark as loaded from storage
      } catch (error) {
        console.error("Error loading hide balance:", error);
        setHasLoadedHideBalance(true);
      }
    };

    // Only load if we haven't loaded from storage yet
    if (!hasLoadedHideBalance) {
      // Load immediately if user is available
      if (user?.identity?.getPrincipal()) {
        loadSavedHideBalance();
      }
      // Also try to load from default storage if no user yet
      else {
        loadSavedHideBalance();
      }
    }
  }, [user?.identity?.getPrincipal()?.toString(), hasLoadedHideBalance]);

  // Listen for localStorage changes from other components (like setting page)
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

      <div className="relative block md:flex min-h-screen bg-[#0F1219] w-full max-w-full">
        {/* Global background spanning all escrow sections */}
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/wallet-background.png" alt="" aria-hidden="true" decoding="async" loading="eager" className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none" />
        <div className="absolute inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>
        {/* Modal Manage Networks */}
        <ManageNetworksModal isOpen={showManageNetworks} onClose={() => setShowManageNetworks(false)} networkFilters={networkFilters} updateNetworkFilters={updateNetworkFilters} currentNetwork={network} setNetwork={setNetwork} />
        {/* ===== START: SIDEBAR KIRI (Desktop) ===== */}
        <aside className="relative z-10 w-[200px] lg:w-[240px] xl:w-[320px] bg-transparent flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-white/10 hidden md:flex min-h-screen">
          {/* Logo dan Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <Link to="/">
                <img src="/assets/logo-fradium.svg" alt="Fradium Logo" />
              </Link>
            </div>
            {/* Menu */}
            <nav className="flex flex-col gap-2">
              {menu.map((item, idx) => {
                const isActive = normalize(location.pathname) === normalize(item.path);
                const iconSrc = getSidebarIconUrl(item.label, isActive);
                return isActive ? (
                  <Link key={item.label} to={item.path} className="relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all">
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-white/20 via-white/10 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-[#9BE4A0] shadow-[0_0_12px_rgba(155,228,160,0.5)]" />
                    <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 text-white font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <Link key={item.label} to={item.path} className="flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all hover:bg-white/5 rounded-lg">
                    <img src={iconSrc} alt={item.label} className="w-5 h-5" />
                    <span className="text-white/70 font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KIRI ===== */}

        {/* ===== START: MAIN CONTENT ===== */}
        <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 overflow-visible pb-28 md:pb-8 pt-8 md:pt-7 flex flex-col">
          {/* Topbar Network & User for md screens - placed above Outlet to avoid content shrink */}
          <div className="hidden md:flex xl:hidden w-full items-center justify-end gap-3 mb-4">
            <EscrowRightActions isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} network={network} getNetworkValue={getNetworkValue} getAvailableNetworks={getAvailableNetworks} handleNetworkChange={handleNetworkChange} handleToggleHideBalance={handleToggleHideBalance} contextHideBalance={contextHideBalance} navigate={navigate} logout={logout} icpPrincipal={addresses?.icp_principal} />
          </div>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[30rem] sm:max-w-[32rem] md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[44rem] 2xl:max-w-[48rem] md:-translate-x-[100px] lg:-translate-x-[120px] xl:translate-x-0 transition-transform">
              <Outlet />
            </div>
          </div>
        </main>
        {/* ===== END: MAIN CONTENT ===== */}

        {/* ===== START: SIDEBAR KANAN (Desktop) ===== */}
        <aside className="relative z-10 w-100 min-h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 hidden xl:flex">
          <div className="flex flex-col gap-4 w-full z-10 mb-auto">
            <div className="flex gap-3 w-full justify-end">
              <EscrowRightActions isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} network={network} getNetworkValue={getNetworkValue} getAvailableNetworks={getAvailableNetworks} handleNetworkChange={handleNetworkChange} handleToggleHideBalance={handleToggleHideBalance} contextHideBalance={contextHideBalance} navigate={navigate} logout={logout} icpPrincipal={addresses?.icp_principal} />
            </div>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KANAN ===== */}
      </div>

      {/* Bottom Navigation: hanya tampil di mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#181C22] border-t border-[#23272F] flex md:hidden justify-between px-1 py-3" style={{ height: "80px" }}>
        {menu.map((item, idx) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          // Mapping nama menu ke icon mobile
          const mobileIconMap = {
            Escrow: "wallet",
            "P2P Payment": "transaction-history",
            "Escrow History": "history",
          };
          const mobileIconKey = mobileIconMap[item.label] || item.label.toLowerCase();
          const iconSrc = `/assets/icons/mobile/${mobileIconKey}-${isActive ? "active" : "non"}.svg`;
          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center justify-center flex-1 mx-1 transition-all duration-150 ${isActive ? "text-[#9BEB83] bg-[#9BE4A01A] rounded-sm shadow-[0_0_8px_0_#9BE4A01A]" : "text-[#FFFFFF99]"}`} style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "6px 0" }}>
              <img src={iconSrc} alt={item.label} className="w-5 h-5 mb-0.5" />
              <span className="leading-tight text-center text-xs" style={{ fontWeight: 400 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Widget - floating bottom-right */}
      <AIAssistantWidget />
    </>
  );
}

export default function EscrowLayout() {
  return (
    <WalletProvider>
      <EscrowLayoutContent />
    </WalletProvider>
  );
}
