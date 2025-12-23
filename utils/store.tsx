
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, ToolId, Note, NoteTask } from '../types';
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
  const [language, setLanguage] = useState<Language>('zh');
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
    
    // Set language first so we can use correct translations if needed
    let currentLang = language;
    if (savedLang) {
      setLanguage(savedLang);
      currentLang = savedLang;
    }
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
        let loadedNotes: Note[] = JSON.parse(savedNotes);
        
        // --- Migration Logic for Expired Notes ---
        // 1. Identify notes that are NOT pinned and createdAt < today
        // 2. Extract unfinished tasks
        // 3. Create a new note with those tasks
        // 4. Remove those tasks from old notes
        
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
            const title = translations[currentLang].tools.myNotes.migratedTitle + ' ' + new Date().toLocaleDateString();
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
        // Initial Sample Note (Localized default for ZH)
        setNotes([{
            id: '1',
            title: '欢迎使用',
            color: 'bg-yellow-200',
            tasks: [{ id: 't1', text: '创建您的第一条便签', done: false }],
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
