import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2 } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { NeuTextArea } from '../ui/NeuInput';
import { useAppStore } from '../../utils/store';

export const AiAssistant: React.FC = () => {
  const { t } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateIdea = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error('API Key not configured.');
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a creative brainstorming assistant. Keep responses concise, inspiring, and formatted with simple bullet points if listing items.",
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
          <NeuTextArea 
            placeholder={t.tools.aiIdea.placeholder}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="flex justify-end">
            <NeuButton onClick={generateIdea} disabled={loading} variant="primary">
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