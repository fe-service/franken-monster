import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

// Approximate static rates relative to USD (Base)
const rates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.5,
  CNY: 7.21,
  CAD: 1.35,
  AUD: 1.53
};

export const CurrencyConverter: React.FC = () => {
  const { t } = useAppStore();
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('CNY');
  const [result, setResult] = useState('');

  useEffect(() => {
    const val = parseFloat(amount);
    if (isNaN(val)) {
        setResult('---');
        return;
    }
    // Convert from -> USD -> to
    const inUsd = val / rates[from];
    const final = inUsd * rates[to];
    setResult(final.toFixed(2));
  }, [amount, from, to]);

  const swap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.currencyConverter.title}</h2>
        <p className="text-neu-text/60">{t.tools.currencyConverter.subtitle}</p>
      </div>

      <NeuCard className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full space-y-4">
             <NeuInput 
               type="number" 
               value={amount} 
               onChange={(e) => setAmount(e.target.value)}
               className="text-center text-xl font-bold"
               placeholder={t.tools.currencyConverter.amount}
             />
             <div className="relative">
                <select 
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full appearance-none bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-flat outline-none focus:shadow-neu-pressed font-bold cursor-pointer text-center"
                >
                  {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>

          <div className="text-neu-accent cursor-pointer hover:scale-110 transition-transform" onClick={swap}>
            <ArrowRightLeft size={24} />
          </div>

          <div className="flex-1 w-full space-y-4">
             <div className="w-full bg-neu-base rounded-full px-6 py-3 text-neu-text shadow-neu-pressed flex items-center justify-center min-h-[50px]">
                <span className="text-xl font-bold">{result}</span>
             </div>
             <div className="relative">
                <select 
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full appearance-none bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-flat outline-none focus:shadow-neu-pressed font-bold cursor-pointer text-center"
                >
                  {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};