import React from "react";
import { formatAmount, getNetworkIcon } from "@/core/lib/tokenUtils";
import { motion } from "framer-motion";

// Balance Row Skeleton Component
const BalanceRowSkeleton = () => <div className="md:h-5 md:w-16 h-4 w-12 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></div>;

// USD Value Row Skeleton Component
const USDRowSkeleton = () => <div className="md:h-4 md:w-10 h-3 w-8 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></div>;

// Token Item Card Component
const TokenItemCard = ({ token, onClick, balance, isLoading, hasError, usdPrice, usdPriceLoading, usdPriceError, hideBalance }) => {
  const networkIcon = getNetworkIcon(token.chain);

  // Calculate USD value
  const usdValue = balance && usdPrice && !isLoading && !usdPriceLoading ? (parseFloat(balance) * usdPrice).toFixed(2) : "0.00";

  return (
    <motion.div className="group relative flex items-center md:px-2 px-1 md:py-4 py-2 md:gap-4 gap-2 cursor-pointer rounded-lg overflow-hidden hover:bg-white/5 transition-colors duration-200" onClick={() => onClick && onClick(token)} initial={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.6 }}>
      {/* Soft highlight overlay on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }} aria-hidden="true" />

      <div className="relative">
        <img src={token.imageUrl} alt={token.name} className="md:w-10 md:h-10 w-8 h-8 rounded-full" />
        {networkIcon && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-[#0F1219] rounded-full p-0.5">
            <img src={networkIcon} alt={`${token.chain} network`} className="md:w-3 md:h-3 w-2.5 h-2.5 rounded-full" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center md:gap-2 gap-1">
          <span className="text-white font-medium md:text-base text-sm">{token.name}</span>
          <span className="text-[#B0B6BE] md:text-base text-xs">• {token.symbol}</span>
        </div>
        <div className="text-[#B0B6BE] md:text-sm text-xs truncate">{token.chain}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {isLoading ? <BalanceRowSkeleton /> : hasError ? <span className="text-red-400 md:text-sm text-xs">Error</span> : <span className="text-white font-medium md:text-base text-sm">{hideBalance ? "••••" : formatAmount(balance)}</span>}
        {usdPriceLoading ? <USDRowSkeleton /> : usdPriceError ? <span className="text-red-400 md:text-sm text-xs">Error</span> : <span className="text-[#B0B6BE] md:text-sm text-xs">{hideBalance ? "••••" : `$${usdValue}`}</span>}
      </div>
    </motion.div>
  );
};

export default TokenItemCard;
