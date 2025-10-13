import React from "react";

// Social Links Sidebar Component (untuk bottom sidebar)
export function SocialLinksSidebar() {
  return (
    <div className="fixed bottom-6 left-8 z-10 flex items-center gap-5 mt-auto">
      <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" title="Github" onClick={() => window.open("https://github.com/fradiumofficial", "_blank")}>
        <img src="/assets/GithubLogo.svg" alt="Github" className="w-5 h-5" style={{ filter: "brightness(0) saturate(100%) invert(43%) sepia(67%) saturate(534%) hue-rotate(213deg) brightness(101%) contrast(101%)" }} />
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors" title="X" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
        <img src="/assets/XLogo.svg" alt="X" className="w-5 h-5" style={{ filter: "brightness(0) saturate(100%) invert(43%) sepia(67%) saturate(534%) hue-rotate(213deg) brightness(101%) contrast(101%)" }} />
      </button>
    </div>
  );
}

// Social Links Dropdown Component (untuk profile dropdown)
export function SocialLinksDropdown() {
  return (
    <>
      {/* Source Code */}
      <button className="w-full text-sm transition-colors group" onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}>
        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#4942AA]">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#4942AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white">Source Code</span>
        </div>
      </button>

      {/* X Account */}
      <button className="w-full mb-2 text-sm transition-colors group" onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}>
        <div className="mx-4 flex items-center gap-3 py-2 px-2 transition-colors group-hover:bg-[#4A4F57]">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#4942AA]">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#4942AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white">X Account</span>
        </div>
      </button>
    </>
  );
}
