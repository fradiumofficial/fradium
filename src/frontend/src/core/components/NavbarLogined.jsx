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

const NavbarLogined = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <header className="fixed top-0 left-0 w-full bg-[#0C0D14] flex items-center justify-center min-h-[72px] z-[1000]">
            <div className="w-full max-w-[1440px] flex items-center justify-between px-12 min-h-[72px]">
                {/* Logo */}
                <div className="flex items-center gap-3 select-none">
                    <img src="/logo.svg" alt="Crypgo Logo" className="h-9 w-auto" draggable="false" />
                    <span className="font-semibold text-[28px] text-white tracking-wider font-[General Sans, sans-serif]">
                        Cryp<span className="text-[#9BEB83]">go</span>
                    </span>
                </div>
                {/* Menu Desktop */}
                <nav className="hidden md:flex flex-1 justify-center items-center gap-12">
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
                <button
                    className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#9BEB83]"
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
                <div className="md:hidden fixed top-[72px] left-0 w-full min-h-[calc(100vh-72px)] z-[1100] flex flex-col items-center justify-start px-4 py-6" style={{ backdropFilter: 'blur(16px)', background: 'rgba(12,13,20,0.85)' }}>
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
                        {/* Wallet Card - Web3 Style */}
                        <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-[#181c22cc] to-[#23272fcc] border border-[#A259FF] shadow-[0_0_16px_2px_#A259FF80] flex items-center gap-4 animate-fadeIn">
                            {/* Pixel-art/generative avatar dummy */}
                            <img src="/assets/images/icon-user.png" className="w-12 h-12 rounded-full border-2 border-[#9BEB83] shadow-[0_0_8px_2px_#9BEB83] bg-[#23272f]" alt="avatar" />
                            <div>
                                <div className="font-bold text-white text-base mb-1">wildan's wallet</div>
                                <div className="text-xs text-[#B0B6BE] flex items-center gap-1">
                                    Aux78923...Ux <img src="/assets/images/icon-copy.png" className="w-4 h-4" alt="copy" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavbarLogined; 