
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, RefreshCw, Check, ShieldCheck, ShieldAlert, Save, Pin, PinOff, Trash2, Tag } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

// Constants for character sets
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*' // Restricted symbols
};

// Keyboard rows for pattern checking (Lower case for normalization)
const KEYBOARD_ROWS = [
  '1234567890',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm'
];

// Ambiguous characters to exclude
const AMBIGUOUS_CHARS = 'il1Lo0O';

// Simple "Frontend Encryption" (Obfuscation) for LocalStorage
const encrypt = (text: string): string => {
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join(''));
};

const decrypt = (text: string): string => {
  try {
    return atob(text).split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join('');
  } catch (e) {
    return 'Error';
  }
};

interface HistoryItem {
  id: string;
  encryptedPassword: string;
  tag: string;
  timestamp: number;
  pinned: boolean;
}

export const PasswordGenerator: React.FC = () => {
  const { t, language } = useAppStore();
  
  // State
  const [length, setLength] = useState<number>(12);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Fixed Options (Always ON)
  const useUppercase = true;
  const useLowercase = true;
  const useNumbers = true;
  
  // Configurable Options
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [noSequential, setNoSequential] = useState(false);
  const [noKeyboard, setNoKeyboard] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('neubox_pwd_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  // Save History
  const updateHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('neubox_pwd_history', JSON.stringify(newHistory));
  };

  // CSPRNG Helper
  const getRandomInt = (max: number) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };

  const isKeyboardSequence = (char1: string, char2: string) => {
    const c1 = char1.toLowerCase();
    const c2 = char2.toLowerCase();
    for (const row of KEYBOARD_ROWS) {
      const idx = row.indexOf(c1);
      if (idx !== -1) {
        // Check next char (forward or backward)
        if ((idx > 0 && row[idx - 1] === c2) || (idx < row.length - 1 && row[idx + 1] === c2)) {
          return true;
        }
      }
    }
    return false;
  };

  const generatePassword = useCallback(() => {
    let activeSets: string[] = [];
    let fullCharset = '';

    // 1. Mandatory Sets
    activeSets.push(CHAR_SETS.uppercase);
    activeSets.push(CHAR_SETS.lowercase);
    activeSets.push(CHAR_SETS.numbers);
    
    // 2. Optional Sets
    if (useSymbols) activeSets.push(CHAR_SETS.symbols);

    // 3. Filter Ambiguous Characters if needed
    if (excludeAmbiguous) {
      activeSets = activeSets.map(set => 
        set.split('').filter(char => !AMBIGUOUS_CHARS.includes(char)).join('')
      ).filter(set => set.length > 0);
    }

    fullCharset = activeSets.join('');
    
    // Safety check
    if (fullCharset.length === 0) fullCharset = 'abcdefg'; 

    let result = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 500; // Prevent infinite loops

    // Force Distribution (Ensure at least one from each selected set)
    // Only if length permits
    if (length >= activeSets.length) {
        for (const set of activeSets) {
            result.push(set.charAt(getRandomInt(set.length)));
        }
    }

    // Fill remaining length
    while (result.length < length) {
       result.push(fullCharset.charAt(getRandomInt(fullCharset.length)));
    }

    // Shuffle first
    for (let i = result.length - 1; i > 0; i--) {
        const j = getRandomInt(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    // --- RULE: MUST START WITH A LETTER ---
    // Since Upper/Lower are mandatory, we know there are letters in result.
    // Find a letter and swap it to index 0 if index 0 is not a letter.
    const isLetter = (char: string) => {
      const code = char.charCodeAt(0);
      return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    };

    if (!isLetter(result[0])) {
      // Find first letter index
      const letterIndex = result.findIndex(c => isLetter(c));
      if (letterIndex !== -1) {
        [result[0], result[letterIndex]] = [result[letterIndex], result[0]];
      } else {
        // Fallback (Should typically not happen given logic above)
        const letters = CHAR_SETS.uppercase + CHAR_SETS.lowercase;
        result[0] = letters.charAt(getRandomInt(letters.length));
      }
    }

    // 4. Validate and Fix Constraints (Sequential & Keyboard)
    // This uses a retry/mutation approach for best effort compliance
    // We skip index 0 mutation if possible to preserve "Start with letter" rule, 
    // or ensure replacement is a letter if we must mutate index 0.
    if (noSequential || noKeyboard) {
       let valid = false;
       while(!valid && attempts < MAX_ATTEMPTS) {
         attempts++;
         valid = true;
         
         for (let i = 0; i < result.length - 1; i++) {
             const c1 = result[i];
             const c2 = result[i+1];
             let issue = false;

             // Check Sequential/Repeats
             if (noSequential) {
                if (c1 === c2) issue = true;
                if (Math.abs(c1.charCodeAt(0) - c2.charCodeAt(0)) === 1) issue = true;
             }

             // Check Keyboard Patterns
             if (noKeyboard && !issue) {
                if (isKeyboardSequence(c1, c2)) issue = true;
             }

             if (issue) {
                 // Reshuffle or replace current index to break pattern
                 // We modify i+1 to avoid breaking the previous check or the start-letter rule (if i=0)
                 result[i+1] = fullCharset.charAt(getRandomInt(fullCharset.length));
                 valid = false;
             }
         }
       }
    }

    setPassword(result.join(''));
    setCopied(false);
  }, [length, useSymbols, excludeAmbiguous, noSequential, noKeyboard]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    
    // Only toggle the main button icon if we are copying the main password
    if (text === password) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    
    // Always show global toast
    showToast(t.tools.passwordGen.copied);
  };

  const saveToHistory = () => {
    if (!password) return;
    // Check duplicates based on decrypted value
    const exists = history.some(h => decrypt(h.encryptedPassword) === password);
    if (exists) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      encryptedPassword: encrypt(password),
      tag: '',
      timestamp: Date.now(),
      pinned: false
    };

    // Add to top
    updateHistory([newItem, ...history]);
  };

  const deleteHistoryItem = (id: string) => {
    updateHistory(history.filter(item => item.id !== id));
    setDeleteId(null);
  };

  const togglePin = (id: string) => {
    const updated = history.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item);
    // Sort: Pinned first, then by timestamp descending
    updated.sort((a, b) => {
      if (a.pinned === b.pinned) return b.timestamp - a.timestamp;
      return a.pinned ? -1 : 1;
    });
    updateHistory(updated);
  };

  const updateTag = (id: string, tag: string) => {
    updateHistory(history.map(item => item.id === id ? { ...item, tag } : item));
  };

  useEffect(() => {
    generatePassword();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ToggleOption = ({ 
    label, 
    checked, 
    onChange 
  }: { 
    label: string, 
    checked: boolean, 
    onChange: (v: boolean) => void 
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group bg-neu-base p-3 rounded-xl shadow-neu-flat hover:shadow-neu-pressed transition-all active:scale-[0.98]">
      <div 
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-neu-accent text-white shadow-inner' : 'bg-neu-base shadow-neu-pressed text-transparent'}`}
      >
        <Check size={16} strokeWidth={4} />
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="font-bold text-xs text-neu-text select-none whitespace-nowrap">{label}</span>
    </label>
  );

  return (
    <div className="max-w-[60rem] mx-auto space-y-8 animate-fade-in relative">
      
      {/* Toast Notification - Portal to Body to avoid layout shifts */}
      {toastMsg && createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down pointer-events-none">
            <div className="bg-neu-base text-neu-accent px-6 py-3 rounded-full shadow-neu-pressed border border-neu-accent/20 flex items-center gap-2 font-bold backdrop-blur-md pointer-events-auto">
            <Check size={18} strokeWidth={3} />
            {toastMsg}
            </div>
        </div>,
        document.body
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.passwordGen.title}</h2>
        <p className="text-neu-text/60">{t.tools.passwordGen.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Left Column: Generator - This drives the height of the row */}
        <div className="lg:col-span-2">
            <NeuCard className="h-full flex flex-col justify-between">
                <div>
                  {/* Password Display */}
                  <div className="flex flex-col items-center justify-center p-8 mb-8 rounded-[24px] shadow-neu-pressed min-h-[120px] bg-neu-base relative overflow-hidden">
                    <span className="text-2xl md:text-4xl font-mono text-neu-accent break-all text-center font-bold tracking-wider">
                        {password}
                    </span>
                    <div className="absolute top-4 right-4 text-neu-text/10">
                        <ShieldCheck size={100} />
                    </div>
                  </div>
                  
                  {/* Action Buttons - Consistent Layout */}
                  <div className="flex flex-row gap-4 justify-center mb-10">
                      <NeuButton 
                          onClick={generatePassword} 
                          className="flex-1"
                          title={t.tools.passwordGen.generate}
                      >
                          <RefreshCw size={20} /> 
                          <span className="hidden md:inline">{t.tools.passwordGen.generate}</span>
                      </NeuButton>
                      <NeuButton 
                          onClick={saveToHistory} 
                          className="flex-1"
                          title={t.tools.passwordGen.save}
                      >
                          <Save size={20} /> 
                          <span className="hidden md:inline">{t.tools.passwordGen.save}</span>
                      </NeuButton>
                      <NeuButton 
                          onClick={() => copyToClipboard(password)} 
                          active={copied} 
                          className="flex-1"
                          title={copied ? t.tools.passwordGen.copied : t.tools.passwordGen.copy}
                      >
                          {copied ? <Check size={20} /> : <Copy size={20} />}
                          <span className="hidden md:inline">{copied ? t.tools.passwordGen.copied : t.tools.passwordGen.copy}</span>
                      </NeuButton>
                  </div>
                </div>

                {/* Configuration */}
                <div className="space-y-8">
                  {/* Length Slider */}
                  <div className="flex flex-col gap-4 bg-neu-base p-4 rounded-2xl shadow-neu-flat">
                      <div className="flex justify-between items-center px-2">
                      <label className="text-sm font-bold text-neu-text uppercase flex items-center gap-2">
                          {t.tools.passwordGen.length}
                      </label>
                      <span className="text-xl font-black text-neu-accent">{length}</span>
                      </div>
                      <input 
                      type="range" 
                      min="8" 
                      max="32" 
                      value={length} 
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full h-4 bg-transparent rounded-lg appearance-none cursor-pointer focus:outline-none 
                      [&::-webkit-slider-runnable-track]:bg-neu-base [&::-webkit-slider-runnable-track]:shadow-neu-pressed [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-4
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-neu-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2"
                      />
                  </div>

                  {/* Advanced Security */}
                  <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-neu-text/40 tracking-widest mb-2 px-2 flex items-center gap-2">
                          <ShieldAlert size={12} /> {t.tools.passwordGen.security}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <ToggleOption label={t.tools.passwordGen.symbols} checked={useSymbols} onChange={setUseSymbols} />
                          <ToggleOption label={t.tools.passwordGen.excludeAmbiguous} checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
                          <ToggleOption label={t.tools.passwordGen.noSequential} checked={noSequential} onChange={setNoSequential} />
                          <ToggleOption label={t.tools.passwordGen.noKeyboard} checked={noKeyboard} onChange={setNoKeyboard} />
                      </div>
                  </div>
                </div>
            </NeuCard>
        </div>

        {/* Right Column: History */}
        {/* lg:h-0 and lg:min-h-full forces this column to ignore its child's height contribution to the row, 
            so the row height is determined purely by the Left column, but this column stretches to match it. */}
        <div className="lg:col-span-1 lg:h-0 lg:min-h-full">
            <NeuCard title={t.tools.passwordGen.history} className="h-full flex flex-col">
                {/* Concave Well for History Items (Inset) */}
                <div className="bg-neu-base shadow-neu-pressed rounded-[24px] p-4 flex-1 overflow-hidden flex flex-col relative">
                    {/* Balanced px-2 to prevent left-shift, space-y-4 restored to standard */}
                    <div className="overflow-y-auto px-2 space-y-4 flex-1 custom-scrollbar h-full pt-1">
                        {history.length === 0 && (
                            <div className="text-center text-neu-text/40 py-8 italic">
                                {t.tools.passwordGen.historyEmpty}
                            </div>
                        )}
                        {history.map((item) => {
                            const rawPwd = decrypt(item.encryptedPassword);
                            const maskedPwd = rawPwd.length > 4 
                                ? `${rawPwd.substring(0,2)}****${rawPwd.substring(rawPwd.length-2)}` 
                                : '****';
                            
                            return (
                                <div key={item.id} className="
                                    relative group
                                    p-4 rounded-xl
                                    bg-gradient-to-br from-neu-accent/5 to-transparent dark:from-neu-accent/20 dark:to-transparent
                                    border border-neu-accent/10 dark:border-neu-accent/20
                                    hover:border-neu-accent/50 hover:from-neu-accent/10 hover:to-transparent
                                    flex flex-col gap-3
                                    transition-all duration-300
                                ">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => togglePin(item.id)} className={`${item.pinned ? 'text-neu-accent' : 'text-neu-text/20 hover:text-neu-text'}`}>
                                                {item.pinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                                            </button>
                                            <span className="font-mono font-bold text-neu-text text-sm tracking-wider">
                                                {maskedPwd}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => copyToClipboard(rawPwd)} 
                                                className="p-1.5 rounded-full hover:bg-neu-accent/10 text-neu-text/60 hover:text-neu-accent"
                                                title={t.tools.passwordGen.copy}
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteId(item.id)} 
                                                className="p-1.5 rounded-full hover:bg-red-500/10 text-neu-text/60 hover:text-red-500"
                                                title={t.tools.passwordGen.delete}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} className="text-neu-text/30" />
                                        <input 
                                            type="text" 
                                            placeholder={t.tools.passwordGen.tagPlaceholder}
                                            value={item.tag}
                                            onChange={(e) => updateTag(item.id, e.target.value)}
                                            className="bg-transparent text-xs font-bold text-neu-text/70 outline-none w-full placeholder-neu-text/20"
                                        />
                                    </div>

                                    {/* Confirmation Overlay */}
                                    {deleteId === item.id && (
                                        <div className="absolute inset-0 z-20 bg-gray-900/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-fade-in">
                                            <p className="text-xs font-bold text-red-400 mb-3 tracking-wide uppercase">{t.tools.passwordGen.confirmDelete}</p>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => deleteHistoryItem(item.id)}
                                                    className="px-4 py-1 bg-red-600 text-white rounded-full text-xs font-bold shadow-lg hover:bg-red-500 transition-colors"
                                                >
                                                    {t.common.yes}
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(null)}
                                                    className="px-4 py-1 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold shadow-lg hover:bg-white/20 transition-colors"
                                                >
                                                    {t.common.no}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </NeuCard>
        </div>
      </div>
    </div>
  );
};
