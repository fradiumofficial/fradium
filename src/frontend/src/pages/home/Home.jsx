import React from "react";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";

const Home = () => {
    const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
    const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";
    const HOW_IT_WORKS_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/landing-page/how-it-works.png";
    const LOGO_IMG = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/logo.png";

    return (
        <section className="relative w-full overflow-hidden">
            {/* Tagline di atas background */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-16 mt-8 text-center sm:pt-24">
                <p className="text-[14px] font-medium tracking-[0.28em] text-[#C1FFC5]">
                    REINVENTED BLOCKCHAIN SECURITY
                </p>
            </div>

            {/* Hero background dimulai di bawah tagline, mengikuti pola layering dari App.jsx */}
            <div className="relative mx-auto mt-4 overflow-hidden">
                {/* Background layer */}
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img
                        src={BACKGROUND_URL}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        loading="eager"
                        fetchpriority="high"
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                {/* Content di atas background */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white">
                        Protect every transaction.
                        <br className="hidden sm:block" />
                        Stay ahead of fraud.
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl text-gray-300 text-sm md:text-base">
                        Here is Your Digital Asset Guardian to Analyse, Protect, Transact with Confidence.
                    </p>
                </div>
                {/* Row pertama: dua card */}
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-14">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                        {/* Card kiri: About Fradium Web3 Security */}
                        <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                            <div className="flex items-start justify-between">
                                <h3 className="text-xl md:text-2xl lg:text-3xl leading-[1.1] font-medium text-white">
                                    About <span className="text-[#99E39E]">Fradium</span>
                                    <br /> Web3 Security
                                </h3>
                                <ButtonGreen
                                    size="now"
                                    icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg"
                                    iconSize="w-[23px] h-[23px]"
                                    fontWeight="medium"
                                >
                                    Try it free
                                </ButtonGreen>
                            </div>
                            <p className="mt-6 max-w-md text-xs md:text-sm font-normal text-white/75">
                                With Fradium, you can easily analyse wallet addresses before making any interaction. Our mission is simple: to help you identify risks, prevent fraud, and navigate the blockchain ecosystem with confidence.
                            </p>
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(16,185,129,0.18),rgba(34,197,94,0.12)_55%,transparent_80%)]" />
                        </div>

                        {/* Card kanan: Fraud Detection */}
                        <div className="group relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                            <h3 className="text-2xl md:text-3xl leading-[1.1] font-normal text-white">Fraud Detection</h3>
                            <p className="mt-3 max-w-xl text-xs md:text-sm font-normal text-white/75">
                                Discover and map crypto projects while identifying potential wallet risks early, before making any transaction.
                            </p>
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_260px_at_70%_-40px,rgba(139,92,246,0.18),rgba(59,130,246,0.10)_55%,transparent_80%)] opacity-60" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
            <div className="relative mx-auto min-h-[520px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img
                        src={BACKGROUND_URL_2}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        loading="lazy"
                        draggable={false}
                        className="absolute inset-x-0 bottom-0 h-full w-full object-cover"
                    />
                </div>

                {/* Row kedua: kolom kiri panjang, kolom kanan dua kartu setengah tinggi */}
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 pb-12">
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
                                <img
                                    src={HOW_IT_WORKS_IMG}
                                    alt="How it works illustration"
                                    decoding="async"
                                    loading="lazy"
                                    draggable={false}
                                    className="mt-6"
                                />

                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(460px_220px_at_50%_-60px,rgba(20,184,166,0.18),rgba(163,230,53,0.12)_55%,transparent_80%)]" />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        </div>

                        {/* Kolom kanan (dua kartu setengah tinggi) */}
                        <div className="md:col-span-7 flex flex-col gap-2 md:gap-4">
                            {/* Row pertama: dua kartu sejajar */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                {/* Kartu kiri */}
                                <div className="group relative min-h-[260px] md:min-h-[300px] lg:min-h-[340px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                                    <h3 className="text-xl md:text-2xl font-medium text-white">Fradium Wallet</h3>
                                    <p className="mt-2 max-w-2xl text-sm md:text-base text-white/75">
                                        Fradium Wallet safeguards your assets by scanning every transaction in real time.
                                    </p>
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_260px_at_70%_-40px,rgba(139,92,246,0.18),rgba(59,130,246,0.10)_55%,transparent_80%)] opacity-60" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                                {/* Kartu kanan */}
                                <div className="group relative min-h-[260px] md:min-h-[300px] lg:min-h-[340px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                                    <h3 className="text-xl md:text-2xl font-medium text-white">Extension</h3>
                                    <p className="mt-2 max-w-2xl text-sm md:text-base text-white/75">
                                        Helps you check the safety of your transaction while browsing Web3.
                                    </p>
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_60%_-40px,rgba(126,58,242,0.16),rgba(236,72,153,0.12)_55%,transparent_80%)] opacity-50" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                            </div>

                            {/* Row kedua: satu kartu memanjang */}
                            <div className="group relative min-h-[260px] md:min-h-[300px] lg:min-h-[340px] overflow-hidden rounded-[20px] border border-white/10 bg-[#000000]/60 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[2px]">
                                <h3 className="text-xl md:text-2xl font-medium text-white">Community</h3>
                                <p className="mt-2 max-w-3xl text-sm md:text-base text-white/75">
                                    Collaboratively submit, review, and validate fraud cases to defense against scams.
                                </p>
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