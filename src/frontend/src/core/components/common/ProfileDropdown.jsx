import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfileDropdown({ isOpen, setIsOpen, contextHideBalance, handleToggleHideBalance, icpPrincipal, showSettings = true, settingsPath = "/wallet/setting", logout }) {
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
      <button onClick={() => setIsOpen(!isOpen)} className="group flex items-center justify-center bg-[#161B22] w-11 h-11 rounded-full border border-white/10 hover:bg-[#2A2F36] transition-all duration-200 ease-out cursor-pointer hover:border-white/20">
        <img src="/assets/icons/person.svg" alt="User" className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-3 w-[270px] rounded-3xl font-normal border border-white/10 z-[9999] overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(17,22,28,0.92), rgba(11,17,22,0.88))",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(10px)",
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            <div className="py-4">
              {/* Hide/Show Balance Toggle */}
              <button className="w-full text-sm transition-colors group" onClick={handleToggleHideBalance}>
                <div className="mx-5 mb-3 flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5">
                  {contextHideBalance ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                      <path d="M1 1l22 22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="#9BE4A0" strokeWidth="2" />
                    </svg>
                  )}
                  <span className="text-white font-normal">{contextHideBalance ? "Show balance" : "Hide balance"}</span>
                </div>
              </button>

              {/* Copy Principal */}
              <button className="w-full text-sm transition-colors group" onClick={handleCopyPrincipal} aria-label={copiedPrincipal ? "Copied" : "Copy Principal"}>
                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                  {copiedPrincipal ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9BE4A0]">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <img src="/assets/icons/copy-green.svg" alt="Copy Principal" />
                  )}
                  <span className="text-white">Copy Principal</span>
                </div>
              </button>

              <div className="h-px bg-white/10 mx-5 my-3"></div>

              {/* Why Fradium */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}>
                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                    <circle cx="12" cy="12" r="10" stroke="#9BE4A0" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-white">Why Fradium</span>
                </div>
              </button>

              {/* Documentation */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}>
                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10,9 9,9 8,9" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white">Documentation</span>
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
                  <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                    <img src="/assets/icons/setting-green.svg" alt="Settings" />
                    <span className="text-white">Settings</span>
                  </div>
                </button>
              )}

              <div className="h-px bg-white/10 mx-5 my-3"></div>

              {/* Source Code */}
              <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white">Source Code</span>
                </div>
              </button>

              {/* X Account */}
              <button className="w-full mb-2 text-sm transition-colors group" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#9BE4A0]">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#9BE4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white">X Account</span>
                </div>
              </button>

              {/* Logout Button */}
              <div className="mx-5 mt-2 mb-2">
                <div className="rounded-full p-[1px] hover:bg-white/5">
                  <button
                    className="w-full h-12 rounded-full text-[#9BEB83] font-medium border border-white/10"
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
