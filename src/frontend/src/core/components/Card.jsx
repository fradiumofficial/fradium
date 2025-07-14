import React from "react";

const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`
        relative
        w-full
        bg-[rgba(20,24,30,0.85)]
        shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]
        rounded-md
        backdrop-blur-md
        p-8
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
