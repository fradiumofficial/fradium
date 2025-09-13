import React from "react";
import ButtonGreen from "@/core/components/ButtonGreen";
import Footer from "@/core/components/Footer";
import { useNavigate } from "react-router-dom";

const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";
const ICON_401 = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/icons/401.png";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      {/* Top content before background */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 mt-8 text-center">
        {/* <p className="text-[14px] font-medium tracking-[0.28em] text-[#C1FFC5]">UNAUTHORIZED ACCESS</p> */}
      </div>

      {/* Background section */}
      <div className="relative mx-auto mt-4 overflow-hidden min-h-[600px] md:min-h-[700px]">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img
            src={BACKGROUND_URL}
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Content over background */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[600px] md:min-h-[700px] px-4">
          {/* 401 Icon */}
          <div className="mb-8">
            <img
              src={ICON_401}
              alt="401"
              className="w-[200px] md:w-[300px] h-auto pointer-events-none select-none"
            />
          </div>

          {/* Error message */}
          <h1 className="text-[#99E39E] text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
            Oops! you dont have Access
          </h1>
          <p className="text-[#B0B6BE] text-center max-w-2xl text-sm md:text-base mb-8">
            Sorry, this page you are looking for doesn't exist or has been removed
          </p>

          {/* Back to Homepage button */}
          <div className="">
            <ButtonGreen
              size="md"
              fontWeight="medium"
              fullWidth
              onClick={() => navigate("/")}
            >
              ← Back to Homepage
            </ButtonGreen>
          </div>
        </div>

        {/* Fade to base color */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#000510]" />
      </div>

      <Footer />
    </section>
  );
}
