import React, { useState } from 'react';
import { Link } from 'react-router';
import Button from './Button';

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'Docs', href: '/docs' },
  { label: 'View Reports', href: '/reports' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-[#0C0D14] flex items-center justify-center min-h-[72px] z-[1000]">
      <div className="w-full max-w-[1440px] flex items-center justify-between lg:px-12 md:px-8 sm:px-4 px-2 min-h-[72px]">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 select-none min-w-fit">
          <img src="/logo.svg" alt="Crypgo Logo" className="h-8 sm:h-9 w-auto" draggable="false" />
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
        <div className="hidden lg:flex relative items-center flex-shrink-0 min-w-fit">
          <Button size="sm">
            Sign In &nbsp;→
          </Button>
        </div>
        {/* Hamburger Mobile */}
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#9BEB83]"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {/* Hamburger Icon */}
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile Menu Dropdown - Web3 Style */}
      {menuOpen && (
        <div className="lg:hidden fixed top-[72px] left-0 w-full min-h-[calc(100vh-72px)] z-[1100] flex flex-col items-center justify-start px-4 py-6" style={{ backdropFilter: 'blur(16px)', background: 'rgba(12,13,20,0.85)' }}>
          {/* Background visual (dummy asset) */}
          <img src="/assets/images/glow.png" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" alt="bg" />
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
            <Button size="sm" className="w-11/12 max-w-xs mt-2 font-bold text-base bg-[#9BEB83] shadow-[0_0_12px_2px_#A259FF80] border border-[#A259FF] hover:shadow-[0_0_16px_4px_#9BEB83] transition-all duration-200">
              Sign In &nbsp;→
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
