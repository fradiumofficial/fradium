import React from "react";
import Navbar from "@/core/components/Navbar";
import Button from "@/core/components/Button";
import styles from "./home-page.module.css";
import Footer from "../core/components/Footer";

const HomePage = () => {
  return (
    <>
      <Navbar />
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
      {/* Section lainnya bisa langsung ditambah di sini */}
      <Footer></Footer>
    </>
  );
};

export default HomePage;
