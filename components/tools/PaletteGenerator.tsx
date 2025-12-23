
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

interface PaletteItem {
  role: string;
  hex: string;
}

export const PaletteGenerator: React.FC = () => {
  const { t } = useAppStore();
  const [baseHue, setBaseHue] = useState(210);
  const [quantity, setQuantity] = useState(5);
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const generate = () => {
    const newPalette: PaletteItem[] = [];
    const roles = t.tools.paletteGenerator.roles;

    // 1. Primary (Base)
    newPalette.push({ role: roles.primary, hex: hslToHex(baseHue, 70, 50) });

    if (quantity >= 2) {
      // 2. Secondary (Complementary)
      newPalette.push({ role: roles.secondary, hex: hslToHex((baseHue + 180) % 360, 65, 55) });
    }
    if (quantity >= 3) {
       // 3. Neutral / Surface (Very Light)
       newPalette.push({ role: roles.neutral, hex: hslToHex(baseHue, 10, 96) });
    }
    if (quantity >= 4) {
       // 4. Accent (Analogous)
       newPalette.push({ role: roles.accent, hex: hslToHex((baseHue + 30) % 360, 80, 60) });
    }
    if (quantity >= 5) {
       // 5. Dark (Text)
       newPalette.push({ role: roles.dark, hex: hslToHex(baseHue, 20, 20) });
    }
    if (quantity >= 6) {
       // 6. Tertiary (Split Comp 1)
       newPalette.push({ role: roles.tertiary, hex: hslToHex((baseHue + 210) % 360, 60, 50) });
    }
    if (quantity >= 7) {
       // 7. Light (Pale version of Primary)
       newPalette.push({ role: roles.light, hex: hslToHex(baseHue, 80, 90) });
    }
    if (quantity >= 8) {
       // 8. Info (Blue-ish shift usually, or just another accent)
       newPalette.push({ role: roles.info, hex: hslToHex((baseHue + 150) % 360, 60, 55) });
    }
    if (quantity >= 9) {
       // 9. Warning (Shift towards orange/yellow relative to base, or fixed)
       // Let's make it relative logic: +60deg is usually a good shift
       newPalette.push({ role: roles.warning, hex: hslToHex((baseHue + 60) % 360, 80, 60) });
    }
    if (quantity >= 10) {
       // 10. Success (Shift towards green)
       // Let's make it relative: +120deg
       newPalette.push({ role: roles.success, hex: hslToHex((baseHue + 120) % 360, 70, 50) });
    }

    setPalette(newPalette);
  };

  const randomize = () => {
      setBaseHue(Math.floor(Math.random() * 360));
  };

  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseHue, quantity, t]); // Add t to deps for lang switch

  const copy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 1500);
  };

  const ColorRow: React.FC<{ item: PaletteItem }> = ({ item }) => {
    const { hex, role } = item;
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    
    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const hexUpper = hex.toUpperCase();

    const CodeButton = ({ value, label }: { value: string, label: string }) => (
      <button 
        onClick={() => copy(value)}
        className="flex items-center justify-between gap-2 px-3 py-2 bg-neu-base rounded-lg border border-neu-text/5 hover:bg-neu-text/5 active:scale-95 transition-all text-xs font-mono group w-full"
      >
        <span className="text-neu-text/50 font-bold">{label}</span>
        <span className="text-neu-text font-bold truncate select-all">{value}</span>
        <div className="w-4 h-4 flex items-center justify-center text-neu-accent opacity-0 group-hover:opacity-100 transition-opacity">
           {copiedValue === value ? <Check size={12} /> : <Copy size={12} />}
        </div>
      </button>
    );

    return (
      <div className="bg-neu-base rounded-[12px] shadow-neu-flat p-4 flex flex-col sm:flex-row gap-6 items-center border border-neu-text/5">
        {/* Color Block: Removed concave/pressed effect, now using simple rounded look or convex */}
        <div 
          className="w-full sm:w-24 h-24 rounded-lg shadow-sm border border-black/5"
          style={{ backgroundColor: hex }}
        />
        
        <div className="flex-1 w-full flex flex-col gap-2">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-8 rounded-full" style={{backgroundColor: hex}}></div>
             <h4 className="font-black text-neu-text text-lg uppercase tracking-tight">{role}</h4>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
              <CodeButton label="HEX" value={hexUpper} />
              <CodeButton label="RGB" value={rgbString} />
              <CodeButton label="HSL" value={hslString} />
           </div>
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

      <NeuCard className="mb-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
             <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold uppercase text-neu-text/60 ml-2">{t.tools.paletteGenerator.base}</label>
                 <div className="flex items-center gap-4">
                    <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={baseHue} 
                    onChange={(e) => setBaseHue(Number(e.target.value))}
                    className="w-full h-4 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full appearance-none cursor-pointer"
                    />
                    <div 
                        className="w-10 h-10 rounded-full shadow-neu-flat border-2 border-neu-base"
                        style={{ backgroundColor: `hsl(${baseHue}, 70%, 50%)` }}
                    />
                 </div>
             </div>

             <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center px-2">
                    <label className="text-sm font-bold uppercase text-neu-text/60">{t.tools.paletteGenerator.quantity}</label>
                    <span className="font-black text-neu-accent">{quantity}</span>
                 </div>
                 <input 
                    type="range" 
                    min="3" 
                    max="10" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-4 bg-transparent rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:bg-neu-base [&::-webkit-slider-runnable-track]:shadow-neu-pressed [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-neu-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-1"
                 />
             </div>
         </div>
         
         <div className="mt-8 flex justify-center">
             <NeuButton onClick={randomize}>
                <RefreshCw size={20} /> {t.tools.paletteGenerator.generate}
             </NeuButton>
         </div>
      </NeuCard>

      <div className="flex flex-col gap-4">
          {palette.map((item, i) => (
              <ColorRow key={`${item.hex}-${i}`} item={item} />
          ))}
      </div>

    </div>
  );
};
