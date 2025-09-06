import React from "react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/providers/AuthProvider.jsx";

const Home = () => {
  const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
  const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";

  const navigate = useNavigate();
  const { isAuthenticated, handleLogin } = useAuth();

  const handleLaunchWallet = async () => {
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
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Tagline di atas background */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 text-center sm:pt-24">
        <p className="text-[16px] font-medium tracking-[0.28em] text-[#C1FFC5]">REINVENTED BLOCKCHAIN SECURITY</p>
      </div>

      {/* Hero background dimulai di bawah tagline, mengikuti pola layering dari App.jsx */}
      <div className="relative mx-auto mt-4 min-h-[720px] overflow-hidden">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL} alt="background-1" className="absolute inset-x-0 top-0 w-full" />
        </div>

        {/* Content di atas background */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl font-medium leading-tight text-white sm:text-6xl md:text-7xl">
            Protect every transaction.
            <br className="hidden sm:block" />
            Stay ahead of fraud.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl font-normal text-gray-300 sm:text-lg">Here is Your Digital Asset Guardian to Analyse, Protect, Transact with Confidence.</p>
        </div>
        {/* Row pertama: dua card */}
        <div className="relative z-10 mx-auto w-full max-w-[1350px] px-4 pt-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Card kiri: About Fradium Web3 Security */}
            <div className="group relative h-[474px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
              <div className="flex items-start justify-between">
                <h3 className="text-[40px] leading-[1.1] font-medium text-white">
                  About <span className="text-[#99E39E]">Fradium</span>
                  <br /> Web3 Security
                </h3>
                <ButtonGreen onClick={handleLaunchWallet} size="now" icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-[23px] h-[23px]" fontWeight="medium">
                  Launch Wallet
                </ButtonGreen>
              </div>
              <p className="mt-6 max-w-md text-sm text-white/75">With Fradium, you can easily analyse wallet addresses before making any interaction. Our mission is simple: to help you identify risks, prevent fraud, and navigate the blockchain ecosystem with confidence.</p>
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(16,185,129,0.18),rgba(34,197,94,0.12)_55%,transparent_80%)]" />
            </div>

            {/* Card kanan: Fraud Detection */}
            <div className="group relative h-[474px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
              <h3 className="text-[32px] leading-[1.1] font-medium text-white">Fraud Detection</h3>
              <p className="mt-3 max-w-xl text-sm text-white/75">Discover and map crypto projects while identifying potential wallet risks early, before making any transaction.</p>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_260px_at_70%_-40px,rgba(139,92,246,0.18),rgba(59,130,246,0.10)_55%,transparent_80%)] opacity-60" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
      <div className="relative mx-auto min-h-[720px] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_2} alt="background-2" className="absolute inset-x-0 bottom-0 h-[720px] w-full" />
        </div>

        {/* Row kedua: kolom kiri panjang, kolom kanan dua kartu setengah tinggi */}
        <div className="relative z-10 mx-auto w-full max-w-[1350px] px-4 pt-6 pb-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
            {/* Kolom kiri (panjang) */}
            <div className="md:col-span-5">
              <div className="group relative h-[847px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                <h3 className="text-[28px] font-medium text-white">How it works?</h3>
                <p className="mt-2 max-w-md text-sm text-white/75">Create a wallet, enter an address, and get instant risk and contract audit results.</p>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(460px_220px_at_50%_-60px,rgba(20,184,166,0.18),rgba(163,230,53,0.12)_55%,transparent_80%)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            {/* Kolom kanan (dua kartu setengah tinggi) */}
            <div className="md:col-span-7 flex flex-col gap-6 md:gap-8">
              {/* Row pertama: dua kartu sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Kartu kiri */}
                <div className="group relative h-[411px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                  <h3 className="text-[28px] font-medium text-white">Fradium Wallet</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/75">Fradium Wallet safeguards your assets by scanning every transaction in real time.</p>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_260px_at_70%_-40px,rgba(139,92,246,0.18),rgba(59,130,246,0.10)_55%,transparent_80%)] opacity-60" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                {/* Kartu kanan */}
                <div className="group relative h-[411px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                  <h3 className="text-[28px] font-medium text-white">Extension</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/75">Helps you check the safety of your transaction while browsing Web3.</p>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(126,58,242,0.16),rgba(236,72,153,0.12)_55%,transparent_80%)] opacity-50" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>

              {/* Row kedua: satu kartu memanjang */}
              <div className="group relative h-[411px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                <h3 className="text-[28px] font-medium text-white">Community</h3>
                <p className="mt-2 max-w-3xl text-sm text-white/75">Collaboratively submit, review, and validate fraud cases to defense against scams.</p>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_300px_at_50%_0px,rgba(255,255,255,0.08),transparent_70%)] opacity-30" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
