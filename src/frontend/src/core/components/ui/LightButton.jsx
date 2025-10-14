import React from "react";

// Desain: pill, gradient border + fill (#C263E1 → #8791E1 → #1344AF, 135deg),
// stroke 1px inside, drop shadow lembut dominan ke bawah.
const variantClassesOuter = {
  primary: "relative inline-flex items-center justify-center rounded-full p-[1px] my-2 cursor-pointer group [background:linear-gradient(135deg,#6C8CDF_0%,#2D54B8_40%,#6C8CDF_100%)] shadow-[0_22px_36px_-18px_rgba(19,68,175,0.40),0_5px_8px_-4px_rgba(135,145,225,0.70)] transition-all duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0 hover:shadow-[0_26px_44px_-18px_rgba(19,68,175,0.45),0_8px_14px_-4px_rgba(135,145,225,0.75)]",
  secondary: "rounded-full",
  ghost: "rounded-full my-2",
  inverted: "rounded-full",
};

const variantClassesInner = {
  primary: "rounded-full text-white [background:linear-gradient(135deg,#8791E1_0%,#1344AF_100%)] ring-1 ring-inset ring-white/30 font-medium tracking-tight",
  secondary: "bg-slate-900 text-white",
  ghost: "border border-slate-300 text-slate-900",
  inverted: "bg-white text-slate-900",
};

const sizeClasses = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export default function Button({ children, variant = "primary", size = "md", className = "", leftIcon = null, rightIcon = null, as: Component = "button", ...props }) {
  if (variant === "primary") {
    return (
      <Component className={`${variantClassesOuter.primary} ${className}`} {...props}>
        <span className={`${variantClassesInner.primary} ${sizeClasses[size] || sizeClasses.md} inline-flex items-center justify-center transition-[filter] group-hover:brightness-110`}>
          {leftIcon ? <span className="mr-2 inline-flex">{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
        </span>
      </Component>
    );
  }

  return (
    <Component className={`inline-flex items-center justify-center ${variantClassesOuter[variant]} ${variantClassesInner[variant]} ${sizeClasses[size] || sizeClasses.md} ${className}`} {...props}>
      {leftIcon ? <span className="mr-2 inline-flex">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
    </Component>
  );
}
