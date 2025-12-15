import React from 'react';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{label}</label>}
      <input
        className={`w-full bg-neu-base rounded-full px-6 py-3 text-neu-text shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 placeholder-neu-text/30 transition-all ${className}`}
        {...props}
      />
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