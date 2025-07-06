import React from "react";

export default function ButtonBullet({ onClick, direction = "down", ariaLabel = "Toggle section" }) {
    return (
        <button
            onClick={e => { e.stopPropagation(); onClick && onClick(e); }}
            aria-label={ariaLabel}
            style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#23272f",
                border: "none",
                boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
                padding: 0,
            }}
            className="button-bullet"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    transform: direction === "up" ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.2s"
                }}
            >
                <path
                    d="M12 28L24 16L36 28"
                    stroke="#7be495"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
} 