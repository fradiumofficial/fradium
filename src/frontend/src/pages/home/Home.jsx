import React from "react";

const Home = () => {
    const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
    const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";

    return (
        <section className="relative w-full overflow-hidden">
            {/* Tagline di atas background (tanpa panel) */}
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 text-center sm:pt-24">
                <p className="text-[16px] font-medium tracking-[0.28em] text-[#C1FFC5]">
                    REINVENTED BLOCKCHAIN SECURITY
                </p>
            </div>

            {/* Hero background dimulai di bawah tagline, mengikuti pola layering dari App.jsx */}
            <div className="relative mx-auto mt-4 min-h-[720px] overflow-hidden">
                {/* Background layer */}
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img
                        src={BACKGROUND_URL}
                        alt="background-1"
                        className="absolute inset-x-0 top-0 w-full"
                    />
                </div>

                {/* Content di atas background */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <h1 className="text-6xl font-medium leading-tight text-white sm:text-6xl md:text-7xl">
                        Protect every transaction.
                        <br className="hidden sm:block" />
                        Stay ahead of fraud.
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl font-normal text-gray-300 sm:text-lg">
                        Here is Your Digital Asset Guardian to Analyse, Protect, Transact with Confidence.
                    </p>
                </div>

            </div>

            {/* Background kedua di bawah background pertama, dengan jarak margin-8 */}
            <div className="relative mx-auto min-h-[720px] overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img
                        src={BACKGROUND_URL_2}
                        alt="background-2"
                        className="absolute inset-x-0 bottom-0 h-[720px] w-full"
                    />
                </div>
            </div>
        </section>
    );
};

export default Home;