import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/core/providers/WalletProvider";
import SwitchServices from "@/core/components/common/SwitchServices.jsx";
import ProfileDropdown from "@/core/components/common/ProfileDropdown.jsx";
import { useAuth } from "@/core/providers/AuthProvider";
import { LoadingState } from "@/core/components/ui/LoadingState";
import { NETWORK_CONFIG } from "@/core/config/tokenConfig.js";
import { backend } from "declarations/backend";
// toast not used for copy feedbacks anymore
import { motion, AnimatePresence } from "framer-motion";
import { User, ArrowRightLeft, Wallet, History, PlusCircle, FileText, ChevronDown, Check, Eye, Copy, LogOut, Settings, X } from "lucide-react";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";

import WelcomingWalletModal from "../modals/WelcomingWallet";
import ManageNetworksModal from "../modals/ManageNetworksModal";
import { SocialLinksSidebar, SocialLinksDropdown } from "@/core/components/common/SocialLinks.jsx";

const MotionLink = motion(Link);

// Trade Invitation Alert Component
function TradeInvitationAlert({ invitation, onClose }) {
  const navigate = useNavigate();

  if (!invitation) return null;

  const formatEscrowAmount = (tokenSymbol, nat) => {
    const getDecimalsForToken = (symbol) => {
      switch (symbol) {
        case "ETH":
        case "ckETH":
          return 18;
        case "SOL":
          return 9;
        case "ICP":
        case "FRADIUM":
        case "BTC":
        case "ckBTC":
        default:
          return 8;
      }
    };

    const formatNatToDecimal = (nat, decimals) => {
      try {
        const n = BigInt(nat ?? 0);
        const d = Math.max(0, Number(decimals ?? 8));
        const base = BigInt(10) ** BigInt(d);
        const intPart = n / base;
        const fracPart = n % base;
        let fracStr = fracPart.toString().padStart(d, "0");
        fracStr = fracStr.replace(/0+$/, "");
        return fracStr.length ? `${intPart.toString()}.${fracStr}` : intPart.toString();
      } catch (_e) {
        return String(nat ?? 0);
      }
    };

    const sym = tokenSymbol;
    const dec = getDecimalsForToken(sym);
    return `${formatNatToDecimal(nat, dec)} ${sym}`;
  };

  const getTokenInfo = (tokenType) => {
    const tokenMap = {
      FRADIUM: { symbol: "FRADIUM", name: "Fradium", imageUrl: "/assets/images/coins/fradium.webp" },
      ICP: { symbol: "ICP", name: "Internet Computer", imageUrl: "/assets/images/coins/icp.webp" },
      ckBTC: { symbol: "ckBTC", name: "Chain Key Bitcoin", imageUrl: "/assets/images/coins/ckbtc.webp" },
      ckETH: { symbol: "ckETH", name: "Chain Key Ethereum", imageUrl: "/assets/images/coins/cketh.webp" },
      BTC: { symbol: "BTC", name: "Bitcoin", imageUrl: "/assets/images/coins/bitcoin.webp" },
      ETH: { symbol: "ETH", name: "Ethereum", imageUrl: "/assets/images/coins/ethereum.webp" },
      SOL: { symbol: "SOL", name: "Solana", imageUrl: "/assets/images/coins/solana.webp" },
    };
    return tokenMap[tokenType] || { symbol: tokenType, name: tokenType, imageUrl: "/assets/images/coins/bitcoin.webp" };
  };

  const variantName = (v) => (v && typeof v === "object" ? Object.keys(v)[0] : v);
  const tokenFromSymbol = variantName(invitation.token_from);
  const tokenToSymbol = variantName(invitation.token_to);
  const tokenFromInfo = getTokenInfo(tokenFromSymbol);
  const tokenToInfo = getTokenInfo(tokenToSymbol);

  const expiresAt = new Date(Number(invitation.expires_at) / 1000000);
  const timeLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#171A1C] border border-white/10 rounded-xl p-4 mb-4"
      style={{
        background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        backdropFilter: "blur(10px)",
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">Trade Invitation</span>
              <span className="text-white/60 text-xs">•</span>
              <span className="text-white/60 text-xs">{hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${minutesLeft}m left`}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <img src={tokenFromInfo.imageUrl} alt={tokenFromInfo.symbol} className="w-4 h-4 rounded-full" />
              <span>{formatEscrowAmount(tokenFromInfo.symbol, invitation.amount_from)}</span>
              <ArrowRightLeft className="w-3 h-3 text-white/50" />
              <img src={tokenToInfo.imageUrl} alt={tokenToInfo.symbol} className="w-4 h-4 rounded-full" />
              <span>{formatEscrowAmount(tokenToInfo.symbol, invitation.amount_to)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ButtonPurple onClick={() => navigate(`/escrow/detail/${invitation.escrow_id}`)} size="sm" textSize="text-xs" fontWeight="medium">
            View Details
          </ButtonPurple>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EscrowLayoutContent() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const { logout, user, identity } = useAuth();
  const navigate = useNavigate();
  const { isLoading, isCreatingWallet, network, setNetwork, hideBalance: contextHideBalance, setHideBalance: setContextHideBalance, getNetworkValue, networkFilters, updateNetworkFilters, addresses } = useWallet();
  const [showManageNetworks, setShowManageNetworks] = React.useState(false);
  const [hasLoadedHideBalance, setHasLoadedHideBalance] = React.useState(false);

  // Trade invitation alert state
  const [tradeInvitation, setTradeInvitation] = React.useState(null);
  const [isCheckingInvitations, setIsCheckingInvitations] = React.useState(false);

  // Helper functions for trade invitation detection
  const variantName = (v) => (v && typeof v === "object" ? Object.keys(v)[0] : v);
  const unwrapOpt = (opt) => (Array.isArray(opt) ? opt[0] ?? null : opt ?? null);

  // Check for trade invitations where current user is the recipient
  const checkForTradeInvitations = async () => {
    // Try different ways to get user identity
    const userIdentity = user?.identity || identity;
    const userPrincipal = userIdentity?.getPrincipal?.();

    if (!userPrincipal || isCheckingInvitations) {
      return;
    }

    try {
      setIsCheckingInvitations(true);

      // Get escrows received by user (where they are the recipient)
      const res = await backend.get_received_escrows_paginated(0, 50);

      if (res && Array.isArray(res.items)) {
        // Find escrows where current user is the recipient and state is AwaitingAccept
        const invitations = res.items.filter((escrow) => {
          const state = variantName(escrow.state);
          const expiresAt = new Date(Number(escrow.expires_at) / 1000000);
          const isExpired = Date.now() >= expiresAt.getTime();

          return state === "AwaitingAccept" && !isExpired; // Only pending invitations that haven't expired
        });

        if (invitations.length > 0) {
          // Show the first invitation
          const invitation = invitations[0];
          const normalized = {
            ...invitation,
            _token_from: variantName(invitation.token_from),
            _token_to: variantName(invitation.token_to),
            _state: variantName(invitation.state),
            _recipient: unwrapOpt(invitation.recipient),
            _description: unwrapOpt(invitation.description),
            _metadata: unwrapOpt(invitation.metadata),
          };
          setTradeInvitation(normalized);
        }
      }
    } catch (error) {
      console.error("Error checking for trade invitations:", error);
    } finally {
      setIsCheckingInvitations(false);
    }
  };

  // Handle closing trade invitation alert
  const handleCloseInvitation = () => {
    setTradeInvitation(null);
  };

  // Get networks from tokenUtils configuration
  const NETWORKS = NETWORK_CONFIG.map((network) => ({
    key: network.id,
    name: network.name,
    icon: network.icon,
  }));

  // Helper: map sidebar label to Lucide React icon component
  const getSidebarIcon = (label, active) => {
    const iconMap = {
      "P2P Trade": ArrowRightLeft,
      "Create Escrow": PlusCircle,
      "My Escrow": FileText,
      "Escrow History": History,
    };
    return iconMap[label] || Wallet;
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
    { label: "P2P Trade", icon: "p2p-trade", path: "/escrow" },
    { label: "Create Escrow", icon: "p2p-payment", path: "/escrow/create" },
    { label: "My Escrow", icon: "escrow-history", path: "/escrow/my-escrow" },
    { label: "Escrow History", icon: "escrow-history", path: "/escrow/history" },
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

  // Check for trade invitations when user is authenticated
  React.useEffect(() => {
    const userIdentity = user?.identity || identity;
    const userPrincipal = userIdentity?.getPrincipal?.();

    if (userPrincipal) {
      // Check immediately
      checkForTradeInvitations();

      // Then check every 30 seconds
      const interval = setInterval(() => {
        checkForTradeInvitations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.identity?.getPrincipal, identity?.getPrincipal]);

  // Also check when location changes (user navigates)
  React.useEffect(() => {
    const userIdentity = user?.identity || identity;
    const userPrincipal = userIdentity?.getPrincipal?.();

    if (userPrincipal) {
      checkForTradeInvitations();
    }
  }, [location.pathname]);

  return (
    <>
      <WelcomingWalletModal isOpen={isCreatingWallet} />

      <div className="relative block md:flex min-h-screen bg-[#0F1219] w-full max-w-full">
        {/* Global background spanning all escrow sections */}
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/escrow/background.webp" alt="" aria-hidden="true" decoding="async" loading="eager" className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none" />
        <div className="absolute inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>
        {/* Modal Manage Networks */}
        <ManageNetworksModal isOpen={showManageNetworks} onClose={() => setShowManageNetworks(false)} networkFilters={networkFilters} updateNetworkFilters={updateNetworkFilters} currentNetwork={network} setNetwork={setNetwork} />
        {/* ===== START: SIDEBAR KIRI (Desktop) ===== */}
        <aside className="relative z-10 w-[200px] lg:w-[240px] xl:w-[320px] bg-transparent flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-white/10 hidden md:flex min-h-screen">
          {/* Logo dan Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <Link to="/">
                <img src="/assets/logo/fradium-escrow.svg" className="h-[50px] sm:h-[50px] w-auto" alt="Fradium Logo" />
              </Link>
            </div>
            {/* Menu */}
            <nav className="flex flex-col gap-2">
              {menu.map((item, idx) => {
                const isActive = normalize(location.pathname) === normalize(item.path);
                const IconComponent = getSidebarIcon(item.label, isActive);
                return isActive ? (
                  <Link key={item.label} to={item.path} className="relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all">
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-white/20 via-white/10 to-transparent" />
                    <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-[#7C72FE] shadow-[0_0_12px_rgba(124,114,254,0.5)]" />
                    <IconComponent className="w-5 h-5 relative z-10 text-white" />
                    <span className="relative z-10 text-white font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <Link key={item.label} to={item.path} className="flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all hover:bg-white/5 rounded-lg">
                    <IconComponent className="w-5 h-5 text-white/70" />
                    <span className="text-white/70 font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Bottom icons - fixed at bottom */}
          <SocialLinksSidebar color="#7C72FE" />
        </aside>
        {/* ===== END: SIDEBAR KIRI ===== */}

        {/* ===== START: MAIN CONTENT ===== */}
        <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 overflow-visible pb-28 md:pb-8 pt-8 md:pt-7 flex flex-col">
          {/* Trade Invitation Alert - Full Width (Hidden on detail page) */}
          {!location.pathname.includes("/escrow/detail/") && (
            <div className="w-full mb-4">
              <AnimatePresence>{tradeInvitation && <TradeInvitationAlert invitation={tradeInvitation} onClose={handleCloseInvitation} />}</AnimatePresence>
            </div>
          )}
          {/* Topbar actions for md screens - Escrow: without All Networks, but with Switch Services */}
          <div className="hidden md:flex xl:hidden w-full items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <SwitchServices compact={false} color="#7C72FE" />
            </div>
            <div className="flex items-center gap-3">
              <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={false} logout={logout} color="#7C72FE" showHideBalance={false} />
            </div>
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
            <div className="flex gap-3 w-full justify-between items-center">
              <SwitchServices compact={false} color="#7C72FE" />
              <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={contextHideBalance} handleToggleHideBalance={handleToggleHideBalance} icpPrincipal={addresses?.icp_principal} showSettings={false} logout={logout} color="#7C72FE" showHideBalance={false} />
            </div>
          </div>
        </aside>
        {/* ===== END: SIDEBAR KANAN ===== */}
      </div>

      {/* Bottom Navigation: hanya tampil di mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#181C22] border-t border-[#23272F] flex md:hidden justify-between px-1 py-3" style={{ height: "80px" }}>
        {menu.map((item, idx) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          const IconComponent = getSidebarIcon(item.label, isActive);
          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center justify-center flex-1 mx-1 transition-all duration-150 ${isActive ? "text-[#7C72FE] bg-[#7C72FE1A] rounded-sm shadow-[0_0_8px_0_#7C72FE1A]" : "text-[#FFFFFF99]"}`} style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "6px 0" }}>
              <IconComponent className={`w-5 h-5 mb-0.5 ${isActive ? "text-[#7C72FE]" : "text-[#FFFFFF99]"}`} />
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

export default function EscrowLayout() {
  return (
    <WalletProvider>
      <EscrowLayoutContent />
    </WalletProvider>
  );
}
