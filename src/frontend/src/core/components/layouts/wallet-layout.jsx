import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/wallet-provider";
import SidebarButton from "../SidebarButton";
import { useAuth } from "@/core/providers/auth-provider";
import { Dialog, DialogContent } from "../ui/dialog";

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
  const { isLoading, userWallet, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = React.useState(false);
  const [activeNetworks, setActiveNetworks] = React.useState({
    bitcoin: true,
    ethereum: true,
    fradium: true,
  });
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = React.useState(false);
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);
  const NETWORKS = [
    {
      key: "bitcoin",
      name: "Bitcoin",
      icon: "/assets/icons/bitcoin-grey.svg",
    },
    {
      key: "ethereum",
      name: "Ethereum",
      icon: "/assets/icons/eth-grey.svg",
    },
    {
      key: "fradium",
      name: "Fradium",
      icon: "/assets/icons/fum-grey.svg",
    },
  ];
  // Function to get localStorage key for user's active networks
  const getActiveNetworksKey = () => {
    return user?.identity?.getPrincipal()?.toString() ? `activeNetworks_${user.identity.getPrincipal().toString()}` : "activeNetworks_default";
  };

  // Function to get localStorage key for user's hide balance setting
  const getHideBalanceKey = () => {
    return user?.identity?.getPrincipal()?.toString() ? `hideBalance_${user.identity.getPrincipal().toString()}` : "hideBalance_default";
  };

  // Function to save active networks to localStorage
  const saveActiveNetworks = (networks) => {
    const key = getActiveNetworksKey();
    try {
      localStorage.setItem(key, JSON.stringify(networks));

      // Trigger storage event for cross-component sync
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: key,
          newValue: JSON.stringify(networks),
          storageArea: localStorage,
        })
      );
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Function to load active networks from localStorage
  const loadActiveNetworks = () => {
    const key = getActiveNetworksKey();

    try {
      const saved = localStorage.getItem(key);

      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading/parsing saved active networks:", error);
    }

    // Return default networks
    const defaultNetworks = {
      bitcoin: true,
      ethereum: true,
      fradium: true,
    };
    return defaultNetworks;
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

  const handleToggleNetwork = (key) => {
    setActiveNetworks((prev) => {
      const newNetworks = { ...prev, [key]: !prev[key] };
      return newNetworks;
    });
  };

  const handleSaveNetworks = () => {
    // Explicitly save the current active networks
    saveActiveNetworks(activeNetworks);

    // Check if current selected network is disabled, if so switch to "All Networks"
    const currentNetworkKey = network.toLowerCase();
    if (currentNetworkKey !== "all networks" && !activeNetworks[currentNetworkKey]) {
      setNetwork("All Networks");
    }

    setShowManageNetworks(false);
  };

  const handleToggleHideBalance = () => {
    const newHideBalance = !contextHideBalance;
    setContextHideBalance(newHideBalance);
    saveHideBalance(newHideBalance);
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

  // Load active networks from localStorage on component mount and user change
  React.useEffect(() => {
    const loadSavedNetworks = () => {
      try {
        const savedNetworks = loadActiveNetworks();
        setActiveNetworks(savedNetworks);
        setIsInitialLoad(false); // Mark initial load as complete
        setHasLoadedFromStorage(true); // Mark as loaded from storage
      } catch (error) {
        console.error("Error loading active networks:", error);
        setIsInitialLoad(false);
        setHasLoadedFromStorage(true);
      }
    };

    // Only load if we haven't loaded from storage yet
    if (!hasLoadedFromStorage) {
      // Load immediately if user is available
      if (user?.identity?.getPrincipal()) {
        loadSavedNetworks();
      }
      // Also try to load from default storage if no user yet
      else {
        loadSavedNetworks();
      }
    }
  }, [user?.identity?.getPrincipal()?.toString(), hasLoadedFromStorage]);

  // Load hide balance setting from localStorage on component mount and user change
  React.useEffect(() => {
    const loadSavedHideBalance = () => {
      try {
        const savedHideBalance = loadHideBalance();
        setContextHideBalance(savedHideBalance);
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
          const newNetworks = JSON.parse(e.newValue);
          setActiveNetworks(newNetworks);
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

    if (activeNetworks.bitcoin) {
      availableNetworks.push({ key: "bitcoin", name: "Bitcoin", value: getNetworkValue("Bitcoin") });
    }

    if (activeNetworks.ethereum) {
      availableNetworks.push({ key: "ethereum", name: "Ethereum", value: getNetworkValue("Ethereum") });
    }

    if (activeNetworks.fradium) {
      availableNetworks.push({ key: "fradium", name: "Fradium", value: getNetworkValue("Fradium") });
    }

    return availableNetworks;
  };

  if (isCreatingWallet) {
    return <div>Creating wallet...</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#0F1219]">
      {/* Modal Manage Networks */}
      <Dialog
        open={showManageNetworks}
        onOpenChange={(open) => {
          if (!open) {
            // Save networks when modal is closed
            saveActiveNetworks(activeNetworks);
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
                  <button className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 ${activeNetworks[net.key] ? "bg-[#9BE4A0]" : "bg-[#23272F]"}`} onClick={() => handleToggleNetwork(net.key)}>
                    <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${activeNetworks[net.key] ? "translate-x-5" : "translate-x-0"}`} />
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
      <aside className="h-screen w-300 bg-[#0F1219] flex flex-col justify-between py-8 px-6 border-r border-[#23272F]">
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
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
      <aside className="relative w-100 min-h-screen bg-[#0F1219] flex flex-col pt-6 pr-6 pb-6 pl-4 overflow-hidden">
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
                    <button className="w-full text-sm transition-colors group" onClick={() => navigate("/?section=why-fradium")}>
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
                    <button className="w-full text-sm transition-colors group">
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
  );
}
