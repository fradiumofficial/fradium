import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import { useWallet } from "@/core/providers/WalletProvider";
import { backend } from "declarations/backend";
import SidebarButton from "@/core/components/SidebarButton";
import Footer from "../../core/components/Footer.jsx";
import ButtonGreen from "@/core/components/ButtonGreen";
import ConfirmCreateWalletModal from "@/core/components/modals/ConfirmCreateWalletModal";

// Custom hook untuk deteksi mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const ProductsWallet = () => {
  const isMobile = useIsMobile();
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

  if (isMobile) {
    // Layout mobile khusus
    return (
      <div className="relative min-h-screen bg-[#000510] mt-10 text-white font-inter w-full overflow-x-hidden pb-10">
        {/* Glow background */}
        <img src="/assets/images/glow.png" alt="Glow" className="absolute top-0 left-0 w-[320px] h-[180px] opacity-40 z-0 pointer-events-none select-none" style={{ objectFit: "cover" }} />
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-16 pb-6 px-4">
          {/* Section label */}
          <span className="text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-4 uppercase">FRADIUM WALLET</span>
          {/* Heading */}
          <h1 className="text-white text-center text-[22px] font-medium leading-tight mb-6 max-w-xs">Your Command Center for Safer Transactions</h1>
          {/* Button */}
          <div className="mb-8 w-full flex justify-center">
            <SidebarButton onClick={handleLaunchWallet} disabled={isLoading} className="text-base font-medium w-full max-w-xs">
              {isLoading ? "Checking Wallet..." : "Start Using Wallet →"}
            </SidebarButton>
          </div>
          {/* Laptop Image with Glow Effect */}
          <div className="relative w-full flex justify-center mb-8">
            <img src="/assets/images/glow-effect.png" alt="Glow Effect" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-auto z-0 pointer-events-none select-none blur-2xl " />
            <img src="/assets/images/laptop.png" alt="Laptop" className="relative w-full max-w-xs mx-auto z-10" style={{ objectFit: "contain" }} />
          </div>
          {/* Description */}
          <p className="text-[#B0B6BE] text-center text-[13px] font-normal max-w-xs mx-auto mt-2 mb-4">Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</p>
        </div>
        {/* Wallet Feature Section */}
        <section className="w-full flex flex-col items-center py-8 px-4">
          {/* Feature Image */}
          <div className="w-full flex items-center justify-center mb-8">
            <img src="/assets/images/wallet-feature.png" alt="Wallet Feature" className="w-full max-w-xs rounded-2xl" />
          </div>
          {/* Section label */}
          <span className="text-[#9beb83] text-[13px] font-semibold tracking-[0.18em] mb-2 uppercase">FRADIUM WALLET FEATURE</span>
          <h2 className="text-white text-[18px] font-medium leading-tight mb-6 max-w-xs text-center">Protect and manage your assets with confidence</h2>
          {/* Feature List */}
          <div className="flex flex-col gap-6 w-full max-w-xs">
            {/* Safe Transactions */}
            <div className="flex items-start gap-4">
              <img src="/assets/icons/Icon.png" alt="Safe Transactions" className="w-10 h-10" />
              <div>
                <div className="text-white text-[15px] font-medium mb-1">Safe Transactions</div>
                <div className="text-[#B0B6BE] text-[12px] font-normal leading-snug">Map the crypto projects. Identify wallet risks before any transaction.</div>
              </div>
            </div>
            {/* Smart Contract Audit */}
            <div className="flex items-start gap-4">
              <img src="/assets/icons/Icon-1.png" alt="Smart Contract Audit" className="w-10 h-10" />
              <div>
                <div className="text-white text-[15px] font-medium mb-1">Smart Contract Audit</div>
                <div className="text-[#B0B6BE] text-[12px] font-normal leading-snug">Check and scan contracts for vulnerabilities automatically.</div>
              </div>
            </div>
            {/* Analyze Address */}
            <div className="flex items-start gap-4">
              <img src="/assets/icons/Icon-2.png" alt="Analyze Address" className="w-10 h-10" />
              <div>
                <div className="text-white text-[15px] font-medium mb-1">Analyze Address</div>
                <div className="text-[#B0B6BE] text-[12px] font-normal leading-snug">Check wallet address for past fraud activity.</div>
              </div>
            </div>
            {/* History */}
            <div className="flex items-start gap-4">
              <img src="/assets/icons/Icon-3.png" alt="History" className="w-10 h-10" />
              <div>
                <div className="text-white text-[15px] font-medium mb-1">History</div>
                <div className="text-[#B0B6BE] text-[12px] font-normal leading-snug">View past transactions and scan records in one place.</div>
              </div>
            </div>
          </div>
        </section>
        {/* Confirm Create Wallet Modal */}
        <ConfirmCreateWalletModal isOpen={showConfirmWalletModal} onOpenChange={setShowConfirmWalletModal} onConfirm={handleConfirmCreateWallet} isLoading={isLoading} />
      </div>
    );
  }

  // Layout desktop lama
  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      {/* Top content before background */}
      <div className="relative z-10 mx-auto w-full max-w-[1300px] pt-28">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-[320px]">
            <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-3 uppercase">FRADIUM WALLET</span>
            <h1 className="text-white text-[36px] font-medium leading-tight mb-3">Manage your assets with protection</h1>
            <p className="text-[#B0B6BE] text-[14px] md:text-[15px] max-w-3xl">Fradium Extension lets you analyse wallet addresses and smart contracts directly in your browser, showing instant risk checks so you can spot threats without leaving the page.</p>
          </div>
          <div className="shrink-0 hidden md:block pt-4">
            <ButtonGreen
              textSize="text-[16px]"
              fontWeight="medium"
              onClick={() => {
                window.open("https://chromewebstore.google.com/detail/fradium-crypto-security-e/doglfmcjkdpohekndccabpplljgkgkcc", "_blank");
              }}
            >
              Download Extension
            </ButtonGreen>
          </div>
        </div>
      </div>

      {/* Background section with cards and laptop */}
      <div className="relative mx-auto mt-8 overflow-hidden">
        {/* Background layer - starts from bottom with natural height */}
        <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
          <img
            src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            draggable={false}
            className="w-full h-auto object-contain object-bottom"
          />
        </div>

        {/* Content over background */}
        <div className="relative z-10 mx-auto w-full max-w-[1300px] pt-12 pb-[380px] md:pb-[600px]">
          {/* Cards row with reveal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[0, 1, 2].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-[#0B0F18]/60 backdrop-blur-[2px] p-5 transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
                <div className="w-full h-[250px] rounded-[12px] bg-white/5 mb-5" />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-white text-[18px] md:text-[20px] font-medium">Extension</div>
                    <div className="text-[#B0B6BE] text-[12px] md:text-[13px] mt-1">Helps you check the safety of your transaction while browsing Web3.</div>
                  </div>
                  <button className="ml-4 w-9 h-9 rounded-full border border-white/15 text-white/90 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 16L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 8H16V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Laptop image moved to absolute bottom full-width */}
        </div>
        {/* Full-width laptop at the very bottom */}
        <div className="absolute inset-x-0 bottom-[-40px] md:bottom-[-80px] z-10">
          <div className="relative w-full overflow-hidden pointer-events-none select-none">
            <img
              src="/assets/images/laptop.png"
              alt="Laptop"
              className="relative w-full max-w-none h-auto block"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
      {/* Footer visuals spacing area if needed */}
      <Footer />
    </section>
  );
};

export default ProductsWallet;
