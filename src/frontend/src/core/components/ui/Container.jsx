import React from "react";

export default function Container({ children, className = "", size = "xl" }) {
  const sizeToClass = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
  };

  return <div className={`mx-auto w-full ${sizeToClass[size] ?? sizeToClass.xl} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
