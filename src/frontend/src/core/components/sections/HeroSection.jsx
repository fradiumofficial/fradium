import React from 'react';
import Container from '@/core/components/ui/Container';
import Button from '@/core/components/ui/Button';
import styles from './hero-section.module.css';

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
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
      <Container>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', textAlign: 'center', paddingTop: 64 }}>
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
          <p className={styles.heroSubtitle} style={{ margin: '32px 0 48px 0', maxWidth: 600 }}>
            Here is Your Digital Asset Guardian to <br /> Analyse. Protect. Transact with Confidence.
          </p>
          {/* CTA Button */}
          <Button className={styles.heroButton} size="lg">
            Launch Wallet &rarr;
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
