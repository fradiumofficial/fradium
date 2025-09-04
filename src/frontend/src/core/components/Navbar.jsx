import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronDown, FileText, LogOut, Coins } from "lucide-react";

import { fradium_token as token } from "declarations/fradium_token";

import { useAuth } from "@/core/providers/AuthProvider";
import { Button as ButtonShad } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";
import { LoadingState } from "@/core/components/ui/LoadingState";
import SidebarButton from "@/core/components/SidebarButton";
import { convertE8sToToken, formatAddress } from "@/core/lib/canisterUtils";
import { cn } from "@/core/lib/utils";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "https://fradium.gitbook.io/docs", external: true },
  { label: "View Reports", href: "/reports" },
  { label: "Assistant", href: "/assistant" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, handleLogin, logout, identity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const productsDropdownTimeout = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const pathname = location.pathname || "/";

  const isItemActive = (item) => {
    if (item.external) return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };

  const desktopItemClass = (active) =>
    `font-[General Sans, sans-serif] text-base no-underline transition-colors duration-200 text-center ${active ? "text-white font-semibold" : "text-white/70 hover:text-[#9BEB83] font-normal"
    }`;

  const mobileItemClass = (active) =>
    `font-[General Sans, sans-serif] text-lg ${active ? "text-white font-semibold" : "text-white/70 font-medium"} no-underline rounded-lg px-4 py-3 transition-all duration-200 hover:shadow-[0_0_8px_2px_#9BEB83] hover:bg-[#181C22]/60 focus:bg-[#181C22]/80 focus:shadow-[0_0_12px_3px_#A259FF] active:scale-95`;

  const isProductsActive = pathname.startsWith("/products");
  const productsBtnClass = `font-[General Sans, sans-serif] text-base no-underline transition-colors duration-200 flex items-center gap-1 ${isProductsActive ? "text-white font-semibold" : "text-white/70 hover:text-[#9BEB83] font-normal"
    }`;

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchBalance() {
      try {
        const response = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setBalance(response);
      } catch (error) { }
    }

    fetchBalance();

    // Listen for balance update events
    const handleBalanceUpdate = () => {
      fetchBalance();
    };

    window.addEventListener("balance-updated", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balance-updated", handleBalanceUpdate);
    };
  }, [isAuthenticated, identity]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await handleLogin();
    } catch (error) {
      console.log("handleSignIn error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full backdrop-blur-lg bg-black/50   flex items-center justify-center min-h-[72px] z-[1000]">
      <div className="w-full max-w-[1440px] flex items-center justify-between lg:px-12 md:px-8 sm:px-4 px-2 min-h-[72px]">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 select-none min-w-fit cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo.svg" alt="Crypgo Logo" className="h-8 sm:h-9 w-auto" draggable="false" />
          <span className="font-medium text-[22px] sm:text-[28px] text-white tracking-wider font-[General Sans, sans-serif]">
            Fradi<span className="text-[#9BEB83]">um</span>
          </span>
        </div>
        {/* Menu Desktop */}
        <nav className="hidden lg:flex flex-1 justify-center items-center gap-8 xl:gap-12 relative">
          {navigationItems.map((item) => {
            const active = isItemActive(item);
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" className={desktopItemClass(false)}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} className={desktopItemClass(active)}>
                {item.label}
              </Link>
            );
          })}
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(productsDropdownTimeout.current);
              setProductsDropdown(true);
            }}
            onMouseLeave={() => {
              productsDropdownTimeout.current = setTimeout(() => setProductsDropdown(false), 200);
            }}>
            <button className={productsBtnClass} onClick={() => setProductsDropdown((v) => !v)} type="button">
              Products <ChevronDown className="w-4 h-4" />
            </button>
            {productsDropdown && (
              <div
                className="absolute top-full left-0 mt-2 w-40 bg-black/70 backdrop-blur-lg border border-white/10 rounded-lg z-50 flex flex-col py-2 animate-fadeIn"
                onMouseEnter={() => {
                  clearTimeout(productsDropdownTimeout.current);
                  setProductsDropdown(true);
                }}
                onMouseLeave={() => {
                  productsDropdownTimeout.current = setTimeout(() => setProductsDropdown(false), 200);
                }}>
                <Link to="/products" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Extension
                </Link>
                <Link to="/products-wallet" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Wallet
                </Link>
              </div>
            )}
          </div>
        </nav>
        {/* Sign In Button Desktop */}
        <ButtonShad
          className="hidden md:flex bg-transparent text-white hover:bg-white/10 hover:backdrop-blur-lg mr-4"
          onClick={() => {
            if (!isAuthenticated) {
              return;
            }

            navigate("/balance");
          }}>
          <span className="text-sm font-medium h-5">{isAuthenticated ? convertE8sToToken(balance) : 0} FADM</span>
        </ButtonShad>
        {/* User Profile Desktop */}
        {isAuthenticated ? (
          <div className="hidden md:block">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-black/5 focus:bg-black/5">
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${identity.getPrincipal().toString()}&colors=000000`} alt="User avatar" className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-medium text-white">{formatAddress(identity.getPrincipal().toString())}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform text-[#9BEB83]", isOpen && "rotate-180")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black/70 backdrop-blur-lg z-[1000] border border-transparent">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1 text-xs text-white">
                      <p>{identity.getPrincipal().toString()}</p>
                      <button onClick={() => navigator.clipboard.writeText(identity.getPrincipal().toString())} className="hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/balance")}>
                  <Coins className="mr-2 h-4 w-4" />
                  <span>Balance</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/my-report")}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Reports</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden lg:flex relative items-center flex-shrink-0 min-w-fit">
            <SidebarButton buttonClassName="py-2" className="translate-y-0" onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingState type="spinner" size="sm" color="primary" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In →"
              )}
            </SidebarButton>
          </div>
        )}
        {/* Hamburger Mobile */}
        <button className="lg:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#9BEB83]" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Toggle menu">
          {/* Hamburger Icon */}
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile Menu Dropdown - Web3 Style */}
      {menuOpen && (
        <div
          className="lg:hidden fixed top-[72px] left-0 w-full min-h-[calc(100vh-72px)] z-[1100] flex flex-col items-center justify-start px-4 py-6"
          style={{
            backdropFilter: "blur(16px)",
            background: "rgba(12,13,20,0.85)",
          }}>
          {/* Background visual (dummy asset) */}
          <img src="/assets/images/glow.png" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" alt="bg" />
          {/* Glassmorphism Card */}
          <div className="relative w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-[#23272f80] to-[#181c2280] border border-[rgba(155,235,131,0.25)] shadow-[0_4px_32px_0_rgba(155,235,131,0.15)] p-6 flex flex-col gap-6 animate-fadeIn">
            {/* Menu items */}
            {navigationItems.map((item) =>
              item.external ? (
                <a key={item.label} href={item.href} target="_blank" className="font-[General Sans, sans-serif] text-lg font-bold text-white no-underline rounded-lg px-4 py-3 transition-all duration-200 hover:shadow-[0_0_8px_2px_#9BEB83] hover:bg-[#181C22]/60 focus:bg-[#181C22]/80 focus:shadow-[0_0_12px_3px_#A259FF] active:scale-95" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className="font-[General Sans, sans-serif] text-lg font-bold text-white no-underline rounded-lg px-4 py-3 transition-all duration-200 hover:shadow-[0_0_8px_2px_#9BEB83] hover:bg-[#181C22]/60 focus:bg-[#181C22]/80 focus:shadow-[0_0_12px_3px_#A259FF] active:scale-95" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              )
            )}
            {/* Products Dropdown Mobile */}
            <div className="w-full">
              <div className="font-[General Sans, sans-serif] text-lg font-bold text-white no-underline rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-[0_0_8px_2px_#9BEB83] hover:bg-[#181C22]/60 focus:bg-[#181C22]/80 focus:shadow-[0_0_12px_3px_#A259FF] active:scale-95" onClick={() => setProductsDropdown((v) => !v)}>
                Products <ChevronDown className="w-4 h-4" />
              </div>
              {productsDropdown && (
                <div className="flex flex-col bg-[#181C22] rounded-lg shadow-lg border border-[#23272f] mt-1">
                  <Link
                    to="/products"
                    className="px-4 py-2 text-white hover:bg-[#23272f] text-left text-base transition-colors"
                    onClick={() => {
                      setProductsDropdown(false);
                      setMenuOpen(false);
                    }}>
                    Extension
                  </Link>
                  <Link
                    to="/products-wallet"
                    className="px-4 py-2 text-white hover:bg-[#23272f] text-left text-base transition-colors"
                    onClick={() => {
                      setProductsDropdown(false);
                      setMenuOpen(false);
                    }}>
                    Wallet
                  </Link>
                </div>
              )}
            </div>
            {/* Sign In Button Mobile - Neon Style */}
            <SidebarButton buttonClassName="py-1" onClick={handleSignIn} disabled={isLoading} className="w-11/12 max-w-xs mt-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingState type="spinner" size="sm" color="primary" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In →"
              )}
            </SidebarButton>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
