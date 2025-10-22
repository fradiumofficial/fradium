import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronDown, FileText, LogOut, Coins, Menu, User } from "lucide-react";

import { fradium_ledger as token } from "declarations/fradium_ledger";

import { useAuth } from "@/core/providers/AuthProvider";
import { Button as ButtonShad } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/core/components/ui/sheet";
import { LoadingState } from "@/core/components/ui/LoadingState";
import SidebarButton from "@/core/components/SidebarButton";
import ButtonPurple from "@/core/components/ButtonPurple";
import { convertE8sToToken, formatAddress } from "@/core/lib/canisterUtils";
import { cn } from "@/core/lib/utils";
import toast from "react-hot-toast";

function NavbarCopyPrincipal({ identity }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex items-center gap-1 text-xs text-white">
      <p className="truncate max-w-[160px]" title={identity.getPrincipal().toString()}>
        {identity.getPrincipal().toString()}
      </p>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(identity.getPrincipal().toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch (error) {
            console.error("Failed to copy Principal ID:", error);
            toast.error("Failed to copy Principal ID");
          }
        }}
        className="hover:text-foreground"
        aria-label={copied ? "Copied" : "Copy Principal"}>
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9BE4A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
}

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "https://fradium.gitbook.io/docs", external: true },
  { label: "View Reports", href: "/reports" },
  { label: "Assistant", href: "/assistant" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, handleLogin, logout, identity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const productsDropdownTimeout = useRef();
  const [developersDropdown, setDevelopersDropdown] = useState(false);
  const developersDropdownTimeout = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [mobileProductsDropdown, setMobileProductsDropdown] = useState(false);
  const [mobileDevelopersDropdown, setMobileDevelopersDropdown] = useState(false);

  const pathname = location.pathname || "/";

  const isItemActive = (item) => {
    if (item.external) return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };

  const desktopItemClass = (active) => `font-[General Sans, sans-serif] text-base no-underline transition-colors duration-200 text-center ${active ? "text-white font-semibold" : "text-white/70 hover:text-[#9BEB83] font-normal"}`;

  const isProductsActive = pathname.startsWith("/products");
  const productsBtnClass = `font-[General Sans, sans-serif] text-base no-underline transition-colors duration-200 flex items-center gap-1 ${isProductsActive ? "text-white font-semibold" : "text-white/70 hover:text-[#9BEB83] font-normal"}`;

  const isDevelopersActive = pathname.startsWith("/developers");
  const developersBtnClass = `font-[General Sans, sans-serif] text-base no-underline transition-colors duration-200 flex items-center gap-1 ${isDevelopersActive ? "text-white font-semibold" : "text-white/70 hover:text-[#9BEB83] font-normal"}`;

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchBalance() {
      try {
        const response = await token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        });
        setBalance(response);
      } catch (error) {}
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
          <img src="/assets/logo/fradium.svg" alt="Fradium Logo" className="h-9 sm:h-9 w-auto" draggable="false" />
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
          {/* Developers Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(developersDropdownTimeout.current);
              setDevelopersDropdown(true);
            }}
            onMouseLeave={() => {
              developersDropdownTimeout.current = setTimeout(() => setDevelopersDropdown(false), 200);
            }}>
            <button className={developersBtnClass} onClick={() => setDevelopersDropdown((v) => !v)} type="button">
              Developers <ChevronDown className="w-4 h-4" />
            </button>
            {developersDropdown && (
              <div
                className="absolute top-full left-0 mt-0 w-56 bg-black backdrop-blur-lg border border-white/10 rounded-lg z-50 flex flex-col py-2 animate-fadeIn"
                onMouseEnter={() => {
                  clearTimeout(developersDropdownTimeout.current);
                  setDevelopersDropdown(true);
                }}
                onMouseLeave={() => {
                  developersDropdownTimeout.current = setTimeout(() => setDevelopersDropdown(false), 200);
                }}>
                <Link to="/developer-overview" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setDevelopersDropdown(false)}>
                  API Dashboard
                </Link>
                <Link to="/developer-pricing" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setDevelopersDropdown(false)}>
                  Usage & Pricing
                </Link>
              </div>
            )}
          </div>
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
                className="absolute top-full left-0 mt-0 w-56 bg-black backdrop-blur-lg border border-white/10 rounded-lg z-50 flex flex-col py-2 animate-fadeIn"
                onMouseEnter={() => {
                  clearTimeout(productsDropdownTimeout.current);
                  setProductsDropdown(true);
                }}
                onMouseLeave={() => {
                  productsDropdownTimeout.current = setTimeout(() => setProductsDropdown(false), 200);
                }}>
                <Link to="/products-wallet" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Wallet App
                </Link>
                <Link to="/products-extension" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Wallet Extension
                </Link>
                <Link to="/products-escrow" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Escrow
                </Link>
                <Link to="/products-paylink" className="px-4 py-2 text-white hover:bg-[#23272f] hover:text-[#9BEB83] text-left text-sm transition-colors rounded-md" onClick={() => setProductsDropdown(false)}>
                  Fradium Paylink
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
          <span className="text-sm font-medium h-5">{isAuthenticated ? convertE8sToToken(balance) : 0} FRADIUM</span>
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
                    <NavbarCopyPrincipal identity={identity} />
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
            <ButtonPurple size="sm" onClick={handleSignIn} loading={isLoading} fontWeight="medium" iconSize="w-5 h-5" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg">
              Sign in
            </ButtonPurple>
          </div>
        )}
        {/* Hamburger Mobile */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <ButtonShad variant="ghost" size="icon" className="lg:hidden relative z-50">
              <Menu className="h-5 w-5 text-white" />
            </ButtonShad>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] sm:w-[350px] p-0 bg-black/95 backdrop-blur-lg border-white/10">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/assets/logo/fradium.svg" alt="Fradium Logo" className="h-8 w-auto" draggable="false" />
                </div>
              </div>

              {/* User Info & Balance - Mobile */}
              {isAuthenticated && identity ? (
                <div className="border-b border-white/10 p-4">
                  <div className="flex flex-col gap-3">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${identity.getPrincipal().toString()}&colors=000000`} alt="User avatar" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{formatAddress(identity.getPrincipal().toString())}</span>
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <p className="truncate max-w-[150px]">{identity.getPrincipal().toString()}</p>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(identity.getPrincipal().toString());
                                toast.success("Principal ID copied!");
                              } catch (error) {
                                toast.error("Failed to copy");
                              }
                            }}
                            className="hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => {
                        navigate("/balance");
                        setIsMobileMenuOpen(false);
                      }}>
                      <Coins className="h-6 w-6 text-[#9BEB83]" />
                      <div className="flex flex-col">
                        <span className="text-sm text-white/60">FRADIUM Balance</span>
                        <span className="text-base font-medium text-white">{convertE8sToToken(balance)} FRADIUM</span>
                      </div>
                    </div>

                    {/* User Actions */}
                    <ButtonShad
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10"
                      onClick={() => {
                        navigate("/my-report");
                        setIsMobileMenuOpen(false);
                      }}>
                      <FileText className="h-4 w-4 mr-2" />
                      My Reports
                    </ButtonShad>

                    {/* Logout Button */}
                    <ButtonShad
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </ButtonShad>
                  </div>
                </div>
              ) : (
                <div className="border-b border-white/10 p-4">
                  <ButtonPurple size="sm" onClick={handleSignIn} loading={isLoading} className="w-full" fontWeight="medium" iconSize="w-5 h-5" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg">
                    Sign in
                  </ButtonPurple>
                </div>
              )}

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-auto py-4">
                <nav className="flex flex-col px-4 gap-1">
                  {navigationItems.map((item) =>
                    item.external ? (
                      <a key={item.label} href={item.href} target="_blank" className="flex items-center py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors">
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <Link key={item.label} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors">
                        <span>{item.label}</span>
                      </Link>
                    )
                  )}

                  {/* Developers Dropdown Mobile */}
                  <div className="w-full">
                    <button className="w-full flex items-center justify-between py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors" onClick={() => setMobileDevelopersDropdown((v) => !v)}>
                      Developers
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mobileDevelopersDropdown && "rotate-180")} />
                    </button>
                    {mobileDevelopersDropdown && (
                      <div className="flex flex-col ml-4 mt-1">
                        <Link
                          to="/developer-overview"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileDevelopersDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          API Dashboard
                        </Link>
                        <Link
                          to="/developer-pricing"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileDevelopersDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          Usage & Pricing
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Products Dropdown Mobile */}
                  <div className="w-full">
                    <button className="w-full flex items-center justify-between py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors" onClick={() => setMobileProductsDropdown((v) => !v)}>
                      Products
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mobileProductsDropdown && "rotate-180")} />
                    </button>
                    {mobileProductsDropdown && (
                      <div className="flex flex-col ml-4 mt-1">
                        <Link
                          to="/products-wallet"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileProductsDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          Fradium Wallet App
                        </Link>
                        <Link
                          to="/products-extension"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileProductsDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          Fradium Wallet Extension
                        </Link>
                        <Link
                          to="/products-escrow"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileProductsDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          Fradium Escrow
                        </Link>
                        <Link
                          to="/products-paylink"
                          className="py-2 px-3 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          onClick={() => {
                            setMobileProductsDropdown(false);
                            setIsMobileMenuOpen(false);
                          }}>
                          Fradium Paylink
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
