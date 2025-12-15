import React, { useState } from 'react';
import { AlignLeft, Minimize2, AlertCircle } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

export const JsonFormatter: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(t.tools.jsonFormatter.invalid);
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError(t.tools.jsonFormatter.invalid);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.jsonFormatter.title}</h2>
        <p className="text-neu-text/60">{t.tools.jsonFormatter.subtitle}</p>
      </div>

      <NeuCard className="space-y-4">
        <div className="flex justify-end gap-4 mb-2">
            <NeuButton onClick={format} className="!px-4 !py-2 text-sm">
                <AlignLeft size={16} /> {t.tools.jsonFormatter.prettify}
            </NeuButton>
            <NeuButton onClick={minify} className="!px-4 !py-2 text-sm">
                <Minimize2 size={16} /> {t.tools.jsonFormatter.minify}
            </NeuButton>
        </div>
        
        <NeuTextArea 
           value={input}
           onChange={(e) => {
               setInput(e.target.value);
               setError('');
           }}
           placeholder='{"key": "value"}'
           rows={16}
           className={`font-mono text-sm leading-relaxed ${error ? 'ring-2 ring-red-500/50' : ''}`}
        />

        {error && (
            <div className="flex items-center gap-2 text-red-500 font-bold px-4">
                <AlertCircle size={16} /> {error}
            </div>
        )}
      </NeuCard>
    </div>
  );
};