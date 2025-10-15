import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfileDropdown({ isOpen, setIsOpen, contextHideBalance, handleToggleHideBalance, icpPrincipal, showSettings = true, settingsPath = "/wallet/setting", logout, color = "#9BE4A0", background = "dark", showHideBalance = true }) {
  const navigate = useNavigate();
  const [copiedPrincipal, setCopiedPrincipal] = React.useState(false);

  React.useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest(".profile-dropdown")) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [setIsOpen]);

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(icpPrincipal || "");
      setCopiedPrincipal(true);
      setTimeout(() => setCopiedPrincipal(false), 1500);
    } catch (_e) {}
  };

  return (
    <div className="relative profile-dropdown">
      <button onClick={() => setIsOpen(!isOpen)} className={background === "light" ? "group flex items-center justify-center bg-slate-100 w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-200 transition-all duration-200 ease-out cursor-pointer hover:border-slate-300" : "group flex items-center justify-center bg-[#161B22] w-11 h-11 rounded-full border border-white/10 hover:bg-[#2A2F36] transition-all duration-200 ease-out cursor-pointer hover:border-white/20"}>
        <svg width={background === "light" ? "20" : "24"} height={background === "light" ? "20" : "24"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:scale-110">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
          <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={background === "light" ? "absolute top-full right-0 mt-2 w-[270px] rounded-xl font-normal border border-slate-200 z-[9999] overflow-hidden bg-white shadow-lg" : "absolute top-full right-0 mt-3 w-[270px] rounded-3xl font-normal border border-white/10 z-[9999] overflow-hidden"}
            style={
              background === "light"
                ? undefined
                : {
                    background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(10px)",
                  }
            }
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            <div className="py-4">
              {/* Hide/Show Balance Toggle */}
              {showHideBalance && (
                <button className="w-full text-sm transition-colors group" onClick={handleToggleHideBalance}>
                  <div className={background === "light" ? "mx-5 mb-3 flex items-center gap-3 py-3 px-4 rounded-xl bg-slate-50" : "mx-5 mb-3 flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5"}>
                    {contextHideBalance ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
                        <path d="M1 1l22 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
                      </svg>
                    )}
                    <span className={background === "light" ? "text-slate-900 font-normal" : "text-white font-normal"}>{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                  </div>
                </button>
              )}

              {/* Copy Principal */}
              <button className="w-full text-sm transition-colors group" onClick={handleCopyPrincipal} aria-label={copiedPrincipal ? "Copied" : "Copy Principal"}>
                <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                  {copiedPrincipal ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color }}>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color }}>
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                      <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                  <span className={background === "light" ? "text-slate-900" : "text-white"}>Copy Principal</span>
                </div>
              </button>

              <div className={background === "light" ? "h-px bg-slate-200 mx-5 my-3" : "h-px bg-white/10 mx-5 my-3"}></div>

              {/* Why Fradium */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className={background === "light" ? "text-slate-900" : "text-white"}>Why Fradium</span>
                </div>
              </button>

              {/* Documentation */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10,9 9,9 8,9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={background === "light" ? "text-slate-900" : "text-white"}>Documentation</span>
                </div>
              </button>

              {/* Settings */}
              {showSettings && (
                <button
                  className="w-full text-sm transition-colors group"
                  onClick={() => {
                    navigate(settingsPath);
                    setIsOpen(false);
                  }}>
                  <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
                    </svg>
                    <span className={background === "light" ? "text-slate-900" : "text-white"}>Settings</span>
                  </div>
                </button>
              )}

              <div className={background === "light" ? "h-px bg-slate-200 mx-5 my-3" : "h-px bg-white/10 mx-5 my-3"}></div>

              {/* Source Code */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
                <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={background === "light" ? "text-slate-900" : "text-white"}>Source Code</span>
                </div>
              </button>

              {/* X Account */}
              <button className="w-full mb-2 text-sm transition-colors group" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
                <div className={background === "light" ? "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50" : "mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5"}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={background === "light" ? "text-slate-900" : "text-white"}>X Account</span>
                </div>
              </button>

              {/* Logout Button */}
              <div className="mx-5 mt-2 mb-2">
                <div className={background === "light" ? "rounded-full p-[1px] hover:bg-slate-50" : "rounded-full p-[1px] hover:bg-white/5"}>
                  <button
                    className={background === "light" ? "w-full h-12 rounded-full font-medium border border-slate-200" : "w-full h-12 rounded-full font-medium border border-white/10"}
                    style={{ color }}
                    onClick={() => {
                      navigate("/");
                      logout();
                    }}>
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
