import React, { useState, useEffect } from 'react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const ColorMixer: React.FC = () => {
  const { t } = useAppStore();
  const [hex, setHex] = useState('#6d5dfc');
  const [rgb, setRgb] = useState({ r: 109, g: 93, b: 252 });

  useEffect(() => {
    const newRgb = hexToRgb(hex);
    if (newRgb) {
      setRgb(newRgb);
    }
  }, [hex]);

  const handleRgbChange = (key: 'r' | 'g' | 'b', value: string) => {
    const val = Math.min(255, Math.max(0, Number(value) || 0));
    const newRgb = { ...rgb, [key]: val };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.colorMixer.title}</h2>
        <p className="text-neu-text/60">{t.tools.colorMixer.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NeuCard className="flex flex-col items-center justify-center min-h-[300px]">
          <div 
            className="w-40 h-40 rounded-full shadow-neu-flat mb-6 border-4 border-neu-base transition-colors duration-300"
            style={{ backgroundColor: hex }}
          ></div>
          <span className="font-mono text-xl font-bold text-neu-text">{hex.toUpperCase()}</span>
          <span className="font-mono text-sm text-neu-text/60 mt-1">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
        </NeuCard>

        <div className="flex flex-col gap-6">
          <NeuCard title={t.tools.colorMixer.hexInput}>
            <NeuInput 
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#000000"
              maxLength={7}
            />
          </NeuCard>

          <NeuCard title={t.tools.colorMixer.rgbSliders}>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-red-400">RED</label>
                    <span className="text-xs font-bold text-neu-text">{rgb.r}</span>
                  </div>
                  <input 
                    type="range" min="0" max="255" value={rgb.r} 
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                    className="w-full h-2 rounded-lg appearance-none bg-neu-base shadow-neu-pressed cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                  />
               </div>
               <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-green-400">GREEN</label>
                    <span className="text-xs font-bold text-neu-text">{rgb.g}</span>
                  </div>
                  <input 
                    type="range" min="0" max="255" value={rgb.g} 
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                    className="w-full h-2 rounded-lg appearance-none bg-neu-base shadow-neu-pressed cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                  />
               </div>
               <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-blue-400">BLUE</label>
                    <span className="text-xs font-bold text-neu-text">{rgb.b}</span>
                  </div>
                  <input 
                    type="range" min="0" max="255" value={rgb.b} 
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                    className="w-full h-2 rounded-lg appearance-none bg-neu-base shadow-neu-pressed cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                  />
               </div>
             </div>
          </NeuCard>
        </div>
      </div>
    </div>
  );
};