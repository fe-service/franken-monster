
import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

export const CodeFormatter: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Very basic indenter used as a fallback for a full formatter library
  const basicFormat = (code: string) => {
    let pad = 0;
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        let indent = 0;
        if (line.match(/<\//) || line.match(/^}/) || line.match(/^]/)) {
           pad -= 1;
        }
        indent = pad;
        if (line.match(/<[^/].*>/) && !line.match(/<\//) && !line.match(/\/>/)) {
            pad += 1;
        } else if (line.match(/{$/) || line.match(/\[$/)) {
            pad += 1;
        }
        return '  '.repeat(Math.max(0, indent)) + line;
      })
      .join('\n');
  };

  const format = () => {
      // Try JSON first
      try {
          const json = JSON.parse(input);
          setInput(JSON.stringify(json, null, 2));
          return;
      } catch (e) {
          // Not JSON, try basic logic
      }
      setInput(basicFormat(input));
  };

  const copyToClipboard = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.codeFormatter.title}</h2>
        <p className="text-neu-text/60">{t.tools.codeFormatter.subtitle}</p>
      </div>

      <NeuCard className="space-y-4">
        <div className="flex justify-end gap-2 mb-2">
            <NeuButton onClick={format} className="!px-4 !py-2 text-sm">
                <Code size={16} /> {t.tools.codeFormatter.format}
            </NeuButton>
             <NeuButton onClick={copyToClipboard} active={copied} className="!px-4 !py-2 text-sm">
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </NeuButton>
        </div>
        
        <NeuTextArea 
           value={input}
           onChange={(e) => setInput(e.target.value)}
           placeholder="Paste HTML, JSON, or code here..."
           rows={20}
           className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre"
        />
      </NeuCard>
    </div>
  );
};
