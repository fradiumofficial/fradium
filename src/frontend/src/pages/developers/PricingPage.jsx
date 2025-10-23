// React
import React from "react";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import ButtonPurple from "@/core/components/ButtonPurple.jsx";
import { useAuth } from "@/core/providers/AuthProvider";
import { useNavigate } from "react-router";

const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
const BACKGROUND_URL_2 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-2.webp";
const BACKGROUND_URL_3 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp";

const PricingPage = () => {
  const { isAuthenticated, handleLogin } = useAuth();
  const navigate = useNavigate();
  const [isSignUpLoading, setIsSignUpLoading] = React.useState(false);

  const handleSignUp = async () => {
    setIsSignUpLoading(true);
    try {
      await handleLogin();
    } catch (error) {
      console.log("handleSignUp error", error);
    } finally {
      setIsSignUpLoading(false);
    }
  };

  // Animation variants - simplified
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      {/* Background 1 */}
      <div className="relative mx-auto overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="eager" fetchpriority="high" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
          {/* Dark overlay untuk background lebih gelap */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 pt-24 pb-16">
          {/* Header Section */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="container mx-auto px-4 text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-medium text-white mb-3">Simple, Usage-Based Pricing</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Pay only for what you use. No subscriptions, no hidden fees.</p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 max-w-6xl mb-16">
            {/* AI Model Card */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="group relative rounded-2xl backdrop-blur-sm bg-gradient-to-b from-[#A259FF]/[0.05] to-black/20 hover:from-[#A259FF]/[0.08] hover:to-black/30 border border-[#A259FF]/[0.05] hover:border-[#A259FF]/[0.1] p-8 transition-all duration-300"
              style={{
                boxShadow: "0 4px 24px -6px rgba(162, 89, 255, 0.1)",
              }}>
              {/* Subtle card highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#A259FF]/20 to-transparent" />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#A259FF]/[0.02] to-transparent rounded-2xl pointer-events-none" />

              <div className="mb-8">
                <h3 className="text-xl text-white font-medium mb-3">Fradium AI Model Analyzer</h3>
                <p className="text-gray-400 min-h-[60px]">On-chain AI analyzes wallet behavior using transaction features, risk patterns, and anomaly detection across ETH, SOL, BTC, and ICP.</p>
              </div>

              <div className="mb-8">
                <div className="text-3xl text-white font-medium mb-2">
                  0.01 <span className="text-[#9BE4A0]">FRADIUM</span>
                  <span className="text-base text-gray-400"> per address</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  AI-driven reputation scoring
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  Multi-chain support
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  Fully on-chain inference
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  Verifiable results on ICP
                </div>
              </div>

              <div className="text-sm text-gray-400 mb-6">Ideal for developers, exchanges, and dApps requiring instant risk scoring.</div>

              <ButtonPurple fullWidth onClick={isAuthenticated ? () => navigate("/wallet") : handleSignUp} loading={isSignUpLoading} icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-purple.svg" iconSize="w-5 h-5" fontWeight="medium">
                {isAuthenticated ? "Get Started" : "Get Started"}
              </ButtonPurple>
            </motion.div>

            {/* Community Model Card */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="group relative rounded-2xl backdrop-blur-sm bg-gradient-to-b from-[#9BE4A0]/[0.05] to-black/20 hover:from-[#9BE4A0]/[0.08] hover:to-black/30 border border-[#9BE4A0]/[0.05] hover:border-[#9BE4A0]/[0.1] p-8 transition-all duration-300"
              style={{
                boxShadow: "0 4px 24px -6px rgba(155, 228, 160, 0.1)",
              }}>
              {/* Subtle card highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9BE4A0]/20 to-transparent" />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#9BE4A0]/[0.02] to-transparent rounded-2xl pointer-events-none" />

              <div className="mb-8">
                <h3 className="text-xl text-white font-medium mb-3">Community Consensus Analyzer</h3>
                <p className="text-gray-400 min-h-[60px]">Risk score powered by decentralized community reports, DAO voting, and collective trust signals.</p>
              </div>

              <div className="mb-8">
                <div className="text-3xl text-white font-medium mb-2">
                  0.003 <span className="text-[#9BE4A0]">FRADIUM</span>
                  <span className="text-base text-gray-400"> per address</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  Crowd-validated risk data
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  DAO consensus layer
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  Fraud & scam reporting
                </div>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <div className="w-[3px] h-[3px] bg-[#9BE4A0] rounded-full"></div>
                  On-chain transparency
                </div>
              </div>

              <div className="text-sm text-gray-400 mb-6">Ideal for wallets, marketplaces, or dApps that prefer human-verified, trust-based analysis.</div>

              <ButtonGreen fullWidth onClick={isAuthenticated ? () => navigate("/wallet") : handleSignUp} loading={isSignUpLoading} icon="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/f-green.svg" iconSize="w-5 h-5" fontWeight="medium">
                {isAuthenticated ? "Get Started" : "Get Started"}
              </ButtonGreen>
            </motion.div>
          </div>
        </div>
        {/* Fade ke warna dasar agar transisi halus */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      {/* Background 2 */}
      <div className="relative mx-auto overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img src={BACKGROUND_URL_2} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-x-0 bottom-0 h-full w-full object-cover" />
          {/* Dark overlay untuk background lebih gelap */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        {/* Fade dari warna dasar ke background-2 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent" />

        {/* Fade ke warna dasar di bagian bawah */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>
    </section>
  );
};

export default PricingPage;
