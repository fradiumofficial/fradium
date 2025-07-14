import React from 'react';
import styles from './button.module.css';

const sizeMap = {
    sm: { fontSize: 16, padding: '8px 20px' },
    md: { fontSize: 22, padding: '16px 40px' },
    lg: { fontSize: 28, padding: '20px 56px' },
};

const Button = ({ children, className = '', size = 'md', style = {}, ...props }) => {
    const sizeStyle = sizeMap[size] || sizeMap.md;
    return (
        <button
            className={`${styles.buttonFancy} ${className}`}
            style={{ fontSize: sizeStyle.fontSize, padding: sizeStyle.padding, ...style }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
