
import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Cpu } from 'lucide-react';
import { NeuCard } from './NeuCard';
import { NeuButton } from './NeuButton';
import { NeuInput, NeuTextArea } from './NeuInput';
import { useAppStore } from '../../utils/store';
import { AiModelConfig, AiModelType, ToolId } from '../../types';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, t, aiModels, updateAiModels } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AiModelConfig>>({});

  if (!isSettingsOpen) return null;

  const handleClose = () => {
    setEditingId(null);
    setFormData({});
    setSettingsOpen(false);
  };

  const startEdit = (model?: AiModelConfig) => {
    if (model) {
      setEditingId(model.id);
      setFormData({ ...model });
    } else {
      setEditingId('new');
      setFormData({
        id: Date.now().toString(),
        name: '',
        apiKey: '',
        apiUrl: '',
        sortOrder: 0,
        modelType: 'text',
        boundTools: [],
        systemPrompt: ''
      });
    }
  };

  const saveModel = () => {
    if (!formData.name || !formData.apiKey) return;

    const newModel = formData as AiModelConfig;
    
    if (editingId === 'new') {
      updateAiModels([...aiModels, newModel]);
    } else {
      updateAiModels(aiModels.map(m => m.id === editingId ? newModel : m));
    }
    setEditingId(null);
    setFormData({});
  };

  const deleteModel = (id: string) => {
    updateAiModels(aiModels.filter(m => m.id !== id));
  };
  
  const toggleBoundTool = (toolId: ToolId) => {
      const currentTools = formData.boundTools || [];
      if (currentTools.includes(toolId)) {
          setFormData({ ...formData, boundTools: currentTools.filter(t => t !== toolId) });
      } else {
          setFormData({ ...formData, boundTools: [...currentTools, toolId] });
      }
  };

  const sortedModels = [...aiModels].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neu-base/80 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
        <NeuCard className="flex flex-col h-full !p-0 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-black/5 shrink-0">
                <h2 className="text-2xl font-black text-neu-text flex items-center gap-2">
                    <Cpu size={24} className="text-neu-accent"/> {t.settings.title}
                </h2>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/5 text-neu-text/60 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* Mode: List */}
                {!editingId && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-neu-text/70 uppercase tracking-wider text-sm">{t.settings.models}</h3>
                            <NeuButton onClick={() => startEdit()} className="!py-2 !px-4 text-sm">
                                <Plus size={16} /> {t.settings.addModel}
                            </NeuButton>
                        </div>

                        {sortedModels.length === 0 ? (
                            <div className="text-center py-12 bg-neu-base shadow-neu-pressed rounded-2xl text-neu-text/40 font-medium">
                                {t.settings.noModels}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {sortedModels.map(model => (
                                    <div key={model.id} className="bg-neu-base shadow-neu-flat rounded-2xl p-4 flex justify-between items-center group hover:scale-[1.01] transition-transform">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-neu-base shadow-neu-pressed flex items-center justify-center font-bold text-neu-accent">
                                                {model.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-neu-text">{model.name}</h4>
                                                <div className="flex gap-2 text-xs font-bold text-neu-text/40 uppercase tracking-wider mt-1">
                                                    <span className="bg-neu-base px-2 py-0.5 rounded shadow-neu-flat">{t.settings.types[model.modelType]}</span>
                                                    {model.boundTools.length > 0 && (
                                                        <span className="bg-neu-accent/10 text-neu-accent px-2 py-0.5 rounded">
                                                            {model.boundTools.length} Tools
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(model)} className="p-2 text-neu-text/50 hover:text-neu-accent transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => deleteModel(model.id)} className="p-2 text-neu-text/50 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Mode: Edit */}
                {editingId && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NeuInput 
                                label={t.settings.fields.name}
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="gemini-2.0-flash"
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4">{t.settings.fields.type}</label>
                                <select 
                                    className="w-full bg-neu-base rounded-full px-6 py-3 text-neu-text shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 font-bold cursor-pointer appearance-none"
                                    value={formData.modelType}
                                    onChange={e => setFormData({...formData, modelType: e.target.value as AiModelType})}
                                >
                                    <option value="text">{t.settings.types.text}</option>
                                    <option value="coding">{t.settings.types.coding}</option>
                                    <option value="image">{t.settings.types.image}</option>
                                    <option value="video">{t.settings.types.video}</option>
                                </select>
                            </div>
                            
                            <NeuInput 
                                label={t.settings.fields.apiUrl}
                                value={formData.apiUrl}
                                onChange={e => setFormData({...formData, apiUrl: e.target.value})}
                                placeholder="https://generativelanguage.googleapis.com"
                            />
                            <NeuInput 
                                label={t.settings.fields.apiKey}
                                value={formData.apiKey}
                                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                type="password"
                                placeholder="sk-..."
                            />
                            
                            <div className="md:col-span-2">
                                <NeuInput 
                                    label={t.settings.fields.order}
                                    value={formData.sortOrder}
                                    onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})}
                                    type="number"
                                    className="!w-32"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neu-text/60 ml-4 mb-2 block">{t.settings.fields.tools}</label>
                                <div className="bg-neu-base shadow-neu-pressed rounded-2xl p-4 flex flex-wrap gap-2">
                                    {[ToolId.AI_IDEA].map(toolId => (
                                        <button 
                                            key={toolId}
                                            onClick={() => toggleBoundTool(toolId)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent ${
                                                formData.boundTools?.includes(toolId) 
                                                ? 'bg-neu-accent text-white shadow-neu-flat'
                                                : 'bg-neu-base text-neu-text/60 hover:text-neu-text shadow-neu-flat'
                                            }`}
                                        >
                                            {toolId === ToolId.AI_IDEA ? t.tools.aiIdea.name : toolId}
                                        </button>
                                    ))}
                                    {/* Placeholder for future tools */}
                                    <span className="text-xs text-neu-text/30 flex items-center px-2">More tools coming soon...</span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <NeuTextArea 
                                    label={t.settings.fields.systemPrompt}
                                    value={formData.systemPrompt}
                                    onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-black/5">
                            <NeuButton onClick={() => setEditingId(null)} className="flex-1" variant="default">
                                {t.common.cancel}
                            </NeuButton>
                            <NeuButton onClick={saveModel} className="flex-1" variant="primary">
                                <Check size={20} /> {t.common.save}
                            </NeuButton>
                        </div>
                    </div>
                )}

            </div>
        </NeuCard>
      </div>
    </div>
  );
};
