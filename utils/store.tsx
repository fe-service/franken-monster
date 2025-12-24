
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, ToolId, Note, NoteTask, AiModelConfig } from '../types';
import { translations } from './translations';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: any; // Helper for translations
  recentTools: ToolId[];
  addRecentTool: (id: ToolId) => void;
  favoriteTools: ToolId[];
  toggleFavorite: (id: ToolId) => void;
  notes: Note[];
  updateNotes: (notes: Note[]) => void;
  // AI Configs
  aiModels: AiModelConfig[];
  updateAiModels: (models: AiModelConfig[]) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize Language: Check LocalStorage -> Check Browser -> Default 'zh'
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('neubox_lang') as Language;
        if (saved) return saved;
        
        // Detect browser language
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);
        if (browserLang && browserLang.toLowerCase().includes('en')) {
            return 'en';
        }
    }
    return 'zh'; // Default to Chinese if not English
  });

  // Initialize Theme: Check LocalStorage -> Check System Preference -> Default 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('neubox_theme') as Theme;
        if (saved) return saved;
        
        // Detect system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    return 'light';
  });

  const [recentTools, setRecentTools] = useState<ToolId[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<ToolId[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // AI Models State
  const [aiModels, setAiModels] = useState<AiModelConfig[]>([]);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Load saved data (Settings are handled in useState init, but we ensure consistency here)
  useEffect(() => {
    const savedRecents = localStorage.getItem('neubox_recents');
    const savedFavorites = localStorage.getItem('neubox_favorites');
    const savedNotes = localStorage.getItem('neubox_notes');
    const savedModels = localStorage.getItem('neubox_ai_models');
    
    // Ensure the theme attribute is set on mount (in case it changed during hydration or wasn't set by index.html logic correctly)
    document.documentElement.setAttribute('data-theme', theme);

    if (savedRecents) {
      try {
        setRecentTools(JSON.parse(savedRecents));
      } catch (e) {
        console.error('Failed to parse recent tools', e);
      }
    }
    if (savedFavorites) {
      try {
        setFavoriteTools(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorite tools', e);
      }
    }
    if (savedModels) {
      try {
        setAiModels(JSON.parse(savedModels));
      } catch (e) {
        console.error('Failed to parse models', e);
      }
    }
    
    if (savedNotes) {
      try {
        let loadedNotes: Note[] = JSON.parse(savedNotes);
        
        // --- Migration Logic for Expired Notes ---
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        let unfinishedTasks: NoteTask[] = [];
        let hasChanges = false;

        const processedNotes = loadedNotes.map(n => {
           // Ensure new fields exist for legacy data
           const note = { 
               ...n, 
               createdAt: n.createdAt || Date.now(),
               pinned: n.pinned || false 
           };

           if (note.pinned) return note;

           // Check if note is from before today
           const noteDate = new Date(note.createdAt);
           const noteStartOfDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate()).getTime();

           if (noteStartOfDay < startOfToday) {
               // Extract unfinished tasks
               const openTasks = note.tasks.filter(t => !t.done);
               if (openTasks.length > 0) {
                   unfinishedTasks = [...unfinishedTasks, ...openTasks];
                   hasChanges = true;
                   
                   // Remove moved tasks from old note
                   return {
                       ...note,
                       tasks: note.tasks.filter(t => t.done)
                   };
               }
           }
           return note;
        });

        let finalNotes = processedNotes;

        if (unfinishedTasks.length > 0) {
            // Use current language for the migrated title
            const title = translations[language].tools.myNotes.migratedTitle + ' ' + new Date().toLocaleDateString();
            const migratedNote: Note = {
                id: Date.now().toString(),
                title: title,
                color: 'bg-yellow-200',
                tasks: unfinishedTasks,
                createdAt: Date.now(),
                pinned: false
            };
            finalNotes = [migratedNote, ...processedNotes];
            hasChanges = true;
        }

        setNotes(finalNotes);
        if (hasChanges) {
            localStorage.setItem('neubox_notes', JSON.stringify(finalNotes));
        }

      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    } else {
        // Initial Sample Note
        const isZh = language === 'zh';
        setNotes([{
            id: '1',
            title: isZh ? '欢迎使用' : 'Welcome',
            color: 'bg-yellow-200',
            tasks: [{ id: 't1', text: isZh ? '创建您的第一条便签' : 'Create your first note', done: false }],
            createdAt: Date.now(),
            pinned: true
        }]);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('neubox_lang', lang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('neubox_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const addRecentTool = (id: ToolId) => {
    if (id === ToolId.DASHBOARD) return;

    setRecentTools(prev => {
      // Remove existing occurrence of the id, add to front, slice to keep max 4
      const newRecents = [id, ...prev.filter(toolId => toolId !== id)].slice(0, 4);
      localStorage.setItem('neubox_recents', JSON.stringify(newRecents));
      return newRecents;
    });
  };

  const toggleFavorite = (id: ToolId) => {
    setFavoriteTools(prev => {
      let newFavorites;
      if (prev.includes(id)) {
        newFavorites = prev.filter(toolId => toolId !== id);
      } else {
        newFavorites = [...prev, id];
      }
      localStorage.setItem('neubox_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const updateNotes = (newNotes: Note[]) => {
      setNotes(newNotes);
      localStorage.setItem('neubox_notes', JSON.stringify(newNotes));
  };
  
  const updateAiModels = (newModels: AiModelConfig[]) => {
      setAiModels(newModels);
      localStorage.setItem('neubox_ai_models', JSON.stringify(newModels));
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      theme, 
      toggleTheme, 
      t,
      recentTools,
      addRecentTool,
      favoriteTools,
      toggleFavorite,
      notes,
      updateNotes,
      aiModels,
      updateAiModels,
      isSettingsOpen,
      setSettingsOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
