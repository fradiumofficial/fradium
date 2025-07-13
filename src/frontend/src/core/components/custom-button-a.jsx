import React from "react";

const CustomButton = ({ children, icon, onClick, className = '', ...props }) => {
    return (
        <div className={`bg-[#99E39E] ${className}`}>
            <button
                onClick={onClick}
                className={`
          w-full
          flex items-center gap-3 px-4 py-3
          px-3 py-3
          font-medium text-white
          bg-[#823EFD]
          transform -translate-y-1 translate-x-1
          hover:-translate-y-0 hover:translate-x-0
          active:translate-y-0 active:translate-x-0
          transition-transform duration-150 ease-in-out
        `}
                {...props}
            >
                {icon &&
                    (typeof icon === "string"
                        ? <img src={icon} alt="Button Icon" className="w-[20px] h-[20px] " />
                        : icon)}
                <span className="text-[14px]">{children}</span>
            </button>
        </div>
    );
};

export default CustomButton; 