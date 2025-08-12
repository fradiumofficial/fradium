import React from "react";
import { ChevronDown, Copy } from "lucide-react";

const ProfileHeader = () => {
  return (
    <div className="sticky top-0 z-20 relative w-full bg-[#1C1D22] p-4">
      {/* Background glow effect */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-[#99E39E]/20 to-transparent opacity-30" /> */}

      <div className="relative flex items-center justify-between">
        {/* Left: Fradium Logo */}
        <div className="flex items-center">
          <img
            src="/assets/icon128.png"
            alt="Fradium Logo"
            className="w-10 h-10"
          />
        </div>

        {/* Center: Wallet Information */}
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-white text-sm font-medium mb-1">Neu's Wallet</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium text-xs">Au...Ux</span>
            <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        {/* Right: Settings Icon with Dropdown */}
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#9BE4A01A] rounded-full flex items-center justify-center mr-2">
            <img
              src="/assets/construction.svg"
              alt="Settings"
              className="w-6 h-6"
            />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Glow overlay using glow.png */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'url(/assets/images/glow.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
};

export default ProfileHeader;