import React from 'react';
import { Link } from 'react-router';
import styles from './header.module.css';

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'Docs', href: '/docs' },
  { label: 'View Reports', href: '/reports' },
];

const Header = () => {
  return (
    <header className={styles.headerRoot}>
      <div className={styles.headerContainer}>
        {/* Logo */}
        <div className={styles.logoArea}>
          {/* Pakai img jika ada, fallback ke text */}
          <img src="/logo.svg" alt="Crypgo Logo" style={{ height: 36, width: 'auto' }} draggable="false" />
          <span style={{ fontFamily: 'General Sans, sans-serif', fontWeight: 600, fontSize: 28, color: '#fff', letterSpacing: 1 }}>Cryp<span style={{ color: '#9BEB83' }}>go</span></span>
        </div>
        {/* Menu */}
        <nav className={styles.menuArea}>
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={styles.menuLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Sign In Button */}
        <div className={styles.signInWrap}>
          <button className={styles.signInButton}>
            Sign In &nbsp;→
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
