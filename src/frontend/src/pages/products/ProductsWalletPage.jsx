import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/AuthProvider";
import { useWallet } from "@/core/providers/WalletProvider";
import { backend } from "declarations/backend";
import SidebarButton from "@/core/components/SidebarButton";
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
    <div className="relative min-h-screen mb-32 bg-[#000510] text-white font-inter w-full overflow-x-hidden">
      {/* Glow background */}
      <img src="/assets/images/glow.png" alt="Glow" className="absolute top-0 left-0 w-[600px] h-[400px] opacity-40 z-0 pointer-events-none select-none" style={{ objectFit: "cover" }} />
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-40 pb-10 px-4 md:px-8 lg:px-16">
        {/* Section label */}
        <span className="text-[#9beb83] text-[16px] font-semibold tracking-[0.18em] mb-6 uppercase">FRADIUM WALLET</span>
        {/* Heading */}
        <h1 className="text-white text-center text-[40px] md:text-[48px] font-medium leading-tight mb-12 max-w-3xl">Your Command Center for Safer Transactions</h1>
        {/* Button */}
        <div className="mb-16">
          <SidebarButton onClick={handleLaunchWallet} disabled={isLoading} className="text-[20px] font-medium">
            {isLoading ? "Checking Wallet..." : "Start Using Wallet →"}
          </SidebarButton>
        </div>
        {/* Laptop Image with Glow Effect */}
        <div className="relative w-full flex justify-center mb-16">
          <img src="/assets/images/glow-effect.png" alt="Glow Effect" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-auto z-0 pointer-events-none select-none blur-2xl " />
          <img src="/assets/images/laptop.png" alt="Laptop" className="relative w-full max-w-3xl mx-auto z-10" style={{ objectFit: "contain" }} />
        </div>
        {/* Description */}
        <p className="text-[#B0B6BE] text-center text-base font-normal max-w-5xl mx-auto mt-2">Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</p>
      </div>
      {/* Wallet Feature Section */}
      <section className="w-full max-w-[1200px] mb-32 mx-auto flex flex-col md:flex-row items-center justify-between gap-x-12 gap-y-8 py-24 px-4 md:px-8 lg:px-16">
        {/* Left: Text & Features */}
        <div className="flex-1 flex flex-col items-start justify-center">
          <span className="text-[#9beb83] text-[17px] font-semibold tracking-[0.18em] mb-6 uppercase">FRADIUM WALLET FEATURE</span>
          <h2 className="text-white text-[40px] font-medium leading-tight mb-12 max-w-2xl">Protect and manage your assets with confidence</h2>
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 w-full max-w-2xl">
            {/* Safe Transactions */}
            <div className="flex items-start gap-5">
              <img src="/assets/icons/Icon.png" alt="Safe Transactions" className="w-16 h-16 md:w-[56px] md:h-[56px]" />
              <div>
                <div className="text-white text-[20px] font-medium mb-1">Safe Transactions</div>
                <div className="text-[#B0B6BE] text-[16px] font-normal leading-snug">Map the crypto projects. Identify wallet risks before any transaction.</div>
              </div>
            </div>
            {/* Smart Contract Audit */}
            <div className="flex items-start gap-5">
              <img src="/assets/icons/Icon-1.png" alt="Smart Contract Audit" className="w-16 h-16 md:w-[56px] md:h-[56px]" />
              <div>
                <div className="text-white text-[20px] font-medium mb-1">Smart Contract Audit</div>
                <div className="text-[#B0B6BE] text-[16px] font-normal leading-snug">Check and scan contracts for vulnerabilities automatically.</div>
              </div>
            </div>
            {/* Analyze Address */}
            <div className="flex items-start gap-5">
              <img src="/assets/icons/Icon-2.png" alt="Analyze Address" className="w-16 h-16 md:w-[56px] md:h-[56px]" />
              <div>
                <div className="text-white text-[20px] font-medium mb-1">Analyze Address</div>
                <div className="text-[#B0B6BE] text-[16px] font-normal leading-snug">Check wallet address for past fraud activity.</div>
              </div>
            </div>
            {/* History */}
            <div className="flex items-start gap-5">
              <img src="/assets/icons/Icon-3.png" alt="History" className="w-16 h-16 md:w-[56px] md:h-[56px]" />
              <div>
                <div className="text-white text-[20px] font-medium mb-1">History</div>
                <div className="text-[#B0B6BE] text-[16px] font-normal leading-snug">View past transactions and scan records in one place.</div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Image */}
        <div className="flex-1 flex items-center justify-center w-full">
          <img src="/assets/images/wallet-feature.png" alt="Wallet Feature" className="w-full max-w-2xl md:max-w-[600px] rounded-2xl" />
        </div>
      </section>
      {/* Confirm Create Wallet Modal */}
      <ConfirmCreateWalletModal isOpen={showConfirmWalletModal} onOpenChange={setShowConfirmWalletModal} onConfirm={handleConfirmCreateWallet} isLoading={isLoading} />
    </div>
  );
};

export default ProductsWallet;
