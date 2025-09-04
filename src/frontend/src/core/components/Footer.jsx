import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import { useWallet } from "@/core/providers/WalletProvider";
import { backend } from "declarations/backend";
import ConfirmCreateWalletModal from "./modals/ConfirmCreateWalletModal";
import SidebarButton from "./SidebarButton";
import { LoadingState } from "./ui/LoadingState";

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
        console.log("handleLaunchWallet error", error);
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
    <footer className={`relative w-full flex h-auto flex-col items-center`}>
      {/* Mobile Only: Social + Copyright */}
      <div className="block sm:hidden w-full flex flex-col items-center justify-center py-8">
        <div className="flex gap-3 mt-2">
          <a href="https://github.com/fradiumofficial/fradium" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
            <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-8 h-8" />
          </a>
          <a href="https://x.com/fradiumofficial" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
            <img src="/assets/XLogo.svg" alt="X" className="w-8 h-8" />
          </a>
        </div>
        <div className="text-[#B0B6BE] text-[0.95rem] mt-4">Copyright &copy;2025 Fradium. All rights reserved</div>
      </div>
      {/* Desktop Only: Footer Content */}
      <div className="hidden sm:block w-full">
        <img src="/assets/images/illus-footer2.png" alt="Footer Illustration" className="absolute" draggable="false" style={{ top: "-110px", left: 0, right: 0, margin: "0 auto" }} />
        <div className="relative z-[2] mt-[260px] w-[calc(100vw-100px)] max-w-[1500px] mx-auto bg-[rgba(20,24,30,0.85)] shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] rounded-[32px] flex flex-col md:flex-row items-start justify-between pt-16 pb-12 px-4 md:px-20 gap-8 md:gap-[120px] min-h-[340px] backdrop-blur-lg">
          <div className="flex-1 min-w-[260px] flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img src="/assets/logo-fradium.svg" alt="Logo Fradium" className="w-12 h-12" />
            </div>
            <p className="text-[#B0B6BE] text-[1.05rem] max-w-[400px]">Fradium equips you with powerful tools to analyse, protect, and transact securely across the blockchain.</p>
            <div className="flex gap-3 mt-2">
              <a href="https://github.com/fradiumofficial/fradium" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
                <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-8 h-8" />
              </a>
              <a href="https://x.com/fradiumofficial" target="_blank" rel="noopener noreferrer" aria-label="X" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#181C22] hover:bg-[#23272F] transition-colors">
                <img src="/assets/XLogo.svg" alt="X" className="w-8 h-8" />
              </a>
            </div>
          </div>
          <div className="flex-1 min-w-[260px] flex flex-col md:flex-row gap-8 md:gap-[120px] justify-end w-full">
            <div className="flex flex-col gap-3">
              <div className="text-white text-[1.15rem] font-semibold mb-2">Links</div>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                <li>
                  <a href="https://fradium.gitbook.io/docs" target="_blank" rel="noopener noreferrer" className="text-[#B0B6BE] text-[1.02rem] hover:text-[#9BEB83] transition-colors">
                    Docs
                  </a>
                </li>
                <li>
                  <a
                    href="/reports"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/reports");
                    }}
                    className="text-[#B0B6BE] text-[1.02rem] hover:text-[#9BEB83] transition-colors"
                  >
                    View Reports
                  </a>
                </li>
                <li>
                  <a
                    href="/assistant"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/assistant");
                    }}
                    className="text-[#B0B6BE] text-[1.02rem] hover:text-[#9BEB83] transition-colors"
                  >
                    Assistant
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-white text-[1.15rem] font-semibold mb-2">Products</div>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                <li>
                  <a
                    href="/products"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/products");
                    }}
                    className="text-[#B0B6BE] text-[1.02rem] hover:text-[#9BEB83] transition-colors"
                  >
                    Fradium Extension
                  </a>
                </li>
                <li>
                  <a
                    href="/products-wallet"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/products-wallet");
                    }}
                    className="text-[#B0B6BE] text-[1.02rem] hover:text-[#9BEB83] transition-colors"
                  >
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
        <div className="relative z-[3] text-[#B0B6BE] text-[0.97rem] text-center my-7">Copyright &copy;2025 Fradium. All rights reserved</div>
      </div>
      {/* Confirm Create Wallet Modal */}
      <ConfirmCreateWalletModal isOpen={showConfirmWalletModal} onOpenChange={setShowConfirmWalletModal} onConfirm={handleConfirmCreateWallet} isLoading={isLoading} />
    </footer>
  );
};

export default Footer;
