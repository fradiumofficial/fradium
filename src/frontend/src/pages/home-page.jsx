import React from "react";
import Navbar from "@/core/components/Navbar";
import Button from "@/core/components/Button";
import styles from "./home-page.module.css";

const HomePage = () => {
  return (
    <div className={styles.homeRoot}>
      <Navbar />
      <section className={styles.heroSection}>
        {/* Ilustrasi kiri */}
        <img
          src="assets/images/hero_kiri.png"
          alt="Blockchain Security Illustration"
          className={styles.heroIllustrationLeft}
          draggable="false"
        />
        {/* Ilustrasi kanan */}
        <img
          src="assets/images/hero_kanan.png"
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
        </div>
      </section>
      {/* Section lainnya bisa langsung ditambah di sini */}
    </div>
  );
};

export default HomePage;
