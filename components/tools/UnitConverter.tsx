import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

type UnitType = 'length' | 'mass' | 'temp';

const units = {
  length: { m: 1, km: 0.001, cm: 100, mm: 1000, ft: 3.28084, mi: 0.000621371, in: 39.3701 },
  mass: { kg: 1, g: 1000, lb: 2.20462, oz: 35.274 },
  temp: { C: 'C', F: 'F' } // Special handling
};

export const UnitConverter: React.FC = () => {
  const { t } = useAppStore();
  const [type, setType] = useState<UnitType>('length');
  const [amount, setAmount] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [result, setResult] = useState<string>('');

  // Reset units when type changes
  useEffect(() => {
    if (type === 'length') { setFromUnit('m'); setToUnit('ft'); }
    else if (type === 'mass') { setFromUnit('kg'); setToUnit('lb'); }
    else { setFromUnit('C'); setToUnit('F'); }
  }, [type]);

  useEffect(() => {
    const val = parseFloat(amount);
    if (isNaN(val)) {
      setResult('---');
      return;
    }

    let res = 0;
    
    if (type === 'temp') {
      if (fromUnit === toUnit) res = val;
      else if (fromUnit === 'C') res = (val * 9/5) + 32;
      else res = (val - 32) * 5/9;
    } else {
      // @ts-ignore
      const base = val / units[type][fromUnit];
      // @ts-ignore
      res = base * units[type][toUnit];
    }

    setResult(res.toFixed(2));
  }, [amount, fromUnit, toUnit, type]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.unitConverter.title}</h2>
        <p className="text-neu-text/60">{t.tools.unitConverter.subtitle}</p>
      </div>

      <div className="flex justify-center mb-6">
         <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex gap-2">
            {(['length', 'mass', 'temp'] as UnitType[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setType(mode)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  type === mode ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'
                }`}
              >
                {t.tools.unitConverter[mode]}
              </button>
            ))}
         </div>
      </div>

      <NeuCard className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full space-y-4">
             <NeuInput 
               type="number" 
               value={amount} 
               onChange={(e) => setAmount(e.target.value)}
               className="text-center text-xl font-bold"
             />
             <div className="relative">
                <select 
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full appearance-none bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-flat outline-none focus:shadow-neu-pressed font-bold cursor-pointer text-center"
                >
                  {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                </select>
             </div>
          </div>

          <div className="text-neu-accent">
            <ArrowRightLeft size={24} />
          </div>

          <div className="flex-1 w-full space-y-4">
             <div className="w-full bg-neu-base rounded-full px-6 py-3 text-neu-text shadow-neu-pressed flex items-center justify-center min-h-[50px]">
                <span className="text-xl font-bold">{result}</span>
             </div>
             <div className="relative">
                <select 
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full appearance-none bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-flat outline-none focus:shadow-neu-pressed font-bold cursor-pointer text-center"
                >
                  {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                </select>
             </div>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};