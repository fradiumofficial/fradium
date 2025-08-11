import React from 'react';
import { cn } from '@/core/lib/utils';

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-primary-green text-primary-black hover:bg-[#83D36F] shadow-[4px_4px_0px_#A259FF] hover:shadow-[2px_2px_8px_rgba(162,89,255,0.3)] transition-all duration-200',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-primary-green bg-transparent text-primary-green hover:bg-primary-green hover:text-primary-black',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-900',
    link: 'text-primary-green underline-offset-4 hover:underline',
  };

  const sizes = {
    default: 'h-12 px-6 py-3 text-button',
    sm: 'h-10 px-4 py-2 text-button',
    lg: 'h-14 px-8 py-4 text-button',
    icon: 'h-12 w-12',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-sans transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-purple focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export default Button;
