import React from "react";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#000510] text-white overflow-visible border-t border-white/10">
      {/* Fade halus di tepi atas footer */}
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#000510] to-transparent" />
      <div className="relative mx-auto w-full max-w-[1300px] px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-6 items-center">
          <div className="order-last sm:order-first text-center sm:text-left">
            <span className="uppercase tracking-wider text-white/70 text-[11px] sm:text-sm">(© 2025 FRADIUM)</span>
          </div>
          <Link to="/reports" className="text-center uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-200 text-[11px] sm:text-sm">
            (VIEW REPORT)
          </Link>
          <Link to="/assistant" className="text-center uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-200 text-[11px] sm:text-sm">
            (AI ASSISTANT)
          </Link>
          <Link to="/developer-overview" className="text-center uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-200 text-[11px] sm:text-sm">
            (DEVELOPER)
          </Link>
          <a href="https://fradium.gitbook.io/docs" target="_blank" rel="noopener noreferrer" className="text-center sm:text-right uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-200 text-[11px] sm:text-sm">
            (DOCUMENTATION)
          </a>
        </div>
      </div>
    </footer>
  );
}
