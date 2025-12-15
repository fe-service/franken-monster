import React, { useState, useMemo } from 'react';
import { AlignLeft, FileText, Type } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

export const TextAnalyzer: React.FC = () => {
  const { t } = useAppStore();
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    if (!text) return { words: 0, chars: 0, sentences: 0, paragraphs: 0 };
    return {
      words: text.trim().split(/\s+/).filter(w => w.length > 0).length,
      chars: text.length,
      sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      paragraphs: text.split(/\n+/).filter(p => p.trim().length > 0).length
    };
  }, [text]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.textAnalyzer.title}</h2>
        <p className="text-neu-text/60">{t.tools.textAnalyzer.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neu-base p-6 rounded-[20px] shadow-neu-flat flex flex-col items-center justify-center gap-2">
          <span className="text-3xl font-black text-neu-accent">{stats.words}</span>
          <span className="text-xs uppercase font-bold text-neu-text/60">{t.tools.textAnalyzer.words}</span>
        </div>
        <div className="bg-neu-base p-6 rounded-[20px] shadow-neu-flat flex flex-col items-center justify-center gap-2">
          <span className="text-3xl font-black text-neu-accent">{stats.chars}</span>
          <span className="text-xs uppercase font-bold text-neu-text/60">{t.tools.textAnalyzer.chars}</span>
        </div>
        <div className="bg-neu-base p-6 rounded-[20px] shadow-neu-flat flex flex-col items-center justify-center gap-2">
          <span className="text-3xl font-black text-neu-accent">{stats.sentences}</span>
          <span className="text-xs uppercase font-bold text-neu-text/60">{t.tools.textAnalyzer.sentences}</span>
        </div>
        <div className="bg-neu-base p-6 rounded-[20px] shadow-neu-flat flex flex-col items-center justify-center gap-2">
          <span className="text-3xl font-black text-neu-accent">{stats.paragraphs}</span>
          <span className="text-xs uppercase font-bold text-neu-text/60">{t.tools.textAnalyzer.paragraphs}</span>
        </div>
      </div>

      <NeuCard>
        <NeuTextArea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.tools.textAnalyzer.placeholder}
          rows={12}
          className="font-mono text-sm leading-relaxed"
        />
      </NeuCard>
    </div>
  );
};