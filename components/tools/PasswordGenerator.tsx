import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

export const PasswordGenerator: React.FC = () => {
  const { t } = useAppStore();
  const [length, setLength] = useState<number>(12);
  const [password, setPassword] = useState<string>('');
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let charset = letters;
    let firstCharSet = letters; // Ensure first char comes from here if possible

    if (includeNumbers) {
      charset += numbers;
    }
    if (includeSymbols) {
      charset += symbols;
      firstCharSet += symbols; // Symbols allowed at start
    }

    // Edge case: User unchecks everything except numbers (if logical UI allowed it, assume letters always exist in charset init above)
    // If we only have numbers, first char must be number.
    // However, default charset includes letters. If we wanted to allow disabling letters we would need extra logic.
    // Assuming standard "Strong Password" logic where letters are base.
    
    // If for some reason letters are empty (not possible with current UI state), fallback
    if (firstCharSet.length === 0) firstCharSet = charset;

    let retVal = '';
    
    // Generate first character (No Number)
    retVal += firstCharSet.charAt(Math.floor(Math.random() * firstCharSet.length));

    // Generate remaining characters
    for (let i = 1, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    
    setPassword(retVal);
    setCopied(false);
  }, [length, includeNumbers, includeSymbols]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    generatePassword();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.passwordGen.title}</h2>
        <p className="text-neu-text/60">{t.tools.passwordGen.subtitle}</p>
      </div>

      <NeuCard>
        <div className="flex flex-col items-center justify-center p-6 mb-6 rounded-[20px] shadow-neu-pressed min-h-[100px]">
          <span className="text-3xl font-mono text-neu-accent break-all text-center">
            {password}
          </span>
        </div>
        
        <div className="flex gap-4 justify-center mb-8">
          <NeuButton onClick={generatePassword}>
            <RefreshCw size={20} /> {t.tools.passwordGen.generate}
          </NeuButton>
          <NeuButton onClick={copyToClipboard} active={copied}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? t.tools.passwordGen.copied : t.tools.passwordGen.copy}
          </NeuButton>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-bold text-neu-text uppercase">{t.tools.passwordGen.length}: {length}</label>
            </div>
            <input 
              type="range" 
              min="6" 
              max="32" 
              value={length} 
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer focus:outline-none 
              [&::-webkit-slider-runnable-track]:bg-neu-base [&::-webkit-slider-runnable-track]:shadow-neu-pressed [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-3
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-neu-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <div className="flex justify-center gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${includeNumbers ? 'shadow-neu-pressed bg-neu-base text-neu-accent' : 'shadow-neu-flat bg-neu-base'}`}
              >
                {includeNumbers && <Check size={16} strokeWidth={4} />}
              </div>
              <input type="checkbox" className="hidden" checked={includeNumbers} onChange={() => setIncludeNumbers(!includeNumbers)} />
              <span className="font-semibold select-none">{t.tools.passwordGen.numbers}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${includeSymbols ? 'shadow-neu-pressed bg-neu-base text-neu-accent' : 'shadow-neu-flat bg-neu-base'}`}
              >
                {includeSymbols && <Check size={16} strokeWidth={4} />}
              </div>
              <input type="checkbox" className="hidden" checked={includeSymbols} onChange={() => setIncludeSymbols(!includeSymbols)} />
              <span className="font-semibold select-none">{t.tools.passwordGen.symbols}</span>
            </label>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};