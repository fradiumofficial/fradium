import React from 'react';
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
    return (
        <header style={{ position: 'fixed', top: 0, left: 0, width: '100vw', background: '#0C0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 72, zIndex: 1000 }}>
            <div style={{ width: '100%', maxWidth: 1440, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', minHeight: 72 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/logo.svg" alt="Crypgo Logo" style={{ height: 36, width: 'auto' }} draggable="false" />
                    <span style={{ fontFamily: 'General Sans, sans-serif', fontWeight: 600, fontSize: 28, color: '#fff', letterSpacing: 1 }}>Cryp<span style={{ color: '#9BEB83' }}>go</span></span>
                </div>
                {/* Menu */}
                <nav style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 48 }}>
                    {navigationItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            style={{ fontFamily: 'General Sans, sans-serif', fontSize: 16, fontWeight: 400, color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img src="/assets/images/icon-user.png" alt="User" style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: 56, position: 'relative', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#fff', fontWeight: 500, fontSize: 14, lineHeight: 1, marginBottom: 0 }}>wildan's wallet</span>
                            {/* Dropdown icon sejajar nama */}
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: 4 }} xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 10L12 15L17 10" stroke="#7be495" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#B0B6BE', fontSize: 12, fontWeight: 500, lineHeight: 1 }}>Aux78923...Ux</span>
                            <img src="/assets/images/icon-copy.png" alt="Copy" style={{ width: 14, height: 14, marginLeft: 0, verticalAlign: 'middle', opacity: 0.8 }} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default NavbarLogined; 