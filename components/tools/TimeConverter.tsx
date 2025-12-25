
import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Calendar, Globe } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuInput } from '../ui/NeuInput';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';

const COMMON_TIMEZONES = [
    { label: 'Local (Device)', value: 'local' },
    { label: 'UTC', value: 'UTC' },
    { label: 'Shanghai / Beijing (UTC+8)', value: 'Asia/Shanghai' },
    { label: 'Tokyo (UTC+9)', value: 'Asia/Tokyo' },
    { label: 'New York (EST/EDT)', value: 'America/New_York' },
    { label: 'London (GMT/BST)', value: 'Europe/London' },
    { label: 'Paris / Berlin (CET)', value: 'Europe/Paris' },
    { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
    { label: 'Los Angeles (PST/PDT)', value: 'America/Los_Angeles' },
];

export const TimeConverter: React.FC = () => {
  const { t } = useAppStore();
  const [input, setInput] = useState<string>('');
  const [dateObj, setDateObj] = useState<Date | null>(new Date());
  const [timezone, setTimezone] = useState<string>('local');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setInput(new Date().valueOf().toString());
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setDateObj(null);
      return;
    }

    let d: Date | null = null;
    const cleanInput = input.trim();

    // Check if pure number (Timestamp)
    if (/^\d+$/.test(cleanInput)) {
        const num = parseInt(cleanInput, 10);
        // Heuristic: If < 10000000000 (10 digits), assume Seconds. (Up to year 2286)
        // Milliseconds usually 13 digits.
        if (cleanInput.length <= 10) {
            d = new Date(num * 1000);
        } else {
            d = new Date(num);
        }
    } else {
        // Try standard string parsing
        const parsed = new Date(cleanInput);
        if (!isNaN(parsed.getTime())) {
            d = parsed;
        }
    }

    setDateObj(d);
  }, [input]);

  const setNow = () => {
      const now = new Date();
      setInput(now.valueOf().toString());
  };

  const copy = (text: string, key: string) => {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
  };

  // Helper to format date based on timezone and pattern
  const formatDateTime = (date: Date, tz: string, type: 'chinese' | 'stdDash' | 'stdSlash' | 'compact' | 'iso' | 'time' | 'date') => {
      const options: Intl.DateTimeFormatOptions = {
          timeZone: tz === 'local' ? undefined : tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          weekday: type === 'chinese' ? 'long' : undefined,
      };

      // Use zh-CN for the Chinese format to get "星期X", others use en-CA/sv-SE (ISO-like) structure or manual
      const locale = type === 'chinese' ? 'zh-CN' : 'en-US';
      
      const formatter = new Intl.DateTimeFormat(locale, options);
      const parts = formatter.formatToParts(date);
      
      const getPart = (name: string) => parts.find(p => p.type === name)?.value || '';

      const Y = getPart('year');
      const M = getPart('month');
      const D = getPart('day');
      const h = getPart('hour');
      const m = getPart('minute');
      const s = getPart('second');
      const w = getPart('weekday');

      switch (type) {
          case 'chinese':
              return `${Y}年${M}月${D}日 ${h}时${m}分${s}秒 ${w}`;
          case 'stdDash':
              return `${Y}-${M}-${D} ${h}:${m}:${s}`;
          case 'stdSlash':
              return `${Y}/${M}/${D} ${h}:${m}:${s}`;
          case 'compact':
              return `${Y}${M}${D}${h}${m}${s}`;
          case 'time':
              return `${h}:${m}:${s}`;
          case 'date':
              return `${Y}-${M}-${D}`;
          default:
              return '';
      }
  };

  const ResultRow = ({ label, value, id }: { label: string, value: string, id: string }) => (
    <div className="bg-neu-base rounded-xl shadow-neu-flat p-4 flex flex-col md:flex-row justify-between items-center gap-4 group">
       <div className="flex flex-col gap-1 w-full overflow-hidden">
           <span className="text-xs font-bold uppercase text-neu-text/50 tracking-wider">{label}</span>
           <span className="text-neu-text font-mono font-bold truncate select-all">{value}</span>
       </div>
       <button 
         onClick={() => copy(value, id)}
         className="p-2 rounded-full bg-neu-base shadow-neu-flat text-neu-text/50 hover:text-neu-accent active:scale-95 transition-all shrink-0"
         title="Copy"
       >
         {copiedKey === id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
       </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.timeConverter.title}</h2>
        <p className="text-neu-text/60">{t.tools.timeConverter.subtitle}</p>
      </div>

      <NeuCard className="space-y-8">
         {/* Input Section */}
         <div className="flex gap-4 items-end">
             <div className="flex-1">
                 <NeuInput 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    label={t.tools.timeConverter.input}
                    placeholder="1678888888 or 2024-01-01"
                    leftIcon={<Calendar size={18} />}
                    className="font-mono"
                 />
             </div>
             <NeuButton onClick={setNow} className="!px-6 h-[50px] mb-0.5">
                 <Clock size={18} /> <span className="hidden md:inline">{t.tools.timeConverter.now}</span>
             </NeuButton>
         </div>

         {/* Timezone Selector */}
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4 flex items-center gap-2">
                <Globe size={12} /> {t.tools.timeConverter.timezone}
            </label>
            <div className="relative">
                <select 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full appearance-none bg-neu-base text-neu-text px-6 py-3 rounded-full shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer"
                >
                    {COMMON_TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                </select>
            </div>
         </div>

         <div className="h-0.5 w-full bg-neu-base shadow-neu-pressed rounded-full"></div>

         <div className="space-y-4">
            {dateObj ? (
                <>
                   {/* Timestamps (Invariant) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <ResultRow 
                         id="ts_ms" 
                         label={t.tools.timeConverter.formats.timestampMs} 
                         value={dateObj.valueOf().toString()} 
                       />
                       <ResultRow 
                         id="ts_s" 
                         label={t.tools.timeConverter.formats.timestampSec} 
                         value={Math.floor(dateObj.valueOf() / 1000).toString()} 
                       />
                   </div>

                   {/* Custom Formats */}
                   <ResultRow 
                      id="chinese" 
                      label={t.tools.timeConverter.formats.chinese} 
                      value={formatDateTime(dateObj, timezone, 'chinese')} 
                   />
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultRow 
                            id="stdDash" 
                            label={t.tools.timeConverter.formats.stdDash} 
                            value={formatDateTime(dateObj, timezone, 'stdDash')} 
                        />
                        <ResultRow 
                            id="stdSlash" 
                            label={t.tools.timeConverter.formats.stdSlash} 
                            value={formatDateTime(dateObj, timezone, 'stdSlash')} 
                        />
                   </div>

                   {/* UTC now moved to full row for better fit */}
                   <ResultRow 
                      id="utc" 
                      label={t.tools.timeConverter.formats.utc} 
                      value={dateObj.toUTCString()} 
                   />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <ResultRow 
                          id="iso" 
                          label={t.tools.timeConverter.formats.iso} 
                          value={dateObj.toISOString()} 
                       />
                       {/* Compact moved to grid */}
                       <ResultRow 
                          id="compact" 
                          label={t.tools.timeConverter.formats.compact} 
                          value={formatDateTime(dateObj, timezone, 'compact')} 
                       />
                   </div>
                </>
            ) : (
                <div className="text-center py-8 text-red-500 font-bold opacity-70">
                    {t.tools.timeConverter.invalid}
                </div>
            )}
         </div>
      </NeuCard>
    </div>
  );
};
