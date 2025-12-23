
import React, { useState } from 'react';
import { ArrowDown, Copy, Check, Lock, Unlock, Hash, FileCode, Eye, EyeOff, Trash2 } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea, NeuInput } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

// --- Native SHA-256 ---
async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- AES-256-GCM Implementation matching Node.js crypto ---
// Format: Salt (64) | IV (16) | Tag (16) | Ciphertext
// Key Derivation: PBKDF2, SHA-512, 128 iterations, 64 byte salt (from payload or random)

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
    // Separate ciphertext and tag for re-ordering
    // WebCrypto: [Ciphertext ..... Tag]
    // Target: [Salt][IV][Tag][Ciphertext]
    
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
    const tag = encryptedBytes.slice(encryptedBytes.length - tagLength);

    const resultLength = salt.length + iv.length + tag.length + ciphertext.length;
    const result = new Uint8Array(resultLength);

    let offset = 0;
    result.set(salt, offset); offset += salt.length;
    result.set(iv, offset); offset += iv.length;
    result.set(tag, offset); offset += tag.length;
    result.set(ciphertext, offset);

    // Convert to Base64
    // Using simple loop to avoid stack overflow with spread operator on large arrays
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

        // Parse format: Salt (64) | IV (16) | Tag (16) | Ciphertext
        const salt = bytes.slice(0, 64);
        const iv = bytes.slice(64, 80);
        const tag = bytes.slice(80, 96);
        const ciphertext = bytes.slice(96);

        const key = await deriveKey(password, salt);

        // Reconstruct for Web Crypto: Ciphertext + Tag
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
  const [copied, setCopied] = useState(false);

  // AES State - Default to DECRYPT
  const [aesMode, setAesMode] = useState<'ENCRYPT' | 'DECRYPT'>('DECRYPT');
  // Base64 State
  const [b64Mode, setB64Mode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

  const process = async () => {
    // For decryption, trim is important to remove accidental whitespace in base64
    // For encryption, we usually want to preserve whitespace if it's user intent, but trim() is safer for general tools
    const cleanInput = input.trim(); 
    
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
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.cryptoTool.title}</h2>
        <p className="text-neu-text/60">{t.tools.cryptoTool.subtitle}</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex gap-2">
            {(['AES', 'BASE64', 'HASH'] as const).map(tab => (
                 <button
                 key={tab}
                 onClick={() => { setActiveTab(tab); setOutput(''); }}
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
                 <div className="bg-neu-base p-1 rounded-full shadow-neu-pressed flex shrink-0">
                    <button onClick={() => setAesMode('DECRYPT')} className={`px-4 py-2 rounded-full text-xs font-bold ${aesMode === 'DECRYPT' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.decrypt}</button>
                    <button onClick={() => setAesMode('ENCRYPT')} className={`px-4 py-2 rounded-full text-xs font-bold ${aesMode === 'ENCRYPT' ? 'text-neu-accent shadow-neu-flat' : 'text-neu-text/50'}`}>{t.tools.cryptoTool.encrypt}</button>
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

         <NeuTextArea 
           label={t.tools.cryptoTool.input}
           value={input}
           onChange={(e) => setInput(e.target.value)}
           rows={3}
           placeholder={activeTab === 'AES' && aesMode === 'DECRYPT' ? 'Paste encrypted Base64 string...' : '...'}
           spellCheck={false}
         />
         
         <div className="flex justify-center gap-6">
            <NeuButton onClick={clear} className="w-full md:w-auto px-8" variant="danger">
                <Trash2 size={20} /> {t.tools.cryptoTool.clear}
            </NeuButton>
            <NeuButton onClick={process} className="w-full md:w-auto px-8">
                <ArrowDown size={20} /> {t.tools.cryptoTool.process}
            </NeuButton>
         </div>

         <div className="relative">
            <NeuTextArea 
                label={t.tools.cryptoTool.output}
                value={output}
                readOnly
                rows={16}
                className="font-mono text-sm bg-neu-base/50"
                spellCheck={false}
            />
            <div className="absolute right-4 bottom-4">
                <NeuButton onClick={copyToClipboard} active={copied} className="!px-3 !py-2 text-xs">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? t.tools.cryptoTool.copied : t.tools.cryptoTool.copy}
                </NeuButton>
            </div>
         </div>
      </NeuCard>
    </div>
  );
};
