import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, ToolId, Note } from '../types';
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [recentTools, setRecentTools] = useState<ToolId[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<ToolId[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Load saved settings
  useEffect(() => {
    const savedLang = localStorage.getItem('neubox_lang') as Language;
    const savedTheme = localStorage.getItem('neubox_theme') as Theme;
    const savedRecents = localStorage.getItem('neubox_recents');
    const savedFavorites = localStorage.getItem('neubox_favorites');
    const savedNotes = localStorage.getItem('neubox_notes');
    
    if (savedLang) setLanguage(savedLang);
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
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
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    } else {
        // Initial Sample Note
        setNotes([{
            id: '1',
            title: 'Welcome',
            color: 'bg-yellow-100 dark:bg-yellow-900/30',
            tasks: [{ id: 't1', text: 'Create your first note', done: false }]
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
      // Remove existing occurrence of the id, add to front, slice to keep max 3
      const newRecents = [id, ...prev.filter(toolId => toolId !== id)].slice(0, 3);
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
      updateNotes
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