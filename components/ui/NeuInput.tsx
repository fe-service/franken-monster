
import React from 'react';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  rightElement?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, rightElement, leftIcon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{label}</label>}
      <div className="relative w-full">
        <input
          className={`w-full bg-neu-base rounded-full px-6 py-3 text-neu-text shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 placeholder-neu-text/30 transition-all ${leftIcon ? 'pl-12' : ''} ${rightElement ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-neu-text/50 pointer-events-none">
            {leftIcon}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-neu-text/50">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

interface NeuTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const NeuTextArea: React.FC<NeuTextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{label}</label>}
      <textarea
        className={`w-full bg-neu-base rounded-[20px] px-6 py-4 text-neu-text shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 placeholder-neu-text/30 transition-all resize-none ${className}`}
        {...props}
      />
    </div>
  );
};
