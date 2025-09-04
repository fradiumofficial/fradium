import React from "react";
import SidebarButton from "@/core/components/SidebarButton";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen mb-48 w-full bg-[#000510] overflow-hidden px-2 md:px-0">
      {/* Glow background – lebih ke atas */}
      <img
        src="/assets/images/glow.png"
        alt="Glow"
        className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 md:w-[1100px] md:h-[1100px] w-[300px] h-[300px] opacity-80 blur-2xl pointer-events-none select-none"
      />

      {/* 404 asset – lebih ke atas */}
      <img
        src="/assets/404.png"
        alt="404"
        className="absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2 md:w-[420px] w-[230px] pointer-events-none select-none"
      />

      {/* Hero kiri */}
      <img
        src="/assets/images/hero_kiri.png"
        alt="Hero Kiri"
        className="absolute left-0 top-1/2 -translate-y-1/2 md:max-w-[33vw] max-w-[0vw] md:w-full min-w-0 pointer-events-none select-none hidden md:block"
      />

      {/* Hero kanan */}
      <img
        src="/assets/images/hero_kanan.png"
        alt="Hero Kanan"
        className="absolute right-0 top-1/2 -translate-y-1/2 md:max-w-[33vw] max-w-[0vw] md:w-full min-w-0 pointer-events-none select-none hidden md:block"
      />

      {/* Center Content Overlay – ikut naik supaya tetap di tengah 404 */}
      <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center justify-center px-2 md:px-0">
        <h1 className="text-[#99E39E] md:text-4xl text-2xl md:mb-2 mb-1 font-medium text-center">We’ve lost this page</h1>
        <p className="text-[#B0B6BE] text-center max-w-xl md:mb-12 mb-6 md:text-lg text-base">Sorry, this page you are looking for doesn’t exist or has been removed</p>
        <div className="w-full flex justify-center mt-4">
          <div className="max-w-xs w-full">
            <SidebarButton className="w-full" onClick={() => navigate("/")}> &larr; Back to Homepage</SidebarButton>
          </div>
        </div>
      </div>
    </div>
  );
}