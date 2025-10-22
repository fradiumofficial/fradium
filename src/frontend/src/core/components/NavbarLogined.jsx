import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/core/components/ui/sheet";
import { Button as ButtonShad } from "@/core/components/ui/button";
import Button from "./Button";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "View Reports", href: "/reports" },
  // Products will be handled as dropdown
  // { label: 'Products', href: '/products' },
  { label: "Assistant", href: "/assistant" },
];

const NavbarLogined = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const productsDropdownTimeout = useRef();
  const [mobileProductsDropdown, setMobileProductsDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full backdrop-blur-lg bg-black/50 flex items-center justify-center min-h-[72px] z-[1000]">
      <div className="w-full max-w-[1440px] flex items-center justify-between lg:px-12 md:px-8 sm:px-4 px-2 min-h-[72px]">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 select-none min-w-fit cursor-pointer" onClick={() => navigate("/")}>
          <img src="/assets/logo/fradium.svg" alt="Fradium Logo" className="h-9 sm:h-9 w-auto" draggable="false" />
        </div>
        {/* Menu Desktop */}
        <nav className="hidden lg:flex flex-1 justify-center items-center gap-8 xl:gap-12 relative">
          {navigationItems.map((item) => (
            <Link key={item.label} to={item.href} className="font-[General Sans, sans-serif] text-base font-normal text-white/70 hover:text-[#9BEB83] no-underline transition-colors duration-200">
              {item.label}
            </Link>
          ))}
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
            <button className="font-[General Sans, sans-serif] text-base font-normal text-white/70 hover:text-[#9BEB83] no-underline transition-colors duration-200 flex items-center gap-1" onClick={() => setProductsDropdown((v) => !v)} type="button">
              Products
              <ChevronDown className="w-4 h-4" />
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
        {/* User Profile Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <img src="/assets/images/icon-user.png" alt="User" className="w-11 h-11 rounded-full bg-white" />
          <div className="flex flex-col items-start justify-center h-14 min-w-[120px] relative">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm leading-none">wildan's wallet</span>
              {/* Dropdown icon sejajar nama */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mt-1" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L12 15L17 10" stroke="#7be495" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#B0B6BE] text-xs font-medium leading-none">Aux78923...Ux</span>
              <img src="/assets/images/icon-copy.png" alt="Copy" className="w-[14px] h-[14px] ml-0 align-middle opacity-80" />
            </div>
          </div>
        </div>
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

              {/* User Info - Mobile */}
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <img src="/assets/images/icon-user.png" className="w-12 h-12 rounded-full border-2 border-[#9BE4A0]" alt="avatar" />
                  <div>
                    <div className="font-bold text-white text-base mb-1">wildan's wallet</div>
                    <div className="text-xs text-white/60 flex items-center gap-1">
                      Aux78923...Ux
                      <img src="/assets/images/icon-copy.png" className="w-4 h-4" alt="copy" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-auto py-4">
                <nav className="flex flex-col px-4 gap-1">
                  {navigationItems.map((item) => (
                    <Link key={item.label} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors">
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {/* Products Dropdown Mobile */}
                  <div className="w-full">
                    <button className="w-full flex items-center justify-between py-3 px-3 rounded-md hover:bg-white/10 text-white font-medium transition-colors" onClick={() => setMobileProductsDropdown((v) => !v)}>
                      Products
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileProductsDropdown ? "rotate-180" : ""}`} />
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

export default NavbarLogined;
