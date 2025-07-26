import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/wallet-provider";
import SidebarButton from "../SidebarButton";
import { useAuth } from "@/core/providers/auth-provider";
import { Dialog, DialogContent } from "../ui/dialog";
import { LoadingState } from "@/core/components/ui/loading-state";

// Clean Architecture Imports
import { NETWORK_CONFIG, getSupportedNetworks } from "../../config/tokens.config";

import WelcomingWalletModal from "../modals/WelcomingWallet";
import { backend } from "declarations/backend";

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
  const { isLoading, userWallet, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue, networkFilters, updateNetworkFilters, createWallet, hasConfirmedWallet } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = React.useState(false);
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);
  const [showConfirmWalletModal, setShowConfirmWalletModal] = React.useState(false);

  // Get networks from configuration
  const NETWORKS = getSupportedNetworks().map((networkName) => {
    const config = NETWORK_CONFIG[networkName];
    return {
      key: networkName.toLowerCase(),
      name: config.name,
      icon: config.icon,
    };
  });

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
    const networkMapping = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum",
      solana: "Solana",
      fradium: "Fradium",
    };

    const filterKey = networkMapping[networkKey];
    return networkFilters[filterKey] || false;
  };

  const handleToggleNetwork = (key) => {
    // Map network keys to match networkFilters format
    const networkMapping = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum",
      solana: "Solana",
      fradium: "Fradium",
    };

    const networkName = networkMapping[key] || key;
    const newFilters = {
      ...networkFilters,
      [networkName]: !networkFilters[networkName],
    };
    updateNetworkFilters(newFilters);
  };

  const handleSaveNetworks = () => {
    // No need to explicitly save since updateNetworkFilters already saves to localStorage

    // Check if current selected network is disabled, if so switch to "All Networks"
    const networkMapping = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum",
      solana: "Solana",
      fradium: "Fradium",
    };

    const currentNetworkKey = network.toLowerCase();
    if (currentNetworkKey !== "all networks") {
      // Find the corresponding filter key
      const filterKey = Object.entries(networkMapping).find(([key, value]) => value.toLowerCase() === currentNetworkKey)?.[1];

      if (filterKey && !networkFilters[filterKey]) {
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
    { label: "Transactions", icon: "wallet", path: "/wallet" },
    {
      label: "Analyze Address",
      icon: "analyze-address",
      path: "/wallet/analyze-address",
    },
    {
      label: "Analyze Contract",
      icon: "analyze-contract",
      path: "/wallet/analyze-contract",
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
    const availableNetworks = [];

    if (networkFilters.Bitcoin) {
      availableNetworks.push({ key: "bitcoin", name: "Bitcoin", value: getNetworkValue("Bitcoin") });
    }

    if (networkFilters.Ethereum) {
      availableNetworks.push({ key: "ethereum", name: "Ethereum", value: getNetworkValue("Ethereum") });
    }

    if (networkFilters.Solana) {
      availableNetworks.push({ key: "solana", name: "Solana", value: getNetworkValue("Solana") });
    }

    if (networkFilters.Fradium) {
      availableNetworks.push({ key: "fradium", name: "Fradium", value: getNetworkValue("Fradium") });
    }

    return availableNetworks;
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

      <div className="block md:flex min-h-screen bg-[#0F1219] w-full max-w-full">
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
        {/* Sidebar kiri: hanya tampil di desktop */}
        <aside className="h-screen w-300 bg-[#0F1219] flex flex-col justify-between py-8 px-6 border-r border-[#23272F] hidden md:flex">
          {/* Logo dan Brand */}
          <div>
            <div className="flex items-center gap-3 mb-12">
              <Link to="/">
                <img src="/assets/logo-fradium.svg" alt="Fradium Logo" />
              </Link>
            </div>
            {/* Menu */}
            <nav className="flex flex-col gap-1">
              {menu.map((item, idx) => {
                const isActive = normalize(location.pathname) === normalize(item.path);
                const iconSrc = `/assets/icons/${item.icon}-${isActive ? "dark" : "light"}.svg`;
                return isActive ? (
                  <SidebarButton key={item.label} icon={<img src={iconSrc} alt={item.label} className="w-5 h-5" />} className={idx === 0 ? "mt-0" : "mt-1"} as={Link} to={item.path}>
                    {item.label}
                  </SidebarButton>
                ) : item.onClick ? (
                  <button key={item.label} onClick={item.onClick} className={`flex items-center gap-3 px-4 py-3 font-medium text-base transition-all relative text-white hover:bg-[#181C22] hover:text-[#9BEB83] ${idx === 0 ? "mt-0" : "mt-1"}`}>
                    <img src={iconSrc} alt={item.label} className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-4 py-3 font-medium text-base transition-all relative text-white hover:bg-[#181C22] hover:text-[#9BEB83] ${idx === 0 ? "mt-0" : "mt-1"}`}>
                    <img src={iconSrc} alt={item.label} className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Bottom icons */}
          <div className="flex gap-3">
            <button className="w-10 h-10 flex items-center justify-center-[#181C22] hover:bg-[#23282f]">
              <img src="/assets/GithubLogo.svg" alt="Github" className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center-[#181C22] hover:bg-[#23282f]">
              <img src="/assets/XLogo.svg" alt="X" className="w-6 h-6" />
            </button>
          </div>
        </aside>
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
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white">Source Code</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-white">X Account</span>
                    </button>
                    <button
                      className="flex items-center gap-3 px-4 py-3 text-base text-[#9BEB83]"
                      onClick={() => {
                        navigate("/wallet/setting");
                        setIsProfileDropdownOpen(false);
                      }}>
                      <img src="/assets/icons/setting-green.svg" alt="Settings" className="w-5 h-5" />
                      <span className="text-white">Settings</span>
                    </button>
                    <div className="flex-1"></div>
                    <button
                      className="w-full bg-[#9BEB83] text-[#23272F] font-semibold text-base py-3 rounded-lg mb-6 mt-2"
                      onClick={() => {
                        navigate("/");
                        logout();
                        setIsProfileDropdownOpen(false);
                      }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Logout
                      </span>
                    </button>
                  </div>
                  {/* Logout button sticky di bawah */}
                  <div className="sticky bottom-0 left-0 right-0 bg-[#23242A] px-4 pb-6 pt-2 z-10">
                    <button
                      className="w-full bg-[#9BEB83] text-[#23272F] font-semibold text-base py-3 rounded-lg flex items-center justify-center gap-2 shadow-md"
                      onClick={() => {
                        navigate("/");
                        logout();
                        setIsProfileDropdownOpen(false);
                      }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke="#23272F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <main className="flex-1 w-full max-w-full p-4 md:p-8 overflow-auto pb-28 md:pb-8 pt-8 md:pt-7">
          <Outlet />
        </main>
        {/* Sidebar kanan: hanya tampil di desktop */}
        <aside className="relative w-100 min-h-screen bg-[#0F1219] flex flex-col pt-6 pr-6 pb-6 pl-4 overflow-hidden hidden md:flex">
          {/* Pattern background - diperbaiki positioning */}
          <img src="/assets/pattern-sidebar.png" alt="Pattern" className="absolute bottom-0 w-60 right-0 z-0 pointer-events-none select-none object-cover object-bottom-right " />

          {/* Top action buttons */}
          <div className="flex flex-col gap-4 w-full z-10 mb-auto">
            <div className="flex gap-3 w-full justify-end">
              {/* Network Dropdown */}
              <div className="relative network-dropdown">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 bg-[#23272F] px-4 py-2.5 text-white font-medium text-sm w-[190px] hover:bg-[#2A2F36] transition-all">
                  <img src="/assets/icons/construction.svg" alt="All Networks" className="w-6 h-6" />
                  <span className="text-white pr-2 capitalize text-sm">{network}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className={`ml-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                    <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full mt-2 w-64 bg-[#3A3F47] shadow-lg border border-[#4A4F57] z-50 overflow-hidden" style={{ left: "-10px" }}>
                    <div className="py-2">
                      {/* All Networks - always shown */}
                      <button onClick={() => handleNetworkChange("All Networks")} className="w-full text-sm transition-colors group">
                        <div className={`mx-4 flex items-center justify-between py-3 px-2 transition-colors group-hover:bg-[#4A4F57] ${network === "All Networks" ? "bg-[#4A4F57]" : ""}`}>
                          <div className="flex items-center gap-3">
                            {network === "All Networks" && (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                                <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {network !== "All Networks" && <div className="w-4 h-4"></div>}
                            <span className="text-white font-medium">All Networks</span>
                          </div>
                          <span className="text-[#9CA3AF] text-sm font-medium">{getNetworkValue("All Networks")}</span>
                        </div>
                      </button>

                      {/* Dynamic network list based on active networks */}
                      {getAvailableNetworks().length > 0 && (
                        <>
                          {/* Divider */}
                          <div className="h-px bg-[#5A5F67] mx-4"></div>

                          {getAvailableNetworks().map((net, index) => (
                            <React.Fragment key={net.key}>
                              <button onClick={() => handleNetworkChange(net.name)} className="w-full text-sm transition-colors group">
                                <div className={`mx-4 flex items-center justify-between py-3 px-2 transition-colors group-hover:bg-[#4A4F57] ${network === net.name ? "bg-[#4A4F57]" : ""}`}>
                                  <div className="flex items-center gap-3">
                                    {network === net.name && (
                                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                                        <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                    {network !== net.name && <div className="w-4 h-4"></div>}
                                    <span className="text-white">{net.name}</span>
                                  </div>
                                  <span className="text-[#9CA3AF] text-sm font-medium">{net.value}</span>
                                </div>
                              </button>
                              {/* Add divider between networks except for the last one */}
                              {index < getAvailableNetworks().length - 1 && <div className="h-px bg-[#5A5F67] mx-4"></div>}
                            </React.Fragment>
                          ))}

                          {/* Divider before manage networks */}
                          <div className="h-px bg-[#5A5F67] mx-4"></div>
                        </>
                      )}

                      {/* Manage Networks */}
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#9BEB83] hover:bg-[#4A4F57] transition-colors" onClick={() => setShowManageNetworks(true)}>
                        <img src="/assets/icons/construction.svg" alt="Manage Networks" />
                        <span className="font-medium">Manage Networks</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Button */}
              <div className="relative profile-dropdown">
                <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center justify-center bg-[#23272F] w-11 h-11 hover:bg-[#2A2F36] transition-all">
                  <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#3A3F47] shadow-lg border border-[#4A4F57] z-50 overflow-hidden" style={{ left: "-210px" }}>
                    <div className="py-2">
                      {/* Hide Balance */}
                      <button className="w-full text-sm transition-colors group" onClick={handleToggleHideBalance}>
                        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
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
                          <span className="text-white">{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                        </div>
                      </button>

                      {/* Your Addresses */}
                      <button className="w-full text-sm transition-colors group">
                        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                          <img src="/assets/icons/copy-green.svg" alt="Your addresses" />
                          <span className="text-white">Your addresses</span>
                        </div>
                      </button>

                      {/* Refer Your Friends */}
                      {/* <button className="w-full text-sm transition-colors group">
                      <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                        <img src="/assets/icons/share-green.svg" alt="Refer your friends" />
                        <span className="text-white">Refer your friends</span>
                      </div>
                    </button> */}
                      <div className="h-px bg-white/5 mx-4"></div>

                      {/* Why Fradium */}
                      <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <circle cx="12" cy="12" r="10" stroke="#9BE4A0" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="12" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="text-white">Why Fradium</span>
                        </div>
                      </button>

                      {/* Documentation */}
                      <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14,2 14,8 20,8" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="10,9 9,9 8,9" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-white">Documentation</span>
                        </div>
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
        </aside>
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
