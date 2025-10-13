import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import SidebarButton from "@/core/components/SidebarButton";
import Footer from "../../core/components/Footer.jsx";
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

const DeveloperPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, handleLogin } = useAuth();

  // Fungsi untuk handle launch developer - cek login dulu
  const handleLaunchDeveloper = async () => {
    if (!isAuthenticated) {
      // Jika belum login, lakukan login dulu
      await handleLogin(({ user, isAuthenticated: authStatus }) => {
        // Callback setelah login berhasil - redirect ke API dashboard
        navigate("/developer");
      });
    } else {
      // Jika sudah login, langsung redirect ke API dashboard
      navigate("/developer");
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
          <span className="text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM API</span>
          {/* Heading (same as desktop) */}
          <h1 className="text-white text-center text-[26px] font-medium leading-tight mb-3 max-w-[22rem]">Build with Fradium's powerful API</h1>
          {/* Description (same copy as desktop) */}
          <p className="text-[#B0B6BE] text-center text-[14px] font-normal leading-relaxed max-w-[28rem] mx-auto mb-4">Integrate Fradium's fraud detection and wallet analysis capabilities into your applications with our comprehensive API and SDK.</p>
          {/* Try it free button for mobile (launch developer) */}
          <div className="w-full flex justify-center mb-6">
            <div className="max-w-xs">
              <ButtonGreen size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" textSize="text-[13px]" className="w-full whitespace-nowrap" onClick={handleLaunchDeveloper}>
                Get Started
              </ButtonGreen>
            </div>
          </div>
        </div>

        {/* Cards section (same content as desktop, stacked) */}
        <div className="z-10 relative grid grid-cols-1 gap-4 mb-8 px-3 mt-2">
          {/* Card 1 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/safe-transaction.webp" alt="API Documentation" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">API Documentation</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Comprehensive guides and reference for all API endpoints</div>
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
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/analyze-address.webp" alt="SDK & Tools" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">SDK & Tools</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Ready-to-use SDKs for popular programming languages</div>
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
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/history.webp" alt="Analytics Dashboard" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Analytics Dashboard</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Monitor API usage and performance metrics</div>
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
            <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/macbook-wallet.webp" alt="MacBook with Fradium API" className="w-full h-auto object-cover mx-auto" draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-[83.7%] h-[54%] top-[23%] left-[8.15%] overflow-hidden rounded-[6px]">
                  <video className="w-full h-full object-cover" autoPlay loop muted playsInline preload="metadata" poster="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp">
                    <source src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-demo.mp4" type="video/mp4" />
                    <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp" alt="Fradium API Dashboard" className="w-full h-full object-cover" />
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
      {/* Background layer - starts below navbar (not from top) */}
      <div className="absolute inset-x-0 top-20 md:top-28 bottom-0 z-0 pointer-events-none select-none">
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover object-top" />
      </div>
      {/* Soft fade at top edge to blend with navbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />

      {/* Main Content */}
      <main className="relative z-10 pt-28 px-4 sm:px-6 flex-1">
        <div className="container mx-auto max-w-[1300px]">
          {/* Top content before background */}
          <div className="flex items-start justify-between gap-6 mb-12">
            <div className="flex-1 min-w-[320px]">
              <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-3 uppercase">FRADIUM API</span>
              <h1 className="text-white text-[36px] font-medium leading-tight mb-3">Build with Fradium's powerful API</h1>
              <p className="text-[#B0B6BE] text-[14px] md:text-[15px] max-w-3xl">Integrate Fradium's fraud detection and wallet analysis capabilities into your applications with our comprehensive API and SDK.</p>
            </div>
            <div className="shrink-0 hidden md:block pt-4">
              <ButtonGreen size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[18px] h-[18px] md:w-[23px] md:h-[23px]" onClick={handleLaunchDeveloper}>
                Get Started
              </ButtonGreen>
            </div>
          </div>

          {/* Cards section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 md:gap-4 mb-16 justify-items-center">
            {/* Card 1: API Documentation */}
            <div className="w-full max-w-[420px] h-[411px] rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2 transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
              <div className="w-full h-[250px] rounded-[12px] bg-white/5 mb-5 overflow-hidden">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/safe-transaction.webp" alt="API Documentation" className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white text-[18px] md:text-[20px] font-medium">API Documentation</div>
                  <div className="text-[#B0B6BE] text-[12px] md:text-[13px] mt-1">Comprehensive guides and reference for all API endpoints</div>
                </div>
                <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 2: SDK & Tools */}
            <div className="w-full max-w-[420px] h-[411px] rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2 transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
              <div className="w-full h-[250px] rounded-[12px] bg-white/5 mb-5 overflow-hidden">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/analyze-address.webp" alt="SDK & Tools" className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white text-[18px] md:text-[20px] font-medium">SDK & Tools</div>
                  <div className="text-[#B0B6BE] text-[12px] md:text-[13px] mt-1">Ready-to-use SDKs for popular programming languages</div>
                </div>
                <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 3: Analytics Dashboard */}
            <div className="w-full max-w-[420px] h-[411px] rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2 transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
              <div className="w-full h-[250px] rounded-[12px] bg-white/5 mb-5 overflow-hidden">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/history.webp" alt="Analytics Dashboard" className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white text-[18px] md:text-[20px] font-medium">Analytics Dashboard</div>
                  <div className="text-[#B0B6BE] text-[12px] md:text-[13px] mt-1">Monitor API usage and performance metrics</div>
                </div>
                <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* MacBook section */}
          <div className="flex justify-center pt-8 items-center">
            <div className="relative max-w-4xl w-full">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/macbook-wallet.webp" alt="MacBook with Fradium API" className="w-full h-auto max-h-[500px] object-contain mx-auto" draggable={false} />
              {/* Video overlay for MacBook screen */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Video area positioned on MacBook screen */}
                  <div className="absolute w-[83.7%] h-[54%] top-[23%] left-[8.15%] overflow-hidden rounded-[8px]">
                    <video className="w-full h-full object-cover" autoPlay loop muted playsInline preload="metadata" poster="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp">
                      <source src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-demo.mp4" type="video/mp4" />
                      {/* Fallback image if video doesn't load */}
                      <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/wallet-dashboard-poster.webp" alt="Fradium API Dashboard" className="w-full h-full object-cover" />
                    </video>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DeveloperPage;
