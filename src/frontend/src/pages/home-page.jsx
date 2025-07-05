import React from "react";
import Button from "@/core/components/Button";
import styles from "./home-page.module.css";
import HomeLayout from "@/core/components/layouts/home-layout";

const HomePage = () => {
  return (
    <HomeLayout>
      <section className={styles.heroAboutSection}>
        {/* Hero Content */}
        <div className={styles.heroContentWrapper}>
          {/* Ilustrasi kiri */}
          <img
            src="/assets/images/hero_kiri.png"
            alt="Blockchain Security Illustration"
            className={styles.heroIllustrationLeft}
            draggable="false"
          />
          {/* Ilustrasi kanan */}
          <img
            src="/assets/images/hero_kanan.png"
            alt="Digital Assets Security"
            className={styles.heroIllustrationRight}
            draggable="false"
          />
          <div className={styles.heroContent}>
            {/* Badge */}
            <span className={styles.heroBadge}>
              REINVENTED BLOCKCHAIN SECURITY
            </span>
            {/* Main Heading */}
            <h1 className={styles.heroTitle}>
              Protect every <span className="block" />transaction.<br />
              <span className={styles.heroTitleAccent}>Stay ahead of fraud.</span>
            </h1>
            {/* Subtitle */}
            <p className={styles.heroSubtitle}>
              Here is Your Digital Asset Guardian to <br /> Analyse. Protect. Transact with Confidence.
            </p>
            {/* CTA Button */}
            <Button>
              Launch Wallet &rarr;
            </Button>
            {/* Efek Glow di bawah button */}
            <div className={styles.aboutGlowBg}>
              <img src="/assets/images/glow.png" alt="Glow" className={styles.glowImg} />
            </div>
          </div>
        </div>
        {/* Konten About: label, judul besar, deskripsi, ilustrasi */}
        <div className={styles.aboutContent}>
          <div className={styles.aboutLabel}>ABOUT FRADIUM</div>
          <h2 className={styles.aboutTitle}>Built to Secure Every Transaction</h2>
          <p className={styles.aboutDesc}>
            Fradium is a Web3 security platform dedicated to safeguarding digital asset transactions. We enable users to analyse wallet addresses and audit smart contracts before interacting with them.<br />
            Our mission: help you detect risks, avoid fraud, and engage with confidence across the blockchain ecosystem.
          </p>
          <div className={styles.aboutIllus}>
            <img src="/assets/images/illus.png" alt="Fradium About Illustration" />
          </div>
        </div>
      </section>
      {/* How it works section */}
      <section className="w-full flex flex-col items-center mt-24 px-4">
        <div className="text-center mb-6">
          <div className="text-green-400 font-semibold tracking-widest text-sm mb-2">HOW IT WORKS</div>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">Simple Protection for Every Transaction</h2>
          <p className="text-[#B0B6BE] text-lg max-w-4xl mx-auto">Fradium simplifies blockchain security with two essential tools: address analysis and smart contract audit.<br className="hidden md:block" />The process is designed to be clear, quick, and reliable.</p>
        </div>
        <div
          className="relative bg-[#181C22]/80 rounded-3xl shadow-lg overflow-hidden mx-auto"
          style={{
            width: 'calc(100vw - 100px)',
            maxWidth: '1400px',
            margin: '0 auto',
            height: '292px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.10)',
            borderRadius: '24px',
            boxSizing: 'border-box',
          }}
        >
          <img
            src="/assets/images/wave-steper.png"
            alt="How it works"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
            }}
            draggable="false"
          />
          {/* Overlay step content */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Step 1 */}
            <div
              className="absolute text-center"
              style={{
                top: '150px',
                left: '19%',
                transform: 'translateX(-50%)',
                width: '260px',
              }}
            >
              <div className="text-white text-xl font-medium mb-2">Step 1</div>
              <div className="text-[#B0B6BE] text-base">
                Enter the wallet address or smart contract you wish to review
              </div>
            </div>
            {/* Step 2 */}
            <div
              className="absolute text-center"
              style={{
                top: '150px',
                left: '51%',
                transform: 'translateX(-50%)',
                width: '260px',
              }}
            >
              <div className="text-white text-xl font-medium mb-2">Step 2</div>
              <div className="text-[#B0B6BE] text-base">
                Fradium checks against fraud databases and performs risk analysis.
              </div>
            </div>
            {/* Step 3 */}
            <div
              className="absolute text-center"
              style={{
                top: '150px',
                left: '83%',
                transform: 'translateX(-50%)',
                width: '260px',
              }}
            >
              <div className="text-white text-xl font-medium mb-2">Step 3</div>
              <div className="text-[#B0B6BE] text-base">
                Get a risk score and actionable recommendations instantly.
              </div>
            </div>
          </div>
        </div>
      </section>
    </HomeLayout>
  );
};

export default HomePage;
