import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import SidebarButton from "@/core/components/SidebarButton";
import Footer from "../../core/components/Footer.jsx";
import ButtonGreen from "@/core/components/ButtonGreen";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp";

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
          {/* Dark overlay untuk background lebih gelap */}
          <div className="absolute inset-0 bg-black/70"></div>
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
        {/* Dark overlay untuk background lebih gelap */}
        <div className="absolute inset-0 bg-black/70"></div>
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

          <div className="relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[800px] overflow-visible">
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
              <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
              {/* Dark overlay untuk background lebih gelap */}
              <div className="absolute inset-0 bg-black/70"></div>
            </div>
            {/* Fade ke warna dasar ke background-3 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />
            {/* Wrapper konten */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 md:pt-10 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
              {/* Laptop Image - positioned within background 3 content */}
              <div className="relative flex justify-center items-end mt-16 sm:mt-6 md:mt-8">
                <div className="relative w-full max-w-3xl sm:max-w-4xl md:max-w-5xl mx-auto">
                  {/* Laptop Frame */}
                  <img
                    src="assets/laptop.webp"
                    alt="MacBook"
                    className="w-full h-auto object-contain"
                    style={{
                      transform: "translateY(0px)",
                      marginBottom: "-10%",
                    }}
                    draggable={false}
                  />

                  <div
                    className="absolute 
                top-[2.5%] left-[8.5%] w-[83%] h-[109%]
                md:top-[2.5%] md:left-[8.5%] md:w-[83%] md:h-[109%]
                lg:top-[2.5s%] lg:left-[8.5%] lg:w-[83%] lg:h-[109%]
                rounded-lg overflow-hidden">
                    <video src="https://res.cloudinary.com/dsvxom8rv/video/upload/v1761181346/API4_bhayka.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover rounded-lg" />
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
