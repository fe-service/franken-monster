import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

// Helper: HSL to Hex
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Helper: Hex to RGB Object
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Helper: Hex to HSL Object
const hexToHsl = (hex: string) => {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const PaletteGenerator: React.FC = () => {
  const { t } = useAppStore();
  const [baseHue, setBaseHue] = useState(210);
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const generate = () => {
    // Generate Analogous + Complementary palette
    const colors = [
      hslToHex(baseHue, 70, 50),
      hslToHex((baseHue + 30) % 360, 70, 60),
      hslToHex((baseHue + 60) % 360, 60, 70),
      hslToHex((baseHue + 180) % 360, 70, 60), // Complementary
      hslToHex((baseHue + 210) % 360, 60, 50),
    ];
    setPalette(colors);
  };

  const randomize = () => {
      setBaseHue(Math.floor(Math.random() * 360));
  };

  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseHue]);

  const copy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 1500);
  };

  const ColorRow = ({ hex }: { hex: string }) => {
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    
    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const hexUpper = hex.toUpperCase();

    const CodeButton = ({ value, label }: { value: string, label: string }) => (
      <button 
        onClick={() => copy(value)}
        className="flex items-center justify-between gap-2 px-3 py-2 bg-neu-base rounded-lg shadow-neu-flat hover:shadow-neu-pressed hover:scale-[0.98] active:scale-95 transition-all text-xs font-mono group w-full"
      >
        <span className="text-neu-text/50 font-bold">{label}</span>
        <span className="text-neu-text font-bold truncate">{value}</span>
        <div className="w-4 h-4 flex items-center justify-center text-neu-accent opacity-0 group-hover:opacity-100 transition-opacity">
           {copiedValue === value ? <Check size={12} /> : <Copy size={12} />}
        </div>
      </button>
    );

    return (
      <div className="bg-neu-base rounded-[24px] shadow-neu-flat p-4 flex flex-col md:flex-row gap-6 items-center">
        <div 
          className="w-full md:w-32 h-24 rounded-2xl shadow-neu-pressed"
          style={{ backgroundColor: hex }}
        />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
           <CodeButton label="HEX" value={hexUpper} />
           <CodeButton label="RGB" value={rgbString} />
           <CodeButton label="HSL" value={hslString} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.paletteGenerator.title}</h2>
        <p className="text-neu-text/60">{t.tools.paletteGenerator.subtitle}</p>
      </div>

      <div className="flex justify-center mb-8">
          <NeuButton onClick={randomize}>
              <RefreshCw size={20} /> {t.tools.paletteGenerator.generate}
          </NeuButton>
      </div>

      <div className="flex flex-col gap-4">
          {palette.map((hex, i) => (
              <ColorRow key={`${hex}-${i}`} hex={hex} />
          ))}
      </div>

      <NeuCard className="mt-8">
         <div className="flex flex-col gap-4">
             <label className="text-sm font-bold uppercase text-neu-text/60">{t.tools.paletteGenerator.base}</label>
             <input 
               type="range" 
               min="0" 
               max="360" 
               value={baseHue} 
               onChange={(e) => setBaseHue(Number(e.target.value))}
               className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
             />
         </div>
      </NeuCard>
    </div>
  );
};