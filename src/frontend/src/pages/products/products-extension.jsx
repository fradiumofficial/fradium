import React from "react";
import SidebarButton from "@/core/components/SidebarButton";

const ProductsExtension = () => {
  return (
    <div className="min-h-screen bg-[#000510] mb-32 text-white font-inter w-full">
      {/* Hero Section */}
      <section className="relative w-full max-w-[1200px] mx-auto pt-32 px-4 md:px-8 lg:px-16 flex flex-row items-start justify-between">
        {/* Left: Text */}
        <div className="w-[80%] min-w-[340px]">
          <span className="block text-[#9beb83] text-[16px] font-semibold tracking-[0.15em] mb-4">FRADIUM EXTENSION</span>
          <h1 className="text-[40px] font-medium leading-tight mb-8">Security that follows you, anywhere you Browse</h1>
        </div>
        {/* Download Button absolute top-right */}
        <div className="absolute right-0 mt-8 pr-8 mr-8 z-10">
          <SidebarButton className="w-[199px] h-[48px] text-[18px]">Download Extension</SidebarButton>
        </div>
      </section>

      {/* Content Section 1: About Fradium Extension */}
      <section className="w-full max-w-[1200px] mx-auto mt-24 px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 items-center">
        {/* Kiri: Teks */}
        <div className="flex flex-col items-start">
          <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">KEY FEATURE</span>
          <h2 className="text-[40px] font-medium mb-6">About Fradium Extension</h2>
          <p className="text-[#B0B6BE] text-justify text-base font-normal leading-[1.6] mb-0 text-left max-w-[700px]">Fradium Extension is a browser tool designed to help you assess the safety of blockchain interactions as you navigate Web3 platforms. After downloading and installing the extension, you can analyse wallet addresses and smart contracts directly from your browser. The extension runs checks in the background and displays risk information on the spot, so you can review potential threats without leaving the page or switching to another tool.</p>
        </div>
        {/* Kanan: Gambar */}
        <div className="flex justify-center items-center w-full mt-8 md:mt-0">
          <img src="/assets/images/products-extension.png" alt="Fradium Extension UI" className="max-w-[500px] w-full rounded-2xl" />
        </div>
      </section>

      {/* Content Section 2: How It Works */}
      <section className="w-full max-w-[1200px] mx-auto mt-24 px-4 md:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 items-center">
        {/* Kiri: Gambar */}
        <div className="flex justify-center items-center w-full mt-8 md:mt-0">
          <img src="/assets/images/products-extension-works.png" alt="How It Works" className="max-w-[500px] w-full rounded-2xl" />
        </div>
        {/* Kanan: Teks */}
        <div className="flex flex-col items-start">
          <span className="block text-[#9beb83] text-[15px] font-semibold tracking-[0.15em] mb-2">KEY FEATURE</span>
          <h2 className="text-[40px] font-medium mb-6">How It Works</h2>
          <p className="text-[#B0B6BE] text-justify text-base font-normal leading-[1.6] mb-0 text-left max-w-[700px]">To use the Fradium Extension, simply download and install it on your browser. Once installed, you have two ways to scan wallet addresses or smart contracts. You can highlight the address or contract on any page, right-click, and select 'Scan with Fradium'. Alternatively, you can open the extension, enter the address or contract manually, and click the analyse button to check its risk level. Both options give you clear results directly in your browser, so you can verify before interacting.</p>
        </div>
      </section>
    </div>
  );
};

export default ProductsExtension;
