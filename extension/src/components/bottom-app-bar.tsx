import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CDN } from '~lib/constant/cdn';
import { ROUTES } from '~lib/constant/routes';
import { useWallet } from "~lib/context/walletContext";

const WalletIcon: React.FC<{ className?: string; isActive?: boolean }> = ({ isActive, ...props }) => (
  <img
    {...props}
    src={isActive ? `${CDN.icons.walletGreen}` : `${CDN.icons.walletGrey}`}
    alt="Wallet"
    className="w-6 h-6"
  />
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
  icon: React.ComponentType<{ className?: string; isActive?: boolean }>;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'Wallet', label: 'Wallet', icon: WalletIcon, path: ROUTES.HOME },
  { id: 'AI Analyzer', label: 'AI Analyzer', icon: AnalyzerIcon, path: ROUTES.AI_ANALYZER },
  { id: 'History', label: 'History', icon: HistoryIcon, path: ROUTES.HISTORY },
  { id: 'Account', label: 'Account', icon: AccountIcon, path: ROUTES.ACCOUNT },
];

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, addresses } = useWallet() as any

  const isAnalyzerPath = (pathname: string) => {
    return [
      ROUTES.AI_ANALYZER,
      ROUTES.ANALYZE_ADDRESS,
      ROUTES.ANALYZE_SMART_CONTRACT,
      ROUTES.ANALYZE_PROGRESS,
      ROUTES.ANALYZE_ADDRESS_RESULT,
      ROUTES.ANALYZE_SMART_CONTRACT_RESULT,
      ROUTES.ANALYZE_SMART_CONTRACT_PROGRESS,
    ].some((p) => pathname.startsWith(p));
  };

  const isHistoryPath = (pathname: string) => {
    return [ROUTES.HISTORY, ROUTES.SCAN_HISTORY, ROUTES.DETAIL_HISTORY.replace(':id', '')].some((p) => pathname.startsWith(p));
  };

  // Hide bottom bar on welcome/confirmation pages or when not authenticated
  if (!isAuthenticated || location.pathname === ROUTES.WELCOME || location.pathname === ROUTES.WALLET_CONFIRMATION) {
    return null;
  }

  return (
    <nav className="h-16 bg-[#212121] grid grid-cols-4 items-stretch shadow-lg">
      {navItems.map((item) => {
        const pathname = location.pathname;
        let isActive = false;
        if (item.id === 'AI Analyzer') {
          isActive = isAnalyzerPath(pathname);
        } else if (item.id === 'History') {
          isActive = isHistoryPath(pathname);
        } else if (item.id === 'Wallet') {
          // Wallet is active for both "/" and "/home" paths
          isActive = pathname === '/' || pathname === ROUTES.HOME;
        } else {
          isActive = pathname.startsWith(item.path);
        }
        const Icon = item.icon;

        return (
          <Link
            to={item.path}
            key={item.id}
            className="relative flex flex-col items-center justify-center w-full h-full text-xs transition-colors duration-300"
          >
            {/* Indikator aktif */}
            {isActive && (
              <>
                {/* Stroke atas */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-full bg-[#99E39E] rounded-b-full" />
                {/* Gradient putih 10% di bawah stroke */}
                <div className="pointer-events-none absolute top-[2px] left-1/2 -translate-x-1/2 w-full h-8 bg-gradient-to-b from-white/10 to-transparent" />
              </>
            )}

            {/* Ikon */}
            {item.id === 'Wallet' ? (
              <WalletIcon isActive={isActive} className="mb-1 transition-colors duration-300" />
            ) : (
              <Icon
                className={`w-6 h-6 mb-1 transition-colors duration-300 ${isActive ? 'text-[#9aff8a]' : 'text-gray-400'
                  }`}
              />
            )}

            {/* Label Teks */}
            <span
              className={`transition-colors duration-300 ${isActive ? 'text-[#9aff8a]' : 'text-gray-400'
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