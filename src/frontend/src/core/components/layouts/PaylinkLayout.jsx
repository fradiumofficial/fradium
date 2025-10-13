import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/core/providers/AuthProvider";

const MotionLink = motion(Link);

function PaylinkRightActions({ 
  isDropdownOpen, 
  setIsDropdownOpen, 
  isProfileDropdownOpen, 
  setIsProfileDropdownOpen, 
  navigate, 
  logout 
}) {
  const services = [
    { 
      name: "Fradium Wallet", 
      icon: "/assets/icons/services/wallet.svg",
      path: "/wallet",
      active: false
    },
    { 
      name: "Fradium Escrow", 
      icon: "/assets/icons/services/escrow.svg",
      path: "/escrow",
      active: false
    },
    { 
      name: "Fradium Paylink", 
      icon: "/assets/icons/services/paylink.svg",
      path: "/paylink",
      active: true // This one is selected/active
    },
    { 
      name: "Fradium Extension", 
      icon: "/assets/icons/services/extension.svg",
      path: "/extension",
      active: false
    },
  ];

  const handleServiceClick = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* Switch Services Dropdown */}
      <div className="relative network-dropdown">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white/5 transition-all duration-200 border border-white/10"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="8" height="8" rx="1" fill="#C6A960"/>
            <rect x="13" y="3" width="8" height="8" rx="1" fill="#C6A960"/>
            <rect x="3" y="13" width="8" height="8" rx="1" fill="#C6A960"/>
            <rect x="13" y="13" width="8" height="8" rx="1" fill="#C6A960"/>
          </svg>
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              className="absolute top-full mt-3 w-[320px] rounded-3xl border border-white/10 z-[9999] overflow-hidden" 
              style={{ 
                right: "0px", 
                background: "linear-gradient(180deg, rgba(17,22,28,0.95), rgba(11,17,22,0.92))", 
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)", 
                backdropFilter: "blur(20px)" 
              }} 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10, scale: 0.95 }} 
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="p-5">
                <h3 className="text-[#C6A960] text-base font-medium mb-3 px-1">
                  Switch services
                </h3>
                
                <div className="flex flex-col gap-1.5">
                  {services.map((service) => (
                    <button
                      key={service.name}
                      onClick={() => handleServiceClick(service.path)}
                      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        service.active 
                          ? "bg-white/10 hover:bg-white/12" 
                          : "bg-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                        <img 
                          src={service.icon} 
                          alt={service.name}
                          className="w-5 h-5"
                        />
                      </div>
                      <span className="text-white text-sm font-normal">
                        {service.name}
                      </span>
                      
                      {service.active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C6A960]"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Dropdown */}
      <div className="relative profile-dropdown">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
          className="group flex items-center justify-center bg-transparent w-12 h-12 rounded-full border border-white/10 hover:bg-white/5 transition-all duration-200 ease-out cursor-pointer"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="8" r="4" stroke="#C6A960" strokeWidth="2"/>
            <path 
              d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" 
              stroke="#C6A960" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>

        <AnimatePresence>
          {isProfileDropdownOpen && (
            <motion.div 
              className="absolute top-full right-0 mt-3 w-[270px] rounded-3xl font-normal border border-white/10 z-[9999] overflow-hidden" 
              style={{ 
                background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))", 
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)", 
                backdropFilter: "blur(10px)" 
              }} 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10, scale: 0.95 }} 
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="py-4">
                <button 
                  className="w-full text-sm transition-colors group" 
                  onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}
                >
                  <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                      <circle cx="12" cy="12" r="10" stroke="#C6A960" strokeWidth="2" />
                      <line x1="12" y1="8" x2="12" y2="12" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-white">Why Fradium</span>
                  </div>
                </button>
                <button 
                  className="w-full text-sm transition-colors group" 
                  onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}
                >
                  <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="14,2 14,8 20,8" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="13" x2="8" y2="13" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="17" x2="8" y2="17" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="10,9 9,9 8,9" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-white">Documentation</span>
                  </div>
                </button>
                <div className="h-px bg-white/10 mx-5 my-3"></div>
                <button 
                  className="w-full text-sm transition-colors group" 
                  onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}
                >
                  <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-white">Source Code</span>
                  </div>
                </button>
                <button 
                  className="w-full mb-2 text-sm transition-colors group" 
                  onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}
                >
                  <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-white">X Account</span>
                  </div>
                </button>
                <div className="mx-5 mt-2 mb-2">
                  <button 
                    className="w-full h-12 rounded-full text-white font-medium bg-gradient-to-r from-[#C6A960] to-[#D4B76E] hover:opacity-90 transition-opacity" 
                    onClick={() => { 
                      navigate("/"); 
                      logout(); 
                    }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function PaylinkLayout() {
  return <PaylinkLayoutContent />;
}

function normalize(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "");
}

function PaylinkLayoutContent() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getSidebarIconUrl = (label, active) => {
    const ACTIVE = {
      "Create Link": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-active.svg",
      "My Links": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/scan-history-active.svg",
    };
    const INACTIVE = {
      "Create Link": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/transaction-inactive.svg",
      "My Links": "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/sidebar/scan-history-inactive.svg",
    };
    return active ? ACTIVE[label] : INACTIVE[label];
  };

  const menu = [
    { label: "Create Link", icon: "create-link", path: "/paylink" },
    { label: "My Links", icon: "my-links", path: "/paylink/manage" },
  ];

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".network-dropdown")) {
        setIsDropdownOpen(false);
      }
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isProfileDropdownOpen]);

  return (
    <div className="relative block md:flex min-h-screen bg-[#0F1219] w-full max-w-full">
      {/* Background Image & Overlay */}
      <img 
        src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/paylink-background.png" 
        alt="" 
        aria-hidden="true" 
        decoding="async" 
        loading="eager" 
        className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none" 
      />
      <div className="absolute inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>
      
      {/* LEFT SIDEBAR - DESKTOP */}
      <aside className="relative z-10 w-[200px] lg:w-[240px] xl:w-[320px] bg-transparent flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-white/10 hidden md:flex min-h-screen">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Link to="/"><img src="/assets/logo-fradium-paylink.svg" alt="Fradium Logo Paylink" /></Link>
          </div>
          <nav className="flex flex-col gap-2">
            {menu.map((item) => {
              const isActive = normalize(location.pathname) === normalize(item.path);
              const iconSrc = getSidebarIconUrl(item.label, isActive);
              return isActive ? (
                <Link 
                  key={item.label} 
                  to={item.path} 
                  className="relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#C6A960]/20 via-[#D4B76E]/10 to-transparent" />
                  <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#C6A960] to-[#D4B76E] shadow-[0_0_12px_rgba(198,169,96,0.5)]" />
                  <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 text-white font-medium">{item.label}</span>
                </Link>
              ) : (
                <MotionLink 
                  whileHover={{ y: -1 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} 
                  key={item.label} 
                  to={item.path} 
                  className="group relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all text-white/70 hover:text-white font-normal"
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-[#C6A960]/10 via-[#D4B76E]/5 to-transparent" />
                  <span className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-[5px] transition-all duration-200 bg-gradient-to-b from-[#C6A960] to-[#D4B76E] shadow-[0_0_10px_rgba(198,169,96,0.4)]" />
                  <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </MotionLink>
              );
            })}
          </nav>
        </div>
        {/* Bottom Social Icons - matching WalletLayout style */}
        <div className="fixed bottom-6 left-8 z-10 flex items-center gap-5 mt-auto">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" 
            title="Github" 
            onClick={() => window.open("https://github.com/fradiumofficial", "_blank")}
          >
            <img src="/assets/GithubLogoGold.svg" alt="Github" className="w-5 h-5" />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" 
            title="X" 
            onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}
          >
            <img src="/assets/XLogoGold.svg" alt="X" className="w-5 h-5" />
          </button>
        </div>
      </aside>
      
      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-[#0F1219] sticky top-0 z-40 border-b border-[#23272F]">
        <Link to="/"><img src="/logo.svg" alt="Fradium Logo" className="w-10 h-10" /></Link>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 overflow-visible pb-28 md:pb-8 pt-8 md:pt-7 flex flex-col">
        <div className="hidden md:flex xl:hidden w-full items-center justify-end gap-3 mb-4">
          <PaylinkRightActions 
            isDropdownOpen={isDropdownOpen} 
            setIsDropdownOpen={setIsDropdownOpen} 
            isProfileDropdownOpen={isProfileDropdownOpen} 
            setIsProfileDropdownOpen={setIsProfileDropdownOpen} 
            navigate={navigate} 
            logout={logout} 
          />
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[30rem] sm:max-w-[32rem] md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[44rem] 2xl:max-w-[48rem] md:-translate-x-[100px] lg:-translate-x-[120px] xl:translate-x-0 transition-transform">
            <Outlet />
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR - DESKTOP */}
      <aside className="relative z-10 w-100 min-h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 hidden xl:flex">
        <div className="flex flex-col gap-4 w-full z-10 mb-auto">
          <div className="flex gap-3 w-full justify-end">
            <PaylinkRightActions 
              isDropdownOpen={isDropdownOpen} 
              setIsDropdownOpen={setIsDropdownOpen} 
              isProfileDropdownOpen={isProfileDropdownOpen} 
              setIsProfileDropdownOpen={setIsProfileDropdownOpen} 
              navigate={navigate} 
              logout={logout} 
            />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#181C22] border-t border-[#23272F] flex md:hidden justify-between px-1 py-3" 
        style={{ height: "80px" }}
      >
        {menu.map((item) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          const mobileIconMap = {
            "create-link": "wallet",
            "my-links": "scan-history",
          };
          const mobileIconKey = mobileIconMap[item.icon] || item.icon;
          const iconSrc = `/assets/icons/mobile/${mobileIconKey}-${isActive ? "active" : "non"}.svg`;
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`flex flex-col items-center justify-center flex-1 mx-1 transition-all duration-150 ${
                isActive 
                  ? "text-[#C6A960] bg-[#C6A960]/10 rounded-sm shadow-[0_0_8px_0_rgba(198,169,96,0.1)]" 
                  : "text-[#FFFFFF99]"
              }`} 
              style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "6px 0" }}
            >
              <img src={iconSrc} alt={item.label} className="w-5 h-5 mb-0.5" />
              <span className="leading-tight text-center text-xs" style={{ fontWeight: 400 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}