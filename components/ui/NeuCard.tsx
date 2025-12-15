import React, { ReactNode } from 'react';

interface NeuCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const NeuCard: React.FC<NeuCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-neu-base rounded-[30px] shadow-neu-flat p-8 transition-all duration-300 ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-neu-text mb-6 tracking-wide opacity-80 uppercase text-sm">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};