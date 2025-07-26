import React from "react";
import { cn } from "@/core/lib/utils";

const NeoButton = ({ children, icon, onClick, className = "", buttonClassName = "", active, size = "default", ...props }) => {
  let baseClasses = `
    flex items-center gap-3
    font-medium text-[#000510]
    bg-[#9BEB83]
    transform -translate-y-1 translate-x-1
    hover:-translate-y-0 hover:translate-x-0
    active:translate-y-0 active:translate-x-0
    transition-transform duration-150 ease-in-out
  `;
  let defaultPaddingClasses = "px-4 py-3 w-full";
  let fontSize = "text-[14px]";
  if (size === "sm") {
    defaultPaddingClasses = "px-3 py-2";
    fontSize = "text-[13px]";
  }
  return (
    <div className={size === "sm" ? "bg-[#823EFD] max-w-xs mx-auto" : "bg-[#823EFD]"}>
      <button type="button" onClick={onClick} className={cn(baseClasses, defaultPaddingClasses, buttonClassName)} {...props}>
        {icon && (typeof icon === "string" ? <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] " /> : icon)}
        <span className={fontSize}>{children}</span>
      </button>
    </div>
  );
};

export default NeoButton;
