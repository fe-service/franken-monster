
import React, { useState } from 'react';
import { Code, Copy, Check, ChevronDown } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { CodeEditor } from '../ui/CodeEditor';
import { useAppStore } from '../../utils/store';

export const CodeFormatter: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('auto');
  const [detectedLang, setDetectedLang] = useState('plaintext');
  const [copied, setCopied] = useState(false);

  const LANGUAGES = [
      { value: 'auto', label: t.common.autoDetect },
      { value: 'json', label: 'JSON' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'javascript', label: 'JavaScript' },
      { value: 'java', label: 'Java' },
      { value: 'rust', label: 'Rust' },
      { value: 'python', label: 'Python' },
      { value: 'go', label: 'Go' },
      { value: 'yaml', label: 'YAML' },
      { value: 'xml', label: 'XML' }
  ];

  // Improved Basic Formatter
  const basicFormat = (code: string, lang: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return '';

    // JSON
    if (lang === 'json') {
        try {
            return JSON.stringify(JSON.parse(cleanCode), null, 2);
        } catch (e) { return cleanCode; } // Fallback
    }

    // HTML / XML
    if (lang === 'html' || lang === 'xml') {
        const xml = cleanCode.replace(/>\s*</g, '>\n<');
        let pad = 0;
        return xml.split('\n').map(line => {
            let indent = 0;
            if (line.match(/^<\//)) {
                pad = Math.max(0, pad - 1);
            }
            indent = pad;
            // Increase indent for opening tags that are not self-closing or void
            if (line.match(/^<[a-zA-Z][^>]*>$/) && !line.match(/^<(img|br|hr|input|meta|link|!doctype)/i) && !line.match(/\/>$/)) {
                pad += 1;
            }
            return '  '.repeat(indent) + line;
        }).join('\n');
    }

    // C-Style (JS, Java, Rust, Go, CSS)
    if (['javascript', 'java', 'rust', 'go', 'css'].includes(lang)) {
        let indent = 0;
        return cleanCode
            .replace(/([{}])/g, '$1\n') // Break braces
            .replace(/;/g, ';\n')       // Break semicolons
            .split('\n')
            .map(l => l.trim())
            .filter(l => l)
            .map(line => {
                if (line.match(/^}/)) indent = Math.max(0, indent - 1);
                const str = '  '.repeat(indent) + line;
                if (line.match(/{$/)) indent++;
                return str;
            })
            .join('\n')
            .replace(/\n\s*\n/g, '\n'); // Remove extra newlines
    }

    // Python / YAML (Whitespace sensitive - risky to auto format)
    // Just trim lines
    return cleanCode.split('\n').map(l => l.trimEnd()).join('\n');
  };

  const detectLanguage = (code: string): string => {
    const c = code.trim();
    if (c.startsWith('{') || c.startsWith('[')) return 'json';
    if (c.startsWith('<')) return 'html';
    if (c.includes('function') || c.includes('const ') || c.includes('let ')) return 'javascript';
    if (c.includes('public class') || c.includes('System.out')) return 'java';
    if (c.includes('fn main') || c.includes('let mut')) return 'rust';
    if (c.includes('def ') || c.includes('import ')) return 'python';
    if (c.includes('package main') || c.includes('func ')) return 'go';
    if (c.includes('{') && c.includes(':')) return 'css'; // weak check
    return 'plaintext';
  };

  const handleFormat = () => {
      let targetLang = language;
      if (targetLang === 'auto') {
          targetLang = detectLanguage(input);
          setDetectedLang(targetLang);
      } else {
          setDetectedLang(targetLang);
      }
      setInput(basicFormat(input, targetLang));
  };

  const copyToClipboard = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.codeFormatter.title}</h2>
        <p className="text-neu-text/60">{t.tools.codeFormatter.subtitle}</p>
      </div>

      <NeuCard className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
            <div className="relative w-full md:w-64">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none bg-neu-base text-neu-text px-6 py-3 rounded-full shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neu-text/60">
                    <ChevronDown size={16} />
                </div>
            </div>

            <div className="flex gap-4">
                <NeuButton onClick={handleFormat} className="!px-6 !py-2 text-sm">
                    <Code size={16} /> {t.tools.codeFormatter.format} 
                    {language === 'auto' && detectedLang !== 'plaintext' && <span className="opacity-50 text-xs ml-1">({detectedLang})</span>}
                </NeuButton>
                 <NeuButton onClick={copyToClipboard} active={copied} className="!px-6 !py-2 text-sm">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </NeuButton>
            </div>
        </div>
        
        <CodeEditor 
           value={input}
           language={language === 'auto' ? (detectedLang === 'plaintext' ? 'javascript' : detectedLang) : language}
           onChange={(val) => setInput(val || '')}
           height="600px"
        />
      </NeuCard>
    </div>
  );
};
