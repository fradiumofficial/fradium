import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import SidebarButton from "@/core/components/SidebarButton";
import Footer from "../../core/components/Footer.jsx";
import ButtonGreen from "@/core/components/ButtonGreen";
import MagicBento from "@/core/components/MagicBento.jsx";

// Background URLs from HomePage.jsx
const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";
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

const ProductsPaylink = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, handleLogin } = useAuth();

  // Fungsi untuk handle launch paylink - cek login dulu
  const handleLaunchPaylink = async () => {
    if (!isAuthenticated) {
      // Jika belum login, lakukan login dulu
      await handleLogin(({ user, isAuthenticated: authStatus }) => {
        // Callback setelah login berhasil - redirect ke paylink
        navigate("/paylink");
      });
    } else {
      // Jika sudah login, langsung redirect ke paylink
      navigate("/paylink");
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
        <div className="relative z-10 flex flex-col items-center justify-center pt-32 pb-2 px-3">
          {/* Section label */}
          <span className="text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM PAYLINK</span>
          {/* Heading */}
          <h1 className="text-white text-center text-[26px] font-medium leading-tight mb-3 max-w-[22rem]">Accept crypto payments effortlessly</h1>
          {/* Description */}
          <p className="text-[#B0B6BE] text-center text-[14px] font-normal leading-relaxed max-w-[28rem] mx-auto mb-4">Fradium Paylink enables you to create secure payment links instantly, allowing customers to pay with cryptocurrency without needing complex integrations or technical knowledge.</p>
          {/* Launch button for mobile */}
          <div className="w-full flex justify-center mb-6">
            <div className="max-w-xs">
              <ButtonGreen size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" textSize="text-[13px]" className="w-full whitespace-nowrap" onClick={handleLaunchPaylink}>
                Launch Paylink
              </ButtonGreen>
            </div>
          </div>
        </div>

        {/* Cards section */}
        <div className="z-10 relative grid grid-cols-1 gap-4 mb-8 px-3 mt-2">
          {/* Card 1 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/instant-links.webp" alt="Instant Payment Links" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Instant Payment Links</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Generate secure payment links in seconds for any amount</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/multi-currency.webp" alt="Multi-Currency Support" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Multi-Currency Support</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Accept payments in multiple cryptocurrencies seamlessly</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#00000059] backdrop-blur-[2px] p-2">
            <div className="w-full h-[200px] rounded-[12px] bg-white/5 mb-4 overflow-hidden">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/track-payments.webp" alt="Payment Tracking" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white text-[18px] font-medium">Payment Tracking</div>
                <div className="text-[#B0B6BE] text-[12px] mt-1">Monitor all payment links and transaction status in real-time</div>
              </div>
              <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MacBook section for mobile */}
        <div className="relative z-10 flex justify-center items-center mt-8 px-3">
          <div className="relative w-full max-w-xl">
            <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/produc/macbook-paylink.webp" alt="MacBook with Fradium Paylink" className="w-full h-auto object-cover mx-auto" draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-[83.7%] h-[54%] top-[23%] left-[8.15%] overflow-hidden rounded-[6px]">
                  <video className="w-full h-full object-cover" autoPlay loop muted playsInline preload="metadata" poster="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/paylink-dashboard-poster.webp">
                    <source src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/paylink-dashboard-demo.mp4" type="video/mp4" />
                    <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/paylink-dashboard-poster.webp" alt="Fradium Paylink Dashboard" className="w-full h-full object-cover" />
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
      {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
      <div className="relative mx-auto w-full min-h-[520px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_2} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 w-full h-auto object-contain" />
        </div>
        {/* Fade dari warna dasar ke background-2 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Main Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 md:pt-10 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
          {/* Hero di atas background kedua */}
          <div className="flex flex-col items-center mt-16 justify-center text-center mb-12">
            <span className="block text-[#9beb83] text-[14px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM PAYMENT LINK</span>
            <h1 className="text-white text-[36px] md:text-[40px] font-medium leading-tight mb-4">Simplify Crypto Payments, Securely</h1>
            <p className="text-[#B0B6BE] text-[14px] md:text-[15px] leading-relaxed max-w-4xl mx-auto mb-6">
              Instead of copying long wallet addresses or worrying about sending funds to the wrong place, you simply generate a secure link and let Fradium handle the safety checks behind the scenes.
            </p>
            <div className="pt-1">
              <ButtonGreen
                size="md"
                fontWeight="medium"
                onClick={handleLaunchPaylink}
                icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg"
                iconSize="w-[18px] h-[18px]"
              >
                Try Fradium Paylink
              </ButtonGreen>
            </div>
          </div>

          {/* Header row (title left, description right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-6">
            <div>
              <span className="block text-[#9beb83] text-[14px] font-semibold tracking-[0.18em] mb-3 uppercase">HOW TO WORK</span>
              <h2 className="text-white text-[28px] md:text-[32px] font-medium leading-tight">About Fradium Paylink</h2>
            </div>
            <div>
              <p className="text-[#B0B6BE] text-[14px] md:text-[15px] leading-relaxed">
                Fradium Paylink is a secure payment feature that lets users send or receive crypto through simple, shareable links and no wallet address needed. To use it, just create a payment link, set the amount, and share the link. The recipient just need to clicks it to pay instantly.
              </p>
            </div>
          </div>

          {/* Visual + Steps side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left: Visual image card */}
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
            >
              <div className="rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-2 md:p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] min-h-[380px] flex group transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                <img
                  src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/paylink/about-fradium-paylink.webp"
                  alt="About Fradium Paylink Visual"
                  className="w-full h-auto rounded-[18px] object-cover transition-transform duration-300 group-hover:scale-105"
                  draggable={false}
                />
              </div>
            </MagicBento>

            {/* Right: Steps card */}
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
            >
              <div className="bg-[#0B0F14]/70 backdrop-blur-[2px] border border-white/12 rounded-[22px] p-6 md:p-8 min-h-[380px] flex flex-col group transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                <div className="mb-16">
                  <span className="text-white text-[20px] font-normal">3 Steps only!</span>
                  <h3 className="text-[22px] md:text-[38px] font-medium leading-tight mt-1">
                    <span className="text-[#8791E1]">How to </span>
                    <span className="text-white">Make Transaction</span>
                  </h3>
                </div>

                <div className="">
                  {/* Step 1 */}
                  <div className="flex items-start gap-5">
                    {/* marker column */}
                    <div className="w-12 flex flex-col items-center">
                      <div className="w-9 h-9 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-black font-medium text-[13px]">01</span>
                      </div>
                      <div className="w-0.5 h-14 md:h-16 bg-gray-600/60 mt-2"></div>
                    </div>
                    {/* content */}
                    <div className="flex-1 pt-1">
                      <p className="text-white text-[14px] leading-relaxed">
                        Open Fradium Paylink and set the payment. Fradium will auto-generates a unique, secure Paylink tied to your wallet.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 flex flex-col items-center">
                      <div className="w-9 h-9 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-black font-medium text-[13px]">02</span>
                      </div>
                      <div className="w-0.5 h-14 md:h-16 bg-[#99E39E] mt-2"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-white text-[14px] leading-relaxed">
                        Share the Link. The recipient doesn't need to input or copy any address, just one click takes them directly to a verified payment page.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 - Final step with green styling */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 flex items-start justify-center pt-0.5">
                      <div className="w-9 h-9 bg-[#99E39E] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#99E39E] text-[14px] leading-relaxed">
                        The recipient clicks it to pay instantly. Recipient can also verify the transaction in real time before pay.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MagicBento>
          </div>
        </div>
        {/* Fade ke warna dasar di bagian bawah */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background ketiga paling bawah, konten akan diletakkan di atasnya */}
      <div className="relative mx-auto w-full min-h-[520px] md:min-h-[680px] lg:min-h-[800px] overflow-visible">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
        </div>
        {/* Fade ke warna dasar ke background-3 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* MacBook section - stick to bottom above footer */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center items-end pb-6 md:pb-8 lg:pb-10">
          <div className="relative max-w-4xl w-full">
            <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/paylink/macbook-fradium-paylink.webp" alt="MacBook with Fradium Paylink" className="w-full h-auto max-h-[500px] object-contain mx-auto" draggable={false} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPaylink;