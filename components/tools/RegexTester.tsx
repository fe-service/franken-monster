
import React, { useState, useMemo } from 'react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput, NeuTextArea } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

export const RegexTester: React.FC = () => {
  const { t } = useAppStore();
  const [pattern, setPattern] = useState('[a-zA-Z]+');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Hello World 123');

  const matches = useMemo(() => {
    try {
      if (!pattern) return [];
      const regex = new RegExp(pattern, flags);
      const results = [];
      let match;
      
      if (!flags.includes('g')) {
         match = text.match(regex);
         if (match) results.push(match[0]);
      } else {
         const found = text.match(regex);
         if (found) return found;
      }
      return results;
    } catch (e) {
      return null; // Invalid regex
    }
  }, [pattern, flags, text]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.regexTester.title}</h2>
        <p className="text-neu-text/60">{t.tools.regexTester.subtitle}</p>
      </div>

      <NeuCard className="space-y-6">
         <div className="flex gap-4">
             <div className="flex-1">
                <NeuInput 
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    label={t.tools.regexTester.pattern}
                    className="font-mono text-sm"
                />
             </div>
             <div className="w-24">
                <NeuInput 
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    label={t.tools.regexTester.flags}
                    className="font-mono text-sm"
                />
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
                            <span key={i} className="px-3 py-1 bg-neu-accent/10 text-neu-accent rounded-full text-sm font-mono font-bold">
                                {m}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-neu-text/40">{t.tools.regexTester.noMatch}</span>
                )}
            </div>
         </div>
      </NeuCard>
    </div>
  );
};
