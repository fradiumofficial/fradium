import React from 'react';
import { cn } from '@/core/lib/utils';

const Container = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
