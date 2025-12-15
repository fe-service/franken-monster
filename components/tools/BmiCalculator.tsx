import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

export const BmiCalculator: React.FC = () => {
  const { t } = useAppStore();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      // BMI = kg / m^2
      const meters = h / 100;
      const result = w / (meters * meters);
      setBmi(Math.round(result * 10) / 10);
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const getCategory = (bmi: number) => {
    if (bmi < 18.5) return { text: t.tools.bmiCalculator.underweight, color: 'text-blue-400' };
    if (bmi < 25) return { text: t.tools.bmiCalculator.normal, color: 'text-green-500' };
    if (bmi < 30) return { text: t.tools.bmiCalculator.overweight, color: 'text-orange-400' };
    return { text: t.tools.bmiCalculator.obese, color: 'text-red-500' };
  };

  const category = bmi ? getCategory(bmi) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.bmiCalculator.title}</h2>
        <p className="text-neu-text/60">{t.tools.bmiCalculator.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NeuCard className="flex flex-col justify-center space-y-6">
          <NeuInput 
            label={t.tools.bmiCalculator.height}
            type="number" 
            placeholder="175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <NeuInput 
            label={t.tools.bmiCalculator.weight}
            type="number" 
            placeholder="70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </NeuCard>

        <NeuCard className="flex flex-col items-center justify-center text-center">
           <div className="mb-4 text-neu-text/40">
             <Activity size={48} />
           </div>
           {bmi ? (
             <>
               <span className="text-sm font-bold uppercase text-neu-text/50 tracking-widest mb-2">{t.tools.bmiCalculator.result}</span>
               <span className="text-6xl font-black text-neu-text mb-4">{bmi}</span>
               <span className={`text-xl font-bold ${category?.color}`}>{category?.text}</span>
             </>
           ) : (
             <span className="text-neu-text/40 font-bold">Enter your details</span>
           )}
        </NeuCard>
      </div>
    </div>
  );
};