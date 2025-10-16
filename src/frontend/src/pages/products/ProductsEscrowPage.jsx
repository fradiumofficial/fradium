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
        navigate("/escrow/list");
      });
    } else {
      // Jika sudah login, langsung redirect ke P2P Trade page
      navigate("/escrow/list");
    }
  };

  if (isMobile) {
    // Layout mobile khusus
    return (
      <div className="relative min-h-screen bg-[#000510] mt-10 text-white font-inter w-full overflow-x-hidden pb-0 flex flex-col">
        {/* Background layer - match desktop */}
        <div className="absolute inset-x-0 top-16 bottom-0 z-0 pointer-events-none select-none">
          <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover object-top" />
        </div>
        {/* Soft fade to blend with navbar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />
        {/* Glow background */}
        <img src="/assets/images/glow.png" alt="Glow" className="absolute top-0 left-0 w-[340px] h-[200px] opacity-40 z-0 pointer-events-none select-none" style={{ objectFit: "cover" }} />
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-14 pb-2 px-3">
          {/* Section label */}
          <span className="text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM ESCROW</span>
          {/* Heading (same as desktop) */}
          <h1 className="text-white text-center text-[26px] font-medium leading-tight mb-3 max-w-[22rem]">Secure transactions with smart escrow</h1>
          {/* Description (same copy as desktop) */}
          <p className="text-[#B0B6BE] text-center text-[14px] font-normal leading-relaxed max-w-[28rem] mx-auto mb-4">Fradium Escrow provides secure transaction protection with smart contract automation, ensuring safe exchanges between parties with automated dispute resolution.</p>
          {/* Try it free button for mobile (launch escrow) */}
          <div className="w-full flex justify-center mb-6">
            <div className="max-w-xs">
              <ButtonGreen size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" textSize="text-[13px]" className="w-full whitespace-nowrap" onClick={handleLaunchEscrow}>
                Try Escrow
              </ButtonGreen>
            </div>
          </div>
        </div>

        {/* Cards section (same content as desktop, stacked) */}
        <div className="z-10 relative grid grid-cols-1 gap-4 mb-8 px-3 mt-2">
          {/* Card 1 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/safe-transaction.webp" alt="Secure Escrow" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Secure Escrow</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Automated smart contract protection for safe transactions</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/analyze-address.webp" alt="Dispute Resolution" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Dispute Resolution</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Automated arbitration system for fair conflict resolution</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/history.webp" alt="Transaction History" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Transaction History</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Complete audit trail of all escrow transactions</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MacBook section for mobile */}
        <div className="relative z-10 flex justify-center items-center mt-8 px-3">
          <div className="relative w-full max-w-xl">
            <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/macbook-wallet.webp" alt="MacBook with Fradium Escrow" className="w-full h-auto object-cover mx-auto" draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-[83.7%] h-[54%] top-[23%] left-[8.15%] overflow-hidden rounded-[6px]">
                  <video className="w-full h-full object-cover" autoPlay loop muted playsInline preload="metadata" poster="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp">
                    <source src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-demo.mp4" type="video/mp4" />
                    <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp" alt="Fradium Escrow Dashboard" className="w-full h-full object-cover" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-auto">
          <Footer />
        </div>
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
