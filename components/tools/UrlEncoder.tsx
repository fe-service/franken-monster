
import React, { useState } from 'react';
import { ArrowDown, Copy, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

export const UrlEncoder: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  const [copied, setCopied] = useState(false);

  const process = () => {
    try {
      if (mode === 'ENCODE') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e) {
      setOutput('Error: Malformed URI');
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.urlEncoder.title}</h2>
        <p className="text-neu-text/60">{t.tools.urlEncoder.subtitle}</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex gap-2">
            <button
                 onClick={() => setMode('ENCODE')}
                 className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'ENCODE' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
               >
                 {t.tools.urlEncoder.encode}
            </button>
            <button
                 onClick={() => setMode('DECODE')}
                 className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'DECODE' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
               >
                 {t.tools.urlEncoder.decode}
            </button>
        </div>
      </div>

      <NeuCard className="space-y-6">
         <NeuTextArea 
           value={input}
           onChange={(e) => setInput(e.target.value)}
           rows={4}
           placeholder="https://example.com/search?q=hello world"
         />
         
         <div className="flex justify-center">
            <NeuButton onClick={process} className="w-full md:w-auto">
                <ArrowDown size={20} /> {mode === 'ENCODE' ? t.tools.urlEncoder.encode : t.tools.urlEncoder.decode}
            </NeuButton>
         </div>

         <div className="relative">
            <NeuTextArea 
                value={output}
                readOnly
                rows={4}
                className="font-mono text-sm bg-neu-base/50"
            />
            <div className="absolute right-4 bottom-4">
                <NeuButton onClick={copyToClipboard} active={copied} className="!px-3 !py-2 text-xs">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? t.tools.passwordGen.copied : t.tools.passwordGen.copy}
                </NeuButton>
            </div>
         </div>
      </NeuCard>
    </div>
  );
};
