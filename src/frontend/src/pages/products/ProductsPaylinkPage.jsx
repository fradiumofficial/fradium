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
    // Layout mobile - struktur sama dengan desktop, ukuran disesuaikan
    return (
      <div className="min-h-screen bg-[#000510] text-white relative overflow-hidden flex flex-col">
        {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
        <div className="relative mx-auto w-full min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <img src={BACKGROUND_URL_2} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 w-full h-auto object-contain" />
            {/* Dark overlay untuk background lebih gelap */}
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
          {/* Fade dari warna dasar ke background-2 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

          {/* Main Content */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 pb-16">
            {/* Hero di atas background kedua */}
            <div className="flex flex-col items-center mt-20 justify-center text-center mb-8">
              <span className="block text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM PAYMENT LINK</span>
              <h1 className="text-white text-[28px] font-medium leading-tight mb-4">Simplify Crypto Payments, Securely</h1>
              <p className="text-[#B0B6BE] text-[14px] leading-relaxed max-w-[340px] mx-auto mb-6">Instead of copying long wallet addresses or worrying about sending funds to the wrong place, you simply generate a secure link and let Fradium handle the safety checks behind the scenes.</p>
              <div className="pt-1">
                <ButtonGreen size="sm" fontWeight="medium" onClick={handleLaunchPaylink} icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[14px] h-[14px]" className="h-[40px] text-[14px]">
                  Try Fradium Paylink
                </ButtonGreen>
              </div>
            </div>

            {/* Header row (title left, description right) - mobile stacked */}
            <div className="grid grid-cols-1 gap-6 items-start mb-6">
              <div className="text-center">
                <span className="block text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-3 uppercase">HOW TO WORK</span>
                <h2 className="text-white text-[22px] font-medium leading-tight">About Fradium Paylink</h2>
              </div>
              <div className="text-center">
                <p className="text-[#B0B6BE] text-[14px] leading-relaxed">Fradium Paylink is a secure payment feature that lets users send or receive crypto through simple, shareable links and no wallet address needed. To use it, just create a payment link, set the amount, and share the link. The recipient just need to clicks it to pay instantly.</p>
              </div>
            </div>

            {/* Visual + Steps side-by-side - mobile stacked */}
            <div className="grid grid-cols-1 gap-6 items-stretch">
              {/* Visual image card */}
              <MagicBento textAutoHide={false} enableStars={true} enableSpotlight={true} enableBorderGlow={false} enableTilt={false} enableMagnetism={false} clickEffect={true} particleCount={12} glowColor="153, 227, 158">
                <div className="rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] min-h-[280px] flex group transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                  <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/paylink/about-fradium-paylink.webp" alt="About Fradium Paylink Visual" className="w-full h-auto rounded-[18px] object-cover transition-transform duration-300 group-hover:scale-105" draggable={false} />
                </div>
              </MagicBento>

              {/* Steps card */}
              <MagicBento textAutoHide={false} enableStars={true} enableSpotlight={true} enableBorderGlow={false} enableTilt={false} enableMagnetism={false} clickEffect={true} particleCount={12} glowColor="153, 227, 158">
                <div className="bg-[#0B0F14]/70 backdrop-blur-[2px] border border-white/12 rounded-[22px] p-4 min-h-[280px] flex flex-col group transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                  <div className="mb-8">
                    <span className="text-white text-[16px] font-normal">3 Steps only!</span>
                    <h3 className="text-[20px] font-medium leading-tight mt-1">
                      <span className="text-[#8791E1]">How to </span>
                      <span className="text-white">Make Transaction</span>
                    </h3>
                  </div>

                  <div className="">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* marker column */}
                      <div className="w-10 flex flex-col items-center">
                        <div className="w-8 h-8 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-black font-medium text-[12px]">01</span>
                        </div>
                        <div className="w-0.5 h-8 bg-gray-600/60 mt-2"></div>
                      </div>
                      {/* content */}
                      <div className="flex-1 pt-1">
                        <p className="text-white text-[13px] leading-relaxed">Open Fradium Paylink and set the payment. Fradium will auto-generates a unique, secure Paylink tied to your wallet.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 flex flex-col items-center">
                        <div className="w-8 h-8 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-black font-medium text-[12px]">02</span>
                        </div>
                        <div className="w-0.5 h-8 bg-[#99E39E] mt-2"></div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-white text-[13px] leading-relaxed">Share the Link. The recipient doesn't need to input or copy any address, just one click takes them directly to a verified payment page.</p>
                      </div>
                    </div>

                    {/* Step 3 - Final step with green styling */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 flex items-start justify-center pt-0.5">
                        <div className="w-8 h-8 bg-[#99E39E] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#99E39E] text-[13px] leading-relaxed">The recipient clicks it to pay instantly. Recipient can also verify the transaction in real time before pay.</p>
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
        <div className="relative mx-auto w-full min-h-[400px] overflow-visible">
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
            {/* Dark overlay untuk background lebih gelap */}
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
          {/* Fade ke warna dasar ke background-3 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

          {/* MacBook section - stick to bottom above footer */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center items-end pb-6">
            <div className="relative max-w-4xl w-full">
              <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/paylink/macbook-fradium-paylink.webp" alt="MacBook with Fradium Paylink" className="w-full h-auto max-h-[300px] object-contain mx-auto" draggable={false} />
            </div>
          </div>
        </div>

        <Footer />
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
          {/* Dark overlay untuk background lebih gelap */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        {/* Fade dari warna dasar ke background-2 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Main Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 md:pt-10 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
          {/* Hero di atas background kedua */}
          <div className="flex flex-col items-center mt-16 justify-center text-center mb-12">
            <span className="block text-[#9beb83] text-[14px] font-semibold tracking-[0.18em] mb-3 uppercase">FRADIUM PAYMENT LINK</span>
            <h1 className="text-white text-[36px] md:text-[40px] font-medium leading-tight mb-4">Simplify Crypto Payments, Securely</h1>
            <p className="text-[#B0B6BE] text-[14px] md:text-[15px] leading-relaxed max-w-4xl mx-auto mb-6">Instead of copying long wallet addresses or worrying about sending funds to the wrong place, you simply generate a secure link and let Fradium handle the safety checks behind the scenes.</p>
            <div className="pt-1">
              <ButtonGreen size="md" fontWeight="medium" onClick={handleLaunchPaylink} icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[18px] h-[18px]">
                Try Fradium Paylink
              </ButtonGreen>
            </div>
          </div>

          {/* Header row (title left, description right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-6">
            <div className="text-center lg:text-left">
              <span className="block text-[#9beb83] text-[14px] font-semibold tracking-[0.18em] mb-3 uppercase">HOW TO WORK</span>
              <h2 className="text-white text-[28px] md:text-[32px] font-medium leading-tight">About Fradium Paylink</h2>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-[#B0B6BE] text-[14px] md:text-[15px] leading-relaxed">Fradium Paylink is a secure payment feature that lets users send or receive crypto through simple, shareable links and no wallet address needed. To use it, just create a payment link, set the amount, and share the link. The recipient just need to clicks it to pay instantly.</p>
            </div>
          </div>

          {/* Visual + Steps side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left: Visual image card */}
            <MagicBento textAutoHide={false} enableStars={true} enableSpotlight={true} enableBorderGlow={false} enableTilt={false} enableMagnetism={false} clickEffect={true} particleCount={12} glowColor="153, 227, 158">
              <div className="rounded-[22px] border border-white/12 bg-[#0B0F14]/70 backdrop-blur-[2px] p-2 md:p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] min-h-[380px] flex group transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/paylink/about-fradium-paylink.webp" alt="About Fradium Paylink Visual" className="w-full h-auto rounded-[18px] object-cover transition-transform duration-300 group-hover:scale-105" draggable={false} />
              </div>
            </MagicBento>

            {/* Right: Steps card */}
            <MagicBento textAutoHide={false} enableStars={true} enableSpotlight={true} enableBorderGlow={false} enableTilt={false} enableMagnetism={false} clickEffect={true} particleCount={12} glowColor="153, 227, 158">
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
                      <p className="text-white text-[14px] leading-relaxed">Open Fradium Paylink and set the payment. Fradium will auto-generates a unique, secure Paylink tied to your wallet.</p>
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
                      <p className="text-white text-[14px] leading-relaxed">Share the Link. The recipient doesn't need to input or copy any address, just one click takes them directly to a verified payment page.</p>
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
                      <p className="text-[#99E39E] text-[14px] leading-relaxed">The recipient clicks it to pay instantly. Recipient can also verify the transaction in real time before pay.</p>
                    </div>
                  </div>
                </div>
              </div>
            </MagicBento>
          </div>

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
                  <video src="https://res.cloudinary.com/dsvxom8rv/video/upload/v1761184193/Paylink_wminoj.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Fade ke warna dasar di bagian bawah */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPaylink;
