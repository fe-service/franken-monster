
import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

// Helper: Hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

// Helper: RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

export const GradientGenerator: React.FC = () => {
  const { t } = useAppStore();
  const [startColor, setStartColor] = useState('#6d5dfc');
  const [middleColor, setMiddleColor] = useState('#ffffff');
  const [endColor, setEndColor] = useState('#292d3e');
  const [useMiddle, setUseMiddle] = useState(false);
  const [steps, setSteps] = useState(5);
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const interpolate = (color1: number[], color2: number[], factor: number) => {
      const result = color1.slice();
      for (let i = 0; i < 3; i++) {
          result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
      }
      return result;
  };

  const generate = () => {
    const s = hexToRgb(startColor);
    const e = hexToRgb(endColor);
    const m = hexToRgb(middleColor);
    const result: string[] = [];

    if (!useMiddle) {
        for (let i = 0; i < steps; i++) {
            const factor = i / (steps - 1);
            const rgb = interpolate(s, e, factor);
            result.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
        }
    } else {
        const half = Math.floor(steps / 2);
        const remainder = steps - half;
        // First half: Start -> Middle
        for (let i = 0; i < half; i++) {
             const factor = i / (half); // Reach middle at last step of first half?
             // To match smoothly:
             // 0 -> ... -> Middle
             // Let's do: Start -> Middle (inclusive)
             const f = i / (half); 
             const rgb = interpolate(s, m, f);
             result.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
        }
        // Second half: Middle -> End
        for (let i = 1; i <= remainder; i++) {
            const f = i / remainder;
            const rgb = interpolate(m, e, f);
            result.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
        }
    }

    setPalette(result);
  };

  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startColor, middleColor, endColor, useMiddle, steps]);

  const copy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.gradientGenerator.title}</h2>
        <p className="text-neu-text/60">{t.tools.gradientGenerator.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neu-text/60 ml-2">{t.tools.gradientGenerator.start}</label>
              <div className="flex items-center gap-2 bg-neu-base p-2 rounded-xl shadow-neu-pressed">
                  <input type="color" value={startColor} onChange={e => setStartColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                  <input type="text" value={startColor} onChange={e => setStartColor(e.target.value)} className="bg-transparent font-bold text-neu-text w-full outline-none uppercase" maxLength={7} />
              </div>
          </div>
          
          <div className="space-y-2">
               <div className="flex justify-between items-center px-2">
                 <label className={`text-xs font-bold uppercase ${useMiddle ? 'text-neu-text/60' : 'text-neu-text/20'}`}>{t.tools.gradientGenerator.middle}</label>
                 <input type="checkbox" checked={useMiddle} onChange={e => setUseMiddle(e.target.checked)} className="accent-neu-accent w-4 h-4" />
               </div>
              <div className={`flex items-center gap-2 bg-neu-base p-2 rounded-xl transition-all ${useMiddle ? 'shadow-neu-pressed opacity-100' : 'shadow-neu-flat opacity-50 pointer-events-none'}`}>
                  <input type="color" value={middleColor} onChange={e => setMiddleColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                  <input type="text" value={middleColor} onChange={e => setMiddleColor(e.target.value)} className="bg-transparent font-bold text-neu-text w-full outline-none uppercase" maxLength={7} />
              </div>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neu-text/60 ml-2">{t.tools.gradientGenerator.end}</label>
              <div className="flex items-center gap-2 bg-neu-base p-2 rounded-xl shadow-neu-pressed">
                  <input type="color" value={endColor} onChange={e => setEndColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                  <input type="text" value={endColor} onChange={e => setEndColor(e.target.value)} className="bg-transparent font-bold text-neu-text w-full outline-none uppercase" maxLength={7} />
              </div>
          </div>
      </div>

      <NeuCard>
          <div className="mb-6 flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-neu-text/60 ml-2">{t.tools.gradientGenerator.steps}: {steps}</label>
              <input 
                type="range" min="3" max="20" value={steps} onChange={e => setSteps(Number(e.target.value))} 
                className="w-full h-4 bg-transparent rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:bg-neu-base [&::-webkit-slider-runnable-track]:shadow-neu-pressed [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-neu-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-1"
              />
          </div>
          
          <div className="flex flex-col md:flex-row h-auto md:h-32 rounded-2xl overflow-hidden shadow-neu-flat">
              {palette.map((color, i) => (
                  <div 
                    key={i} 
                    className="flex-1 h-16 md:h-full group relative cursor-pointer hover:flex-[1.5] transition-all duration-300"
                    style={{ backgroundColor: color }}
                    onClick={() => copy(color)}
                  >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-mono font-bold text-xs md:text-sm flex-col">
                          <span>{color}</span>
                          {copiedValue === color && <Check size={16} className="mt-1" />}
                      </div>
                  </div>
              ))}
          </div>
      </NeuCard>
    </div>
  );
};
