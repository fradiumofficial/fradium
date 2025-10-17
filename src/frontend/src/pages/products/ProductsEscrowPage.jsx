import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import SidebarButton from "@/core/components/SidebarButton";
import Footer from "../../core/components/Footer.jsx";
import MagicBento from "@/core/components/MagicBento.jsx";
import ButtonGreen from "@/core/components/ButtonGreen";

// Custom hook untuk deteksi mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const ProductsEscrow = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, handleLogin } = useAuth();

  // Fungsi untuk handle launch escrow - cek login dulu
  const handleLaunchEscrow = async () => {
    if (!isAuthenticated) {
      // Jika belum login, lakukan login dulu
      await handleLogin(({ user, isAuthenticated: authStatus }) => {
        // Callback setelah login berhasil - redirect ke P2P Trade page
        navigate("/escrow");
      });
    } else {
      // Jika sudah login, langsung redirect ke P2P Trade page
      navigate("/escrow");
    }
  };

  if (isMobile) {
    // Layout mobile - struktur sama dengan desktop, ukuran disesuaikan
    return (
      <div className="min-h-screen bg-[#000510] text-white relative overflow-hidden flex flex-col">
        {/* Background layer - starts from bottom with natural height (no stretch) */}
        <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
          <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="w-full h-auto object-contain object-bottom" />
        </div>
        {/* Soft fade at top edge to blend with navbar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />

        {/* Main Content */}
        <main className="relative z-10 pt-20 px-4 flex-1">
          <div className="container mx-auto max-w-[1200px] pb-16">
            {/* Top hero - centered like the design */}
            <div className="flex flex-col items-center justify-center text-center mb-16">
              <span className="block text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM ESCROW</span>
              <h1 className="text-white text-[28px] font-medium leading-tight mb-4">About Fradium Escrow</h1>
              <p className="text-[#B0B6BE] text-[14px] leading-relaxed max-w-[340px] mx-auto mb-6">
                Fradium Escrow acts as a trusted intermediary that protects your assets before, during, and after every transaction. If the recipient's wallet is detected as unsafe, funds are instantly returned. It ensures zero loss from fraudulent or high-risk addresses. When verified as safe, the transaction proceeds seamlessly to the recipient.
              </p>
              <div className="pt-1">
                <ButtonGreen
                  size="sm"
                  fontWeight="medium"
                  onClick={handleLaunchEscrow}
                  icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg"
                  iconSize="w-[14px] h-[14px]"
                  className="h-[40px] text-[14px]"
                >
                  Try Fradium Escrow
                </ButtonGreen>
              </div>
            </div>

            {/* Feature cards - 1 column on mobile */}
            <div className="grid grid-cols-1 gap-4 pt-6 mb-20">
              {/* Card 1: Smart Verification */}
              <MagicBento
                textAutoHide={false}
                enableStars={true}
                enableSpotlight={true}
                enableBorderGlow={false}
                enableTilt={false}
                enableMagnetism={false}
                clickEffect={true}
                particleCount={12}
                glowColor="153, 227, 158"
                className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
                <div className="relative w-12 h-12 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                  <img src="/assets/verification.svg" alt="Verification" className="w-[18px] h-[18px]" />
                </div>
                <div className="relative text-white text-[20px] font-medium mb-3">Smart Verification</div>
                <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">Fradium's AI‑powered risk engine checks the recipient's address reputation and blockchain activity to ensure your funds only reach safe destinations.</p>
              </MagicBento>

              {/* Card 2: Auto Refund System */}
              <MagicBento
                textAutoHide={false}
                enableStars={true}
                enableSpotlight={true}
                enableBorderGlow={false}
                enableTilt={false}
                enableMagnetism={false}
                clickEffect={true}
                particleCount={12}
                glowColor="153, 227, 158"
                className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
                <div className="relative w-12 h-12 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                  <img src="/assets/refund.svg" alt="Auto Refund" className="w-[18px] h-[18px]" />
                </div>
                <div className="relative text-white text-[20px] font-medium mb-3">Auto Refund System</div>
                <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">If a suspicious or high‑risk wallet is detected, Fradium Escrow instantly returns the assets to your account. No manual dispute, no waiting time.</p>
              </MagicBento>

              {/* Card 3: Trust Without Middlemen */}
              <MagicBento
                textAutoHide={false}
                enableStars={true}
                enableSpotlight={true}
                enableBorderGlow={false}
                enableTilt={false}
                enableMagnetism={false}
                clickEffect={true}
                particleCount={12}
                glowColor="153, 227, 158"
                className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
                <div className="relative w-12 h-12 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                  <img src="/assets/encrypted.svg" alt="Encrypted" className="w-[18px] h-[18px]" />
                </div>
                <div className="relative text-white text-[20px] font-medium mb-3">Trust Without Middlemen</div>
                <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">Send and receive assets securely without relying on third‑party custodians. Protection through transparent, on‑chain validation — decentralized and verifiable.</p>
              </MagicBento>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Layout desktop
  return (
    <div className="min-h-screen bg-[#000510] text-white relative overflow-hidden flex flex-col">
      {/* Background layer - starts from bottom with natural height (no stretch) */}
      <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="w-full h-auto object-contain object-bottom" />
      </div>
      {/* Soft fade at top edge to blend with navbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />

      {/* Main Content */}
      <main className="relative z-10 pt-32 sm:pt-36 px-4 sm:px-6 flex-1">
        <div className="container mx-auto max-w-[1200px] pb-24 md:pb-32">
          {/* Local animations for escrow cards */}
          <style>{`
            @keyframes escrow-shine {
              from { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
              20% { opacity: .25; }
              60% { opacity: .15; }
              to { transform: translateX(150%) skewX(-20deg); opacity: 0; }
            }
          `}</style>
          {/* Top hero - centered like the design */}
          <div className="flex flex-col items-center justify-center text-center mb-20 md:mb-24">
            <span className="block text-[#9beb83] text-[14px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM ESCROW</span>
            <h1 className="text-white text-[36px] md:text-[40px] font-medium leading-tight mb-4">About Fradium Escrow</h1>
            <p className="text-[#B0B6BE] text-[14px] md:text-[15px] leading-relaxed max-w-[880px] mx-auto mb-6">
              Fradium Escrow acts as a trusted intermediary that protects your assets before, during, and after every transaction. If the recipient’s wallet is detected as unsafe, funds are instantly returned. It ensures zero loss from fraudulent or high-risk addresses. When verified as safe, the transaction proceeds seamlessly to the recipient.
            </p>
            <div className="pt-1">
              <ButtonGreen
                size="md"
                fontWeight="medium"
                onClick={handleLaunchEscrow}
                icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg"
                iconSize="w-[18px] h-[18px]"
              >
                Try Fradium Escrow
              </ButtonGreen>
            </div>
          </div>

          {/* Feature cards - 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 pt-6 mb-40 md:mb-48 justify-items-stretch">
            {/* Card 1: Smart Verification */}
            <MagicBento
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={false}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              particleCount={12}
              glowColor="153, 227, 158"
              className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
              <div className="relative w-14 h-14 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                <img src="/assets/verification.svg" alt="Verification" className="w-[22px] h-[22px]" />
              </div>
              <div className="relative text-white text-[22px] md:text-[26px] font-medium mb-3">Smart Verification</div>
              <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">Fradium’s AI‑powered risk engine checks the recipient’s address reputation and blockchain activity to ensure your funds only reach safe destinations.</p>
            </MagicBento>

            {/* Card 2: Auto Refund System */}
            <MagicBento
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={false}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              particleCount={12}
              glowColor="153, 227, 158"
              className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
              <div className="relative w-14 h-14 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                <img src="/assets/refund.svg" alt="Auto Refund" className="w-[22px] h-[22px]" />
              </div>
              <div className="relative text-white text-[22px] md:text-[26px] font-medium mb-3">Auto Refund System</div>
              <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">If a suspicious or high‑risk wallet is detected, Fradium Escrow instantly returns the assets to your account. No manual dispute, no waiting time.</p>
            </MagicBento>

            {/* Card 3: Trust Without Middlemen */}
            <MagicBento
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={false}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              particleCount={12}
              glowColor="153, 227, 158"
              className="group w-full rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[22px]" />
              <div className="relative w-14 h-14 rounded-full bg-[#151A1F] border border-white/10 flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
                <img src="/assets/encrypted.svg" alt="Encrypted" className="w-[22px] h-[22px]" />
              </div>
              <div className="relative text-white text-[22px] md:text-[26px] font-medium mb-3">Trust Without Middlemen</div>
              <p className="relative text-[#B0B6BE] text-[14px] leading-[1.8]">Send and receive assets securely without relying on third‑party custodians. Protection through transparent, on‑chain validation — decentralized and verifiable.</p>
            </MagicBento>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductsEscrow;
