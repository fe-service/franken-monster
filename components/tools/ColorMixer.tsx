
import React, { useState } from 'react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

// Types
type RGBA = { r: number, g: number, b: number, a: number };

// --- Conversion Helpers ---

// HEX <-> RGBA
const hexToRgba = (hex: string): RGBA | null => {
    hex = hex.trim();
    if (hex.startsWith('#')) hex = hex.slice(1);
    
    let r = 0, g = 0, b = 0, a = 1;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
        return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
    return { r, g, b, a };
};

const rgbaToHex = ({ r, g, b, a }: RGBA): string => {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a < 1) {
        return hex + toHex(Math.round(a * 255));
    }
    return hex;
};

// RGB String <-> RGBA
// Supports: "r,g,b", "r, g, b", "rgb(r,g,b)", "rgba(r,g,b,a)"
const parseRgbString = (str: string): RGBA | null => {
    const match = str.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)?/i);
    if (match) {
        return {
            r: Math.min(255, parseInt(match[1])),
            g: Math.min(255, parseInt(match[2])),
            b: Math.min(255, parseInt(match[3])),
            a: match[4] ? Math.min(1, parseFloat(match[4])) : 1
        };
    }
    return null;
};

const rgbaToString = ({ r, g, b, a }: RGBA): string => {
    r = Math.round(r); g = Math.round(g); b = Math.round(b);
    if (a < 1) {
        // Round alpha to 2 decimals
        return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(2))})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
};

// HSL String <-> RGBA
// Helper: HSL -> RGB
const hslToRgbHelper = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4))
    };
};

const rgbToHslHelper = ({ r, g, b }: RGBA) => {
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

const parseHslString = (str: string): RGBA | null => {
    const match = str.match(/hsla?\(?\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)?/i);
    if (match) {
        const h = parseInt(match[1]);
        const s = parseInt(match[2]);
        const l = parseInt(match[3]);
        const a = match[4] ? Math.min(1, parseFloat(match[4])) : 1;
        const { r, g, b } = hslToRgbHelper(h, s, l);
        return { r, g, b, a };
    }
    return null;
};

const rgbaToHslString = (rgba: RGBA): string => {
    const { h, s, l } = rgbToHslHelper(rgba);
    if (rgba.a < 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${parseFloat(rgba.a.toFixed(2))})`;
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
};


export const ColorMixer: React.FC = () => {
    const { t } = useAppStore();
    
    // Internal Master State
    const [color, setColor] = useState<RGBA>({ r: 109, g: 93, b: 252, a: 1 });
    
    // UI Input States
    const [hexInput, setHexInput] = useState<string>('#6d5dfc');
    const [rgbInput, setRgbInput] = useState<string>('rgb(109, 93, 252)');
    const [hslInput, setHslInput] = useState<string>('hsl(246, 96%, 68%)');

    // Update all inputs from master color
    const syncInputs = (c: RGBA) => {
        setHexInput(rgbaToHex(c));
        setRgbInput(rgbaToString(c));
        setHslInput(rgbaToHslString(c));
    };

    // Slider Handler
    const handleSliderChange = (key: keyof RGBA, val: string) => {
        let v = parseFloat(val);
        if (key === 'a') v = Math.min(1, Math.max(0, v));
        else v = Math.min(255, Math.max(0, Math.round(v)));
        
        const newColor = { ...color, [key]: v };
        setColor(newColor);
        syncInputs(newColor);
    };

    // Input Handlers
    const handleHexChange = (val: string) => {
        setHexInput(val);
        const c = hexToRgba(val);
        if (c) {
            setColor(c);
            // Don't sync self to avoid typing interruption
            setRgbInput(rgbaToString(c));
            setHslInput(rgbaToHslString(c));
        }
    };

    const handleRgbChange = (val: string) => {
        setRgbInput(val);
        const c = parseRgbString(val);
        if (c) {
            setColor(c);
            setHexInput(rgbaToHex(c));
            setHslInput(rgbaToHslString(c));
        }
    };

    const handleHslChange = (val: string) => {
        setHslInput(val);
        const c = parseHslString(val);
        if (c) {
            setColor(c);
            setHexInput(rgbaToHex(c));
            setRgbInput(rgbaToString(c));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in px-4">
           {/* Title */}
           <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.colorMixer.title}</h2>
                <p className="text-neu-text/60">{t.tools.colorMixer.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Visualizer - Takes 2/5 width */}
                <div className="md:col-span-2">
                    <NeuCard className="flex flex-col items-center justify-center min-h-[300px] h-full relative overflow-hidden">
                        {/* Checkered background for Alpha transparency */}
                        <div className="absolute inset-0 z-0 opacity-20" style={{
                             backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                             backgroundSize: '20px 20px',
                             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}></div>

                        <div 
                            className="w-40 h-40 rounded-full shadow-neu-flat mb-6 border-4 border-neu-base transition-colors duration-100 relative z-10"
                            style={{ backgroundColor: `rgba(${color.r},${color.g},${color.b},${color.a})` }}
                        ></div>
                        <span className="font-mono text-xl font-bold text-neu-text z-10 bg-neu-base/80 px-4 py-1 rounded-full backdrop-blur-sm">
                            {hexInput.toUpperCase()}
                        </span>
                    </NeuCard>
                </div>

                {/* Inputs & Sliders - Takes 3/5 width (slightly larger) */}
                <div className="md:col-span-3 flex flex-col gap-6">
                    <NeuCard title={t.tools.colorMixer.converters}>
                        <div className="space-y-4">
                            <NeuInput 
                                label={t.tools.colorMixer.hex}
                                value={hexInput}
                                onChange={(e) => handleHexChange(e.target.value)}
                                placeholder="#RRGGBB(AA)"
                                className="font-mono"
                            />
                            <NeuInput 
                                label={t.tools.colorMixer.rgb}
                                value={rgbInput}
                                onChange={(e) => handleRgbChange(e.target.value)}
                                placeholder="rgb(r, g, b)"
                                className="font-mono"
                            />
                            <NeuInput 
                                label={t.tools.colorMixer.hsl}
                                value={hslInput}
                                onChange={(e) => handleHslChange(e.target.value)}
                                placeholder="hsl(h, s%, l%)"
                                className="font-mono"
                            />
                        </div>
                    </NeuCard>

                    <NeuCard title={t.tools.colorMixer.sliders}>
                         <div className="space-y-4">
                             {[
                                 { label: 'R', key: 'r', max: 255, color: 'text-red-400', val: color.r },
                                 { label: 'G', key: 'g', max: 255, color: 'text-green-500', val: color.g },
                                 { label: 'B', key: 'b', max: 255, color: 'text-blue-400', val: color.b },
                                 { label: 'A', key: 'a', max: 1, step: 0.01, color: 'text-gray-400', val: color.a }
                             ].map((slider) => (
                                 <div key={slider.label}>
                                     <div className="flex justify-between mb-1">
                                         <label className={`text-xs font-bold ${slider.color}`}>{slider.label}</label>
                                         <span className="text-xs font-bold text-neu-text">{typeof slider.val === 'number' && slider.key === 'a' ? slider.val.toFixed(2) : slider.val}</span>
                                     </div>
                                     <input 
                                         type="range"
                                         min="0"
                                         max={slider.max}
                                         step={slider.step || 1}
                                         value={slider.val}
                                         // @ts-ignore
                                         onChange={(e) => handleSliderChange(slider.key, e.target.value)}
                                         className={`w-full h-2 rounded-lg appearance-none bg-neu-base shadow-neu-pressed cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:bg-current ${slider.color}`}
                                     />
                                 </div>
                             ))}
                         </div>
                    </NeuCard>
                </div>
            </div>
        </div>
    );
};
