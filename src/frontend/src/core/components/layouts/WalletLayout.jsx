import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/WalletProvider";
import SidebarButton from "../SidebarButton";
import { useAuth } from "@/core/providers/AuthProvider";
import { Dialog, DialogContent, DialogTitle } from "../ui/Dialog";
import { LoadingState } from "@/core/components/ui/LoadingState";
import { NETWORK_CONFIG } from "@/core/lib/coinUtils";
import { motion } from "framer-motion";

// Remove duplicate NETWORK_CONFIG import since we import from coinUtils

import WelcomingWalletModal from "../modals/WelcomingWallet";

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
  const { isLoading, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue, networkFilters, updateNetworkFilters } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = React.useState(false);
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);

  // Get networks from coinUtils configuration
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
    };
    const INACTIVE = {
      "Analyze Address": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/analyse-address-inactive.svg",
      "Scan History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/scan-history-inactive.svg",
      "Transaction History": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-history-inactive.svg",
      Assets: "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-inactive.svg",
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

  // Helper function to get network filter status
  const getNetworkFilterStatus = (networkKey) => {
    // Find network from NETWORK_CONFIG
    const network = NETWORK_CONFIG.find((net) => net.id === networkKey);
    return network ? networkFilters[network.name] || false : false;
  };

  const handleToggleNetwork = (key) => {
    // Find network from NETWORK_CONFIG
    const network = NETWORK_CONFIG.find((net) => net.id === key);
    if (!network) return;

    const newFilters = {
      ...networkFilters,
      [network.name]: !networkFilters[network.name],
    };
    updateNetworkFilters(newFilters);
  };

  const handleSaveNetworks = () => {
    // No need to explicitly save since updateNetworkFilters already saves to localStorage

    // Check if current selected network is disabled, if so switch to "All Networks"
    const currentNetworkKey = network.toLowerCase();
    if (currentNetworkKey !== "all networks") {
      // Find the network from NETWORK_CONFIG
      const currentNetwork = NETWORK_CONFIG.find((net) => net.name.toLowerCase() === currentNetworkKey);

      if (currentNetwork && !networkFilters[currentNetwork.name]) {
        setNetwork("All Networks");
      }
    }

    setShowManageNetworks(false);
  };

  const handleToggleHideBalance = () => {
    const newHideBalance = !contextHideBalance;
    setContextHideBalance(newHideBalance);
    saveHideBalance(newHideBalance); // Save the new hide balance
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingState type="spinner" size="lg" color="primary" />
          <div className="text-white text-lg">Loading your wallet...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomingWalletModal isOpen={isCreatingWallet} />

      <div className="relative overflow-hidden block md:flex min-h-screen bg-[#0F1219] w-full max-w-full">
        {/* Global background spanning all wallet sections */}
        <img
          src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/wallet-background.png"
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="eager"
          className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />
        <div className="absolute inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>
        {/* Modal Manage Networks */}
        <Dialog
          open={showManageNetworks}
          onOpenChange={(open) => {
            if (!open) {
              // Save networks when modal is closed
              // The WalletProvider handles saving active networks to localStorage
              // saveActiveNetworks(activeNetworks); // This line is no longer needed
            }
            setShowManageNetworks(open);
          }}>
          <DialogContent className="bg-[#23242A] border-none max-w-xl p-0 rounded-xl">
            <DialogTitle className="sr-only">Manage Networks</DialogTitle>
            <div className="px-8 pt-8 pb-4">
              <div className="text-white text-2xl font-bold mb-8">Active networks</div>
              <div className="divide-y divide-white/10">
                {NETWORKS.map((net) => (
                  <div key={net.key} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <img src={net.icon} alt={net.name} className="w-7 h-7" />
                      <span className="text-white text-lg font-medium">{net.name}</span>
                    </div>
                    {/* Custom Switch */}
                    <button className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 ${getNetworkFilterStatus(net.key) ? "bg-[#9BE4A0]" : "bg-[#23272F]"}`} onClick={() => handleToggleNetwork(net.key)}>
                      <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${getNetworkFilterStatus(net.key) ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-8 pb-8">
              <SidebarButton onClick={handleSaveNetworks} className="w-full" buttonClassName="justify-center">
                Save
              </SidebarButton>
            </div>
          </DialogContent>
        </Dialog>
        {/* ===== START: SIDEBAR KIRI (Desktop) ===== */}
        <aside className="relative z-10 h-screen w-[340px] bg-transparent flex flex-col justify-between py-8 pl-8 border-r border-white/10 hidden md:flex">
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
                ) : item.onClick ? (
                  <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} key={item.label} onClick={item.onClick} className={`group relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all text-white/70 hover:text-white font-normal`}>
                    <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-white/10 via-white/5 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-[5px] transition-all duration-200 bg-[#9BE4A0] shadow-[0_0_10px_rgba(155,228,160,0.4)]" />
                    <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
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
          {/* Bottom icons - absolute at bottom */}
          <div className="absolute bottom-6 left-8 z-10 flex items-center gap-5">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" title="Github" onClick={() => window.open("https://github.com/fradiumofficial", "_blank")}>
              <img src="/assets/GithubLogo.svg" alt="Github" className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" title="X" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
              <img src="/assets/XLogo.svg" alt="X" className="w-5 h-5" />
            </button>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KIRI ===== */}
        {/* Topbar khusus mobile */}
        <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-[#0F1219] sticky top-0 z-40 border-b border-[#23272F]">
          {/* Logo Fradium kiri */}
          <Link to="/">
            <img src="/logo.svg" alt="Fradium Logo" className="w-10 h-10" />
          </Link>
          {/* Network dropdown & user button kanan */}
          <div className="flex items-center gap-2">
            {/* Network Dropdown */}
            <div className="relative network-dropdown">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-[#23272F] px-3 py-2 text-white font-medium text-xs rounded-md hover:bg-[#2A2F36] transition-all">
                <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
                <span className="text-white pr-1 capitalize text-xs">{network}</span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Dropdown Menu (mobile: full screen modal) */}
              {isDropdownOpen && (
                <div className="fixed inset-0 z-50 bg-[#23242A] md:hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#23272F]">
                    <div className="text-white text-xl font-semibold">All Networks</div>
                    <button onClick={() => setIsDropdownOpen(false)} className="text-white text-2xl font-bold focus:outline-none">
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-start px-2 pt-2">
                    <button
                      onClick={() => {
                        handleNetworkChange("All Networks");
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-4 text-base ${network === "All Networks" ? "bg-[#34373D]" : ""}`}>
                      <div className="flex items-center gap-3">
                        {network === "All Networks" ? (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                            <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className="w-4 h-4"></div>
                        )}
                        <span className="text-white font-medium">All Networks</span>
                      </div>
                      <span className="text-[#9CA3AF] text-base font-medium">{getNetworkValue("All Networks")}</span>
                    </button>
                    {getAvailableNetworks().map((net) => (
                      <button
                        key={net.key}
                        onClick={() => {
                          handleNetworkChange(net.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-4 py-4 text-base ${network === net.name ? "bg-[#34373D]" : ""}`}>
                        <div className="flex items-center gap-3">
                          {network === net.name ? (
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                              <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                          <span className="text-white font-medium">{net.name}</span>
                        </div>
                        <span className="text-[#9CA3AF] text-base font-medium">{net.value}</span>
                      </button>
                    ))}
                    <button
                      className="flex items-center gap-2 px-4 py-4 text-base text-[#9BEB83] font-medium mt-2"
                      onClick={() => {
                        setShowManageNetworks(true);
                        setIsDropdownOpen(false);
                      }}>
                      <img src="/assets/icons/construction.svg" alt="Manage Networks" className="w-5 h-5" />
                      Manage Networks
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* User Button */}
            <div className="relative profile-dropdown">
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center justify-center bg-[#23272F] w-9 h-9 rounded-md hover:bg-[#2A2F36] transition-all">
                <img src="/assets/icons/person.svg" alt="User" className="w-5 h-5" />
              </button>
              {/* Profile Dropdown Menu (mobile: full screen modal) */}
              {isProfileDropdownOpen && (
                <div className="fixed inset-0 z-50 bg-[#23242A] md:hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#23272F]">
                    <div className="text-white text-xl font-semibold">Profile</div>
                    <button onClick={() => setIsProfileDropdownOpen(false)} className="text-white text-2xl font-bold focus:outline-none">
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-start px-2 pt-2 gap-1 pb-24">
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]" onClick={handleToggleHideBalance}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        {contextHideBalance ? (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="#9BEB83" strokeWidth="2" />
                            <path d="M1 1l22 22" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        ) : (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="#9BEB83" strokeWidth="2" />
                          </>
                        )}
                      </svg>
                      <span className="text-white">{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]">
                      <img src="/assets/icons/copy-green.svg" alt="Your addresses" className="w-5 h-5" />
                      <span className="text-white">Your addresses</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]">
                      <img src="/assets/icons/share-green.svg" alt="Refer your friends" className="w-5 h-5" />
                      <span className="text-white">Refer your friends</span>
                    </button>
                    <div className="h-px bg-white/10 mx-4 my-2"></div>
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        <circle cx="12" cy="12" r="10" stroke="#9BEB83" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="12" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" />
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="text-white">Why Fradium</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="14,2 14,8 20,8" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="16" y1="13" x2="8" y2="13" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="16" y1="17" x2="8" y2="17" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="10,9 9,9 8,9" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white">Documentation</span>
                    </button>
                    <button
                      className="w-full text-sm transition-colors group"
                      onClick={() => {
                        navigate("/wallet/setting");
                        setIsProfileDropdownOpen(false);
                      }}>
                      <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                        <img src="/assets/icons/setting-green.svg" alt="Settings" />
                        <span className="text-white">Settings</span>
                      </div>
                    </button>

                    <div className="h-px bg-white/5 mx-4"></div>
                    {/* Source Code */}
                    <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
                      <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white">Source Code</span>
                      </div>
                    </button>

                    {/* X Account */}
                    <button className="w-full mb-2 text-sm transition-colors group" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
                      <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-white">X Account</span>
                      </div>
                    </button>

                    {/* Logout Button using SidebarButton */}
                    <div className="mx-4 mt-2">
                      <SidebarButton
                        icon="/assets/icons/logout-dark.svg"
                        onClick={() => {
                          navigate("/");
                          logout();
                        }}>
                        Logout
                      </SidebarButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 overflow-auto pb-28 md:pb-8 pt-8 md:pt-7">
          <Outlet />
        </main>
        {/* ===== START: SIDEBAR KANAN (Desktop) ===== */}
        <aside className="relative z-10 w-100 min-h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 overflow-hidden hidden md:flex">
          {/* Overlay for readability on right sidebar */}
          {/* Removed per-sidebar overlay to keep background consistent across sections */}

          {/* Top action buttons */}
          <div className="flex flex-col gap-4 w-full z-10 mb-auto">
            <div className="flex gap-3 w-full justify-end">
              {/* Network Dropdown */}
              <div className="relative network-dropdown">
                <motion.button whileHover={{ y: -1, scale: 1.02 }} transition={{ type: "spring", stiffness: 280, damping: 20, mass: 0.6 }} onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative flex items-center gap-3 h-12 px-5 rounded-full text-white font-medium bg-white/5 text-base hover:opacity-95 transition-colors border border-white/10">
                  <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
                  <span className="text-white pr-2 capitalize">{network}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                    <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full mt-3 w-[250px] rounded-2xl border border-white/10 z-50 overflow-hidden" style={{ left: "0px", background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))", boxShadow: "0 12px 40px rgba(0,0,0,0.45)", backdropFilter: "blur(10px)" }}>
                    <div className="py-2">
                      {/* All Networks - selected row */}
                      <button onClick={() => handleNetworkChange("All Networks")} className="w-full text-base">
                        <motion.div whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === "All Networks" ? "bg-white/8" : "hover:bg-white/5"}`}>
                          <div className="flex items-center gap-3">
                            {network === "All Networks" ? (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]"><path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                            <span className="text-white">All Networks</span>
                          </div>
                          <span className="text-[#9CA3AF]">{getNetworkValue("All Networks")}</span>
                        </motion.div>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-white/10 mx-4 my-1" />

                      {/* Dynamic network list based on active networks */}
                      {getAvailableNetworks().map((net, index) => (
                        <div key={net.key}>
                          <button onClick={() => handleNetworkChange(net.name)} className="w-full text-base">
                            <motion.div whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${network === net.name ? "bg-white/8" : "hover:bg-white/5"}`}>
                              <div className="flex items-center gap-3">
                                {network === net.name ? (
                                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]"><path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                                <span className="text-white">{net.name}</span>
                              </div>
                              <span className="text-[#9CA3AF]">{net.value}</span>
                            </motion.div>
                          </button>
                          {index < getAvailableNetworks().length - 1 && <div className="h-px bg-white/10 mx-4" />}
                        </div>
                      ))}

                      {/* Divider */}
                      <div className="h-px bg-white/10 mx-4 my-2" />

                      {/* Manage Networks */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full flex items-center gap-3 px-6 py-3 text-[#9BEB83] hover:bg-white/5 transition-colors">
                        <img src="/assets/icons/construction.svg" alt="Manage Networks" className="w-5 h-5" />
                        <span className="font-medium">Manage Networks</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Button */}
              <div className="relative profile-dropdown">
                <motion.button whileHover={{ y: -1, scale: 1.02 }} transition={{ type: "spring", stiffness: 280, damping: 20, mass: 0.6 }} onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center justify-center bg-[#161B22] w-11 h-11 rounded-full border border-white/10 hover:bg-[#1C2330] transition-all">
                  <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6" />
                </motion.button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-[230px] rounded-3xl font-normal border border-white/10 z-50 overflow-hidden">
                    <div className="py-4">
                      {/* Hide Balance - pill */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group" onClick={handleToggleHideBalance}>
                        <div className="mx-5 mb-3 flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5">
                          {contextHideBalance ? (
                            // Eye with slash (hidden state)
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                              <path d="M1 1l22 22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            // Normal eye (visible state)
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                            </svg>
                          )}
                          <span className="text-white font-normal">{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                        </div>
                      </motion.button>

                      {/* Your Addresses */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group">
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <img src="/assets/icons/copy-green.svg" alt="Your addresses" />
                          <span className="text-white">Your addresses</span>
                        </div>
                      </motion.button>

                      {/* Contact */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group">
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <img src="/assets/icons/contact.svg" alt="Contact" />
                          <span className="text-white">Contact</span>
                        </div>
                      </motion.button>

                      {/* Refer your friends */}
                      {/* <button className="w-full text-sm transition-colors group">
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <img src="/assets/icons/share-green.svg" alt="Refer your friends" />
                          <span className="text-white">Refer your friends</span>
                        </div>
                      </button> */}

                      <div className="h-px bg-white/10 mx-5 my-3"></div>

                      {/* Why Fradium */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <circle cx="12" cy="12" r="10" stroke="#9BE4A0" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="12" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="text-white">Why Fradium</span>
                        </div>
                      </motion.button>

                      {/* Documentation */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14,2 14,8 20,8" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="10,9 9,9 8,9" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-white">Documentation</span>
                        </div>
                      </motion.button>

                      {/* Settings */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }}
                        className="w-full text-sm transition-colors group"
                        onClick={() => {
                          navigate("/wallet/setting");
                          setIsProfileDropdownOpen(false);
                        }}>
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <img src="/assets/icons/setting-green.svg" alt="Settings" />
                          <span className="text-white">Settings</span>
                        </div>
                      </motion.button>

                      <div className="h-px bg-white/10 mx-5 my-3"></div>

                      {/* Source Code */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full text-sm transition-colors group" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg_WHITE/5">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-white">Source Code</span>
                        </div>
                      </motion.button>

                      {/* X Account */}
                      <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} className="w-full mb-2 text-sm transition-colors group" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
                        <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-white">X Account</span>
                        </div>
                      </motion.button>

                      {/* Logout - gradient border pill */}
                      <div className="mx-5 mt-2 mb-2">
                        <div className="rounded-full p-[1px]">
                          <motion.button whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }}
                            className="w-full h-12 rounded-full text-[#9BEB83] font-medium border border-white/10"

                            onClick={() => {
                              navigate("/");
                              logout();
                            }}>
                            Log Out
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            wallet: "wallet",
            "analyze-address": "analyze-address",
            "analyze-contract": "analyze-contract",
            "transaction-history": "transaction-history",
            history: "scan-history",
          };
          const mobileIconKey = mobileIconMap[item.icon] || item.icon;
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
    </>
  );
}

