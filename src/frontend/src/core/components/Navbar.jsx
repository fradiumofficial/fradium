import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Button from "./Button";
import { Button as ButtonShad } from "@/core/components/ui/button";
import { convertE8sToToken } from "@/core/lib/canisterUtils";
import { useAuth } from "@/core/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { ChevronDown, CloudCog } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { User, CreditCard, FileText, LogOut } from "lucide-react";
import { token } from "declarations/token";
import { formatAddress } from "../lib/canisterUtils";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "Docs", href: "/docs" },
  { label: "View Reports", href: "/reports" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, handleLogin, logout, identity } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchBalance() {
      const response = await token.icrc1_balance_of({
        owner: identity.getPrincipal(),
        subaccount: [],
      });
      console.log(response);
      setBalance(response);
    }

    fetchBalance();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 w-full backdrop-blur-lg bg-black/50   flex items-center justify-center min-h-[72px] z-[1000]">
      <div className="w-full max-w-[1440px] flex items-center justify-between lg:px-12 md:px-8 sm:px-4 px-2 min-h-[72px]">
        {/* Logo */}
        <div
          className="flex items-center gap-2 sm:gap-3 select-none min-w-fit cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="/logo.svg"
            alt="Crypgo Logo"
            className="h-8 sm:h-9 w-auto"
            draggable="false"
          />
          <span className="font-semibold text-[22px] sm:text-[28px] text-white tracking-wider font-[General Sans, sans-serif]">
            Fradi<span className="text-[#9BEB83]">um</span>
          </span>
        </div>
        {/* Menu Desktop */}
        <nav className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-12">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="font-[General Sans, sans-serif] text-base font-normal text-white no-underline transition-colors duration-200 hover:text-[#9BEB83]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Sign In Button Desktop */}
        <ButtonShad
          className="hidden md:flex bg-transparent text-white hover:bg-white/10 hover:backdrop-blur-lg mr-4"
          onClick={() => {
            if (!isAuthenticated) {
              return;
            }

            navigate("/balance");
          }}
        >
          <span className="text-sm font-medium h-5">
            {isAuthenticated ? convertE8sToToken(balance) : 0} FUM
          </span>
        </ButtonShad>
        {/* User Profile Desktop */}
        {isAuthenticated ? (
          <div className="hidden md:block">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-black/5 focus:bg-black/5">
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${identity
                      .getPrincipal()
                      .toString()}&colors=000000`}
                    alt="User avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-white">
                  {formatAddress(identity.getPrincipal().toString())}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform text-[#9BEB83]",
                    isOpen && "rotate-180"
                  )}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-black/70 backdrop-blur-lg z-[1000] border border-transparent"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1 text-xs text-white">
                      <p>{identity.getPrincipal().toString()}</p>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            identity.getPrincipal().toString()
                          )
                        }
                        className="hover:text-foreground"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/nfts")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>NFTs</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/my-projects")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Projects</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden lg:flex relative items-center flex-shrink-0 min-w-fit">
            <Button size="sm" onClick={handleLogin}>
              Sign In &nbsp;→
            </Button>
          </div>
        )}
        {/* Hamburger Mobile */}
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#9BEB83]"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {/* Hamburger Icon */}
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
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
          }}
        >
          {/* Background visual (dummy asset) */}
          <img
            src="/assets/images/glow.png"
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
            alt="bg"
          />
          {/* Glassmorphism Card */}
          <div className="relative w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-[#23272f80] to-[#181c2280] border border-[rgba(155,235,131,0.25)] shadow-[0_4px_32px_0_rgba(155,235,131,0.15)] p-6 flex flex-col gap-6 animate-fadeIn">
            {/* Menu items */}
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-[General Sans, sans-serif] text-lg font-bold text-white no-underline rounded-lg px-4 py-3 transition-all duration-200 hover:shadow-[0_0_8px_2px_#9BEB83] hover:bg-[#181C22]/60 focus:bg-[#181C22]/80 focus:shadow-[0_0_12px_3px_#A259FF] active:scale-95"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {/* Sign In Button Mobile - Neon Style */}
            <Button
              size="sm"
              className="w-11/12 max-w-xs mt-2 font-bold text-base bg-[#9BEB83] shadow-[0_0_12px_2px_#A259FF80] border border-[#A259FF] hover:shadow-[0_0_16px_4px_#9BEB83] transition-all duration-200"
            >
              Sign In &nbsp;→
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
