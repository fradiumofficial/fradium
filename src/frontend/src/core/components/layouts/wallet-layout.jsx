import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/wallet-provider";
import SidebarButton from "../SidebarButton";
import { useAuth } from "@/core/providers/auth-provider";

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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isLoading, userWallet, isCreatingWallet, network, setNetwork } = useWallet();

  // Menu configuration with logout function
  const menu = [
    { label: "Transactions", icon: "wallet", path: "/wallet" },
    {
      label: "Analyse Address",
      icon: "analyze-address",
      path: "/wallet/analyse-address",
    },
    {
      label: "Analyse Contract",
      icon: "analyze-contract",
      path: "/wallet/analyse-contract",
    },
    {
      label: "Transaction History",
      icon: "transaction-history",
      path: "/wallet/transaction-history",
    },
    { label: "Scan History", icon: "history", path: "/wallet/scan-history" },
  ];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".network-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleNetworkChange = (selectedNetwork) => {
    setNetwork(selectedNetwork);
    setIsDropdownOpen(false);
  };

  if (isCreatingWallet) {
    return <div>Creating wallet...</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#0F1219]">
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
                <button key={item.label} onClick={item.onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-all relative text-white hover:bg-[#181C22] hover:text-[#9BEB83] ${idx === 0 ? "mt-0" : "mt-1"}`}>
                  <img src={iconSrc} alt={item.label} className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-all relative text-white hover:bg-[#181C22] hover:text-[#9BEB83] ${idx === 0 ? "mt-0" : "mt-1"}`}>
                  <img src={iconSrc} alt={item.label} className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Bottom icons */}
        <div className="flex gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded bg-[#181C22] hover:bg-[#23282f]" onClick={() => window.open("https://github.com/fradium/fradium", "_blank")}>
            <img src="/assets/GithubLogo.svg" alt="Github" className="w-6 h-6" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded bg-[#181C22] hover:bg-[#23282f]" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
            <img src="/assets/XLogo.svg" alt="X" className="w-6 h-6" />
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
      <aside className="relative w-300 min-h-screen bg-[#0F1219] flex flex-col items-end pt-8 pr-6 pb-4 pl-2 overflow-hidden">
        {/* Pattern background */}
        <img src="/assets/pattern-sidebar.svg" alt="Pattern" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[320px] h-auto opacity-30 z-0 pointer-events-none select-none" />
        {/* Top action buttons */}
        <div className="flex flex-col items-end gap-4 w-full z-10">
          <div className="flex gap-3 w-full justify-end">
            {/* Network Dropdown */}
            <div className="relative network-dropdown">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-[#23272F] px-5 py-2 rounded-md text-white font-light text-base min-w-[140px] shadow hover:bg-[#23282f] transition">
                <img src="/assets/icons/construction.svg" alt="All Networks" className="w-5 h-5" />
                <span className="text-white capitalize">{network}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={`ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#23272F] rounded-md shadow-lg border border-[#3A3F47] z-50">
                  <div className="py-1">
                    <button onClick={() => handleNetworkChange("All Network")} className={`w-full text-left px-4 py-2 text-sm transition-colors ${network === "All Network" ? "bg-[#3A3F47] text-[#9BEB83]" : "text-white hover:bg-[#3A3F47] hover:text-[#9BEB83]"}`}>
                      All Network (default)
                    </button>
                    <button onClick={() => handleNetworkChange("Bitcoin")} className={`w-full text-left px-4 py-2 text-sm transition-colors ${network === "Bitcoin" ? "bg-[#3A3F47] text-[#9BEB83]" : "text-white hover:bg-[#3A3F47] hover:text-[#9BEB83]"}`}>
                      Bitcoin
                    </button>
                    <button onClick={() => handleNetworkChange("Ethereum")} className={`w-full text-left px-4 py-2 text-sm transition-colors ${network === "Ethereum" ? "bg-[#3A3F47] text-[#9BEB83]" : "text-white hover:bg-[#3A3F47] hover:text-[#9BEB83]"}`}>
                      Ethereum
                    </button>
                    <button onClick={() => handleNetworkChange("Solana")} className={`w-full text-left px-4 py-2 text-sm transition-colors ${network === "Solana" ? "bg-[#3A3F47] text-[#9BEB83]" : "text-white hover:bg-[#3A3F47] hover:text-[#9BEB83]"}`}>
                      Solana
                    </button>
                    <button onClick={() => handleNetworkChange("ICP")} className={`w-full text-left px-4 py-2 text-sm transition-colors ${network === "ICP" ? "bg-[#3A3F47] text-[#9BEB83]" : "text-white hover:bg-[#3A3F47] hover:text-[#9BEB83]"}`}>
                      ICP
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="flex items-center justify-center bg-[#23272F] w-12 h-12 rounded-md hover:bg-[#23282f] transition">
              <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
