import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SwitchServices from "@/core/components/common/SwitchServices.jsx";
import ProfileDropdown from "@/core/components/common/ProfileDropdown.jsx";
import NetworkDropdown from "@/core/components/common/NetworkDropdown.jsx";
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
import { SocialLinksSidebar, SocialLinksDropdown } from "@/core/components/common/SocialLinks.jsx";

const MotionLink = motion(Link);

export default function WalletLayout() {
  return (
    <WalletProvider>
      <WalletLayoutContent />
    </WalletProvider>
  );
}

function normalize(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "");
}

function WalletLayoutContent() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { isLoading, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue, networkFilters, updateNetworkFilters, addresses, initializeWalletData } = useWallet();
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
    const ACTIVE = {
      "Analyze Address": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/analyse-address-active.svg",
      "Scan History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/scan-history-active.svg",
      "Transaction History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-history-active.svg",
      Assets: "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-active.svg",
      Settings: "/assets/icons/setting.svg",
    };
    const INACTIVE = {
      "Analyze Address": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/analyse-address-inactive.svg",
      "Scan History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/scan-history-inactive.svg",
      "Transaction History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-history-inactive.svg",
      Assets: "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-inactive.svg",
      Settings: "/assets/icons/setting.svg",
    };

    const src = active ? ACTIVE[label] : INACTIVE[label];
    if (src) return src;

    // fallback to existing local assets
    const key = label === "Analyze Address" ? "analyze-address" : label === "Analyze Contract" ? "analyze-contract" : label === "Transaction History" ? "transaction-history" : label === "Scan History" ? "history" : "wallet";
    return `/assets/icons/${key}-${active ? "dark" : "light"}.svg`;
  };

  // Function to get localStorage key for user's hide balance setting
  const getHideBalanceKey = () => {
    return user?.identity?.getPrincipal()?.toString() ? `hideBalance_${user.identity.getPrincipal().toString()}` : "hideBalance_default";
  };

  // Function to save hide balance setting to localStorage
  const saveHideBalance = (hideBalanceValue) => {
    const key = getHideBalanceKey();
    try {
      localStorage.setItem(key, JSON.stringify(hideBalanceValue));
    } catch (error) {
      console.error("Error saving hide balance to localStorage:", error);
    }
  };

  // Function to load hide balance setting from localStorage
  const loadHideBalance = () => {
    const key = getHideBalanceKey();

    try {
      const saved = localStorage.getItem(key);

      if (saved !== null) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading/parsing saved hide balance:", error);
    }

    // Return default (false - show balance)
    return false;
  };

  const handleToggleHideBalance = () => {
    const newHideBalance = !contextHideBalance;
    setContextHideBalance(newHideBalance);
    saveHideBalance(newHideBalance); // Save the new hide balance
  };

  // Function to copy ICP Principal to clipboard
  const copyICPPrincipal = async () => {
    const icpPrincipal = addresses.icp_principal || "Not available";

    try {
      await navigator.clipboard.writeText(icpPrincipal);
      toast.success("ICP Principal copied to clipboard!", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#23272F",
          color: "#9BE4A0",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "📋",
      });
    } catch (error) {
      console.error("Failed to copy ICP Principal:", error);
      toast.error("Failed to copy ICP Principal", {
        position: "bottom-center",
        duration: 2000,
        style: {
          background: "#23272F",
          color: "#FF6B6B",
          border: "1px solid #393E4B",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
        },
        icon: "❌",
      });
    }
  };

  // Menu configuration with logout function
  const menu = [
    { label: "Assets", icon: "wallet", path: "/wallet" },
    {
      label: "Analyze Address",
      icon: "analyze-address",
      path: "/wallet/analyze-address",
    },
    {
      label: "Transaction History",
      icon: "transaction-history",
      path: "/wallet/transaction-history",
    },
    { label: "Scan History", icon: "history", path: "/wallet/scan-history" },
    { label: "Settings", icon: "setting", path: "/wallet/setting" },
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
      if (e.key && e.key.startsWith("activeNetworks_") && e.newValue) {
        try {
          // The WalletProvider handles updating networkFilters from storage events
          // const newNetworks = JSON.parse(e.newValue);
          // setActiveNetworks(newNetworks); // This line is no longer needed
        } catch (error) {
          console.error("Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for custom event to open Manage Networks modal
  React.useEffect(() => {
    const handleOpenManageNetworks = () => {
      setShowManageNetworks(true);
    };

    window.addEventListener("openManageNetworks", handleOpenManageNetworks);
    return () => window.removeEventListener("openManageNetworks", handleOpenManageNetworks);
  }, []);

  // Initialize wallet data when WalletLayout mounts (for wallet pages that need balances and prices)
  React.useEffect(() => {
    initializeWalletData();
  }, [initializeWalletData]);

  // Remove auto-save to prevent conflicts with manual save

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".network-dropdown")) {
        setIsDropdownOpen(false);
      }
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isProfileDropdownOpen]);

  const handleNetworkChange = (selectedNetwork) => {
    setNetwork(selectedNetwork);
    setIsDropdownOpen(false);
  };

  // Filter available networks based on active networks
  const getAvailableNetworks = () => {
    return NETWORK_CONFIG.filter((network) => networkFilters[network.name]).map((network) => ({
      key: network.id,
      name: network.name,
      value: getNetworkValue(network.name),
    }));
  };

  // Remove the blocking loading screen - let content show immediately
  // Loading states will be handled at component level with skeleton loading

  return (
    <>
      <WelcomingWalletModal isOpen={isCreatingWallet} />

      <div className="relative block md:flex min-h-screen bg-transparent w-full max-w-full">
        {/* Global background spanning all wallet sections (fixed) */}
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/wallet2-background.webp" alt="" aria-hidden="true" decoding="async" loading="eager" className="fixed inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none" />
        <div className="fixed inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>
        {/* Modal Manage Networks */}
        <ManageNetworksModal isOpen={showManageNetworks} onClose={() => setShowManageNetworks(false)} networkFilters={networkFilters} updateNetworkFilters={updateNetworkFilters} currentNetwork={network} setNetwork={setNetwork} />
        {/* ===== START: SIDEBAR KIRI (Desktop) ===== */}
        <aside className="fixed left-0 top-0 z-20 w-[200px] lg:w-[240px] xl:w-[320px] bg-transparent flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-white/10 hidden md:flex h-screen">
          {/* Logo dan Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <Link to="/">
                <img src="/assets/logo/fradium-wallet.svg" className="h-[50px] sm:h-[50px] w-auto" alt="Fradium Logo" />
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
                ) : item.onClick ? (
                  <button key={item.label} onClick={item.onClick} className={`group relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all text-white/70 hover:text-white font-normal`}>
                    <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-white/10 via-white/5 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-[5px] transition-all duration-200 bg-[#9BE4A0] shadow-[0_0_10px_rgba(155,228,160,0.4)]" />
                    <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ) : (
                  <MotionLink whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} key={item.label} to={item.path} className={`group relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all text-white/70 hover:text-white font-normal`}>
                    <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-white/10 via-white/5 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-[5px] transition-all duration-200 bg-[#9BE4A0] shadow-[0_0_10px_rgba(155,228,160,0.4)]" />
                    <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </MotionLink>
                );
              })}
            </nav>
          </div>
          {/* Bottom icons - fixed at bottom */}
          <SocialLinksSidebar color="#9BE4A0" />
        </aside>
        {/* ===== END: SIDEBAR KIRI ===== */}
        {/* Topbar khusus mobile */}
        <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-[#0F1219]/95 backdrop-blur-lg fixed top-0 left-0 right-0 z-40 border-b border-white/10">
          {/* Logo Fradium kiri */}
          <Link to="/">
            <img src="/assets/logo/fradium-wallet.svg" alt="Fradium Logo" className="h-10 w-auto" />
          </Link>
          {/* Switch Service, Network dropdown & user button kanan */}
          <div className="flex items-center gap-2">
            {/* Switch Services */}
            <SwitchServices compact={true} />
            {/* Network Dropdown */}
            <div className="relative network-dropdown">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-lg px-3 py-2 text-white font-medium text-xs rounded-lg border border-white/10 transition-all">
                <img src="/assets/icons/construction.svg" alt="All Networks" className="w-4 h-4" />
                <span className="text-white pr-1 capitalize text-xs">{network}</span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <path d="M7 10l5 5 5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Dropdown Menu (mobile: full screen modal) */}
              {isDropdownOpen && (
                <div className="fixed inset-0 z-50 bg-[#0F1219] md:hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-[#0F1219]">
                    <div className="text-white text-xl font-semibold">Select Network</div>
                    <button onClick={() => setIsDropdownOpen(false)} className="text-white/80 hover:text-white text-2xl font-bold focus:outline-none transition-colors">
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-start px-4 pt-4 gap-2 bg-[#0F1219]">
                    <button
                      onClick={() => {
                        handleNetworkChange("All Networks");
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 text-base rounded-lg transition-all ${network === "All Networks" ? "bg-white/10 border border-[#9BE4A0]/30" : "hover:bg-white/10"}`}>
                      <div className="flex items-center gap-3">
                        {network === "All Networks" ? (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <path d="M20 6L9 17l-5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className="w-[18px] h-[18px]"></div>
                        )}
                        <span className="text-white font-medium">All Networks</span>
                      </div>
                      <span className="text-white/60 text-sm font-medium">{getNetworkValue("All Networks")}</span>
                    </button>
                    {getAvailableNetworks().map((net) => (
                      <button
                        key={net.key}
                        onClick={() => {
                          handleNetworkChange(net.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-4 py-3 text-base rounded-lg transition-all ${network === net.name ? "bg-white/10 border border-[#9BE4A0]/30" : "hover:bg-white/10"}`}>
                        <div className="flex items-center gap-3">
                          {network === net.name ? (
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                              <path d="M20 6L9 17l-5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div className="w-[18px] h-[18px]"></div>
                          )}
                          <span className="text-white font-medium">{net.name}</span>
                        </div>
                        <span className="text-white/60 text-sm font-medium">{net.value}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <button
                        className="flex items-center gap-3 w-full px-4 py-3 text-base text-[#9BE4A0] hover:text-[#9BE4A0] font-medium rounded-lg hover:bg-white/5 transition-all"
                        onClick={() => {
                          setShowManageNetworks(true);
                          setIsDropdownOpen(false);
                        }}>
                        <img src="/assets/icons/construction.svg" alt="Manage Networks" className="w-5 h-5" />
                        Manage Networks
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* User Button */}
            <div className="relative profile-dropdown">
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-lg w-9 h-9 rounded-lg border border-white/10 transition-all">
                <img src="/assets/icons/person.svg" alt="User" className="w-5 h-5" />
              </button>
              {/* Profile Dropdown Menu (mobile: full screen modal) */}
              {isProfileDropdownOpen && (
                <div className="fixed inset-0 z-50 bg-[#0F1219] md:hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-[#0F1219]">
                    <div className="text-white text-xl font-semibold">Profile</div>
                    <button onClick={() => setIsProfileDropdownOpen(false)} className="text-white/80 hover:text-white text-2xl font-bold focus:outline-none transition-colors">
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-start px-4 pt-4 gap-2 pb-24 bg-[#0F1219]">
                    <button className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all" onClick={handleToggleHideBalance}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                        {contextHideBalance ? (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                            <path d="M1 1l22 22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        ) : (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                          </>
                        )}
                      </svg>
                      <span className="text-white font-medium">{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                    </button>
                    <button
                      className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all"
                      onClick={() => {
                        copyICPPrincipal();
                        setIsProfileDropdownOpen(false);
                      }}>
                      <img src="/assets/icons/copy-green.svg" alt="Your Principal" className="w-5 h-5" />
                      <span className="text-white font-medium">Your Principal</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all">
                      <img src="/assets/icons/share-green.svg" alt="Refer your friends" className="w-5 h-5" />
                      <span className="text-white font-medium">Refer your friends</span>
                    </button>

                    <div className="h-px bg-white/10 my-2"></div>

                    <button className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                        <circle cx="12" cy="12" r="10" stroke="#9BE4A0" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="12" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="text-white font-medium">Why Fradium</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="14,2 14,8 20,8" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="16" y1="13" x2="8" y2="13" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="16" y1="17" x2="8" y2="17" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="10,9 9,9 8,9" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white font-medium">Documentation</span>
                    </button>
                    <button
                      className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-white/10 transition-all"
                      onClick={() => {
                        navigate("/wallet/setting");
                        setIsProfileDropdownOpen(false);
                      }}>
                      <img src="/assets/icons/setting-green.svg" alt="Settings" className="w-5 h-5" />
                      <span className="text-white font-medium">Settings</span>
                    </button>

                    <div className="h-px bg-white/10 my-2"></div>
                    <SocialLinksDropdown color="#9BE4A0" />

                    {/* Logout Button */}
                    <div className="mt-2">
                      <button
                        className="flex items-center gap-3 w-full px-4 py-3 text-base text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-all font-medium"
                        onClick={() => {
                          navigate("/");
                          logout();
                        }}>
                        <img src="/assets/icons/logout-dark.svg" alt="Logout" className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 pb-28 md:pb-8 pt-20 md:pt-7 flex flex-col md:pl-[15%] lg:pl-[16%] xl:pl-[18%] xl:pr-[20%]">
          {/* Topbar Network & User for md screens - placed above Outlet to avoid content shrink */}
          <div className="hidden md:flex xl:hidden w-full items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <SwitchServices compact={false} />
            </div>
            <div className="flex items-center gap-3">
              <NetworkDropdown isOpen={isDropdownOpen} setIsOpen={setIsDropdownOpen} network={network} getNetworkValue={getNetworkValue} getAvailableNetworks={getAvailableNetworks} handleNetworkChange={handleNetworkChange} />
              <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={true} settingsPath="/wallet/setting" logout={logout} showHideBalance={true} />
            </div>
          </div>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[30rem] sm:max-w-[32rem] md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[44rem] 2xl:max-w-[48rem] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
        {/* ===== START: SIDEBAR KANAN (Desktop) ===== */}
        <aside className="fixed right-0 top-0 z-10 w-100 h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 hidden xl:flex">
          {/* Top action buttons */}
          <div className="flex flex-col gap-4 w-full z-10 mb-auto">
            <div className="flex gap-3 w-full justify-between items-center">
              <SwitchServices compact={false} />
              <div className="flex items-center gap-3">
                <NetworkDropdown isOpen={isDropdownOpen} setIsOpen={setIsDropdownOpen} network={network} getNetworkValue={getNetworkValue} getAvailableNetworks={getAvailableNetworks} handleNetworkChange={handleNetworkChange} />
                <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={true} settingsPath="/wallet/setting" logout={logout} showHideBalance={true} />
              </div>
            </div>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KANAN ===== */}
      </div>

      {/* Bottom Navigation: hanya tampil di mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1219]/95 backdrop-blur-lg border-t border-white/10 flex md:hidden justify-between px-1 py-2" style={{ height: "72px" }}>
        {menu.map((item, idx) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          // Mapping nama menu ke icon mobile (gunakan icon dari getSidebarIconUrl)
          const iconSrc = getSidebarIconUrl(item.label, isActive);

          // Create shorter labels for mobile
          const getMobileLabel = (label) => {
            const mobileLabels = {
              Assets: "Assets",
              "Analyze Address": "Analyze",
              "Transaction History": "History",
              "Scan History": "Scans",
              Settings: "Settings",
            };
            return mobileLabels[label] || label;
          };

          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center justify-center flex-1 mx-0.5 rounded-lg transition-all duration-200 ${isActive ? "text-white bg-white/10 shadow-[0_0_12px_rgba(155,228,160,0.2)]" : "text-white/60 hover:text-white/90 hover:bg-white/5"}`} style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "8px 2px" }}>
              <img src={iconSrc} alt={item.label} className="w-5 h-5 mb-1" />
              <span className="leading-tight text-center text-[10px] font-medium whitespace-nowrap px-1">{getMobileLabel(item.label)}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Widget - floating bottom-right */}
      <AIAssistantWidget />
    </>
  );
}
