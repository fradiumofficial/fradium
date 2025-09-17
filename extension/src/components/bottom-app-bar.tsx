import React from "react"
import { Link, useLocation } from "react-router-dom"

import { CDN } from "~lib/constant/cdn"
import { ROUTES } from "~lib/constant/routes"
import { useWallet } from "~lib/context/walletContext"

const WalletIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  isActive,
  ...props
}) => (
  <img
    {...props}
    src={isActive ? `${CDN.icons.walletGreen}` : `${CDN.icons.walletGrey}`}
    alt="Wallet"
    className="w-6 h-6"
  />
)

const AnalyzerIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  isActive,
  ...props
}) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </svg>
)

const HistoryIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  isActive,
  ...props
}) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
)

const AccountIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  isActive,
  ...props
}) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
)

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; isActive?: boolean }>
  path: string
}

const navItems: NavItem[] = [
  { id: "Transaction", label: "Transaction", icon: WalletIcon, path: ROUTES.HOME },
  {
    id: "AI Analyzer",
    label: "AI Analyzer",
    icon: AnalyzerIcon,
    path: ROUTES.AI_ANALYZER
  },
  { id: "History", label: "History", icon: HistoryIcon, path: ROUTES.HISTORY },
  { id: "Account", label: "Account", icon: AccountIcon, path: ROUTES.ACCOUNT }
]

const BottomNavbar: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated, addresses } = useWallet() as any

  const isAnalyzerPath = (pathname: string) => {
    return [
      ROUTES.AI_ANALYZER,
      ROUTES.ANALYZE_ADDRESS,
      ROUTES.ANALYZE_SMART_CONTRACT,
      ROUTES.ANALYZE_PROGRESS,
      ROUTES.ANALYZE_ADDRESS_RESULT,
      ROUTES.ANALYZE_SMART_CONTRACT_RESULT,
      ROUTES.ANALYZE_SMART_CONTRACT_PROGRESS
    ].some((p) => pathname.startsWith(p))
  }

  const isHistoryPath = (pathname: string) => {
    return [
      ROUTES.HISTORY,
      ROUTES.SCAN_HISTORY,
      ROUTES.DETAIL_HISTORY.replace(":id", "")
    ].some((p) => pathname.startsWith(p))
  }

  // Hide bottom bar on welcome/confirmation pages, analyze progress page, or when not authenticated
  if (
    !isAuthenticated ||
    location.pathname === ROUTES.WELCOME ||
    location.pathname === ROUTES.WALLET_CONFIRMATION ||
    location.pathname === ROUTES.ANALYZE_PROGRESS ||
    location.pathname === ROUTES.ANALYZE_ADDRESS_RESULT
  ) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav className="flex flex-row items-center justify-center p-1.5 gap-4 w-[335px] h-[60px] bg-black/50 border border-white/15 backdrop-blur-[13.5px] rounded-full shadow-xl">
        {navItems.map((item, index) => {
          const pathname = location.pathname
          let isActive = false
          if (item.id === "Transaction") {
            isActive = pathname === "/" || pathname === ROUTES.HOME
          } else if (item.id === "AI Analyzer") {
            isActive = isAnalyzerPath(pathname)
          } else if (item.id === "History") {
            isActive = isHistoryPath(pathname)
          } else if (item.id === "Account") {
            isActive = pathname.startsWith(item.path)
          } else {
            isActive = pathname.startsWith(item.path)
          }
          const Icon = item.icon

          return (
            <Link
              to={item.path}
              key={item.id}
              className={`flex flex-row justify-center items-center gap-1 transition-all duration-300 ease-in-out ${
                isActive
                  ? "p-[12px_16px_12px_12px] w-[123px] h-12"
                  : "p-[12px_4px] gap-0.5 w-8 h-12"
              } ${
                isActive
                  ? "bg-gradient-to-r from-white/10 to-white/004 rounded-full shadow-lg scale-105"
                  : "hover:scale-102"
              }`}>
              {/* Ikon */}
              <div className="flex flex-col items-center gap-1 w-6 h-6">
                {item.id === "Transaction" ? (
                  <WalletIcon
                    isActive={isActive}
                    className="transition-all duration-300 ease-in-out hover:scale-110"
                  />
                ) : (
                  <Icon
                    className={`w-6 h-6 transition-all duration-300 ease-in-out hover:scale-110 ${
                      isActive
                        ? "text-[#99E39E] drop-shadow-sm"
                        : "text-white/50"
                    }`}
                  />
                )}
              </div>

              {/* Label Teks - Hidden in CSS */}
              {isActive && (
                <span className="w-[100px] h-4 text-[12px] font-medium leading-[130%] text-center text-[#99E39E] font-['General Sans'] transition-all duration-300 ease-in-out animate-fade-in">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default BottomNavbar
