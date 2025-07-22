import React, { useState } from "react";
import styles from "./footer.module.css";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/auth-provider";
import { useWallet } from "@/core/providers/wallet-provider";
import { backend } from "declarations/backend";
import ConfirmCreateWalletModal from "./modals/ConfirmCreateWalletModal";
import SidebarButton from "./SidebarButton";
import { LoadingState } from "./ui/loading-state";

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, handleLogin } = useAuth();
  const { hasConfirmedWallet, setHasConfirmedWallet } = useWallet();
  const [showConfirmWalletModal, setShowConfirmWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk handle launch wallet
  const handleLaunchWallet = async () => {
    setIsLoading(true);
    if (!isAuthenticated) {
      try {
        const customLoginHandler = async () => {
          // Setelah login, cek wallet
          const walletResult = await backend.get_wallet();
          if ("Ok" in walletResult) {
            // Wallet sudah ada, langsung redirect
            navigate("/wallet");
          } else if (!hasConfirmedWallet) {
            // Wallet belum ada dan belum konfirmasi, tampilkan modal konfirmasi
            setShowConfirmWalletModal(true);
          } else {
            // Sudah konfirmasi tapi belum ada wallet, langsung ke wallet page
            navigate("/wallet");
          }
          setIsLoading(false);
        };
        await handleLogin(customLoginHandler);
      } catch (error) {
        console.log("Login cancelled or failed");
        setIsLoading(false);
      }
    } else {
      // User sudah login, cek wallet
      try {
        const walletResult = await backend.get_wallet();
        if ("Ok" in walletResult) {
          // Wallet sudah ada, langsung redirect
          navigate("/wallet");
        } else if (!hasConfirmedWallet) {
          // Wallet belum ada dan belum konfirmasi, tampilkan modal konfirmasi
          setShowConfirmWalletModal(true);
        } else {
          // Sudah konfirmasi tapi belum ada wallet, langsung ke wallet page
          navigate("/wallet");
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Fungsi untuk handle konfirmasi create wallet
  const handleConfirmCreateWallet = () => {
    setShowConfirmWalletModal(false);
    setHasConfirmedWallet(true);
    navigate("/wallet"); // Redirect ke wallet page untuk proses pembuatan wallet
  };

  return (
    <footer className={`relative w-full flex h-auto  flex-col items-center`}>
      <img src="/assets/images/illus-footer2.png" alt="Footer Illustration" className="absolute" draggable="false" style={{ top: "-110px", left: 0, right: 0, margin: "0 auto" }} />
      <div className={styles.footerContent} style={{ position: "relative", zIndex: 2, marginTop: "260px" }}>
        <div className={styles.leftCol}>
          <div className={styles.logoRow}>
            <img src="/assets/logo-fradium.svg" alt="Logo Fradium" className={styles.logo} />
          </div>
          <p className={styles.desc}>Fradium equips you with powerful tools to analyse, protect, and transact securely across the blockchain.</p>
          <div className={styles.socialRow}>
            <a href="https://github.com/fradiumofficial/fradium" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-8 h-8 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
              <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-5 h-5" />
            </a>
            <a href="https://x.com/fradiumofficial" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-8 h-8 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
              <img src="/assets/XLogo.svg" alt="X" className="w-5 h-5" />
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
            <SidebarButton onClick={handleLaunchWallet} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingState type="spinner" size="sm" color="primary" />
                  <span>Checking Wallet...</span>
                </div>
              ) : (
                "Launch Wallet →"
              )}
            </SidebarButton>
          </div>
        </div>
      </div>
      <div className={styles.copyright}>Copyright &copy;2025 Fradium. All rights reserved</div>

      {/* Confirm Create Wallet Modal */}
      <ConfirmCreateWalletModal isOpen={showConfirmWalletModal} onOpenChange={setShowConfirmWalletModal} onConfirm={handleConfirmCreateWallet} isLoading={isLoading} />
    </footer>
  );
};

export default Footer;
