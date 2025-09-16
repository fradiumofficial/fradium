import React from "react";


interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string | any;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}


const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${className}`}>
      <button
        type="submit"
        onClick={onClick}
        className={`
          w-full
          flex items-center justify-center gap-2
          px-3 py-3
          font-bold text-white
          bg-[#823EFD]
          border-2 border-gray-800
          transform -translate-y-1 translate-x-1
          hover:-translate-y-0 hover:translate-x-0 hover:bg-[#6B2FD1] hover:shadow-lg
          active:translate-y-0 active:translate-x-0 active:bg-[#5A26C0]
          transition-all duration-200 ease-in-out
          cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[#823EFD] focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        `}
        {...rest}
      >
        {icon && iconPosition === 'left' && (
          <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] me-1 transition-transform duration-200 hover:scale-110" />
        )}
        <span className="text-[14px] transition-all duration-200">{children}</span>
        {icon && iconPosition === 'right' && (
          <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] ms-1 transition-transform duration-200 hover:scale-110" />
        )}
      </button>
    </div>
  );
};

export default NeoButton;