import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/core/providers/AuthProvider";
import SwitchServices from "@/core/components/common/SwitchServices.jsx";
import ProfileDropdown from "@/core/components/common/ProfileDropdown.jsx";
import { SocialLinksSidebar } from "@/core/components/common/SocialLinks.jsx";

const MotionLink = motion(Link);

export default function PaylinkLayout() {
  return <PaylinkLayoutContent />;
}

function normalize(path) {
  if (!path) return "/";
  return path.replace(/\/+$/, "");
}

function PaylinkLayoutContent() {
  const location = useLocation();
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
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <div className="relative block md:flex min-h-screen bg-transparent w-full max-w-full">
      {/* Background Image & Overlay (fixed) */}
      <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/paylink-background.png" alt="" aria-hidden="true" decoding="async" loading="eager" className="fixed inset-0 z-0 w-full h-full object-cover object-center pointer-events-none select-none" />
      <div className="fixed inset-0 z-0 bg-[#0F1219]/25 pointer-events-none" aria-hidden="true"></div>

      {/* LEFT SIDEBAR - DESKTOP */}
      <aside className="fixed left-0 top-0 z-20 w-[200px] lg:w-[240px] xl:w-[320px] bg-transparent flex flex-col py-8 pl-5 lg:pl-7 xl:pl-8 border-r border-white/10 hidden md:flex h-screen">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Link to="/">
              <img src="/assets/logo/fradium-paylink.svg" className="h-[50px] sm:h-[50px] w-auto" alt="Fradium Logo Paylink" />
            </Link>
          </div>
          <nav className="flex flex-col gap-2">
            {menu.map((item) => {
              const isActive = normalize(location.pathname) === normalize(item.path);
              const iconSrc = getSidebarIconUrl(item.label, isActive);
              return isActive ? (
                <Link key={item.label} to={item.path} className="relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all">
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#C6A960]/20 via-[#D4B76E]/10 to-transparent" />
                  <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#C6A960] to-[#D4B76E] shadow-[0_0_12px_rgba(198,169,96,0.5)]" />
                  <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 text-white font-medium">{item.label}</span>
                </Link>
              ) : (
                <MotionLink whileHover={{ y: -1 }} transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }} key={item.label} to={item.path} className="group relative flex w-full items-center gap-3 pl-5 pr-10 py-3 text-base transition-all text-white/70 hover:text-white font-normal">
                  <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-[#C6A960]/10 via-[#D4B76E]/5 to-transparent" />
                  <span className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-[5px] transition-all duration-200 bg-gradient-to-b from-[#C6A960] to-[#D4B76E] shadow-[0_0_10px_rgba(198,169,96,0.4)]" />
                  <img src={iconSrc} alt={item.label} className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </MotionLink>
              );
            })}
          </nav>
        </div>
        {/* Bottom Social Icons - using reusable component */}
        <SocialLinksSidebar color="#C6A960" />
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-[#0F1219] fixed top-0 left-0 right-0 z-40 border-b border-[#23272F]">
        <Link to="/">
          <img src="/logo.svg" alt="Fradium Logo" className="w-10 h-10" />
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 pb-28 md:pb-8 pt-20 md:pt-7 flex flex-col md:pl-[15%] lg:pl-[16%] xl:pl-[18%] xl:pr-[20%]">
        <div className="hidden md:flex xl:hidden w-full items-center justify-end gap-3 mb-4">
          <SwitchServices compact={false} color="#C6A960" />
          <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={false} handleToggleHideBalance={() => {}} icpPrincipal="" showSettings={false} logout={logout} color="#C6A960" showHideBalance={false} />
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[30rem] sm:max-w-[32rem] md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[44rem] 2xl:max-w-[48rem] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR - DESKTOP */}
      <aside className="fixed right-0 top-0 z-20 w-100 h-screen bg-transparent flex flex-col pt-6 pr-6 pb-6 pl-4 hidden xl:flex">
        <div className="flex flex-col gap-4 w-full z-10 mb-auto">
          <div className="flex gap-3 w-full justify-end">
            <SwitchServices compact={false} color="#C6A960" />
            <ProfileDropdown isOpen={isProfileDropdownOpen} setIsOpen={setIsProfileDropdownOpen} contextHideBalance={false} handleToggleHideBalance={() => {}} icpPrincipal="" showSettings={false} logout={logout} color="#C6A960" showHideBalance={false} />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#181C22] border-t border-[#23272F] flex md:hidden justify-between px-1 py-3" style={{ height: "80px" }}>
        {menu.map((item) => {
          const isActive = normalize(location.pathname) === normalize(item.path);
          const mobileIconMap = {
            "create-link": "wallet",
            "my-links": "scan-history",
          };
          const mobileIconKey = mobileIconMap[item.icon] || item.icon;
          const iconSrc = `/assets/icons/mobile/${mobileIconKey}-${isActive ? "active" : "non"}.svg`;
          return (
            <Link key={item.label} to={item.path} className={`flex flex-col items-center justify-center flex-1 mx-1 transition-all duration-150 ${isActive ? "text-[#C6A960] bg-[#C6A960]/10 rounded-sm shadow-[0_0_8px_0_rgba(198,169,96,0.1)]" : "text-[#FFFFFF99]"}`} style={{ fontSize: "10px", minWidth: 0, minHeight: 0, padding: "6px 0" }}>
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
