
import React, { useState, useMemo } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput, NeuTextArea } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';
import { NeuButton } from '../ui/NeuButton';

export const RegexTester: React.FC = () => {
  const { t } = useAppStore();
  const [pattern, setPattern] = useState('[a-zA-Z]+');
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [text, setText] = useState('Hello World 123');
  const [copiedPattern, setCopiedPattern] = useState(false);

  const flagString = useMemo(() => {
      let str = '';
      if (flags.g) str += 'g';
      if (flags.i) str += 'i';
      if (flags.m) str += 'm';
      return str;
  }, [flags]);

  const matches = useMemo(() => {
    try {
      if (!pattern) return [];
      const regex = new RegExp(pattern, flagString);
      const results = [];
      let match;
      
      // If Global flag is not set, match() returns an array with index/input if found, or null
      // If Global flag IS set, match() returns array of strings, or null
      
      if (!flags.g) {
         match = text.match(regex);
         if (match) results.push(match[0]);
      } else {
         const found = text.match(regex);
         if (found) return Array.from(found);
      }
      return results;
    } catch (e) {
      return null; // Invalid regex
    }
  }, [pattern, flagString, text, flags.g]);

  const PRESETS = [
      { key: 'alpha', value: '[a-zA-Z]+' },
      { key: 'chinese', value: '[\\u4e00-\\u9fa5]+' },
      { key: 'username', value: '^[a-zA-Z0-9_-]{4,16}$' },
      { key: 'password', value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$' },
      { key: 'email', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
      { key: 'phone', value: '^1[3-9]\\d{9}$' },
      { key: 'landline', value: '^(\\d{3,4}-)?\\d{7,8}$' },
      { key: 'zip', value: '^[1-9]\\d{5}$' },
      { key: 'idCard', value: '(^\\d{15}$)|(^\\d{18}$)|(^\\d{17}(\\d|X|x)$)' },
      { key: 'ipv4', value: '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$' },
      { key: 'url', value: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$' },
      { key: 'number', value: '^-?\\d+$' },
      { key: 'decimal', value: '^-?\\d*\\.\\d+$' },
  ];

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val) {
          setPattern(val);
      }
  };

  const copyPattern = () => {
      if (!pattern) return;
      navigator.clipboard.writeText(pattern);
      setCopiedPattern(true);
      setTimeout(() => setCopiedPattern(false), 2000);
  };

  const toggleFlag = (flag: 'g' | 'i' | 'm') => {
      setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.regexTester.title}</h2>
        <p className="text-neu-text/60">{t.tools.regexTester.subtitle}</p>
      </div>

      <NeuCard className="space-y-6">
         {/* Presets Dropdown */}
         <div className="relative">
             <select 
               onChange={handlePresetChange}
               className="w-full appearance-none bg-neu-base text-neu-text px-6 py-3 rounded-full shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer"
               defaultValue=""
             >
                 <option value="" disabled>{t.tools.regexTester.selectPreset}</option>
                 {PRESETS.map(p => (
                     // @ts-ignore
                     <option key={p.key} value={p.value}>{t.tools.regexTester.presets[p.key]}</option>
                 ))}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neu-text/60">
                <ChevronDown size={16} />
             </div>
         </div>

         <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full relative">
                <NeuInput 
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    label={t.tools.regexTester.pattern}
                    className="font-mono text-sm pr-12"
                />
                <div className="absolute right-2 bottom-1.5 z-10">
                     <NeuButton 
                        onClick={copyPattern} 
                        active={copiedPattern}
                        className="!p-2 !h-8 !w-8 flex items-center justify-center rounded-full"
                        title={t.tools.passwordGen.copy}
                     >
                         {copiedPattern ? <Check size={14} /> : <Copy size={14} />}
                     </NeuButton>
                </div>
             </div>
             
             {/* Flags Toggles */}
             <div className="flex flex-col gap-2 shrink-0">
                 <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-2">{t.tools.regexTester.flags}</label>
                 <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex h-[50px] items-center">
                    <button 
                        onClick={() => toggleFlag('g')} 
                        className={`w-12 h-full rounded-full text-xs font-bold transition-all ${flags.g ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/40 hover:text-neu-text'}`}
                        title="Global"
                    >
                        g
                    </button>
                    <button 
                        onClick={() => toggleFlag('i')} 
                        className={`w-12 h-full rounded-full text-xs font-bold transition-all ${flags.i ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/40 hover:text-neu-text'}`}
                        title="Case Insensitive"
                    >
                        i
                    </button>
                    <button 
                        onClick={() => toggleFlag('m')} 
                        className={`w-12 h-full rounded-full text-xs font-bold transition-all ${flags.m ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/40 hover:text-neu-text'}`}
                        title="Multiline"
                    >
                        m
                    </button>
                 </div>
             </div>
         </div>

         <NeuTextArea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            label={t.tools.regexTester.testString}
            rows={4}
         />

         <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{t.tools.regexTester.matches}</label>
            <div className="bg-neu-base rounded-[20px] shadow-neu-pressed p-6 min-h-[100px] max-h-[200px] overflow-y-auto">
                {matches === null ? (
                    <span className="text-red-500 font-bold">{t.tools.regexTester.invalidRegex}</span>
                ) : matches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {matches.map((m, i) => (
                            <span key={i} className="px-3 py-1 bg-neu-accent/10 text-neu-accent rounded-full text-sm font-mono font-bold border border-neu-accent/20">
                                {m}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-neu-text/40 font-bold italic">{t.tools.regexTester.noMatch}</span>
                )}
            </div>
         </div>
      </NeuCard>
    </div>
  );
};
