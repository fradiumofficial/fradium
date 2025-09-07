import React from "react";
import { formatAmount, getNetworkIcon } from "@/core/lib/coinUtils";

// Balance Skeleton Component
const BalanceSkeleton = () => (
  <div className="flex flex-col items-end gap-2">
    <div className="md:h-5 md:w-16 h-4 w-12 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></div>
    <div className="md:h-4 md:w-10 h-3 w-8 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded animate-pulse"></div>
  </div>
);

// Token Item Card Component
const TokenItemCard = ({ token, onClick, balance, isLoading, hasError }) => {
  const networkIcon = getNetworkIcon(token.chain);

  return (
    <div className="flex items-center md:px-2 px-1 md:py-4 py-2 md:gap-4 gap-2 cursor-pointer hover:bg-[#181C22] transition-colors rounded-lg" onClick={() => onClick && onClick(token)}>
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
        {isLoading ? <BalanceSkeleton /> : hasError ? <span className="text-red-400 md:text-sm text-xs">Error</span> : <span className="text-white font-medium md:text-base text-sm">{formatAmount(balance)}</span>}
        <span className="text-[#B0B6BE] md:text-sm text-xs">$0.00</span>
      </div>
    </div>
  );
};

export default TokenItemCard;
