import React from "react";

const TransactionButton = ({ children, icon, onClick, className = '', iconSize = 'w-7 h-7', ...props }) => {
    return (
        <div className={`bg-[#823EFD] w-10 h-10 ${className}`}>
            <button
                onClick={onClick}
                className={`
                    w-10 h-10
                    flex items-center justify-center
                    font-medium text-[#000510]
                    bg-[#9BEB83]
                    transform -translate-y-1 translate-x-1
                    hover:-translate-y-0 hover:translate-x-0
                    active:translate-y-0 active:translate-x-0
                    transition-transform duration-150 ease-in-out
                `}
                {...props}
            >
                {icon && (
                    typeof icon === "string"
                        ? <img src={icon} alt="Button Icon" className={iconSize} />
                        : <div className={iconSize}>{icon}</div>
                )}
                {children && <span className="text-[14px]">{children}</span>}
            </button>
        </div>
    );
};

export default TransactionButton; 