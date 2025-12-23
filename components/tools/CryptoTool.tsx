
import React, { useState } from 'react';
import { ArrowDown, Copy, Check, Lock, Hash, FileCode, Eye, EyeOff, Trash2 } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea, NeuInput } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { CodeEditor } from '../ui/CodeEditor';
import { useAppStore } from '../../utils/store';

// --- Native SHA-256 ---
async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- AES-256-GCM Implementation matching Node.js crypto ---
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 128,
            hash: "SHA-512"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptAes(text: string, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(64));
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const encodedText = new TextEncoder().encode(text);

    // Web Crypto encrypt returns Ciphertext + Tag (appended at end)
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv, tagLength: 128 },
        key,
        encodedText
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const tagLength = 16;
    
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
    const tag = encryptedBytes.slice(encryptedBytes.length - tagLength);

    const resultLength = salt.length + iv.length + tag.length + ciphertext.length;
    const result = new Uint8Array(resultLength);

    let offset = 0;
    result.set(salt, offset); offset += salt.length;
    result.set(iv, offset); offset += iv.length;
    result.set(tag, offset); offset += tag.length;
    result.set(ciphertext, offset);

    let binary = '';
    const len = result.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
}

async function decryptAes(base64Data: string, password: string): Promise<string> {
    try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        if (bytes.length < 96) throw new Error("Invalid data: too short");

        const salt = bytes.slice(0, 64);
        const iv = bytes.slice(64, 80);
        const tag = bytes.slice(80, 96);
        const ciphertext = bytes.slice(96);

        const key = await deriveKey(password, salt);

        const dataToDecrypt = new Uint8Array(ciphertext.length + tag.length);
        dataToDecrypt.set(ciphertext, 0);
        dataToDecrypt.set(tag, ciphertext.length);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv, tagLength: 128 },
            key,
            dataToDecrypt
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (e: any) {
        console.error(e);
        throw new Error("Decryption failed. Check key or format.");
    }
}

export const CryptoTool: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('abcdefgabcdefgqq');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'AES' | 'BASE64' | 'HASH'>('AES');
  
  // Separate copy states for better feedback
  const [outputCopied, setOutputCopied] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  
  const [outLang, setOutLang] = useState('plaintext');

  // AES State - Default to DECRYPT
  const [aesMode, setAesMode] = useState<'ENCRYPT' | 'DECRYPT'>('DECRYPT');
  // Base64 State
  const [b64Mode, setB64Mode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

  const process = async () => {
    const cleanInput = input.trim(); 
    setOutLang('plaintext'); // Reset default
    
    if (!cleanInput) {
      setOutput('');
      return;
    }

    try {
      if (activeTab === 'AES') {
        if (!key) {
           setOutput('Error: Key is required for AES.');
           return;
        }
        
        if (aesMode === 'ENCRYPT') {
            const result = await encryptAes(cleanInput, key);
            setOutput(result);
        } else {
            const result = await decryptAes(cleanInput, key);
            // Try to format JSON if possible
            try {
                const parsed = JSON.parse(result);
                if (typeof parsed === 'object' && parsed !== null) {
                    setOutput(JSON.stringify(parsed, null, 2));
                    setOutLang('json'); // Switch editor to JSON mode
                } else {
                    setOutput(result);
                }
            } catch {
                setOutput(result);
            }
        }
      } else if (activeTab === 'BASE64') {
        if (b64Mode === 'ENCODE') setOutput(btoa(cleanInput));
        else setOutput(atob(cleanInput));
      } else if (activeTab === 'HASH') {
         const hash = await sha256(cleanInput);
         setOutput(hash);
      }
    } catch (e: any) {
      setOutput('Error: ' + (e.message || 'Invalid Input'));
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setOutLang('plaintext');
  };

  const copyText = (text: string, isInput: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isInput) {
        setInputCopied(true);
        setTimeout(() => setInputCopied(false), 2000);
    } else {
        setOutputCopied(true);
        setTimeout(() => setOutputCopied(false), 2000);
    }
  };

  const CopyButton = ({ onClick, active }: { onClick: () => void, active: boolean }) => (
    <button 
        onClick={onClick} 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-neu-text/60 hover:text-neu-accent hover:bg-neu-text/5 active:scale-95"
        title={t.tools.cryptoTool.copy}
    >
        {active ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        <span className={active ? "text-green-500" : ""}>{active ? t.tools.cryptoTool.copied : t.tools.cryptoTool.copy}</span>
    </button>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.cryptoTool.title}</h2>
        <p className="text-neu-text/60">{t.tools.cryptoTool.subtitle}</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex gap-2">
            {(['AES', 'BASE64', 'HASH'] as const).map(tab => (
                 <button
                 key={tab}
                 onClick={() => { setActiveTab(tab); setOutput(''); setOutLang('plaintext'); }}
                 className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/60 hover:text-neu-text'}`}
               >
                 {tab === 'AES' && <Lock size={14} />}
                 {tab === 'BASE64' && <FileCode size={14} />}
                 {tab === 'HASH' && <Hash size={14} />}
                 {tab === 'HASH' ? t.tools.cryptoTool.hash : tab}
               </button>
            ))}
        </div>
      </div>

      <NeuCard className="space-y-6">
         {/* Sub-controls based on Tab */}
         {activeTab === 'AES' && (
             <div className="flex flex-col md:flex-row gap-4 items-end">
                 <div className="flex-1 w-full">
                     <NeuInput 
                        type={showKey ? "text" : "password"}
                        label={t.tools.cryptoTool.aesKey}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={t.tools.cryptoTool.aesKeyPlaceholder}
                        spellCheck={false}
                        rightElement={
                          <button 
                            onClick={() => setShowKey(!showKey)}
                            className="hover:text-neu-accent transition-colors"
                          >
                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                     />
                 </div>
                 {/* Aligned Buttons - matched py-3 to input's py-3 */}
                 <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex shrink-0 h-[50px] items-center">
                    <button onClick={() => setAesMode('DECRYPT')} className={`px-6 h-full rounded-full text-sm font-bold flex items-center ${aesMode === 'DECRYPT' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.decrypt}</button>
                    <button onClick={() => setAesMode('ENCRYPT')} className={`px-6 h-full rounded-full text-sm font-bold flex items-center ${aesMode === 'ENCRYPT' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.encrypt}</button>
                 </div>
             </div>
         )}

         {activeTab === 'BASE64' && (
             <div className="flex justify-center">
                 <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex">
                    <button onClick={() => setB64Mode('ENCODE')} className={`px-4 py-2 rounded-full text-xs font-bold ${b64Mode === 'ENCODE' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.encode}</button>
                    <button onClick={() => setB64Mode('DECODE')} className={`px-4 py-2 rounded-full text-xs font-bold ${b64Mode === 'DECODE' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.decode}</button>
                 </div>
             </div>
         )}
         
         {activeTab === 'HASH' && (
             <div className="text-center text-xs font-bold text-neu-text/40 uppercase tracking-widest">
                 Algorithm: SHA-256
             </div>
         )}

         <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60">{t.tools.cryptoTool.input}</label>
                <CopyButton onClick={() => copyText(input, true)} active={inputCopied} />
            </div>
            <NeuTextArea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder={activeTab === 'AES' && aesMode === 'DECRYPT' ? t.tools.cryptoTool.decryptPlaceholder : '...'}
                spellCheck={false}
            />
         </div>
         
         <div className="flex justify-center gap-6">
            <NeuButton onClick={clear} className="w-full md:w-auto px-8" variant="danger">
                <Trash2 size={20} /> {t.tools.cryptoTool.clear}
            </NeuButton>
            <NeuButton onClick={process} className="w-full md:w-auto px-8">
                <ArrowDown size={20} /> {t.tools.cryptoTool.process}
            </NeuButton>
         </div>

         <div className="space-y-2">
             <div className="flex justify-between items-center px-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60">{t.tools.cryptoTool.output}</label>
                <CopyButton onClick={() => copyText(output, false)} active={outputCopied} />
             </div>
             {/* Monaco Editor Wrapper */}
             <CodeEditor 
                value={output} 
                language={outLang}
                readOnly={true}
                height="400px"
             />
         </div>
      </NeuCard>
    </div>
  );
};
