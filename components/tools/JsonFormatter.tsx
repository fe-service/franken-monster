
import React, { useState } from 'react';
import { AlignLeft, Minimize2, AlertCircle } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { CodeEditor } from '../ui/CodeEditor';
import { useAppStore } from '../../utils/store';

export const JsonFormatter: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(t.tools.jsonFormatter.invalid);
    }
  };

  const minify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError(t.tools.jsonFormatter.invalid);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.jsonFormatter.title}</h2>
        <p className="text-neu-text/60">{t.tools.jsonFormatter.subtitle}</p>
      </div>

      <NeuCard className="space-y-4">
        <div className="flex justify-between items-center mb-2">
            <div className="pl-4">
                {error && (
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>
            <div className="flex gap-4">
                <NeuButton onClick={format} className="!px-4 !py-2 text-sm">
                    <AlignLeft size={16} /> {t.tools.jsonFormatter.prettify}
                </NeuButton>
                <NeuButton onClick={minify} className="!px-4 !py-2 text-sm">
                    <Minimize2 size={16} /> {t.tools.jsonFormatter.minify}
                </NeuButton>
            </div>
        </div>
        
        <CodeEditor 
            value={input}
            language="json"
            onChange={(val) => {
                setInput(val || '');
                if (error) setError('');
            }}
            height="600px"
        />
      </NeuCard>
    </div>
  );
};
