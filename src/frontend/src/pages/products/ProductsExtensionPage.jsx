import React from "react";
import SidebarButton from "@/core/components/SidebarButton";
import ButtonGreen from "@/core/components/ButtonGreen";
import Footer from "../../core/components/Footer.jsx";

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

const ProductsExtension = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      {/* About Fradium Extension Section - Top (sebelum background) */}
      <div className="relative z-10 mx-auto w-full px-12 pt-16 mt-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Left: Text Content */}
          <div className="w-full lg:w-[70%] min-w-[340px]">
            <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">FRADIUM EXTENSION</span>
            <h2 className="text-[40px] font-medium mb-2">About Fradium Extension</h2>
            <p className="text-[#B0B6BE] text-base font-normal leading-[1.6] text-left max-w-[600px]">Fradium Extension lets you analyse wallet addresses and smart contracts directly in your browser, showing instant risk checks so you can spot threats without leaving the page.</p>
          </div>
          {/* Right: Download Button */}
          <div className="flex justify-center items-center mt-6 lg:mt-0">
            <ButtonGreen
              className=" text-[18px]"
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

      {/* Background dimulai di bawah konten pertama */}
      <div className="relative mx-auto mt-8 overflow-hidden">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img
            src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Content di atas background */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-16 pb-24">
          {/* How It Works Section */}
          <div className="flex flex-col items-start mb-12">
            <span className="block text-[#8791E1] text-[15px] font-semibold tracking-[0.15em] mb-2">KEY FEATURE</span>
            <div className="flex flex-row items-start justify-between w-full">
              <h2 className="text-[40px] font-medium">How It Works</h2>
              <div className="flex items-center gap-2 ml-8">
                <p className="text-[#B0B6BE] text-base font-normal leading-[1.6] text-left max-w-[600px]">Download and install the Fradium Extension to scan wallet addresses instantly. Highlight and right-click any address, or enter it manually in the extension, and view risk results directly in your browser before interacting.</p>

              </div>
            </div>
          </div>

          {/* Two Options Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Option 1: Right-Click Quick Scan */}
            <div className="bg-[#000000]/50 bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 border border-[#333333] shadow-lg">
              <h3 className="text-[24px] font-medium mb-6 text-white">
                Option 1: <span className="text-[#8B5CF6]">Right-Click Quick Scan</span>
              </h3>

              <div className="space-y-8">
                {/* Step 1 */}
                <div className="relative pl-20">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[13px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-14 md:h-16 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Highlight any wallet address on a webpage</p>
                </div>

                {/* Step 2 */}
                <div className="relative pl-20">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[13px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-14 md:h-16 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Right-click and select “Scan with Fradium.”</p>
                </div>

                {/* Step 3 */}
                <div className="relative pl-20">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[13px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-14 md:h-16 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">The extension runs checks in the background (blacklists, scam history, risk patterns)</p>
                </div>

                {/* Final Step */}
                <div className="relative pl-20">
                  <div className="absolute left-1 top-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#74F490] text-[#04381F] flex items-center justify-center shadow-[0_0_0_2px_rgba(116,244,144,0.25)]">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#74F490] text-[17px] font-semibold leading-relaxed">View instant result in a popover: risk level (e.g., Safe/Warning/High Risk), key flags, and a link to the full report</p>
                </div>
              </div>
            </div>

            {/* Option 2: Scan from the Extension */}
            <div className="bg-[#000000]/50 bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 border border-[#333333] shadow-lg">
              <h3 className="text-[24px] font-medium mb-6 text-white">
                Option 2: <span className="text-white">Scan from the <span className="text-[#8B5CF6]">Extension</span></span>
              </h3>

              <div className="space-y-10">
                {/* Step 1 */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[12px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-12 md:h-14 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Open the Fradium icon in your browser toolbar.</p>
                </div>

                {/* Step 2 */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[12px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-12 md:h-14 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Choose Analyze Address</p>
                </div>

                {/* Step 3 */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[12px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-12 md:h-14 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Paste the wallet/contract address (or supported explorer URL)</p>
                </div>

                {/* Step 4 */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white/90 text-white/95 flex items-center justify-center text-[12px] font-semibold tracking-[0.08em]">02</div>
                    <div className="w-px h-12 md:h-14 bg-white/30 mt-2"></div>
                  </div>
                  <p className="text-[#B7C0CD] text-[17px] leading-relaxed">Click Analyze to run the risk evaluation</p>
                </div>

                {/* Final Step */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#74F490] text-[#04381F] flex items-center justify-center shadow-[0_0_0_2px_rgba(116,244,144,0.25)]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#74F490] text-[17px] font-semibold leading-relaxed">Review results in the panel: risk score, evidence (labels, transactions, reports), and recommended next steps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section >
  );
};

export default ProductsExtension;
