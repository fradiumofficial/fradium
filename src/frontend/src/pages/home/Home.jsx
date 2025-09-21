import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import Footer from "../../core/components/Footer.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider.jsx";

const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";
const HOW_IT_WORKS_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/how-it-works.png";
const LOGO_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/logo.png";
const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp";

const Home = React.memo(() => {
  const { isAuthenticated, handleLogin } = useAuth();
  const navigate = useNavigate();

  // Fungsi untuk handle launch wallet - cek login dulu
  const handleLaunchWallet = React.useCallback(async () => {
    if (!isAuthenticated) {
      // Jika belum login, lakukan login dulu
      await handleLogin(({ user, isAuthenticated: authStatus }) => {
        // Callback setelah login berhasil - redirect ke wallet
        navigate("/wallet");
      });
    } else {
      // Jika sudah login, langsung redirect ke wallet
      navigate("/wallet");
    }
  }, [isAuthenticated, handleLogin, navigate]);

  const [isMounted, setIsMounted] = useState(true); // Start with true to avoid initial re-render

  useEffect(() => {
    // Remove the timeout that causes re-render
    setIsMounted(true);
  }, []);

  const appear = "opacity-100 translate-y-0"; // Simplified, no conditional rendering

  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      <style>{`
        @keyframes fradium-float {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-12px); 
          }
        }
        .floating-slow { 
          animation: fradium-float 6s ease-in-out infinite; 
          will-change: transform;
        }
        @keyframes fradium-ring-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.15;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.25;
          }
        }
        @keyframes fradium-icon-float {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            transform: scale(1.05) rotate(2.5deg);
          }
        }
      `}</style>
      {/* Tagline di atas background */}
      <div className={`relative z-10 mx-auto w-full max-w-7xl px-4 pt-16 mt-8 text-center sm:pt-24 transition-all duration-700 ease-out ${appear}`}>
        <p className="text-[14px] font-medium tracking-[0.28em] text-[#C1FFC5]">REINVENTED BLOCKCHAIN SECURITY</p>
      </div>

      {/* Hero background dimulai di bawah tagline, mengikuti pola layering dari App.jsx */}
      <div className={`relative mx-auto mt-4 overflow-hidden transition-all duration-700 ease-out ${appear}`}>
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="high" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
        </div>

        {/* Content di atas background */}
        <div className={`relative z-10 flex flex-col items-center justify-center text-center transition-all duration-700 ease-out ${appear}`}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white">
            Protect every transaction.
            <br className="hidden sm:block" />
            Stay ahead of fraud.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-gray-300 text-sm md:text-base">Here is Your Digital Asset Guardian to Analyse, Protect, Transact with Confidence.</p>
        </div>
        {/* Row pertama: dua card */}
        <div className={`relative z-10 mx-auto w-full max-w-6xl pt-14 transition-all duration-700 ease-out ${appear}`}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
            {/* Card kiri: About Fradium Web3 Security */}
            <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 md:p-8 lg:p-10 lg:pr-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
              {/* decorative grid/beam overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_70%_-80px,rgba(153,227,158,0.10),transparent_65%)] opacity-60" />
              {/* Header row: title only; CTA moved to absolute top-right */}
              <div className="relative z-[1] flex items-center gap-4">
                <h3 className="text-xl md:text-2xl lg:text-3xl leading-[1.1] font-medium text-white">
                  About <span className="text-[#99E39E]">Fradium</span>
                  <br /> Web3 Security
                </h3>
              </div>
              {/* CTA button pinned to top-right corner */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 lg:top-10 lg:right-10 z-[2]">
                <ButtonGreen size="md" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[23px] h-[23px]" fontWeight="medium" onClick={handleLaunchWallet}>
                  Launch Wallet
                </ButtonGreen>
              </div>
              {/* Description block (controlled by padding) */}
              <div className="relative z-[1] pt-16 md:pt-20 lg:pt-32">
                <p className="max-w-md md:max-w-lg text-xs md:text-sm font-normal text-white/75">With Fradium, you can easily analyse wallet addresses before making any interaction. Our mission is simple, to help you identify risks, prevent fraud, and navigate the blockchain ecosystem with confidence.</p>
              </div>
              {/* Bento artwork (right bottom, slightly cropped, aligned with button) */}
              <div className="absolute right-[-40px] md:right-[-64px] bottom-[-84px] md:bottom-[-84px] w-[270px] md:w-[350px] lg:w-[400px] pointer-events-none select-none floating-slow">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/bento.webp" alt="Fradium Bento" className="w-full h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.45)]" decoding="async" loading="lazy" draggable={false} />
              </div>
              {/* Hover glow highlight */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(16,185,129,0.18),rgba(34,197,94,0.12)_55%,transparent_80%)]" />
            </div>

            {/* Card kanan: Fraud Detection */}
            <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
              {/* Background image */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/fraud-detection-frame.webp"
                  alt="Fraud Detection"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* Content overlay */}
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl leading-[1.1] font-normal text-white">Fraud Detection</h3>
                <p className="mt-3 max-w-xl text-xs md:text-sm font-normal text-white/75">Discover and map crypto projects while identifying potential wallet risks early, before making any transaction.</p>
              </div>

              {/* Animated Search Icon in Center */}
              <div className="absolute inset-0 z-10 flex items-center justify-center mt-16">
                <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                  {/* Outer Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[200px] h-[200px] bg-gradient-to-b from-[rgba(34,197,94,0.15)] to-[rgba(34,197,94,0.08)] rounded-full animate-pulse"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite'
                    }}
                  />

                  {/* Middle Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[150px] h-[150px] bg-gradient-to-b from-[rgba(34,197,94,0.2)] to-[rgba(34,197,94,0.1)] rounded-full"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite 0.3s'
                    }}
                  />

                  {/* Inner Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[100px] h-[100px] bg-gradient-to-b from-[rgba(34,197,94,0.25)] to-[rgba(34,197,94,0.15)] rounded-full"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite 0.6s'
                    }}
                  />

                  {/* Magnifying Glass Icon - Optimized with CSS animation */}
                  <div
                    className="relative w-[80px] h-[80px]"
                    style={{
                      animation: 'fradium-icon-float 1.5s ease-in-out infinite'
                    }}
                  >
                    <img
                      src="/assets/images/analisis.png"
                      alt="Analyzing"
                      className="w-full h-full drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation dots */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>

              {/* Bottom gradient overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>
        </div>
        {/* Fade ke warna dasar agar transisi halus */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
      <div className={`relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden transition-all duration-700 ease-out ${appear}`}>
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_2} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
        </div>
        {/* Fade dari warna dasar ke background-2 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Row kedua: kolom kiri panjang, kolom kanan dua kartu setengah tinggi */}
        <div className={`relative z-10 mx-auto w-full max-w-6xl pt-6 pb-12 transition-all duration-700 ease-out ${appear}`}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-4">
            {/* Kolom kiri (panjang) */}
            <div className="md:col-span-5">
              <div className="group relative min-h-[540px] md:min-h-[632px] lg:max-h-[682px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 pt-8 pl-4 pr-4 pb-4 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                {/* Header center: logo + title */}
                <div className="flex w-full items-center justify-center gap-3">
                  <img src={LOGO_IMG} alt="Fradium" className="h-10 w-10  select-none" />
                  <h3 className="text-2xl md:text-3xl leading-[1.1] font-normal text-[#C1FFC5]">How it works?</h3>
                </div>

                {/* Hanya gambar, tanpa panel. Diberi margin agar tidak menempel tepi kartu */}
                <img src={HOW_IT_WORKS_IMG} alt="How it works illustration" decoding="async" loading="lazy" draggable={false} className="mt-6" />

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(460px_220px_at_50%_-60px,rgba(20,184,166,0.18),rgba(163,230,53,0.12)_55%,transparent_80%)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            {/* Kolom kanan (dua kartu setengah tinggi) */}
            <div className="md:col-span-7 flex flex-col gap-2 md:gap-4">
              {/* Row pertama: dua kartu sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {/* Kartu kiri */}
                <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                  <h3 className="text-xl md:text-2xl font-medium text-white">Fradium Wallet</h3>
                  <p className="mt-2 max-w-2xl text-sm md:text-base text-white/75">Fradium Wallet safeguards your assets by scanning every transaction in real time.</p>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_260px_at_70%_-40px,rgba(139,92,246,0.18),rgba(59,130,246,0.10)_55%,transparent_80%)] opacity-60" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                {/* Kartu kanan */}
                <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                  {/* Background image - half card size with padding */}
                  <div className="relative z-0 mb-6">
                    <img
                      src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/extensions.webp"
                      alt="Extension"
                      className="w-full h-[120px] md:h-[140px] lg:h-[160px] object-cover rounded-lg"
                      draggable={false}
                    />
                  </div>

                  {/* Content below the image */}
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-medium text-white mb-3">Extension</h3>
                    <div className="flex items-start justify-between">
                      <p className="text-sm md:text-sm text-white/75 flex-1 pr-4">Helps you check the safety of your transaction while browsing Web3.</p>
                      <div className="w-12 h-12 bg-white/5 border border-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row kedua: satu kartu memanjang */}
              <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                <h3 className="text-xl md:text-2xl font-medium text-white">Community</h3>
                <p className="mt-2 max-w-3xl text-sm md:text-base text-white/75">Collaboratively submit, review, and validate fraud cases to defense against scams.</p>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_300px_at_50%_0px,rgba(255,255,255,0.08),transparent_70%)] opacity-30" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
        {/* Fade ke warna dasar di bagian bawah */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background ketiga paling bawah, konten akan diletakkan di atasnya */}
      <div className={`relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[800px] overflow-visible transition-all duration-700 ease-out ${appear}`}>
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
        </div>
        {/* Fade dari warna dasar ke background-3 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Wrapper konten */}
        <div className={`relative z-10 mx-auto w-full max-w-7xl px-4 pt-10 pb-24 md:pb-32 transition-all duration-700 ease-out ${appear}`}>
          {/* Hero di atas background ketiga */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white">Ready to use crypto with protection?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-white/80 text-sm md:text-base">With Fradium, every wallet address is checked in real time, so you can focus on using crypto without worrying about the risks.</p>
            <div className="mt-6">
              <ButtonGreen size="md" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[23px] h-[23px]" onClick={handleLaunchWallet}>
                Try it free
              </ButtonGreen>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
});

export default Home;
