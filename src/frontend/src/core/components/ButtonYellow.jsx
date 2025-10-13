import React from "react";
import { cn } from "@/core/lib/utils";

// Glossy yellow/gold button matching Figma design
// Props:
// - size: "sm" | "md" | "lg" (default: md)
// - icon: string (url) | ReactNode
// - iconSize: number (px) | string (Tailwind classes like "w-5 h-5")
// - fullWidth: boolean
// - loading: boolean
// - disabled, onClick, type, className
// - textSize, fontWeight, textClassName
const ButtonYellow = ({
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
  textSize,
  fontWeight,
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
      {icon &&
        (typeof icon === "string" ? (
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
        ))}
      <span
        className={cn(
          "tracking-wide",
          textSize ? textSize : s.text,
          weightClassMap[fontWeight] || "font-semibold",
          // dark brownish text for the normal state
          "text-[#3a2f1a]",
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

        // --- MODIFICATION 1: Updated loading state background ---
        // Swapped the opaque grey gradient for a semi-transparent white background with a backdrop blur for the "glass" effect.
        loading
          ? "bg-white/10 backdrop-blur-md"
          : "bg-gradient-to-b from-[#FFE49F] to-[#AA8D42]",

        // --- MODIFICATION 2: Updated loading state border & shadow ---
        // Simplified the border and shadow for a cleaner glass look.
        loading
          ? "border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          : "border border-white/15 shadow-[0_8px_24px_rgba(170,141,66,0.45),inset_0_-2px_6px_rgba(0,0,0,0.25)]",

        // interaction
        "transition-all duration-200 ease-out will-change-transform",
        !loading && "hover:shadow-[0_12px_28px_rgba(170,141,66,0.6),inset_0_-2px_8px_rgba(0,0,0,0.25)] hover:-translate-y-[1px]",
        !loading && "active:translate-y-0 active:shadow-[0_6px_18px_rgba(170,141,66,0.45),inset_0_-1px_4px_rgba(0,0,0,0.3)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        loading && "cursor-wait",
        className
      )}
      {...props}
    >
      {/* Glow (only for normal state) */}
      {!loading && <span className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(120%_120%_at_50%_120%,rgba(255,228,159,0.3)_0%,rgba(255,228,159,0)_60%)] blur-md" />}

      {/* Gloss highlight (only for normal state) */}
      {!loading && <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(120%_60%_at_50%_-30%,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_60%)]" />}

      <span className={cn(
        "relative z-[1] flex items-center gap-2",
        loading ? "text-white" : "text-[#3a2f1a]"
      )}>
        {loading ? (
          <span className={cn("flex items-center gap-2", s.text)}>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
          </span>
        ) : (
          content
        )}
      </span>
    </button>
  );
};

export default ButtonYellow;