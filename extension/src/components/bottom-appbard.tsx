// BottomNavbar.tsx

import React from 'react';
// Impor Link dan useLocation dari react-router-dom
import { Link, useLocation } from 'react-router-dom';

const WalletIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
  </svg>
);

const AnalyzerIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const AccountIcon: React.FC<{ className?: string }> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string; // Tambahkan properti path untuk URL tujuan
}

const navItems: NavItem[] = [
  { id: 'Wallet', label: 'Wallet', icon: WalletIcon, path: '/wallet' },
  { id: 'AI Analyzer', label: 'AI Analyzer', icon: AnalyzerIcon, path: '/analyzer' },
  { id: 'History', label: 'History', icon: HistoryIcon, path: '/history' },
  { id: 'Account', label: 'Account', icon: AccountIcon, path: '/account' },
];

const BottomNavbar: React.FC = () => {
  // Dapatkan informasi lokasi (URL) saat ini
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#212121] flex justify-around items-center shadow-lg">
      {navItems.map((item) => {
        // Tab aktif jika path saat ini dimulai dengan path item
        // Menggunakan startsWith agar sub-route juga dianggap aktif, misal /wallet/send
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          // Ganti button dengan Link, arahkan ke 'path' yang ditentukan
          <Link
            to={item.path}
            key={item.id}
            className="relative flex flex-col items-center justify-center w-full h-full text-xs transition-colors duration-300"
          >
            {/* Indikator aktif */}
            {isActive && (
              <div className="absolute top-0 h-[3px] w-12 bg-[#9aff8a] rounded-b-full"></div>
            )}
            
            {/* Ikon */}
            <Icon
              className={`w-6 h-6 mb-1 transition-colors duration-300 ${
                isActive ? 'text-[#9aff8a]' : 'text-gray-400'
              }`}
            />
            
            {/* Label Teks */}
            <span
              className={`transition-colors duration-300 ${
                isActive ? 'text-[#9aff8a]' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;