import { ShieldAlert } from "lucide-react";
import SidebarButton from "@/core/components/SidebarButton";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen mb-48 w-full bg-[#000510] overflow-hidden">
      {/* Glow background – lebih ke atas */}
      <img src="/assets/images/glow.png" alt="Glow" className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] opacity-80 blur-2xl pointer-events-none select-none" />

      {/* 404 asset – lebih ke atas */}
      <img src="/assets/401.png" alt="404" className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[420px] pointer-events-none select-none" />

      {/* Hero kiri */}
      <img src="/assets/images/hero_kiri.png" alt="Hero Kiri" className="absolute left-0 top-1/2 -translate-y-1/2 max-w-[33vw] w-full min-w-0 pointer-events-none select-none" />

      {/* Hero kanan */}
      <img src="/assets/images/hero_kanan.png" alt="Hero Kanan" className="absolute right-0 top-1/2 -translate-y-1/2 max-w-[33vw] w-full min-w-0 pointer-events-none select-none" />

      {/* Center Content Overlay – ikut naik supaya tetap di tengah 404 */}
      <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center justify-center">
        <h1 className="text-[#99E39E] text-4xl md:text-5xl font-medium mb-2">Oops! you dont have Access</h1>
        <p className="text-[#B0B6BE] text-center max-w-xl mb-12 text-lg md:text-xl">Sorry, this page you are looking for doesn’t exist or has been removed</p>
        <SidebarButton onClick={() => navigate("/")}>&larr; Back to Homepage</SidebarButton>
      </div>
    </div>
  );
}
