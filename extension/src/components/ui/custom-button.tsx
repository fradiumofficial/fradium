import React from "react";

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  children: React.ReactNode;
  onClick: () => void;
  classname?: string;
}

const NeoButton: React.FC<NeoButtonProps> = ({ children, icon, onClick, className = '' }) => {
  return (
    <div className={`bg-green-300 ${className}`}>
      <button
        onClick={onClick}
        className={`
          w-full
          flex items-center justify-center gap-
          px-3 py-3
          font-bold text-white
          bg-[#823EFD]
          border-2 border-gray-800
          transform -translate-y-1 translate-x-1
          hover:-translate-y-0 hover:translate-x-0
          active:translate-y-0 active:translate-x-0
          transition-transform duration-150 ease-in-out
        `}
      >
        {/* We now render an <img> tag with the src pointing to our icon path. */}
        {icon === null ? <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] pe-1" /> : <div></div>}
        <span className="text-[14px]">{children}</span>
      </button>
    </div>
  );
};

export default NeoButton;