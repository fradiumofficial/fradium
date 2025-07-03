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

const Navbar = () => {
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
        {/* Sign In Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Button size="sm">
            Sign In &nbsp;→
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
