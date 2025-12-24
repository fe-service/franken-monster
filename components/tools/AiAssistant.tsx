
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { NeuTextArea } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';
import { ToolId, AiModelConfig } from '../../types';

export const AiAssistant: React.FC = () => {
  const { t, aiModels, setSettingsOpen } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Available Models for this tool (Bound to AI_IDEA or generic unbound)
  const availableModels = aiModels
    .filter(m => m.boundTools.length === 0 || m.boundTools.includes(ToolId.AI_IDEA))
    .sort((a, b) => a.sortOrder - b.sortOrder);
    
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Default select first available model
  useEffect(() => {
      if (availableModels.length > 0 && !selectedModelId) {
          setSelectedModelId(availableModels[0].id);
      }
  }, [availableModels, selectedModelId]);

  const generateIdea = async () => {
    if (!prompt.trim()) return;
    
    const selectedModel = availableModels.find(m => m.id === selectedModelId);
    
    if (!selectedModel) {
        setError(t.tools.aiIdea.noModelConfigured);
        return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Use the User's API Key
      const apiKey = selectedModel.apiKey;
      
      if (!apiKey) {
        throw new Error('API Key is missing for the selected model.');
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const result = await ai.models.generateContent({
        model: selectedModel.name,
        contents: prompt,
        config: {
          systemInstruction: selectedModel.systemPrompt || "You are a creative brainstorming assistant. Keep responses concise, inspiring, and formatted with simple bullet points if listing items.",
        }
      });
      
      setResponse(result.text || 'No response generated.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.tools.aiIdea.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.aiIdea.title}</h2>
        <p className="text-neu-text/60">{t.tools.aiIdea.subtitle}</p>
      </div>

      <NeuCard>
        <div className="space-y-6">
          {/* Model Selector */}
          <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{t.tools.aiIdea.selectModel}</label>
              {availableModels.length > 0 ? (
                  <div className="relative">
                     <select 
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        className="w-full appearance-none bg-neu-base text-neu-text px-6 py-3 rounded-full shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer"
                     >
                         {availableModels.map(m => (
                             <option key={m.id} value={m.id}>{m.name}</option>
                         ))}
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neu-text/60">
                        <ChevronDown size={16} />
                     </div>
                  </div>
              ) : (
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 font-bold text-sm">
                          <AlertTriangle size={16} />
                          {t.tools.aiIdea.noModelConfigured}
                      </div>
                      <button 
                        onClick={() => setSettingsOpen(true)}
                        className="underline text-sm font-bold hover:text-red-600"
                      >
                          {t.app.settings}
                      </button>
                  </div>
              )}
          </div>

          <NeuTextArea 
            placeholder={t.tools.aiIdea.placeholder}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="flex justify-end">
            <NeuButton onClick={generateIdea} disabled={loading || !selectedModelId} variant="primary">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {loading ? t.tools.aiIdea.thinking : t.tools.aiIdea.button}
            </NeuButton>
          </div>
        </div>
      </NeuCard>

      {(response || error) && (
        <NeuCard className="animate-slide-up">
           {error ? (
             <div className="text-red-500 font-medium text-center p-4">
               {error}
             </div>
           ) : (
             <div className="prose prose-slate dark:prose-invert max-w-none text-neu-text leading-relaxed whitespace-pre-line">
               {response}
             </div>
           )}
        </NeuCard>
      )}
    </div>
  );
};
