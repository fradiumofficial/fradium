import React from "react";
import Button from "@/core/components/Button";
import ButtonBullet from "@/core/components/ButtonBullet";
import styles from "./home-page.module.css";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/auth-provider";

// Komponen collapsible reusable
function CollapsibleSection({ title, children, open, onToggle }) {
  return (
    <div className={styles.fradiumExtCollapsibleSection}>
      <div className={styles.fradiumExtCollapsibleHeader} onClick={onToggle}>
        <h2 className={styles.fradiumExtCollapsibleTitle}>{title}</h2>
        <ButtonBullet class="mr-4" onClick={onToggle} direction={open ? "up" : "down"} ariaLabel={open ? `Tutup ${title}` : `Buka ${title}`} />
      </div>
      {/* <hr className={styles.fradiumExtDivider} /> */}
      {open && <div>{children}</div>}
    </div>
  );
}

const HomePage = () => {
  const { isAuthenticated, handleLogin } = useAuth();
  const navigate = useNavigate();

  // State collapsible
  const [openAbout, setOpenAbout] = React.useState(true);
  const [openHow, setOpenHow] = React.useState(false);

  // Fungsi untuk handle launch wallet
  const handleLaunchWallet = async () => {
    if (isAuthenticated) {
      // Jika sudah login, langsung redirect ke wallet
      // window.open("/wallet", "_blank");
      navigate("/wallet");
    } else {
      // Jika belum login, tampilkan popup login dengan custom handler
      try {
        // Custom handler untuk redirect ke wallet setelah login berhasil
        const customLoginHandler = () => {
          navigate("/wallet");
        };

        await handleLogin(customLoginHandler);
      } catch (error) {
        // Jika login gagal, tidak ada yang terjadi (stay di halaman)
        console.log("Login cancelled or failed");
      }
    }
  };

  return (
    <>
      <section className={styles.heroAboutSection}>
        {/* Hero Content */}
        <div className={styles.heroContentWrapper}>
          {/* Ilustrasi kiri */}
          <img src="/assets/images/hero_kiri.png" alt="Blockchain Security Illustration" className={styles.heroIllustrationLeft} draggable="false" />
          {/* Ilustrasi kanan */}
          <img src="/assets/images/hero_kanan.png" alt="Digital Assets Security" className={styles.heroIllustrationRight} draggable="false" />
          <div className={styles.heroContent}>
            {/* Badge */}
            <span className={styles.heroBadge}>REINVENTED BLOCKCHAIN SECURITY</span>
            {/* Main Heading */}
            <h1 className={styles.heroTitle}>
              Protect every <span className="block" />
              transaction.
              <br />
              <span className={styles.heroTitleAccent}>Stay ahead of fraud.</span>
            </h1>
            {/* Subtitle */}
            <p className={styles.heroSubtitle}>
              Here is Your Digital Asset Guardian to <br /> Analyse. Protect. Transact with Confidence.
            </p>
            {/* CTA Button */}
            <Button onClick={handleLaunchWallet}>Launch Wallet &rarr;</Button>
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
            Fradium is a Web3 security platform dedicated to safeguarding digital asset transactions. We enable users to analyse wallet addresses and audit smart contracts before interacting with them.
            <br />
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
          <p className="text-[#B0B6BE] text-lg max-w-4xl mx-auto">
            Fradium simplifies blockchain security with two essential tools: address analysis and smart contract audit.
            <br className="hidden md:block" />
            The process is designed to be clear, quick, and reliable.
          </p>
        </div>
        <div
          className="relative bg-[#181C22]/80 rounded-3xl shadow-lg overflow-hidden mx-auto"
          style={{
            width: "calc(100vw - 100px)",
            maxWidth: "1400px",
            margin: "0 auto",
            height: "292px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            border: "1.5px solid rgba(255,255,255,0.10)",
            borderRadius: "24px",
            boxSizing: "border-box",
          }}>
          <img
            src="/assets/images/wave-steper2.png"
            alt="How it works"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
            }}
            draggable="false"
          />
          {/* Overlay step content */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Step 1 */}
            <div
              className="absolute text-center"
              style={{
                top: "145px",
                left: "18.5%",
                transform: "translateX(-50%)",
                width: "260px",
              }}>
              <div className="text-white text-xl font-medium mb-2">Step 1</div>
              <div className="text-[#B0B6BE] text-base">Enter the wallet address or smart contract you wish to review</div>
            </div>
            {/* Step 2 */}
            <div
              className="absolute text-center"
              style={{
                top: "145px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "260px",
              }}>
              <div className="text-white text-xl font-medium mb-2">Step 2</div>
              <div className="text-[#B0B6BE] text-base">Fradium checks against fraud databases and performs risk analysis.</div>
            </div>
            {/* Step 3 */}
            <div
              className="absolute text-center"
              style={{
                top: "145px",
                left: "81.5%",
                transform: "translateX(-50%)",
                width: "260px",
              }}>
              <div className="text-white text-xl font-medium mb-2">Step 3</div>
              <div className="text-[#B0B6BE] text-base">Get a risk score and actionable recommendations instantly.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Fradium Extension Section */}
      <section className={styles.fradiumExtSectionWrapper}>
        <div className={styles.fradiumExtHeaderRow}>
          <div>
            <span className={styles.fradiumExtSectionLabel}>FRADIUM EXTENSION</span>
            <h2 className={styles.fradiumExtSectionTitle}>Security that follows you, anywhere you Browse</h2>
          </div>
          <Button size="sm" style={{ fontSize: 16, padding: "13px 24px" }}>
            Download Extension
          </Button>
        </div>
        {/* Divider atas */}
        <hr className={styles.fradiumExtDivider} />
        <CollapsibleSection title="About Fradium Extension" open={openAbout} onToggle={() => setOpenAbout((v) => !v)}>
          <div className={styles.fradiumExtAboutContent}>
            <div className={styles.fradiumExtAboutText}>Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</div>
            <div className={styles.fradiumExtAboutImage}>
              <img src="/assets/images/fradium-extension.png" alt="Fradium Extension" draggable="false" />
            </div>
          </div>
        </CollapsibleSection>
        {/* Divider tengah */}
        <hr className={styles.fradiumExtDivider} />
        <CollapsibleSection title="How It Works" open={openHow} onToggle={() => setOpenHow((v) => !v)}>
          <div className={styles.fradiumExtAboutContent}>
            <div className={styles.fradiumExtAboutText}>To use the Fradium Extension, simply download and install it on your browser. Once installed, you have two ways to scan wallet addresses or smart contracts. You can highlight the address or contract on any page, right-click, and select 'Scan with Fradium'. Alternatively, you can open the extension, enter the address or contract manually, and click the analyse button to check its risk level. Both options give you clear results directly in your browser, so you can verify before interacting.</div>
            <div className={styles.fradiumExtAboutImage}>
              <img src="/assets/images/fradium-extension.png" alt="Fradium Extension" draggable="false" />
            </div>
          </div>
        </CollapsibleSection>
        {/* Divider bawah hanya jika How It Works tertutup */}
        {!openHow && <hr className={styles.fradiumExtDivider} />}
      </section>

      {/* KEY FEATURE SECTION */}
      <section className={styles.keyFeatureSection}>
        <div className={styles.keyFeatureHeader}>
          <span className={styles.keyFeatureLabel}>KEY FEATURE</span>
          <h2 className={styles.keyFeatureTitle}>Secure your digital assets with confidence</h2>
        </div>
        <div className={styles.keyFeatureContentWrapper}>
          {/* Fitur kiri atas */}
          <div className={`${styles.keyFeatureItem} ${styles.keyFeatureItemLeftTop}`}>
            <img src="/assets/images/icon-detecion.png" alt="Fraud Detection" className={styles.keyFeatureIcon} />
            <div>
              <div className={styles.keyFeatureItemTitle}>Fraud Detection</div>
              <div className={styles.keyFeatureItemDesc}>
                Map the crypto projects
                <br />
                Identify wallet risks before any transaction
              </div>
            </div>
          </div>
          {/* Fitur kiri bawah */}
          <div className={`${styles.keyFeatureItem} ${styles.keyFeatureItemLeftBottom}`}>
            <img src="/assets/images/icon-wallet.png" alt="Fradium Wallet" className={styles.keyFeatureIcon} />
            <div>
              <div className={styles.keyFeatureItemTitle}>Fradium Wallet</div>
              <div className={styles.keyFeatureItemDesc}>
                Prevent high-risk transactions
                <br />
                with real-time alerts
              </div>
            </div>
          </div>
          {/* Fitur kanan atas */}
          <div className={`${styles.keyFeatureItem} ${styles.keyFeatureItemRightTop}`}>
            <img src="/assets/images/icon-audit.png" alt="Smart Contract Audit" className={styles.keyFeatureIcon} />
            <div>
              <div className={styles.keyFeatureItemTitle}>Smart Contract Audit</div>
              <div className={styles.keyFeatureItemDesc}>
                Scan contracts for
                <br />
                vulnerabilities automatically
              </div>
            </div>
          </div>
          {/* Fitur kanan bawah */}
          <div className={`${styles.keyFeatureItem} ${styles.keyFeatureItemRightBottom}`}>
            <img src="/assets/images/icon-community.png" alt="Community Reporting" className={styles.keyFeatureIcon} />
            <div>
              <div className={styles.keyFeatureItemTitle}>Community Reporting</div>
              <div className={styles.keyFeatureItemDesc}>
                Submit and validate fraud
                <br />
                cases collaboratively
              </div>
            </div>
          </div>
          {/* Gambar utama wallet */}
          <div className={styles.keyFeatureImageWrapper}>
            <img src="/assets/images/fradium-wallet.png" alt="Fradium Wallet" className={styles.keyFeatureImage} draggable="false" />
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
