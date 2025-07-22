import React from "react";
import { cn } from "@/core/lib/utils";

const NeoButton = ({ children, icon, onClick, className = "", buttonClassName = "", active, ...props }) => {
  const baseClasses = `
    w-full
    flex items-center gap-3
    font-medium text-[#000510]
    bg-[#9BEB83]
    transform -translate-y-1 translate-x-1
    hover:-translate-y-0 hover:translate-x-0
    active:translate-y-0 active:translate-x-0
    transition-transform duration-150 ease-in-out
  `;

  const defaultPaddingClasses = "px-4 py-3";

  return (
    <div className={`bg-[#823EFD]`}>
      <button type="button" onClick={onClick} className={cn(baseClasses, defaultPaddingClasses, buttonClassName)} {...props}>
        {icon && (typeof icon === "string" ? <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] " /> : icon)}
        <span className="text-[14px]">{children}</span>
      </button>
    </div>
  );
};

export default NeoButton;
