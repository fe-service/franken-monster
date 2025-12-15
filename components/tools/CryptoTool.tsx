import React, { useState } from 'react';
import { ArrowDown, Copy, Check } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

type CryptoMode = 'ENCODE' | 'DECODE' | 'SHA256';

export const CryptoTool: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<CryptoMode>('ENCODE');
  const [copied, setCopied] = useState(false);

  const process = async () => {
    if (!input) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'ENCODE') {
        setOutput(btoa(input));
      } else if (mode === 'DECODE') {
        setOutput(atob(input));
      } else if (mode === 'SHA256') {
        const msgBuffer = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setOutput(hashHex);
      }
    } catch (e) {
      setOutput('Error: Invalid Input');
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto process when input or mode changes, handled via Effect would be better but simple function call works for buttons
  React.useEffect(() => {
    process();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.cryptoTool.title}</h2>
        <p className="text-neu-text/60">{t.tools.cryptoTool.subtitle}</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex gap-2">
           <button
             onClick={() => setMode('ENCODE')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'ENCODE' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
           >
             {t.tools.cryptoTool.encode}
           </button>
           <button
             onClick={() => setMode('DECODE')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'DECODE' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
           >
             {t.tools.cryptoTool.decode}
           </button>
           <button
             onClick={() => setMode('SHA256')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'SHA256' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
           >
             {t.tools.cryptoTool.sha256}
           </button>
        </div>
      </div>

      <NeuCard className="space-y-6">
         <NeuTextArea 
           label={t.tools.cryptoTool.input}
           value={input}
           onChange={(e) => setInput(e.target.value)}
           rows={4}
         />
         
         <div className="flex justify-center text-neu-accent/50">
            <ArrowDown size={24} />
         </div>

         <div className="relative">
            <NeuTextArea 
                label={t.tools.cryptoTool.output}
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