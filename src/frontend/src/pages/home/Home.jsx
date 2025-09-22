import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";
import Footer from "../../core/components/Footer.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider.jsx";

const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";
const HOW_IT_WORKS_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/how-it-works-frames.webp";
const LOGO_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/logo.png";
const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp";

const Home = React.memo(() => {
  const { isAuthenticated, handleLogin } = useAuth();
  const navigate = useNavigate();

  // Refs for scroll animations
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  // Scroll-based animations
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // In-view animations
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-50px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-50px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-50px" });

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
        @keyframes marquee {
          0% { 
            transform: translateX(0);
          }
          100% { 
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        
        /* Advanced animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(153, 227, 158, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(153, 227, 158, 0.6);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        /* Animation classes */
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Hover effects */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        
        /* Enhanced hover effects for specific cards */
        .card-hover-enhanced {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .card-hover-enhanced:hover {
          transform: translateY(-12px) scale(1.05);
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
        }
        
        /* Custom Fraud Detection Card Hover */
        .fraud-detection-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }
        .fraud-detection-hover:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 
            0 25px 50px rgba(0,0,0,0.6),
            0 0 20px rgba(153, 227, 158, 0.15);
          border-color: rgba(153, 227, 158, 0.2);
        }
        
        /* Fraud Detection Background Image Hover */
        .fraud-bg-hover {
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .fraud-detection-hover:hover .fraud-bg-hover {
          transform: scale(1.1);
          filter: brightness(1.1) contrast(1.05);
        }
        
        /* Fraud Detection Content Hover */
        .fraud-content-hover {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .fraud-detection-hover:hover .fraud-content-hover {
          transform: translateY(-3px);
          text-shadow: 0 0 8px rgba(153, 227, 158, 0.3);
        }
        
        /* Fraud Detection Search Icon Hover */
        .fraud-search-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .fraud-detection-hover:hover .fraud-search-hover {
          transform: scale(1.08);
          filter: drop-shadow(0 0 12px rgba(153, 227, 158, 0.4));
        }
        
        /* Fraud Detection Ring Hover */
        .fraud-ring-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .fraud-detection-hover:hover .fraud-ring-hover {
          transform: scale(1.05);
          opacity: 0.9;
        }
        
        /* Glow effect for Fraud Detection */
        .fraud-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(153, 227, 158, 0.03) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .fraud-detection-hover:hover .fraud-glow {
          opacity: 1;
        }
        
        /* Smooth scale animation */
        .card-scale {
          transition: transform 0.3s ease-out;
        }
        .card-scale:hover {
          transform: scale(1.03);
        }
        
        /* Button hover effects */
        .btn-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(153, 227, 158, 0.3);
        }
        
        /* Text reveal animation */
        @keyframes textReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .text-reveal {
          animation: textReveal 0.8s ease-out forwards;
        }
        
        /* Card entrance animation */
        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .card-entrance {
          animation: cardEntrance 0.6s ease-out forwards;
        }
        
        /* Pulse animation for important elements */
        @keyframes gentlePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .gentle-pulse {
          animation: gentlePulse 2s ease-in-out infinite;
        }
        
        /* Gradient animation */
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .gradient-animate {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        
        /* Stagger animation delays */
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
      `}</style>
      {/* Tagline di atas background */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-12 sm:pt-16 md:pt-24 mt-4 sm:mt-6 md:mt-8 text-center">
        <p className="text-xs sm:text-[14px] font-medium tracking-[0.2em] sm:tracking-[0.28em] text-[#C1FFC5] mt-4 sm:mt-0">REINVENTED BLOCKCHAIN SECURITY</p>
      </div>

      {/* Hero background dimulai di bawah tagline, mengikuti pola layering dari App.jsx */}
      <div className="relative mx-auto mt-4 overflow-hidden">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="high" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
        </div>

        {/* Content di atas background */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white text-reveal">
            Protect every transaction.
            <br className="hidden sm:block" />
            Stay ahead of fraud.
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-gray-300 text-sm sm:text-base md:text-base text-reveal stagger-1">
            Here is Your Digital Asset Guardian to Analyse, Protect, Transact with Confidence.
          </p>
        </div>
        {/* Row pertama: dua card */}
        <div className="relative z-10 mx-auto w-full max-w-6xl pt-6 sm:pt-8 md:pt-12 lg:pt-14 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-4">
            {/* Card kiri: About Fradium Web3 Security */}
            <motion.div
              className="group relative min-h-[300px] sm:min-h-[320px] md:min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[16px] sm:rounded-[20px] border border-white/10 bg-[#000000]/60 p-3 pr-28 sm:p-4 sm:pr-24 md:p-8 lg:p-10 lg:pr-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px] fraud-detection-hover card-entrance stagger-1"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{
                y: -10,
                scale: 1.05,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
            >
              {/* Glow effect overlay */}
              <div className="fraud-glow"></div>

              {/* decorative grid/beam overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_70%_-80px,rgba(153,227,158,0.10),transparent_65%)] opacity-60" />
              {/* Header row: title only; CTA moved to absolute top-right */}
              <div className="relative z-[1] flex items-center gap-2 sm:gap-4 fraud-content-hover">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] font-medium text-white">
                  About <span className="text-[#99E39E]">Fradium</span>
                  <br /> Web3 Security
                </h3>
              </div>
              {/* CTA button pinned to top-right corner */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-8 md:right-8 lg:top-10 lg:right-10 z-[2]">
                <div className="btn-hover rounded-full gentle-pulse">
                  <ButtonGreen size="sm" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] md:w-[23px] md:h-[23px]" fontWeight="medium" onClick={handleLaunchWallet}>
                    <span className="hidden sm:inline">Launch Wallet</span>
                    <span className="sm:hidden">Launch</span>
                  </ButtonGreen>
                </div>
              </div>
              {/* Description block (controlled by padding) */}
              <div className="relative z-[1] pt-14 sm:pt-12 md:pt-20 lg:pt-32 fraud-content-hover">
                <p className="max-w-[160px] sm:max-w-[250px] md:max-w-md lg:max-w-lg text-xs sm:text-sm md:text-sm font-normal text-white/75 leading-relaxed">With Fradium, you can easily analyse wallet addresses before making any interaction. Our mission is simple, to help you identify risks, prevent fraud, and navigate the blockchain ecosystem with confidence.</p>
              </div>
              {/* Bento artwork (positioned below button on mobile, right top on desktop) */}
              <div className="absolute right-[-35px] top-[50px] sm:right-[-15px] sm:top-[60px] md:right-[-50px] md:top-[30px] lg:top-[80px] w-[200px] sm:w-[200px] md:w-[280px] lg:w-[320px] pointer-events-none select-none floating-slow fraud-bg-hover">
                <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/about-fradiums.webp" alt="Fradium Bento" className="w-full h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.45)]" decoding="async" loading="lazy" draggable={false} />
              </div>
              {/* Hover glow highlight */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(16,185,129,0.18),rgba(34,197,94,0.12)_55%,transparent_80%)]" />
            </motion.div>

            {/* Card kanan: Fraud Detection */}
            <div className="group relative min-h-[280px] sm:min-h-[320px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[16px] sm:rounded-[20px] border border-white/10 bg-[#000000]/70 p-3 sm:p-4 md:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px] fraud-detection-hover card-entrance stagger-2">
              {/* Glow effect overlay */}
              <div className="fraud-glow"></div>

              {/* Background image */}
              <div className="absolute inset-0 z-0 fraud-bg-hover">
                <img
                  src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/frame-fraud-detection.webp"
                  alt="Fraud Detection"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* Content overlay */}
              <div className="relative z-10 fraud-content-hover">
                <h3 className="text-xl sm:text-2xl md:text-3xl leading-[1.1] font-normal text-white">Fraud Detection</h3>
                <p className="mt-3 max-w-xl text-xs sm:text-sm md:text-sm font-normal text-white/75">Discover and map crypto projects while identifying potential wallet risks early, before making any transaction.</p>
              </div>

              {/* Animated Search Icon in Center */}
              <div className="absolute inset-0 z-10 flex items-center justify-center mt-12 sm:mt-16 fraud-search-hover">
                <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center">
                  {/* Outer Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] bg-gradient-to-b from-[rgba(34,197,94,0.15)] to-[rgba(34,197,94,0.08)] rounded-full animate-pulse fraud-ring-hover"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite'
                    }}
                  />

                  {/* Middle Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[105px] h-[105px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] bg-gradient-to-b from-[rgba(34,197,94,0.2)] to-[rgba(34,197,94,0.1)] rounded-full fraud-ring-hover"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite 0.3s'
                    }}
                  />

                  {/* Inner Ring - Optimized with CSS animation */}
                  <div
                    className="absolute w-[70px] h-[70px] sm:w-[85px] sm:h-[85px] md:w-[100px] md:h-[100px] bg-gradient-to-b from-[rgba(34,197,94,0.25)] to-[rgba(34,197,94,0.15)] rounded-full fraud-ring-hover"
                    style={{
                      animation: 'fradium-ring-pulse 2s ease-in-out infinite 0.6s'
                    }}
                  />

                  {/* Magnifying Glass Icon - Optimized with CSS animation */}
                  <div
                    className="relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[80px] md:h-[80px]"
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
              {/* Bottom gradient overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>
        </div>
        {/* Fade ke warna dasar agar transisi halus */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
      <div className="relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_2} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
        </div>
        {/* Fade dari warna dasar ke background-2 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Row kedua: kolom kiri panjang, kolom kanan dua kartu setengah tinggi */}
        <div className="relative z-10 mx-auto w-full max-w-6xl pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12 md:gap-4">
            {/* Kolom kiri (panjang) */}
            <div className="md:col-span-5">
              <motion.div
                className="group relative min-h-[320px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[735px] overflow-hidden rounded-[16px] sm:rounded-[20px] border border-white/10 bg-[#000000]/60 pt-3 sm:pt-4 md:pt-8 pl-3 sm:pl-4 pr-3 sm:pr-4 pb-2 sm:pb-3 md:pb-4 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Header center: logo + title */}
                <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
                  <img src={LOGO_IMG} alt="Fradium" className="h-5 w-5 sm:h-6 sm:w-6 md:h-10 md:w-10 select-none" />
                  <h3 className="text-base sm:text-lg md:text-2xl lg:text-3xl leading-[1.1] font-normal text-[#C1FFC5]">How it works?</h3>
                </div>

                {/* Description text */}
                <div className="text-center mt-2 sm:mt-3 md:mt-6 mb-3 sm:mb-4 md:mb-8">
                  <p className="text-white text-xs sm:text-sm md:text-2xl leading-relaxed">
                    Create a wallet, enter<br />
                    an address, and get<br />
                    instant results.
                  </p>
                </div>

                {/* Animated action buttons - Marquee */}
                <div className="mb-4 sm:mb-6 md:mb-8 overflow-hidden">
                  <div className="flex gap-1 sm:gap-2 animate-marquee">
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Address
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Send Coin
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Receive Coin
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Analyze
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Address
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Send Coin
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Receive Coin
                    </div>
                    <div className="bg-white/10 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      Analyze
                    </div>
                  </div>
                </div>

                {/* Background image - positioned from description text */}
                <div className="absolute inset-x-0 top-[70px] sm:top-[80px] md:top-[90px] bottom-0 z-0">
                  <img src={HOW_IT_WORKS_IMG} alt="How it works illustration" decoding="async" loading="lazy" draggable={false} className="w-full h-full object-cover rounded-2xl" />
                </div>

                {/* Steps card - positioned at bottom */}
                <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2 md:bottom-4 md:left-4 md:right-4 z-10 bg-[#ffffff]/5 rounded-[8px] sm:rounded-[12px] md:rounded-[20px] border border-white/3 p-1.5 sm:p-2 md:p-6 shadow-[0_0_26.59px_rgba(20,20,23,1)] backdrop-blur-[20px]">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 md:mb-6">
                    <h4 className="text-white text-[10px] sm:text-xs md:text-lg lg:text-xl">
                      <span className="font-medium">3 Step</span> to protect your transaction!
                    </h4>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-8 md:h-8 bg-[#99E39E] rounded-full flex items-center justify-center">
                      <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-5 md:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Horizontal line separator */}
                  <div className="w-full h-px bg-white/20 mb-1.5 sm:mb-2 md:mb-6"></div>

                  {/* Steps list with stepper */}
                  <div className="relative">
                    <div className="space-y-1 sm:space-y-1.5 md:space-y-4">
                      {/* Step 1 */}
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 bg-[#000000]/20 rounded-md sm:rounded-lg p-1 sm:p-1.5 md:p-3 border border-white/10 relative">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center relative z-10">
                          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-medium text-[10px] sm:text-xs md:text-sm">Launch Wallet</h5>
                          <p className="text-white/75 text-[9px] sm:text-xs">Create your new wallet instantly</p>
                        </div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 flex items-center justify-center">
                          <svg className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-3 md:h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </div>
                        {/* Stepper line to next step */}
                        <div className="absolute left-3.5 sm:left-4 md:left-7 top-full w-0.5 h-1.5 sm:h-2 md:h-4 bg-white/30"></div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 bg-[#000000]/20 rounded-md sm:rounded-lg p-1 sm:p-1.5 md:p-3 border border-white/10 relative">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center relative z-10">
                          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-medium text-[10px] sm:text-xs md:text-sm">Copy Addres</h5>
                          <p className="text-white/75 text-[9px] sm:text-xs">Paste it into the input field</p>
                        </div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 flex items-center justify-center">
                          <svg className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-3 md:h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </div>
                        {/* Stepper line to next step */}
                        <div className="absolute left-3.5 sm:left-4 md:left-7 top-full w-0.5 h-1.5 sm:h-2 md:h-4 bg-white/30"></div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 bg-[#000000]/20 rounded-md sm:rounded-lg p-1 sm:p-1.5 md:p-3 border border-white/10 relative">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center relative z-10">
                          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-medium text-[10px] sm:text-xs md:text-sm">Get Result</h5>
                          <p className="text-white/75 text-[9px] sm:text-xs">You're Done! wait a moment for the result!</p>
                        </div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 flex items-center justify-center">
                          <svg className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-3 md:h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(16,185,129,0.18),rgba(34,197,94,0.12)_55%,transparent_80%)]" />
              </motion.div>
            </div>

            {/* Kolom kanan (dua kartu setengah tinggi) */}
            <div className="md:col-span-7 flex flex-col gap-2 md:gap-4">
              {/* Row pertama: dua kartu sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {/* Kartu kiri - Extension */}
                <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-2 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px] card-hover">
                  {/* Background image - half card size with padding */}
                  <div className="relative z-0 mb-6">
                    <img
                      src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/extensions.webp"
                      alt="Extension"
                      className="w-full h-[120px] md:h-[140px] lg:h-[199px] object-cover rounded-lg"
                      draggable={false}
                    />
                  </div>

                  {/* Content below the image */}
                  <div className="relative p-2 z-10">
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
                {/* Kartu kanan - Fradium Wallet */}
                <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] card-hover">
                  {/* Background image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/fradium-wallets.webp"
                      alt="Fradium Wallet"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>

                  {/* Content overlay */}
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-medium text-white">Fradium Wallet</h3>
                    <p className="mt-2 max-w-2xl text-xs md:text-sm text-white/75">Fradium Wallet safeguards your assets by scanning every transaction in real time.</p>
                  </div>

                  {/* Bottom gradient overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>

              {/* Row kedua: satu kartu memanjang */}
              <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px] card-hover">
                {/* Background image - positioned at top with controlled height */}
                <div className="absolute p-2 inset-x-0 top-0 z-0 h-[180px] md:h-[200px] lg:h-[220px]">
                  <img
                    src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/community-card.webp"
                    alt="Community"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Content below the image */}
                <div className="relative z-10 mt-[180px] md:mt-[200px] lg:mt-[220px]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-medium text-white">Community</h3>
                      <p className="mt-2 max-w-lg text-xs md:text-sm text-white/75">Collaboratively submit, review, and validate fraud cases to defense against scams.</p>
                    </div>

                    {/* Sign up button */}
                    <div className="ml-4 flex-shrink-0">
                      <ButtonPurple
                        size="sm"
                        onClick={() => { }}
                        fontWeight="medium"
                        iconSize="w-5 h-5"
                        icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg"
                      >
                        Sign up
                      </ButtonPurple>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Fade ke warna dasar di bagian bawah */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background ketiga paling bawah, konten akan diletakkan di atasnya */}
      <div className="relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[800px] overflow-visible">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_3} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
        </div>
        {/* Fade dari warna dasar ke background-3 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Wrapper konten */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 md:pt-10 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
          {/* Hero di atas background ketiga */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium leading-tight text-white">
              Ready to use crypto with protection?
            </h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-3xl text-white/80 text-xs sm:text-sm md:text-base leading-relaxed">
              With Fradium, every wallet address is checked in real time, so you can focus on using crypto without worrying about the risks.
            </p>
            <div className="mt-3 sm:mt-4 md:mt-6">
              <div className="btn-hover rounded-full gentle-pulse">
                <ButtonGreen size="sm" fontWeight="medium" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] md:w-[23px] md:h-[23px]" onClick={handleLaunchWallet}>
                  Try it free
                </ButtonGreen>
              </div>
            </div>
          </div>

          {/* Laptop Image - positioned within background 3 content */}
          <div className="relative flex justify-center items-end mt-16 sm:mt-6 md:mt-8">
            <div className="relative w-full max-w-3xl sm:max-w-4xl md:max-w-5xl mx-auto">
              {/* Laptop Frame */}
              <img
                src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/macbook-frame.webp"
                alt="MacBook"
                className="w-full h-auto object-contain"
                style={{
                  transform: 'translateY(0px)',
                  marginBottom: '-10%'
                }}
                draggable={false}
              />

              {/* Video Overlay - positioned over the full screen area */}
              <div className="absolute 
                top-[2%] left-[9%] w-[82%] h-[105%]
                md:top-[2%] md:left-[9%] md:w-[82%] md:h-[105%]
                lg:top-[2%] lg:left-[9%] lg:w-[82%] lg:h-[105%]
                rounded-lg overflow-hidden">

                {/* Placeholder sementara - ganti dengan video nanti */}
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Video Coming Soon</p>
                    <p className="text-xs text-gray-400 mt-1">Replace this placeholder with your video</p>
                  </div>
                </div>

                {/* Uncomment dan ganti dengan video nanti:
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source src="/path/to/your-video.mp4" type="video/mp4" />
                  <source src="/path/to/your-video.webm" type="video/webm" />
                  <img src="/path/to/placeholder.jpg" alt="Screen Content" className="w-full h-full object-cover" />
                </video>
                */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
});

export default Home;
