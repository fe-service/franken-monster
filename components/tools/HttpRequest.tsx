
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Trash2, Wifi, WifiOff, Loader2, ArrowRightLeft, Globe, ChevronDown, MonitorPlay, RotateCcw, Pin, PinOff, Edit2, Check, X } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { CodeEditor } from '../ui/CodeEditor';
import { useAppStore } from '../../utils/store';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface WsMessage {
  id: string;
  type: 'sent' | 'received' | 'system';
  content: string;
  time: string;
}

interface RequestHistoryItem {
  id: string;
  name: string; // Defaults to URL
  protocol: 'HTTP' | 'WS';
  method: string;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  timestamp: number;
  pinned: boolean;
}

export const HttpRequest: React.FC = () => {
  const { t } = useAppStore();
  const [protocol, setProtocol] = useState<'HTTP' | 'WS'>('HTTP');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  
  // Only tabs for Request Config
  const [activeConfigTab, setActiveConfigTab] = useState<'params' | 'headers' | 'body'>('params');
  
  // Data States
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [body, setBody] = useState('');
  
  // Response States
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseType, setResponseType] = useState<string>(''); // JSON, HTML, Stream, etc.
  const [detectedLang, setDetectedLang] = useState('plaintext');

  // WebSocket States
  const [wsConnected, setWsConnected] = useState(false);
  const [wsMessages, setWsMessages] = useState<WsMessage[]>([]);
  const [wsInput, setWsInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const wsLogRef = useRef<HTMLDivElement>(null);

  // History State
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null); // For delete confirmation
  const [editingId, setEditingId] = useState<string | null>(null); // For renaming
  const [editName, setEditName] = useState('');

  // Load History on Mount
  useEffect(() => {
      const saved = localStorage.getItem('neubox_http_history');
      if (saved) {
          try {
              setHistory(JSON.parse(saved));
          } catch (e) {
              console.error('Failed to parse history');
          }
      }
  }, []);

  // Save History Helper
  const persistHistory = (newHistory: RequestHistoryItem[]) => {
      setHistory(newHistory);
      localStorage.setItem('neubox_http_history', JSON.stringify(newHistory));
  };

  const addToHistory = () => {
      const newItem: RequestHistoryItem = {
          id: Date.now().toString(),
          name: url || 'Untitled Request',
          protocol,
          method: protocol === 'HTTP' ? method : 'WS',
          url,
          params,
          headers,
          body,
          timestamp: Date.now(),
          pinned: false
      };

      // Check for duplicate based on Method and URL (Request Address)
      const isSameRequest = (a: RequestHistoryItem, b: RequestHistoryItem) => {
          return a.protocol === b.protocol && 
                 a.method === b.method && 
                 a.url === b.url;
      };

      let newHistory = [...history];
      const existingIndex = newHistory.findIndex(item => isSameRequest(item, newItem));
      
      if (existingIndex !== -1) {
          // Update existing item (overwrite) and move to top
          const existing = newHistory[existingIndex];
          const updatedItem = {
              ...newItem,
              id: existing.id, // Keep ID
              pinned: existing.pinned, // Keep pinned state
              name: existing.name !== existing.url ? existing.name : newItem.name // Keep custom name if renamed, else use new URL
          };
          newHistory.splice(existingIndex, 1);
          newHistory.unshift(updatedItem);
      } else {
          // Add new
          newHistory.unshift(newItem);
      }

      // Enforce Limits: Max 20 items total. 
      // Strategy: Keep all pinned items. If length > 20, remove oldest UNPINNED items.
      if (newHistory.length > 20) {
          const pinnedItems = newHistory.filter(h => h.pinned);
          let unpinnedItems = newHistory.filter(h => !h.pinned);
          
          // Trim unpinned to fit
          // Max allowed unpinned = 20 - pinnedItems.length
          const maxUnpinned = Math.max(0, 20 - pinnedItems.length);
          if (unpinnedItems.length > maxUnpinned) {
              unpinnedItems = unpinnedItems.slice(0, maxUnpinned);
          }
          
          // Recombine: We want to maintain the sort order (Pinned Top -> Recent) logic usually,
          // but here we just have a list. We'll sort properly when rendering or saving.
          // Let's just merge and sort by pinned then date.
          newHistory = [...pinnedItems, ...unpinnedItems];
          newHistory.sort((a, b) => {
              if (a.pinned === b.pinned) return b.timestamp - a.timestamp;
              return a.pinned ? -1 : 1;
          });
      }

      persistHistory(newHistory);
  };

  const restoreRequest = (item: RequestHistoryItem) => {
      clearStateForParse();
      setProtocol(item.protocol);
      if (item.protocol === 'HTTP') {
          setMethod(item.method);
      }
      setUrl(item.url);
      setParams(item.params || []);
      setHeaders(item.headers || []);
      setBody(item.body || '');
      
      // Determine active tab based on data
      determineActiveTab(item.params || [], item.headers || [], item.body || '');
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const item = history.find(h => h.id === id);
      if (!item) return;

      if (!item.pinned) {
          // Check limit
          const pinnedCount = history.filter(h => h.pinned).length;
          if (pinnedCount >= 5) {
              alert('Max 5 pinned requests allowed.');
              return;
          }
      }

      const updated = history.map(h => h.id === id ? { ...h, pinned: !h.pinned } : h);
      // Re-sort
      updated.sort((a, b) => {
          if (a.pinned === b.pinned) return b.timestamp - a.timestamp;
          return a.pinned ? -1 : 1;
      });
      persistHistory(updated);
  };

  const deleteHistoryItem = (id: string) => {
      persistHistory(history.filter(h => h.id !== id));
      setDeleteId(null);
  };

  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(id);
      setEditName(currentName);
  };

  const saveRename = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (editingId && editName.trim()) {
          const updated = history.map(h => h.id === editingId ? { ...h, name: editName.trim() } : h);
          persistHistory(updated);
      }
      setEditingId(null);
      setEditName('');
  };

  // Auto-scroll WS Log
  useEffect(() => {
    if (wsLogRef.current) {
        wsLogRef.current.scrollTop = wsLogRef.current.scrollHeight;
    }
  }, [wsMessages]);

  // Helper: Format Bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Reset Response UI
  const resetResponse = () => {
      setStatus(null);
      setTimeTaken(null);
      setResponseSize(null);
      setResponseText('');
      setResponseType('');
      setIsLoading(false); // Ensure loading is off when parsing new input
  };

  // Helper: Reset Entire Request
  const resetRequest = () => {
      setUrl('');
      setMethod('GET');
      setParams([]);
      setHeaders([]);
      setBody('');
      resetResponse();
  };

  // Helper: Clear state before parsing new input
  const clearStateForParse = () => {
      resetResponse();
      setParams([]);
      setHeaders([]);
      setBody('');
      setMethod('GET');
      setUrl('');
  };

  // Helper: Determine active tab based on data (Left to Right priority: Params -> Headers -> Body)
  const determineActiveTab = (p: KeyValuePair[], h: KeyValuePair[], b: string) => {
      if (p.length > 0) setActiveConfigTab('params');
      else if (h.length > 0) setActiveConfigTab('headers');
      else if (b) setActiveConfigTab('body');
      else setActiveConfigTab('params');
  };

  // --- Smart Import Logic (Paste Handler) ---
  const handleSmartPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (!text) return;

    const lower = text.toLowerCase();
    
    // Check if it looks like cURL
    if (lower.startsWith('curl')) {
        e.preventDefault();
        parseCurl(text);
        return;
    }

    // Check if it looks like fetch
    if (lower.startsWith('fetch')) {
        e.preventDefault();
        parseFetch(text);
        return;
    }
    
    // Check if PowerShell (Invoke-WebRequest, Invoke-RestMethod, or Aliases)
    if (lower.includes('invoke-webrequest') || lower.includes('invoke-restmethod') || lower.includes('new-object microsoft.powershell') || lower.startsWith('iwr ') || lower.startsWith('irm ')) {
        e.preventDefault();
        parsePowerShell(text);
        return;
    }
  };

  const parsePowerShell = (text: string) => {
      clearStateForParse();
      
      // Normalize: Remove backtick line continuations (only if followed by newline) and generic newlines
      // Careful not to break escaped quotes inside strings which use backticks (e.g. `")
      let cleanText = text.replace(/`\s*[\r\n]+/g, ' ').replace(/[\r\n]+/g, ' ').trim();
      
      // 1. URL
      const urlMatch = cleanText.match(/-Uri\s+["']([^"']+)["']/i);
      if (urlMatch) setUrl(urlMatch[1]);
      
      // 2. Method
      // Support quoted "POST" or unquoted POST
      const methodMatch = cleanText.match(/-Method\s+["']?([a-zA-Z]+)["']?/i);
      if (methodMatch) {
          setMethod(methodMatch[1].toUpperCase());
      } else {
          // Will infer POST later if body is present
      }
      
      // 3. Headers - Matches @{ Key="Value"; Key2="Value" }
      const headersBlockMatch = cleanText.match(/-Headers\s+@\{([^}]+)\}/i);
      const newHeaders: KeyValuePair[] = [];
      
      if (headersBlockMatch) {
          const block = headersBlockMatch[1];
          // Powershell hash syntax keys usually quoted "Key"="Value" or 'Key'='Value'
          // Also supports optional = or just space in some loose contexts, but standard is =
          const pairRegex = /["']([^"']+)["']\s*=?\s*["']([^"']+)["']/g;
          let m;
          while ((m = pairRegex.exec(block)) !== null) {
              newHeaders.push({ id: Math.random().toString(), key: m[1], value: m[2], enabled: true });
          }
      }

      // 3b. ContentType (often separate param in PS)
      const contentTypeMatch = cleanText.match(/-ContentType\s+["']([^"']+)["']/i);
      if (contentTypeMatch) {
          newHeaders.push({ id: Math.random().toString(), key: 'Content-Type', value: contentTypeMatch[1], enabled: true });
      }

      // 3c. UserAgent (often set on $session)
      const uaMatch = cleanText.match(/\.UserAgent\s*=\s*["']([^"']+)["']/i);
      if (uaMatch) {
          newHeaders.push({ id: Math.random().toString(), key: 'User-Agent', value: uaMatch[1], enabled: true });
      }

      if (newHeaders.length > 0) setHeaders(newHeaders);
      
      // 4. Body - Matches -Body "..."
      // PowerShell strings escape " with ` (backtick) inside "..."
      // Regex: "((?:[^"`]|`.)*)" -> Matches " then (anything not " or ` OR escaped char) then "
      const complexBodyRegex = /-Body\s+(?:'([^']*)'|"((?:[^"`]|`.)*)")/i;
      const bodyMatch = cleanText.match(complexBodyRegex);
      
      let bodyData = '';
      if (bodyMatch) {
          if (bodyMatch[1] !== undefined) {
              // Single quotes - literal
              bodyData = bodyMatch[1];
          } else if (bodyMatch[2] !== undefined) {
              // Double quotes - unescape backticks
              bodyData = bodyMatch[2].replace(/`"/g, '"').replace(/``/g, '`');
          }
          
           // Try JSON format
          try {
             const j = JSON.parse(bodyData);
             bodyData = JSON.stringify(j, null, 2);
          } catch(e) {}
      }
      
      if (bodyData) {
          setBody(bodyData);
          if (!methodMatch) setMethod('POST');
      }

      // Determine active tab
      determineActiveTab([], newHeaders, bodyData);
  };

  const parseFetch = (text: string) => {
      clearStateForParse();
      // Clean up newlines for easier regex
      const cleanText = text.replace(/[\r\n]+/g, ' ');

      // 1. URL Extraction
      const urlMatch = cleanText.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);
      let parsedUrl = '';
      if (urlMatch) {
          parsedUrl = urlMatch[1];
          setUrl(parsedUrl);
      }

      // 2. Method Extraction
      const methodMatch = cleanText.match(/(?:method|'method'|"method")\s*:\s*['"]([^'"]+)['"]/i);
      let newMethod = 'GET';
      if (methodMatch) {
          newMethod = methodMatch[1].toUpperCase();
          setMethod(newMethod);
      }

      // 3. Headers Extraction
      const headersBlockMatch = cleanText.match(/(?:headers|'headers'|"headers")\s*:\s*\{([^}]+)\}/i);
      const newHeaders: KeyValuePair[] = [];
      
      if (headersBlockMatch) {
          const headersBlock = headersBlockMatch[1];
          // Matches key: "value" or "key": "value"
          const headerRegex = /(?:['"]?)([^'"\s:]+)(?:['"]?)\s*:\s*['"]([^'"]+)['"]/g;
          let hMatch;
          while ((hMatch = headerRegex.exec(headersBlock)) !== null) {
              const key = hMatch[1];
              const value = hMatch[2];
              if (key && value && key.toLowerCase() !== 'referrer') { // Skip referrer often auto-added
                 newHeaders.push({ id: Math.random().toString(), key, value, enabled: true });
              }
          }
      }
      if (newHeaders.length > 0) setHeaders(newHeaders);

      // 4. Body Extraction
      const bodyMatch = cleanText.match(/(?:body|'body'|"body")\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/);
      
      let bodyData = '';
      if (bodyMatch) {
          const rawSingle = bodyMatch[1];
          const rawDouble = bodyMatch[2];
          
          if (rawSingle !== undefined) {
             bodyData = rawSingle.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
          } else if (rawDouble !== undefined) {
             bodyData = rawDouble.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          }

          if (bodyData) {
             try {
                const jsonObj = JSON.parse(bodyData);
                bodyData = JSON.stringify(jsonObj, null, 2);
             } catch (e) { /* keep raw */ }
          }
      }
      
      if (bodyData) {
          setBody(bodyData);
          if (newMethod === 'GET') setMethod('POST');
      }

      // 5. Params from URL
      let newParams: KeyValuePair[] = [];
      if (parsedUrl && parsedUrl.includes('?')) {
         try {
             const u = new URL(parsedUrl);
             u.searchParams.forEach((v, k) => {
                  newParams.push({ id: Math.random().toString(), key: k, value: v, enabled: true });
             });
             if (newParams.length > 0) setParams(newParams);
         } catch(e) {}
      }

      determineActiveTab(newParams, newHeaders, bodyData);
  };

  const parseCurl = (text: string) => {
      clearStateForParse();

      let cleanText = text;
      // Detect CMD style
      const isCmd = text.includes('^');

      if (isCmd) {
          // CMD Normalization
          cleanText = cleanText.replace(/\^\s*[\r\n]+/g, ' ');
          cleanText = cleanText.replace(/\^(.)/g, '$1');
      } else {
          // Bash Normalization
          cleanText = cleanText.replace(/\\\s*[\r\n]+/g, ' ');
      }
      
      // Collapse spaces
      cleanText = cleanText.replace(/[\r\n]+/g, ' ').trim();

      // 1. URL extraction
      const urlMatch = cleanText.match(/(?:'|")?(https?:\/\/[^\s'"]+)(?:'|")?/);
      let parsedUrl = '';
      if (urlMatch) {
          parsedUrl = urlMatch[1];
          setUrl(parsedUrl);
      }
      
      // 2. Method Detection
      let newMethod = 'GET';
      // More robust method matching (handles -XPOST, -X POST, -X "POST", --request POST)
      const methodMatch = cleanText.match(/(?:-X\s*|--request\s+)(?:["']?)([a-zA-Z]+)(?:["']?)/i);
      if (methodMatch && methodMatch[1]) {
          newMethod = methodMatch[1].toUpperCase();
      }
      
      // 3. Body Extraction
      // ORDERING FIX: Put longer flags first (e.g., --data-raw) so they are matched before --data.
      // Matches -d, --data, etc followed by quoted string OR unquoted string (until space)
      const dataRegex = /(?:--data-binary|--data-urlencode|--data-ascii|--data-raw|--data|-d)\s*=?\s*(?:'([^']*)'|"((?:[^"\\]|\\.)*)"|([^'"\s]+))/;
      const dataMatch = cleanText.match(dataRegex);
      
      let bodyData = '';
      if (dataMatch) {
          if (dataMatch[1] !== undefined) {
              bodyData = dataMatch[1];
          } else if (dataMatch[2] !== undefined) {
              bodyData = dataMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          } else if (dataMatch[3] !== undefined) {
              // Unquoted body
              bodyData = dataMatch[3];
          }

          if (bodyData) {
             try {
                const jsonObj = JSON.parse(bodyData);
                bodyData = JSON.stringify(jsonObj, null, 2);
             } catch (e) { /* keep raw */ }
          }
          
          if (newMethod === 'GET') newMethod = 'POST';
      }
      
      setMethod(newMethod);
      if (bodyData) setBody(bodyData);

      // 4. Headers
      const newHeaders: KeyValuePair[] = [];
      const headerRegex = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)")/g;
      let hMatch;
      while ((hMatch = headerRegex.exec(cleanText)) !== null) {
          const headerStr = hMatch[1] || hMatch[2];
          if (headerStr) {
              const colon = headerStr.indexOf(':');
              if (colon > 0) {
                  const key = headerStr.slice(0, colon).trim();
                  const value = headerStr.slice(colon + 1).trim();
                  newHeaders.push({ id: Math.random().toString(), key, value, enabled: true });
              }
          }
      }
      if (newHeaders.length > 0) setHeaders(newHeaders);
      
      // 5. Params from URL
      let newParams: KeyValuePair[] = [];
      if (parsedUrl && parsedUrl.includes('?')) {
         try {
             const u = new URL(parsedUrl);
             u.searchParams.forEach((v, k) => {
                  newParams.push({ id: Math.random().toString(), key: k, value: v, enabled: true });
             });
             if (newParams.length > 0) setParams(newParams);
         } catch(e) {}
      }
      
      determineActiveTab(newParams, newHeaders, bodyData);
  };

  // URL Input Change Handler
  const handleUrlChange = (val: string) => {
    setUrl(val);
    try {
        if (val.includes('?')) {
            const u = new URL(val);
            const newParams: KeyValuePair[] = [];
            u.searchParams.forEach((v, k) => {
                 newParams.push({ id: Math.random().toString(36).substr(2, 9), key: k, value: v, enabled: true });
            });
            // Smart merge: append if params empty
            if (params.length === 0) {
                 setParams(newParams);
                 setActiveConfigTab('params');
            }
        }
    } catch (e) { /* ignore partial url */ }
  };

  // --- HTTP Request Logic ---
  const sendRequest = async () => {
    setIsLoading(true);
    setStatus(null);
    setTimeTaken(null);
    setResponseSize(null);
    setResponseText('');
    setResponseType('');
    setDetectedLang('plaintext');

    const startTime = performance.now();
    const abortController = new AbortController();

    try {
        // Build URL with Params
        let finalUrl = url;
        const activeParams = params.filter(p => p.enabled && p.key);
        if (activeParams.length > 0) {
            try {
                // If url is empty or invalid, this throws
                const u = new URL(url); 
                // Overwrite params from table
                activeParams.forEach(p => u.searchParams.set(p.key, p.value)); 
                finalUrl = u.toString();
            } catch {
                // Fallback for relative or partial URLs
                const qs = activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
                finalUrl = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
            }
        }

        const reqHeaders: Record<string, string> = {};
        headers.filter(h => h.enabled && h.key).forEach(h => reqHeaders[h.key] = h.value);

        const options: RequestInit = {
            method,
            headers: reqHeaders,
            // GET/HEAD must not have body
            body: ['GET', 'HEAD'].includes(method) ? undefined : body,
            signal: abortController.signal
        };

        const res = await fetch(finalUrl, options);
        setStatus(res.status);
        
        // Add to history after successful response (status code available)
        addToHistory();

        // Content Type Detection
        const contentType = res.headers.get('content-type') || '';
        let typeLabel = 'Text';
        let lang = 'plaintext';

        if (contentType.includes('application/json')) {
            typeLabel = 'JSON';
            lang = 'json';
        } else if (contentType.includes('text/html')) {
            typeLabel = 'HTML';
            lang = 'html';
        } else if (contentType.includes('xml')) {
            typeLabel = 'XML';
            lang = 'xml';
        } else if (contentType.includes('text/event-stream')) {
            typeLabel = 'Stream';
        }
        
        setResponseType(typeLabel);
        setDetectedLang(lang);

        // Check Stream
        const isEventStream = contentType.includes('text/event-stream');

        if (isEventStream && res.body) {
             const reader = res.body.getReader();
             const decoder = new TextDecoder();
             let accumulated = '';
             let size = 0;
             
             while (true) {
                 const { done, value } = await reader.read();
                 if (done) break;
                 size += value.length;
                 const chunk = decoder.decode(value, { stream: true });
                 accumulated += chunk;
                 
                 setResponseText(accumulated);
                 setResponseSize(formatBytes(size));
             }
             setTimeTaken(Math.round(performance.now() - startTime));
        } else {
             const blob = await res.blob();
             const text = await blob.text();
             
             // Auto Format JSON
             if (lang === 'json') {
                 try {
                     setResponseText(JSON.stringify(JSON.parse(text), null, 2));
                 } catch {
                     setResponseText(text);
                 }
             } else {
                 setResponseText(text);
             }

             setResponseSize(formatBytes(blob.size));
             setTimeTaken(Math.round(performance.now() - startTime));
        }

    } catch (e: any) {
        let errorMsg = 'Unknown Error';
        
        // Robust Error Extraction to prevent [object Object]
        try {
            if (e instanceof Error) {
                errorMsg = e.message;
            } else if (typeof e === 'string') {
                errorMsg = e;
            } else if (typeof e === 'object' && e !== null) {
                errorMsg = JSON.stringify(e, null, 2);
            } else {
                errorMsg = String(e);
            }
        } catch (inner) {
            errorMsg = "Error parsing failed";
        }

        // Common fetch failure hints
        let hint = "";
        if (errorMsg.includes('Failed to fetch')) {
            hint = "Check your network connection, CORS settings, or if the URL protocol (http/https) is correct.";
        }
        
        setResponseText(`Error: ${errorMsg}\n\n${hint}`);
    } finally {
        setIsLoading(false);
    }
  };

  // --- WebSocket Logic ---
  const toggleWsConnection = () => {
      if (wsConnected) {
          wsRef.current?.close();
          setWsConnected(false);
          addWsLog('system', 'Disconnected');
      } else {
          try {
              const ws = new WebSocket(url);
              wsRef.current = ws;
              
              ws.onopen = () => {
                  setWsConnected(true);
                  addWsLog('system', 'Connected');
                  // Add to history on successful connection
                  addToHistory();
              };
              
              ws.onmessage = (event) => {
                  addWsLog('received', typeof event.data === 'string' ? event.data : 'Binary Data');
              };
              
              ws.onclose = () => {
                  setWsConnected(false);
                  addWsLog('system', 'Connection Closed');
              };
              
              ws.onerror = (err) => {
                  addWsLog('system', 'Error occurred');
                  console.error(err);
              };
          } catch (e: any) {
              addWsLog('system', 'Connection Failed: ' + (e.message || String(e)));
          }
      }
  };

  const sendWsMessage = () => {
      if (wsRef.current && wsConnected && wsInput) {
          wsRef.current.send(wsInput);
          addWsLog('sent', wsInput);
          setWsInput('');
      }
  };

  const addWsLog = (type: 'sent' | 'received' | 'system', content: string) => {
      setWsMessages(prev => [{
          id: Date.now().toString() + Math.random(),
          type,
          content,
          time: new Date().toLocaleTimeString()
      }, ...prev]);
  };

  // --- UI Components ---
  const KeyValueEditor = ({ items, setItems }: { items: KeyValuePair[], setItems: (i: KeyValuePair[]) => void }) => {
      const addRow = () => setItems([...items, { id: Math.random().toString(), key: '', value: '', enabled: true }]);
      const removeRow = (id: string) => setItems(items.filter(i => i.id !== id));
      const updateRow = (id: string, field: keyof KeyValuePair, val: any) => {
          setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
      };

      return (
          <div className="space-y-3">
              {items.map(row => (
                  <div key={row.id} className="flex gap-3 items-center animate-fade-in">
                      <input 
                        type="checkbox" 
                        checked={row.enabled} 
                        onChange={e => updateRow(row.id, 'enabled', e.target.checked)}
                        className="accent-neu-accent w-5 h-5 cursor-pointer"
                      />
                      <input 
                        className="bg-neu-base border border-transparent focus:border-neu-accent/20 rounded-xl px-4 py-2 text-sm w-1/3 outline-none shadow-neu-pressed transition-all"
                        placeholder={t.tools.httpRequest.key}
                        value={row.key}
                        onChange={e => updateRow(row.id, 'key', e.target.value)}
                        spellCheck={false}
                      />
                      <input 
                        className="bg-neu-base border border-transparent focus:border-neu-accent/20 rounded-xl px-4 py-2 text-sm flex-1 outline-none shadow-neu-pressed transition-all"
                        placeholder={t.tools.httpRequest.value}
                        value={row.value}
                        onChange={e => updateRow(row.id, 'value', e.target.value)}
                        spellCheck={false}
                      />
                      <button onClick={() => removeRow(row.id)} className="p-2 text-neu-text/30 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                      </button>
                  </div>
              ))}
              <div className="pt-2">
                <button onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-neu-accent hover:opacity-80 transition-opacity">
                    <Plus size={16} /> {t.common.add}
                </button>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in px-6 py-4 pb-20">
      <div className="text-center">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.httpRequest.title}</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: MAIN TOOL */}
        <div className="flex-1 space-y-8 min-w-0">
            {/* Top: Protocol Switch */}
            <div className="flex justify-center">
                <div className="bg-neu-base p-1.5 rounded-full shadow-neu-pressed flex gap-2">
                    <button 
                        onClick={() => setProtocol('HTTP')} 
                        className={`px-8 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${protocol === 'HTTP' ? 'bg-neu-base shadow-neu-flat text-neu-accent scale-105' : 'text-neu-text/50 hover:text-neu-text'}`}
                    >
                        <Globe size={16} /> HTTP
                    </button>
                    <button 
                        onClick={() => setProtocol('WS')} 
                        className={`px-8 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${protocol === 'WS' ? 'bg-neu-base shadow-neu-flat text-neu-accent scale-105' : 'text-neu-text/50 hover:text-neu-text'}`}
                    >
                        <ArrowRightLeft size={16} /> WebSocket
                    </button>
                </div>
            </div>

            {/* Request Bar */}
            <NeuCard className="!p-6 z-20 relative">
                <div className="flex flex-col md:flex-row gap-5">
                    {protocol === 'HTTP' && (
                        <div className="relative w-full md:w-36 shrink-0">
                            <select 
                                value={method} 
                                onChange={e => setMethod(e.target.value)}
                                className="w-full appearance-none bg-neu-base text-neu-text px-6 py-3.5 rounded-2xl shadow-neu-pressed outline-none font-bold cursor-pointer text-center tracking-wide"
                            >
                                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown size={14}/></div>
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <NeuInput 
                            value={url}
                            onChange={e => handleUrlChange(e.target.value)}
                            onPaste={handleSmartPaste}
                            placeholder={protocol === 'HTTP' ? 'https://api.example.com' : 'wss://echo.websocket.org'}
                            className="font-mono text-sm !py-3.5 !rounded-2xl"
                            spellCheck={false}
                        />
                    </div>

                    <div className="shrink-0 flex gap-3">
                        <NeuButton 
                            onClick={resetRequest} 
                            variant="default"
                            className="!px-4 !py-3.5 !rounded-2xl w-full md:w-auto text-neu-text/50 hover:text-red-500"
                            title={t.common.delete}
                        >
                            <RotateCcw size={20} />
                        </NeuButton>

                        {protocol === 'HTTP' ? (
                            <NeuButton 
                                onClick={sendRequest} 
                                disabled={isLoading} 
                                variant="primary"
                                className="!px-8 !py-3.5 !rounded-2xl w-full md:w-auto"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
                                <span className="ml-2">{t.tools.httpRequest.send}</span>
                            </NeuButton>
                        ) : (
                            <NeuButton 
                                onClick={toggleWsConnection} 
                                variant={wsConnected ? 'danger' : 'primary'}
                                className="!px-8 !py-3.5 !rounded-2xl w-full md:w-auto"
                            >
                                {wsConnected ? <WifiOff size={20} /> : <Wifi size={20} />}
                                <span className="ml-2">{wsConnected ? t.tools.httpRequest.disconnect : t.tools.httpRequest.connect}</span>
                            </NeuButton>
                        )}
                    </div>
                </div>
            </NeuCard>

            {/* Config Card */}
            <NeuCard className="!p-0 overflow-hidden flex flex-col min-h-[200px]">
                <div className="flex border-b border-neu-text/5 overflow-x-auto no-scrollbar gap-2 px-6 pt-5 shrink-0 bg-neu-base">
                    {[
                        { id: 'params', label: t.tools.httpRequest.tabs.params },
                        { id: 'headers', label: t.tools.httpRequest.tabs.headers, show: protocol === 'HTTP' },
                        { id: 'body', label: t.tools.httpRequest.tabs.body, show: protocol === 'HTTP' },
                    ].filter(tabItem => tabItem.show !== false).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveConfigTab(tab.id as any)}
                            className={`px-6 pb-4 font-bold text-sm whitespace-nowrap transition-all border-b-[3px] rounded-t-lg ${activeConfigTab === tab.id ? 'text-neu-accent border-neu-accent' : 'text-neu-text/50 border-transparent'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 bg-neu-base/30">
                    {activeConfigTab === 'params' && <KeyValueEditor items={params} setItems={setParams} />}
                    {activeConfigTab === 'headers' && <KeyValueEditor items={headers} setItems={setHeaders} />}
                    {activeConfigTab === 'body' && (
                        <div className="h-[120px] border-none rounded-2xl overflow-hidden shadow-neu-pressed bg-neu-base">
                            <CodeEditor 
                                value={body} 
                                onChange={v => setBody(v || '')} 
                                language="json" 
                                height="100%" 
                                className="h-full border-0 !shadow-none !rounded-none"
                            />
                        </div>
                    )}
                </div>
            </NeuCard>

            {/* Response / Log Card */}
            <NeuCard className="!p-0 overflow-hidden flex flex-col min-h-[400px]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neu-text/5 flex flex-wrap justify-between items-center bg-neu-base shrink-0 gap-4">
                    <span className="font-bold text-neu-text text-sm uppercase tracking-wider flex items-center gap-2">
                        {protocol === 'HTTP' ? t.tools.httpRequest.tabs.response : t.tools.httpRequest.tabs.wsLog}
                        {responseType && <span className="bg-neu-accent/10 text-neu-accent px-2 py-0.5 rounded text-[10px] border border-neu-accent/20">{responseType}</span>}
                    </span>
                    
                    {protocol === 'HTTP' && status !== null && (
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider items-center bg-neu-base shadow-neu-pressed px-4 py-2 rounded-xl">
                            <span className={`flex items-center gap-1 ${status >= 200 && status < 300 ? 'text-green-500' : 'text-red-500'}`}>
                                <span className={`w-2 h-2 rounded-full ${status >= 200 && status < 300 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {status}
                            </span>
                            {timeTaken && <span className="text-neu-text/40 border-l border-neu-text/10 pl-4">{timeTaken}ms</span>}
                            {responseSize && <span className="text-neu-text/40 border-l border-neu-text/10 pl-4">{responseSize}</span>}
                        </div>
                    )}
                    
                    {protocol === 'WS' && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${wsConnected ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            {wsConnected ? 'LIVE' : 'OFFLINE'}
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 bg-neu-base">
                    <div className="w-full h-full rounded-2xl shadow-neu-pressed bg-neu-base overflow-hidden relative">
                        {protocol === 'HTTP' ? (
                            isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-neu-accent/50 flex-col gap-4">
                                    <Loader2 className="animate-spin" size={40} />
                                    <span className="font-bold text-sm animate-pulse">Fetching...</span>
                                </div>
                            ) : (
                                responseText ? (
                                    <CodeEditor 
                                        value={responseText} 
                                        language={detectedLang} 
                                        readOnly 
                                        height="500px"
                                        className="h-full border-0 !shadow-none !rounded-none !bg-transparent" 
                                    />
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center text-neu-text/20 font-bold italic flex-col gap-4">
                                        <MonitorPlay size={48} strokeWidth={1} />
                                        <span>Ready to send request</span>
                                    </div>
                                )
                            )
                        ) : (
                            // WS Log Area
                            <div className="flex flex-col h-[500px]">
                                <div ref={wsLogRef} className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                        {wsMessages.length === 0 && (
                                            <div className="h-full flex items-center justify-center text-neu-text/20 italic">
                                                Waiting for WebSocket messages...
                                            </div>
                                        )}
                                        {wsMessages.map(msg => (
                                            <div key={msg.id} className={`flex flex-col text-xs p-3 rounded-2xl max-w-[85%] shadow-sm ${
                                                msg.type === 'sent' ? 'self-end bg-neu-accent/10 border border-neu-accent/10 text-right' : 
                                                msg.type === 'system' ? 'self-center text-neu-text/40 italic bg-neu-base/50 !shadow-none !border-none' : 
                                                'self-start bg-neu-base border border-neu-text/5'
                                            }`}>
                                                <div className={`flex gap-4 mb-1 opacity-40 text-[10px] font-bold uppercase tracking-wider ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                                                    <span>{msg.type}</span>
                                                    <span>{msg.time}</span>
                                                </div>
                                                <pre className="whitespace-pre-wrap font-mono text-sm">{msg.content}</pre>
                                            </div>
                                        ))}
                                </div>
                                <div className="p-4 bg-neu-base border-t border-neu-text/10 flex gap-3">
                                    <div className="flex-1">
                                        <NeuInput 
                                            value={wsInput}
                                            onChange={e => setWsInput(e.target.value)}
                                            placeholder={t.tools.httpRequest.wsMsgPlaceholder}
                                            onKeyDown={e => e.key === 'Enter' && sendWsMessage()}
                                            disabled={!wsConnected}
                                            className="!py-3 !rounded-xl"
                                            spellCheck={false}
                                        />
                                    </div>
                                    <NeuButton 
                                        onClick={sendWsMessage} 
                                        disabled={!wsConnected} 
                                        variant="primary"
                                        className="!rounded-xl !px-4"
                                    >
                                        <Send size={20} />
                                    </NeuButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </NeuCard>
        </div>

        {/* RIGHT COLUMN: HISTORY SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0">
             <NeuCard title={`${t.tools.httpRequest.tabs.history} (${history.length})`} className="h-full flex flex-col min-h-[600px]">
                 {/* Concave Well for History Items (Inset) */}
                 <div className="bg-neu-base shadow-neu-pressed rounded-[24px] p-4 flex-1 overflow-hidden flex flex-col relative h-[600px]">
                     <div className="overflow-y-auto px-2 space-y-4 flex-1 custom-scrollbar h-full pt-1">
                         {history.length === 0 && (
                             <div className="text-center py-8 text-neu-text/30 italic text-sm">
                                {t.tools.passwordGen.historyEmpty || 'No History'}
                             </div>
                         )}
                         
                         {history.map((item) => (
                             <div 
                                key={item.id} 
                                onClick={() => restoreRequest(item)}
                                className={`
                                    relative group
                                    p-4 rounded-xl cursor-pointer
                                    bg-gradient-to-br from-neu-accent/5 to-transparent dark:from-neu-accent/20 dark:to-transparent
                                    border 
                                    ${item.pinned ? 'border-neu-accent/50 from-neu-accent/10' : 'border-neu-accent/10 dark:border-neu-accent/20'}
                                    hover:border-neu-accent/50 hover:from-neu-accent/10 hover:to-transparent
                                    flex flex-col gap-3
                                    transition-all duration-300
                                `}
                             >
                                {/* Header: Method + Date */}
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-neu-base shadow-sm border border-black/5 ${
                                        item.method === 'GET' ? 'text-green-600' :
                                        item.method === 'POST' ? 'text-blue-600' :
                                        item.method === 'DELETE' ? 'text-red-600' :
                                        item.method === 'PUT' ? 'text-orange-500' :
                                        'text-neu-text'
                                    }`}>
                                        {item.method}
                                    </span>
                                    <span className="text-[10px] text-neu-text/30 font-mono">
                                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                
                                {/* Body: Name/URL */}
                                <div>
                                    {editingId === item.id ? (
                                        /* Edit Mode */
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="text" 
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="w-full bg-neu-base shadow-inner rounded px-2 py-1 text-xs font-bold text-neu-text outline-none focus:ring-1 focus:ring-neu-accent"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && saveRename()}
                                            />
                                            <button onClick={saveRename} className="text-green-500 hover:text-green-600"><Check size={14}/></button>
                                            <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600"><X size={14}/></button>
                                        </div>
                                    ) : (
                                        /* Display Mode */
                                        <div className="group/title flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-neu-text text-xs truncate" title={item.name}>
                                                {item.name}
                                            </h4>
                                            <button 
                                                onClick={(e) => startRename(item.id, item.name, e)}
                                                className="opacity-0 group-hover/title:opacity-100 text-neu-text/30 hover:text-neu-accent transition-opacity p-1"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-neu-text/40 truncate font-mono mt-1" title={item.url}>
                                        {item.url}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-black/5 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => togglePin(item.id, e)}
                                        className={`p-1.5 rounded-full hover:bg-neu-base hover:shadow-sm transition-all ${item.pinned ? 'text-neu-accent' : 'text-neu-text/30 hover:text-neu-accent'}`}
                                        title={item.pinned ? t.tools.passwordGen.unpin : t.tools.passwordGen.pin}
                                    >
                                        {item.pinned ? <Pin size={12} fill="currentColor" /> : <PinOff size={12} />}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                                        className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 text-neu-text/30 transition-all"
                                        title={t.common.delete}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                {/* Delete Confirmation Overlay */}
                                {deleteId === item.id && (
                                    <div className="absolute inset-0 z-10 bg-neu-base/90 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-2 animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs font-bold text-red-500 mb-2">{t.tools.passwordGen.confirmDelete}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => deleteHistoryItem(item.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold shadow-md hover:bg-red-600"
                                            >
                                                {t.common.yes}
                                            </button>
                                            <button 
                                                onClick={() => setDeleteId(null)}
                                                className="px-3 py-1 bg-white text-neu-text rounded-full text-[10px] font-bold shadow-md hover:bg-gray-100"
                                            >
                                                {t.common.no}
                                            </button>
                                        </div>
                                    </div>
                                )}
                             </div>
                         ))}
                     </div>
                 </div>
             </NeuCard>
        </div>

      </div>
    </div>
  );
};
