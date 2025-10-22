import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProductTransition from "./ProductTransition.jsx";

export default function SwitchServices({ compact = false, color = "#9BE4A0" }) {
  const [open, setOpen] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionProduct, setTransitionProduct] = React.useState("");
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest(".service-switcher")) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (path, productName) => {
    console.log("🚀 Starting transition to:", productName);

    // Close dropdown
    setOpen(false);

    // Start transition
    setTransitionProduct(productName);
    setIsTransitioning(true);

    // Navigate after delay
    setTimeout(() => {
      navigate(path);
    }, 3000); // Increased delay to match longer animation
  };

  const handleTransitionComplete = () => {
    console.log("✅ Transition completed");
    setIsTransitioning(false);
    setTransitionProduct("");
  };

  // Button classes for mobile (compact) - sama seperti user profile button
  const MobileButtonClasses = "group flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-lg w-9 h-9 rounded-lg border border-white/10 transition-all";

  // Button classes for desktop
  const DesktopButtonClasses = "group flex items-center justify-center bg-transparent w-12 h-12 rounded-full border border-white/10 hover:bg-white/5 transition-all duration-200 ease-out cursor-pointer";

  return (
    <>
      <ProductTransition isVisible={isTransitioning} productName={transitionProduct} onComplete={handleTransitionComplete} />

      <div className="relative service-switcher">
        <button onClick={() => setOpen(!open)} aria-label="Switch Services" className={compact ? MobileButtonClasses : DesktopButtonClasses}>
          <svg width={compact ? "18" : "20"} height={compact ? "18" : "20"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:scale-110">
            <rect x="3" y="3" width="8" height="8" rx="1" fill={color} />
            <rect x="13" y="3" width="8" height="8" rx="1" fill={color} />
            <rect x="3" y="13" width="8" height="8" rx="1" fill={color} />
            <rect x="13" y="13" width="8" height="8" rx="1" fill={color} />
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <>
              {/* Desktop Dropdown */}
              <motion.div
                className="hidden md:block absolute top-full mt-3 w-[320px] rounded-3xl border border-white/10 z-[9999] overflow-hidden"
                style={{
                  right: "0px",
                  background: "linear-gradient(180deg, rgba(17,22,28,0.95), rgba(11,17,22,0.92))",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(20px)",
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}>
                <div className="p-5">
                  <h3 className="text-white text-base font-medium mb-3 px-1">Switch services</h3>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => go("/wallet", "Fradium Wallet")} className="w-full text-base">
                      <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname.startsWith("/wallet") ? "bg-white/10 hover:bg-white/12" : "bg-transparent hover:bg-white/5"}`}>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <img src="/assets/logo/wallet-single.svg" alt="Fradium Wallet" className="w-5 h-5" />
                        </div>
                        <span className="text-white text-sm font-normal">Fradium Wallet</span>

                        {location.pathname.startsWith("/wallet") && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>

                    <button onClick={() => go("/escrow", "Fradium Escrow")} className="w-full text-base">
                      <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname.startsWith("/escrow") ? "bg-white/10 hover:bg-white/12" : "bg-transparent hover:bg-white/5"}`}>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <img src="/assets/logo/escrow-single.svg" alt="Fradium Escrow" className="w-5 h-5" />
                        </div>
                        <span className="text-white text-sm font-normal">Fradium Escrow</span>

                        {location.pathname.startsWith("/escrow") && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>

                    <button onClick={() => go("/paylink", "Fradium Paylink")} className="w-full text-base">
                      <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname.startsWith("/paylink") ? "bg-white/10 hover:bg-white/12" : "bg-transparent hover:bg-white/5"}`}>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <img src="/assets/logo/paylink-single.svg" alt="Fradium Paylink" className="w-5 h-5" />
                        </div>
                        <span className="text-white text-sm font-normal">Fradium Paylink</span>

                        {location.pathname.startsWith("/paylink") && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Mobile Full Screen Modal */}
              <div className="fixed inset-0 z-50 bg-[#0F1219] md:hidden flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 bg-[#0F1219]">
                  <div className="text-white text-xl font-semibold">Switch Services</div>
                  <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-2xl font-bold focus:outline-none transition-colors">
                    &times;
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-start px-4 pt-4 gap-2 bg-[#0F1219]">
                  <button onClick={() => go("/wallet", "Fradium Wallet")} className="w-full text-base">
                    <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname.startsWith("/wallet") ? "bg-white/10 border border-[#9BE4A0]/30" : "hover:bg-white/10"}`}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                        <img src="/assets/logo/wallet-single.svg" alt="Fradium Wallet" className="w-6 h-6" />
                      </div>
                      <span className="text-white text-base font-medium">Fradium Wallet</span>
                      {location.pathname.startsWith("/wallet") && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="ml-auto text-[#9BE4A0]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <button onClick={() => go("/escrow", "Fradium Escrow")} className="w-full text-base">
                    <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname.startsWith("/escrow") ? "bg-white/10 border border-[#9BE4A0]/30" : "hover:bg-white/10"}`}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                        <img src="/assets/logo/escrow-single.svg" alt="Fradium Escrow" className="w-6 h-6" />
                      </div>
                      <span className="text-white text-base font-medium">Fradium Escrow</span>
                      {location.pathname.startsWith("/escrow") && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="ml-auto text-[#9BE4A0]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <button onClick={() => go("/paylink", "Fradium Paylink")} className="w-full text-base">
                    <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname.startsWith("/paylink") ? "bg-white/10 border border-[#9BE4A0]/30" : "hover:bg-white/10"}`}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5">
                        <img src="/assets/logo/paylink-single.svg" alt="Fradium Paylink" className="w-6 h-6" />
                      </div>
                      <span className="text-white text-base font-medium">Fradium Paylink</span>
                      {location.pathname.startsWith("/paylink") && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="ml-auto text-[#9BE4A0]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
