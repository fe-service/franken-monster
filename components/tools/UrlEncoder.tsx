
import React, { useState, useEffect } from 'react';
import { ArrowDown, Copy, Check, Plus, Trash2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuTextArea, NeuInput } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

interface QueryParam {
    id: string;
    key: string;
    value: string;
}

export const UrlEncoder: React.FC = () => {
  const { t } = useAppStore();
  
  // URL Components
  const [fullUrl, setFullUrl] = useState('');
  const [protocol, setProtocol] = useState('https');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [path, setPath] = useState('');
  const [hash, setHash] = useState('');
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);

  // Initialize defaults
  useEffect(() => {
    // Only set default if empty on first load
    if (!fullUrl) {
       // Optional: Set a placeholder or keep empty
    }
  }, []);

  // PARSE: Full URL -> Components
  // Triggered when user modifies the "Full URL" input
  const handleFullUrlChange = (val: string) => {
      setFullUrl(val);
      try {
          if (!val) {
             setIsValid(true);
             return;
          }
          // Try to create URL object. If protocol missing, it fails, so we might append http:// just for parsing check if needed
          // But strict parsing is better.
          const u = new URL(val);
          setIsValid(true);
          
          setProtocol(u.protocol.replace(':', ''));
          setHost(u.hostname);
          setPort(u.port);
          setPath(u.pathname);
          setHash(u.hash);
          
          const params: QueryParam[] = [];
          u.searchParams.forEach((value, key) => {
              params.push({ id: Math.random().toString(36).substr(2, 9), key, value });
          });
          setQueryParams(params);

      } catch (e) {
          setIsValid(false);
          // Don't clear components immediately, user might be typing
      }
  };

  // BUILD: Components -> Full URL
  // Triggered when user modifies any component
  const rebuildUrl = (
      newProtocol?: string, 
      newHost?: string, 
      newPort?: string, 
      newPath?: string, 
      newHash?: string,
      newParams?: QueryParam[]
  ) => {
      const pProtocol = newProtocol !== undefined ? newProtocol : protocol;
      const pHost = newHost !== undefined ? newHost : host;
      const pPort = newPort !== undefined ? newPort : port;
      const pPath = newPath !== undefined ? newPath : path;
      const pHash = newHash !== undefined ? newHash : hash;
      const pParams = newParams !== undefined ? newParams : queryParams;

      if (!pHost) return; // Can't build without host

      try {
          // Construct basic base
          let urlStr = `${pProtocol}://${pHost}`;
          if (pPort) urlStr += `:${pPort}`;
          
          // Ensure path starts with /
          let cleanPath = pPath;
          if (cleanPath && !cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
          urlStr += cleanPath;

          // Add Params
          const searchParams = new URLSearchParams();
          pParams.forEach(p => {
              if (p.key) searchParams.append(p.key, p.value);
          });
          const qs = searchParams.toString();
          if (qs) urlStr += `?${qs}`;

          // Add Hash
          if (pHash) {
              urlStr += pHash.startsWith('#') ? pHash : `#${pHash}`;
          }

          setFullUrl(urlStr);
          setIsValid(true);
      } catch (e) {
          // Construction error
      }
  };

  // Handlers for individual inputs
  const changeProtocol = (val: string) => {
      setProtocol(val);
      rebuildUrl(val);
  };
  const changeHost = (val: string) => {
      setHost(val);
      rebuildUrl(undefined, val);
  };
  const changePort = (val: string) => {
      setPort(val);
      rebuildUrl(undefined, undefined, val);
  };
  const changePath = (val: string) => {
      setPath(val);
      rebuildUrl(undefined, undefined, undefined, val);
  };
  const changeHash = (val: string) => {
      setHash(val);
      rebuildUrl(undefined, undefined, undefined, undefined, val);
  };

  // Param Handlers
  const addParam = () => {
      const newParams = [...queryParams, { id: Date.now().toString(), key: '', value: '' }];
      setQueryParams(newParams);
      // No rebuild yet, empty param doesn't affect URL usually until key exists
  };

  const updateParam = (id: string, field: 'key' | 'value', text: string) => {
      const newParams = queryParams.map(p => p.id === id ? { ...p, [field]: text } : p);
      setQueryParams(newParams);
      rebuildUrl(undefined, undefined, undefined, undefined, undefined, newParams);
  };

  const removeParam = (id: string) => {
      const newParams = queryParams.filter(p => p.id !== id);
      setQueryParams(newParams);
      rebuildUrl(undefined, undefined, undefined, undefined, undefined, newParams);
  };

  // Encode/Decode Actions for specific fields (Optional utility)
  const quickEncode = () => {
      setFullUrl(encodeURIComponent(fullUrl));
  };
  const quickDecode = () => {
      // If it's a full URL encoded, decode it and then parse
      try {
          const decoded = decodeURIComponent(fullUrl);
          handleFullUrlChange(decoded);
      } catch (e) {
          setFullUrl(decodeURIComponent(fullUrl));
      }
  };

  const copyToClipboard = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.urlEncoder.title}</h2>
        <p className="text-neu-text/60">{t.tools.urlEncoder.subtitle}</p>
      </div>

      <NeuCard className="space-y-8">
         {/* Main URL Input */}
         <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60">{t.tools.urlEncoder.fullUrl}</label>
                {!isValid && (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> {t.tools.urlEncoder.invalidUrl}
                    </span>
                )}
            </div>
            <div className="relative">
                <NeuTextArea 
                    value={fullUrl}
                    onChange={(e) => handleFullUrlChange(e.target.value)}
                    rows={3}
                    className={`font-mono text-sm ${!isValid ? 'text-red-500/80' : ''}`}
                    placeholder="https://example.com/api?q=search"
                />
                 <div className="absolute right-4 bottom-4 flex gap-2">
                    <button onClick={quickEncode} className="px-3 py-1 bg-neu-base rounded-full shadow-neu-flat text-xs font-bold text-neu-text/50 hover:text-neu-accent">{t.tools.urlEncoder.encode}</button>
                    <button onClick={quickDecode} className="px-3 py-1 bg-neu-base rounded-full shadow-neu-flat text-xs font-bold text-neu-text/50 hover:text-neu-accent">{t.tools.urlEncoder.decode}</button>
                    <NeuButton onClick={copyToClipboard} active={copied} className="!px-3 !py-1 text-xs">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </NeuButton>
                 </div>
            </div>
         </div>

         <div className="h-0.5 w-full bg-neu-base shadow-neu-pressed rounded-full"></div>

         {/* URL Parts Grid */}
         <div className="grid grid-cols-12 gap-6">
            {/* Row 1: Protocol, Host, Port */}
            <div className="col-span-12 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4 mb-2 block">{t.tools.urlEncoder.protocol}</label>
                 <div className="relative">
                    <select 
                        value={protocol}
                        onChange={(e) => changeProtocol(e.target.value)}
                        className="w-full appearance-none bg-neu-base text-neu-text px-4 py-3 rounded-full shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer"
                    >
                        <option value="https">https</option>
                        <option value="http">http</option>
                        <option value="ftp">ftp</option>
                        <option value="ws">ws</option>
                        <option value="wss">wss</option>
                    </select>
                </div>
            </div>

            <div className="col-span-12 md:col-span-8">
                 <NeuInput 
                    label={t.tools.urlEncoder.host}
                    value={host}
                    onChange={(e) => changeHost(e.target.value)}
                    placeholder={t.tools.urlEncoder.hostPlaceholder}
                    className="font-mono"
                 />
            </div>

            <div className="col-span-12 md:col-span-2">
                 <NeuInput 
                    label={t.tools.urlEncoder.port}
                    value={port}
                    onChange={(e) => changePort(e.target.value)}
                    placeholder="80"
                    type="number"
                    className="font-mono"
                 />
            </div>

             {/* Row 2: Path, Hash */}
             <div className="col-span-12 md:col-span-8">
                 <NeuInput 
                    label={t.tools.urlEncoder.path}
                    value={path}
                    onChange={(e) => changePath(e.target.value)}
                    placeholder={t.tools.urlEncoder.pathPlaceholder}
                    leftIcon={<div className="pl-4 text-neu-text/40">/</div>}
                    className="font-mono"
                 />
            </div>
            <div className="col-span-12 md:col-span-4">
                 <NeuInput 
                    label={t.tools.urlEncoder.hash}
                    value={hash}
                    onChange={(e) => changeHash(e.target.value)}
                    placeholder={t.tools.urlEncoder.hashPlaceholder}
                    className="font-mono"
                 />
            </div>
         </div>

         {/* Query Params Section */}
         <div className="bg-neu-base shadow-neu-pressed rounded-[24px] p-6">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase text-neu-text/60 flex items-center gap-2">
                    <LinkIcon size={16} /> {t.tools.urlEncoder.params}
                </h4>
                <button 
                    onClick={addParam}
                    className="p-2 rounded-full bg-neu-base shadow-neu-flat text-neu-accent hover:scale-105 transition-transform"
                >
                    <Plus size={18} />
                </button>
             </div>

             <div className="space-y-3">
                 {queryParams.length === 0 && (
                     <div className="text-center text-neu-text/30 italic text-sm py-4">{t.tools.urlEncoder.noParams}</div>
                 )}
                 {queryParams.map((param) => (
                     <div key={param.id} className="flex gap-3 items-center animate-slide-up">
                         <div className="flex-1">
                             <input 
                                type="text"
                                value={param.key}
                                onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                                placeholder={t.tools.urlEncoder.key}
                                className="w-full bg-neu-base rounded-xl px-4 py-2 text-sm text-neu-text shadow-neu-pressed outline-none focus:ring-1 focus:ring-neu-accent/20 font-mono"
                             />
                         </div>
                         <div className="flex-[2]">
                             <input 
                                type="text"
                                value={param.value}
                                onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                                placeholder={t.tools.urlEncoder.value}
                                className="w-full bg-neu-base rounded-xl px-4 py-2 text-sm text-neu-text shadow-neu-pressed outline-none focus:ring-1 focus:ring-neu-accent/20 font-mono"
                             />
                         </div>
                         <button 
                            onClick={() => removeParam(param.id)}
                            className="p-2 text-neu-text/30 hover:text-red-500 transition-colors"
                         >
                             <Trash2 size={16} />
                         </button>
                     </div>
                 ))}
             </div>
         </div>
         
      </NeuCard>
    </div>
  );
};
