import React from "react";
import styles from "./footer.module.css";
import { useNavigate } from "react-router";
import SidebarButton from "./SidebarButton";

const Footer = () => {
  const navigate = useNavigate();

  // Fungsi untuk handle launch wallet - langsung redirect ke /wallet
  const handleLaunchWallet = () => {
    navigate("/wallet");
  };


  return (
    <footer className={`relative w-full flex h-auto  flex-col items-center`}>
      {/* Mobile Only: Social + Copyright */}
      <div className="block sm:hidden w-full flex flex-col items-center justify-center py-8">
        <div className={styles.socialRow}>
          <a href="https://github.com/fradiumofficial/fradium" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
            <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-8 h-8" />
          </a>
          <a href="https://x.com/fradiumofficial" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
            <img src="/assets/XLogo.svg" alt="X" className="w-8 h-8" />
          </a>
        </div>
        <div className={styles.copyright}>Copyright &copy;2025 Fradium. All rights reserved</div>
      </div>
      {/* Desktop Only: Footer Content */}
      <div className="hidden sm:block w-full">
        <img src="/assets/images/illus-footer2.png" alt="Footer Illustration" className="absolute" draggable="false" style={{ top: "-110px", left: 0, right: 0, margin: "0 auto" }} />
        <div className={styles.footerContent} style={{ position: "relative", zIndex: 2, marginTop: "260px" }}>
          <div className={styles.leftCol}>
            <div className={styles.logoRow}>
              <img src="/assets/logo-fradium.svg" alt="Logo Fradium" className={styles.logo} />
            </div>
            <p className={styles.desc}>Fradium equips you with powerful tools to analyse, protect, and transact securely across the blockchain.</p>
            <div className={styles.socialRow}>
              <a href="https://github.com/fradiumofficial/fradium" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
                <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-8 h-8" />
              </a>
              <a href="https://x.com/fradiumofficial" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
                <img src="/assets/XLogo.svg" alt="X" className="w-8 h-8" />
              </a>
            </div>
          </div>
          <div className={styles.linksCol}>
            <div className={styles.linksBlock}>
              <div className={styles.linksTitle}>Links</div>
              <ul>
                <li>
                  <a href="https://fradium.gitbook.io/docs" target="_blank" rel="noopener noreferrer">
                    Docs
                  </a>
                </li>
                <li>
                  <a
                    href="/reports"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/reports");
                    }}>
                    View Reports
                  </a>
                </li>
                <li>
                  <a
                    href="/assistant"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/assistant");
                    }}>
                    Assistant
                  </a>
                </li>
              </ul>
            </div>
            <div className={styles.linksBlock}>
              <div className={styles.linksTitle}>Products</div>
              <ul>
                <li>
                  <a
                    href="/products"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/products");
                    }}>
                    Fradium Extension
                  </a>
                </li>
                <li>
                  <a
                    href="/products-wallet"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/products-wallet");
                    }}>
                    Fradium Wallet
                  </a>
                </li>
              </ul>
              <SidebarButton onClick={handleLaunchWallet}>
                Launch Wallet →
              </SidebarButton>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>Copyright &copy;2025 Fradium. All rights reserved</div>
      </div>
    </footer>
  );
};

export default Footer;
