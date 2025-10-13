import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProductTransition from "./ProductTransition.jsx";

export default function SwitchServices({ compact = false }) {
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

  const ButtonClasses = "group flex items-center justify-center bg-[#161B22] w-11 h-11 rounded-full border border-white/10 hover:bg-[#2A2F36] transition-all duration-200 ease-out cursor-pointer hover:border-white/20";

  return (
    <>
      <ProductTransition isVisible={isTransitioning} productName={transitionProduct} onComplete={handleTransitionComplete} />

      <div className="relative service-switcher">
        <button onClick={() => setOpen(!open)} aria-label="Switch Services" className={ButtonClasses}>
          <img src="/assets/icons/product-select.svg" alt="Switch Services" className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              className="absolute top-full mt-3 w-[300px] rounded-2xl border border-white/10 z-[9999] overflow-hidden"
              style={{
                right: "0px",
                background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                backdropFilter: "blur(10px)",
              }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}>
              <div className="px-6 py-4 border-b border-white/10">
                <div className="text-white font-semibold">Switch Services</div>
              </div>
              <div className="py-2">
                <button onClick={() => go("/wallet", "Fradium Wallet")} className="w-full text-base">
                  <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${location.pathname.startsWith("/wallet") ? "bg-white/8" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      {location.pathname.startsWith("/wallet") ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#7C72FE]">
                          <path d="M20 6L9 17l-5-5" stroke="#7C72FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-white">Fradium Wallet</span>
                    </div>
                  </div>
                </button>

                <button onClick={() => go("/escrow", "Fradium Escrow")} className="w-full text-base">
                  <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${location.pathname.startsWith("/escrow") ? "bg-white/8" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      {location.pathname.startsWith("/escrow") ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#7C72FE]">
                          <path d="M20 6L9 17l-5-5" stroke="#7C72FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-white">Fradium Escrow</span>
                    </div>
                  </div>
                </button>

                {/* <button onClick={() => go("/escrow", "Fradium Paylink")} className="w-full text-base">
                  <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${location.pathname.startsWith("/escrow") ? "bg-white/8" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      {location.pathname.startsWith("/escrow") ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-white">Fradium Paylink</span>
                    </div>
                  </div>
                </button>

                <button onClick={() => go("/escrow", "Fradium Extension")} className="w-full text-base">
                  <div className={`mx-3 flex items-center justify-between px-4 py-3 rounded-xl ${location.pathname.startsWith("/escrow") ? "bg-white/8" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-3">
                      {location.pathname.startsWith("/escrow") ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BEB83]">
                          <path d="M20 6L9 17l-5-5" stroke="#9BEB83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-white">Fradium Extension</span>
                    </div>
                  </div>
                </button> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
