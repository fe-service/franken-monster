import React, { ReactNode } from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  variant?: 'primary' | 'danger' | 'default';
}

export const NeuButton: React.FC<NeuButtonProps> = ({ 
  children, 
  active = false, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-full font-bold transition-all duration-200 ease-in-out flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-neu-accent/20";
  
  let sizeStyles = "px-6 py-3";
  let colorStyles = "text-neu-text hover:text-neu-accent";
  
  // Dynamic class construction based on active state (pressed vs flat)
  const shadowStyle = active 
    ? 'shadow-neu-pressed text-neu-accent scale-[0.98]' 
    : 'shadow-neu-flat hover:-translate-y-0.5 active:shadow-neu-pressed active:scale-[0.98]';

  if (variant === 'primary') {
    colorStyles = "text-neu-accent";
  } else if (variant === 'danger') {
    colorStyles = "text-red-500 hover:text-red-600";
  }

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${colorStyles} ${shadowStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};