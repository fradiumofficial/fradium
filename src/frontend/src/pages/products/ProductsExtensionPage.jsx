import React from "react";
import SidebarButton from "@/core/components/SidebarButton";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
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

  // Simple reveal-on-scroll component
  const Reveal = ({ children, delay = 0 }) => {
    const ref = React.useRef(null);
    const [show, setShow] = React.useState(false);
    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShow(true);
            io.disconnect();
          }
        },
        { rootMargin: "-10% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return (
      <div ref={ref} className={`transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`} style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </div>
    );
  };

  if (isMobile) {
    // Layout mobile khusus
    return (
      <>
        <div className="min-h-screen bg-[#000510] text-white font-inter w-full pb-16 relative overflow-hidden">
          {/* Background layer - starts from bottom with natural height */}
          <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
            <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="w-full h-auto object-contain object-bottom" />
          </div>
          {/* Soft fade at top edge to blend with navbar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#000510] to-transparent z-0" />
          {/* Hero Section */}
          <section className="relative z-10 w-full flex flex-col items-center mt-20 justify-center pt-10 px-4">
            <Reveal>
              <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">FRADIUM EXTENSION</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-[24px] font-medium leading-tight mb-8 text-center">
                Security that follows you,
                <br />
                anywhere you Browse
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <ButtonGreen
                size="md"
                onClick={() => {
                  window.open("https://chromewebstore.google.com/detail/fradium-the-trust-layer-f/bkkhicfomfaagfhnlechfapddmdfabdp", "_blank");
                }}
                fontWeight="medium"
                className="w-full max-w-xs"
                textClassName="text-center leading-tight">
                Download Extension
              </ButtonGreen>
            </Reveal>
          </section>

          {/* Gambar utama */}
          <div className="relative z-10 w-full flex justify-center items-center mb-4 mt-10 px-2">
            <Reveal>
              <div className="group transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
                <img src="/assets/images/products-extension.png" alt="Fradium Extension UI" className="w-full max-w-[340px] rounded-2xl" />
              </div>
            </Reveal>
          </div>

          {/* About Section */}
          <section className="relative z-10 w-full flex flex-col items-center px-4 mt-2">
            <Reveal>
              <span className="block text-[#9beb83] text-[13px] font-semibold tracking-[0.15em] mb-1">KEY FEATURE</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[20px] font-medium mb-2 text-center">About Fradium Extension</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="text-[#B0B6BE] text-[14px] max-w-[340px] font-normal leading-[1.6] text-justify mb-4">Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</p>
            </Reveal>
          </section>

          {/* Gambar kedua */}
          <div className="relative z-10 w-full flex justify-center items-center my-6 px-2">
            <Reveal>
              <div className="group transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
                <img src="/assets/images/products-extension-works.png" alt="How It Works" className="w-full max-w-[340px] rounded-2xl" />
              </div>
            </Reveal>
          </div>

          {/* How it works */}
          <section className="relative z-10 w-full flex flex-col items-center px-4 mt-2">
            <Reveal>
              <span className="block text-[#9beb83] text-[13px] font-semibold tracking-[0.15em] mb-1">KEY FEATURE</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[20px] font-medium mb-2 text-center">How It Works</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="text-[#B0B6BE] text-[14px] max-w-[340px] font-normal leading-[1.6] text-justify">To use the Fradium Extension, simply download and install it on your browser. Once installed, you have two ways to scan wallet addresses or smart contracts. You can highlight the address or contract on any page, right-click, and select 'Scan with Fradium'. Alternatively, you can open the extension, enter the address or contract manually, and click the analyse button to check its risk level. Both options give you clear results directly in your browser, so you can verify before interacting.</p>
            </Reveal>
          </section>
        </div>
        <Footer />
      </>
    );
  }

  // Layout desktop lama
  return (
    <>
      <div className="min-h-screen bg-[#000510] text-white font-inter w-full relative overflow-hidden">
        {/* Background layer - starts from bottom with natural height */}
        <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none">
          <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="w-full h-auto object-contain object-bottom" />
        </div>
        {/* Soft fade at top edge to blend with navbar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 md:h-28 bg-gradient-to-b from-[#000510] to-transparent z-0" />
        {/* Hero Section */}
        <section className="relative z-10 w-full max-w-[1200px] mx-auto pt-32 px-4 md:px-8 lg:px-16 flex flex-row items-start justify-between">
          {/* Left: Text */}
          <div className="w-[80%] min-w-[340px]">
            <Reveal>
              <span className="block text-[#9beb83] text-[16px] font-semibold tracking-[0.15em] mb-4">FRADIUM EXTENSION</span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="text-[40px] font-medium leading-tight mb-8">Security that follows you, anywhere you Browse</h1>
            </Reveal>
          </div>
          {/* Download Button absolute top-right */}
          <div className="absolute right-0 mt-8 pr-8 mr-8 z-10">
            <Reveal delay={140}>
              <ButtonGreen
                size="md"
                fontWeight="medium"
                className=" h-[48px] text-[18px]"
                onClick={() => {
                  window.open("https://chromewebstore.google.com/detail/fradium-the-trust-layer-f/bkkhicfomfaagfhnlechfapddmdfabdp", "_blank");
                }}
                textClassName="text-center leading-tight">
                Download Extension
              </ButtonGreen>
            </Reveal>
          </div>
        </section>

        {/* Content Section 1: About Fradium Extension */}
        <section className="relative z-10 w-full max-w-[1200px] mx-auto mt-24 px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 items-center">
          {/* Kiri: Teks */}
          <div className="flex flex-col items-start">
            <Reveal>
              <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">KEY FEATURE</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[40px] font-medium mb-6">About Fradium Extension</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="text-[#B0B6BE] text-justify text-base font-normal leading-[1.6] mb-0 text-left max-w-[700px]">Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</p>
            </Reveal>
          </div>
          {/* Kanan: Gambar */}
          <div className="flex justify-center items-center w-full mt-8 md:mt-0">
            <Reveal>
              <div className="group transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
                <img src="/assets/images/products-extension.png" alt="Fradium Extension UI" className="max-w-[500px] w-full rounded-2xl" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Content Section 2: How It Works */}
        <section className="relative z-10 w-full mb-10 max-w-[1200px] mx-auto mt-24 px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 items-center">
          {/* Kiri: Gambar */}
          <div className="flex justify-center items-center w-full mt-8 md:mt-0">
            <Reveal>
              <div className="group transition-transform duration-300 hover:scale-[1.01] hover:rotate-[0.6deg]">
                <img src="/assets/images/products-extension-works.png" alt="How It Works" className="max-w-[500px] w-full rounded-2xl" />
              </div>
            </Reveal>
          </div>
          {/* Kanan: Teks */}
          <div className="flex flex-col items-start">
            <Reveal>
              <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">KEY FEATURE</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="text-[40px] font-medium mb-6">How It Works</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="text-[#B0B6BE] text-justify text-base font-normal leading-[1.6] mb-0 text-left max-w-[700px]">To use the Fradium Extension, simply download and install it on your browser. Once installed, you have two ways to scan wallet addresses or smart contracts. You can highlight the address or contract on any page, right-click, and select 'Scan with Fradium'. Alternatively, you can open the extension, enter the address or contract manually, and click the analyse button to check its risk level. Both options give you clear results directly in your browser, so you can verify before interacting.</p>
            </Reveal>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ProductsExtension;
