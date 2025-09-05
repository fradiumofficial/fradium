import React from "react";
import { cn } from "@/core/lib/utils";

// Flexible glossy purple button used across the app
// Props:
// - size: "sm" | "md" | "lg" (default: md)
// - icon: string (url) | ReactNode
// - iconSize: number (px) | string (Tailwind classes like "w-5 h-5")
// - iconClassName: extra classes for <img>
// - fullWidth: boolean
// - loading: boolean
// - disabled, onClick, type, className
const ButtonPurple = ({
  children,
  icon,
  onClick,
  className = "",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  iconSize,
  iconClassName = "",
  textSize, // override text size (Tailwind class or raw size)
  fontWeight, // normal | medium | semibold | bold
  textClassName = "",
  ...props
}) => {
  const sizeMap = {
    sm: {
      padding: "px-4 py-2",
      text: "text-[13px]",
      icon: "w-[16px] h-[16px]",
    },
    md: {
      padding: "px-6 py-3",
      text: "text-[15px]",
      icon: "w-[18px] h-[18px]",
    },
    lg: {
      padding: "px-8 py-4",
      text: "text-[17px]",
      icon: "w-[20px] h-[20px]",
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
      {icon && (
        typeof icon === "string" ? (
          <img
            src={icon}
            alt="icon"
            className={cn(
              "select-none",
              typeof iconSize === "string" ? iconSize : s.icon,
              iconClassName
            )}
            style={typeof iconSize === "number" ? { width: iconSize, height: iconSize } : undefined}
          />
        ) : (
          icon
        )
      )}
      <span
        className={cn(
          "tracking-wide",
          textSize ? textSize : s.text,
          weightClassMap[fontWeight] || "font-semibold",
          textClassName
        )}
      >
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
        // base visual
        "text-white bg-gradient-to-b from-[#6F64FF] to-[#5B49E8]",
        // borders and inner shadow to mimic glossy pill
        "border border-white/15 shadow-[0_8px_24px_rgba(102,88,255,0.45),inset_0_-2px_6px_rgba(0,0,0,0.35)]",
        // interaction
        "transition-all duration-200 ease-out will-change-transform",
        "hover:shadow-[0_12px_28px_rgba(102,88,255,0.6),inset_0_-2px_8px_rgba(0,0,0,0.35)] hover:-translate-y-[1px]",
        "active:translate-y-0 active:shadow-[0_6px_18px_rgba(102,88,255,0.45),inset_0_-1px_4px_rgba(0,0,0,0.4)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Glow */}
      <span className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(120%_120%_at_50%_120%,rgba(126,103,255,0.25)_0%,rgba(126,103,255,0)_60%)] blur-md" />
      {/* Gloss highlight */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(120%_60%_at_50%_-30%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_60%)]" />
      <span className="relative z-[1] flex items-center gap-3">
        {loading ? (
          <span className={cn("flex items-center gap-2", s.text)}>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

export default ButtonPurple;
