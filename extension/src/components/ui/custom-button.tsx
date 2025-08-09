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
    <div className={`bg-green-300 ${className}`}>
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
          hover:-translate-y-0 hover:translate-x-0
          active:translate-y-0 active:translate-x-0
          transition-transform duration-150 ease-in-out
        `}
        {...rest}
      >
        {icon && iconPosition === 'left' && (
          <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] me-1" />
        )}
        <span className="text-[14px]">{children}</span>
        {icon && iconPosition === 'right' && (
          <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] ms-1" />
        )}
      </button>
    </div>
  );
};

export default NeoButton;