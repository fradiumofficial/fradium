import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Container from './components/ui/Container';
import Button from './components/ui/Button';

function App() {
  const basePath = import.meta?.env?.BASE_URL ?? '/';
  const bg1 = `${basePath}assets/background-1.png`;
  const bg2 = `${basePath}assets/background-2.png`;
  const ornament = `${basePath}assets/ornamen-bg.png`;
  const imageWrapper = `${basePath}assets/image-wrapper.png`;
  const glowEffect = `${basePath}assets/glow-effect.png`;
  const macbook = `${basePath}assets/macbook.png`;
  const substract = `${basePath}assets/substract2.png`;
  const featureImages = {
    transfer: `${basePath}assets/transfer.png`,
    receive: `${basePath}assets/receive.png`,
    createWallet: `${basePath}assets/create-wallet.png`,
    balance: `${basePath}assets/balance.png`,
    fiat: `${basePath}assets/fiat.png`,
    convert: `${basePath}assets/convert.png`,
    comparation: `${basePath}assets/comparation.png`,
    bestPrice: `${basePath}assets/best-price.png`,
  };
  const featureCards = [
    {
      title: 'Crypto Transfers',
      description:
        'Send BTC, ETH, and SOL with fee preview, ETA, network validation, QR support, and real-time tracking.',
      image: featureImages.transfer,
    },
    {
      title: 'Receive Address',
      description:
        'Instantly surface your address and QR with clear “correct network only” reminders and memo/tag hints when needed.',
      image: featureImages.receive,
    },
    {
      title: 'Create Wallet Addresses',
      description:
        'Generate new addresses for BTC, ETH, and SOL. Labeled and ready to receive or send without technical friction',
      image: featureImages.createWallet,
    },
    {
      title: 'Real-time Balances',
      description:
        'See time-stamped balances for each asset in a single, easy snapshot—no app-hopping.',
      image: featureImages.balance,
    },
    {
      title: 'Buy with Fiat',
      description:
        'Purchase crypto without leaving chat. Every cost is shown upfront; coins are delivered to your address on success.',
      image: featureImages.fiat,
    },
    {
      title: 'Crypto → Fiat Conversion',
      description:
        'Get live BTC/ETH/SOL rates to USD/IDR (and more) so you always know what your holdings are worth.',
      image: featureImages.convert,
    },
    {
      title: 'Market Price Comparison',
      description:
        'Compare CoinGecko, CoinMarketCap, and Coinbase. View deltas and the most competitive price at a glance.',
      image: featureImages.comparation,
    },
    {
      title: 'Price Recommendation',
      description:
        'Let the AI suggest the cheapest/trusted market for your purchase, with a short rationale and confidence indicator.',
      image: featureImages.bestPrice,
    },
  ];
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Section Pertama */}
        <section className="relative overflow-hidden mt-8 min-h-[820px]">
          {/* Background layers */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <img
              src={bg1}
              alt="bg-1"
              className="absolute inset-x-0 top-0 w-full h-[820px] object-cover"
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent)'
              }}
            />
            <img
              src={bg2}
              alt="bg-2"
              className="absolute inset-x-0 bottom-0 w-full h-[820px] object-cover opacity-95"
              style={{
                maskImage: 'linear-gradient(to top, black 70%, transparent)',
                WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent)'
              }}
            />
          </div>

          {/* Top blur overlay to blend background with navbar */}
          <div className="absolute inset-x-0 top-0 h-20 sm:h-24 md:h-28 z-[5] pointer-events-none">
            <div className="h-full bg-gradient-to-b from-white/90 via-white/60 to-transparent backdrop-blur-sm md:backdrop-blur-md" />
          </div>

          {/* Bottom blur overlay to blend background-2 with page */}
          <div className="absolute inset-x-0 bottom-0 h-10 z-[5] pointer-events-none">
            <div className="h-full bg-gradient-to-t from-white/90 via-white/60 to-transparent backdrop-blur-sm md:backdrop-blur-md" />
          </div>

          <Container className="relative z-10 pt-16 pb-24">
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-[34px] sm:text-5xl lg:text-[64px] font-normal tracking-tight text-slate-900">
                Simple, Transparent, Secure
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-[13px] sm:text-[18px] leading-relaxed text-slate-600">
                Nara Wallet is a chat-first wallet agent for BTC, ETH, and SOL. Create addresses, send or
                receive, buy with card, and see real-time prices with clear, upfront fees.
              </p>
            </div>

            {/* Row 1: Get to know + How it works */}
            <div className="mt-12 flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-8">
              {/* Card: Get to Know */}
              <div className="group relative w-full md:w-[636px] h-auto md:h-[474px] rounded-[28px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-8 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(520px_240px_at_60%_-40px,rgba(96,165,250,0.22),rgba(34,211,238,0.14)_55%,transparent_75%)]" />
                <div className="max-w-[520px] pr-28">
                  <h2 className="text-[36px] sm:text-5xl leading-[1.1] font-normal tracking-tight text-slate-900">
                    <span className="block">Get to Know</span>
                    <span className="block">
                      <span className="bg-gradient-to-r from-[#6C8CDF] to-[#2D54B8] bg-clip-text text-transparent font-normal">about</span> Nara Wallet
                    </span>
                  </h2>
                  <p className="mt-5 max-w-xs text-slate-600 text-[15px] leading-relaxed">
                    Agentbot is a chat-first crypto assistant that makes cross-chain transactions simple, safe,
                    and transparent. Manage BTC, ETH, and SOL from one conversation. Our focus are ease of use,
                    fair pricing, and security from day one.
                  </p>
                  <div className="mt-16">
                    <Button size="lg" leftIcon={<img src="/assets/icon-logo.png" className="h-4 w-4" alt="" />}>Get Started</Button>
                  </div>
                </div>
                {/* Phone image */}
                <img
                  src="/assets/Artboard.png"
                  alt="phone"
                  className="pointer-events-none select-none absolute right-[-22px] bottom-[-22px] hidden h-[450px] sm:block transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              </div>

              {/* Card: How it works (dark) */}
              <div className="group relative w-full bg-white md:w-[480px] h-auto md:h-[474px] rounded-[28px] border border-white/10 shadow-[0_24px_64px_rgba(2,6,23,0.36)] overflow-hidden p-2 transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_28px_80px_rgba(2,6,23,0.5)]">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(480px_220px_at_50%_-60px,rgba(139,92,246,0.20),rgba(236,72,153,0.16)_55%,transparent_80%)]" />
                <div className="bg-[#070707] text-white rounded-[22px] md:rounded-[24px] w-full h-full pt-8 pb-8 overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.01]">
                  <h3 className="text-[28px] pl-8 font-normal">How it works</h3>
                  <p className="mt-2 text-[16px] pl-8 font-normal text-white/75 max-w-md leading-relaxed">
                    Chat your request: Agent Wallet handles addresses, balances, transfers, and fiat checkout. Agent Conversion delivers live, compared prices and best picks
                  </p>
                  <img
                    src="/assets/how-it-works3.png"
                    alt="how it works"
                    className="mt-8 w-full max-w-[560px] transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Nara Wallet + What we do? */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-8">
              {/* Card: Feature summary */}
              <div className="group relative rounded-[20px] w-full md:w-[372px] h-auto md:min-h-[596px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(460px_220px_at_50%_-60px,rgba(20,184,166,0.18),rgba(163,230,53,0.12)_55%,transparent_80%)]" />
                <div className="px-8 pt-8 pb-6">
                  <div className="flex items-center justify-center">
                    <img src="/assets/logo-nara.png" alt="Nara Wallet logo" className="w-[196px] h-auto" />
                  </div>
                </div>
                <div className="p-2">
                  <img src="/assets/feature.png" alt="feature" className="w-full block transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
                </div>
              </div>

              {/* Card: What we do */}
              <div className="group relative rounded-[20px] w-full md:w-[744px] h-auto md:min-h-[596px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_260px_at_50%_-60px,rgba(245,158,11,0.18),rgba(249,115,22,0.14)_55%,transparent_80%)]" />
                <div className="flex items-center justify-between p-8">
                  <div>
                    <h4 className="text-[32px] font-normal text-slate-900">What we do?</h4>
                    <p className="mt-1 text-slate-600 text-[16px]">All crypto actions in single chat! wallet management, send/receive and others.</p>
                  </div>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12.97 5.47a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H5.75a.75.75 0 0 1 0-1.5h11.19l-3.97-3.97a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                </div>
                <div className="p-2">
                  <img src="/assets/what-we-do.png" alt="what we do" className="w-full block transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
                </div>
              </div>
            </div>
          </Container>
        </section>




        {/* Section 2: Features wrapper */}
        <section id="features" className="relative pb-8">

          <div className="relative z-30">
            <div className="relative z-30 max-w-[1380px] mx-auto overflow-hidden rounded-[20px] md:rounded-[24px] bg-[#111111] ring-1 ring-white/10 shadow-[0_24px_64px_rgba(2,6,23,0.35)]">
              {/* soft top glow */}
              {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_220px_at_50%_-60px,rgba(255,255,255,0.08),transparent)]" /> */}
              <img
                src={ornament}
                alt="ornament"
                className="pointer-events-none select-none absolute -top-16 sm:-top-20 opacity-60 z-0"
              />
              {/* Top content */}
              <div className="relative z-30 p-6 sm:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                  <div className="md:col-span-7">
                    <h2 className="text-white font-normal tracking-tight leading-tight text-[56px] sm:text-6xl lg:text-[56px]">
                      Simple, Transparent, Secure
                    </h2>
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-white/80 text-[18px] font-normal sm:text-base leading-relaxed">
                      You can manage BTC/ETH/SOL faster with fewer errors, view transparent fees, buy at competitive rates with AI price picks and comparisons, and stay protected by network validation and real-time monitoring.
                    </p>
                    <button className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-white/90 hover:bg-white/10 transition">
                      <span className="mr-2">Get setup in 9 minutes</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M12.97 5.47a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H5.75a.75.75 0 0 1 0-1.5h11.19l-3.97-3.97a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid cards */}
              <div className="relative z-30 px-6 pb-12 sm:px-8 lg:px-12">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(299px,1fr))] justify-center gap-6 lg:gap-7">
                  {featureCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="group relative z-30 rounded-[10px] bg-[#8F82C70D] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden w-[299px] h-[300px] flex flex-col transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:ring-1 hover:ring-[#8F82C7]/40 focus-visible:ring-1 focus-visible:ring-[#8F82C7]/50"
                    >
                      {/* subtle glow overlay on hover */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(300px_140px_at_50%_0%,rgba(143,130,199,0.18),transparent)]" />

                      <div className="overflow-hidden">
                        <img
                          src={card.image}
                          alt="feature visual"
                          className="w-full h-[150px] rounded-[8px] object-cover pointer-events-none select-none transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                        />
                      </div>
                      <div className="px-4 pb-3 mt-4">
                        <h3 className="text-white text-[24px] leading-snug font-normal">{card.title}</h3>
                        <p className="mt-3 text-[14px] font-normal leading-relaxed text-white/70 group-hover:text-white/85 transition-colors duration-300">{card.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 (minimal): Glow background + Macbook content */}
        <section id="cta" className="relative overflow-hidden w-screen left-1/2 -translate-x-1/2 bg-[#ffffff]">
          {/* Glow as background */}
          <img
            src={glowEffect}
            alt="glow"
            className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-80"
          />

          {/* Content */}
          <div className="relative z-10 mx-auto">
            <div className="text-center">
              <h2 className="text-[28px] sm:text-[40px] font-normal tracking-tight text-slate-900">
                Ready to use crypto without the complexity?
              </h2>
              <p className="mt-2 text-slate-600 text-[14px] sm:text-[15px]">
                Try Agentbot and complete your first transaction in minutes!
              </p>
              <div className="mt-8 mb-10">
                <Button>
                  <span className="inline-flex items-center gap-2">
                    <img src="/assets/icon-logo.png" alt="icon" className="h-4 w-4" />
                    Try it free
                  </span>
                </Button>
              </div>
            </div>
            <div className="relative mt-2">
              {/* Substract sits above glow but below macbook; pinned to bottom to extend page height */}
              <img
                src={substract}
                alt="panel background"
                className="pointer-events-none select-none absolute bottom-0 left-1/2 -translate-x-1/2 h-auto z-0"
              />
              <img
                src={macbook}
                alt="macbook"
                className="relative z-10 mx-auto max-w-full w-[760px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}

export default App;
