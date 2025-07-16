import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/core/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-['General_Sans',sans-serif] font-medium text-[#0c0d14] bg-[#99e39e] border-none cursor-pointer z-[1] transition-all duration-200 ease-in-out outline-none leading-tight text-center overflow-visible hover:bg-[#83d36f] focus:outline-none active:transform active:translate-x-[-2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-fit",
  {
    variants: {
      size: {
        sm: "text-sm px-4 py-2 shadow-[-3px_3px_0_0_#a259ff] active:shadow-[-2px_2px_0_0_#a259ff] min-h-[36px]",
        md: "text-base px-6 py-3 shadow-[-5px_5px_0_0_#a259ff] active:shadow-[-3px_3px_0_0_#a259ff] sm:active:shadow-[-4px_4px_0_0_#a259ff] min-h-[44px]",
        lg: "text-lg px-8 py-4 shadow-[-6px_6px_0_0_#a259ff] active:shadow-[-4px_4px_0_0_#a259ff] sm:active:shadow-[-5px_5px_0_0_#a259ff] min-h-[52px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const Button = React.forwardRef(
  ({ className, size, style = {}, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ size, className }))}
        style={style}
        ref={ref}
        {...props}
      >
        {props.children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
