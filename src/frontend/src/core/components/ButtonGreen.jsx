import React from "react";
import { cn } from "@/core/lib/utils";

// Glossy green button (same API as ButtonPurple, only styling differs)
// Props:
// - size: "sm" | "md" | "lg" (default: md)
// - icon: string (url) | ReactNode
// - iconSize: number (px) | string (Tailwind classes like "w-5 h-5")
// - fullWidth: boolean
// - loading: boolean
// - disabled, onClick, type, className
// - textSize, fontWeight, textClassName
const ButtonGreen = ({ children, icon, onClick, className = "", size = "md", fullWidth = false, loading = false, disabled = false, type = "button", iconSize, iconClassName = "", textSize, fontWeight, textClassName = "", ...props }) => {
  const sizeMap = {
    sm: {
      padding: "px-4 py-2",
      text: "text-[13px]",
      icon: "w-[16px] h-[16px]",
    },
    md: {
      padding: "px-6 py-3",
      text: "text-[16px]",
      icon: "w-[18px] h-[18px]",
    },
    lg: {
      padding: "px-8 py-4",
      text: "text-[18px]",
      icon: "w-[20px] h-[20px]",
    },
    now: {
      padding: "px-3 py-2",
      text: "text-[14px]",
      icon: "w-[16px] h-[16px]",
    },
  };

  const s = sizeMap[size] || sizeMap.md;

  const weightClassMap = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const content = (
    <>
      {icon && (typeof icon === "string" ? <img src={icon} alt="icon" className={cn("select-none", typeof iconSize === "string" ? iconSize : s.icon, iconClassName)} style={typeof iconSize === "number" ? { width: iconSize, height: iconSize } : undefined} /> : icon)}
      <span
        className={cn(
          "tracking-wide",
          textSize ? textSize : s.text,
          weightClassMap[fontWeight] || "font-semibold",
          // dark green text to match glossy pill
          "text-[#0A4C2A]",
          textClassName
        )}>
        {children}
      </span>
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // layout
        "relative inline-flex items-center justify-center gap-3 rounded-full overflow-hidden",
        s.padding,
        fullWidth ? "w-full" : "",
        // base visual - solid green button
        "bg-gradient-to-b from-[#A8F2B7] to-[#64D57E]",
        // simple border without glow effects
        "border border-[#FFFFFF47]",
        // interaction
        "transition-all duration-200 ease-out will-change-transform",
        "hover:from-[#9EE8AD] hover:to-[#5ACB73]",
        "active:from-[#8FE49E] active:to-[#50C168]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}>
      <span className="flex items-center gap-2">
        {loading ? (
          <span className={cn("flex items-center gap-2", s.text)}>
            <svg className="animate-spin h-4 w-4 text-[#0A4C2A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          content
        )}
      </span>
    </button>
  );
};

export default ButtonGreen;
