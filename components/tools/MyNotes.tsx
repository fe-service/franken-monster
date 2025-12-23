
import React, { useEffect, useRef } from 'react';
import { Plus, X, Trash2, CheckSquare, Square, Palette, Download, Upload, Pin, PinOff, CalendarClock } from 'lucide-react';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';
import { Note } from '../../types';

// Updated Colors: Use brighter, opaque pastel colors. 
// We removed dark mode transparency to ensure black text is always readable.
const colors = [
  'bg-yellow-200',
  'bg-blue-200',
  'bg-green-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-orange-200',
];

export const MyNotes: React.FC = () => {
  const { t, notes, updateNotes } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle browser close prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require setting returnValue for the dialog to appear
      e.returnValue = ''; 
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const addNote = () => {
    let currentNotes = [...notes];
    
    // Auto-Cleanup: Limit to 20 notes
    if (currentNotes.length >= 20) {
        // Find oldest non-pinned note
        const sorted = [...currentNotes].sort((a, b) => a.createdAt - b.createdAt);
        const oldestUnpinnedIndex = sorted.findIndex(n => !n.pinned);
        
        if (oldestUnpinnedIndex !== -1) {
            const idToDelete = sorted[oldestUnpinnedIndex].id;
            currentNotes = currentNotes.filter(n => n.id !== idToDelete);
        }
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      color: colors[Math.floor(Math.random() * colors.length)],
      tasks: [],
      createdAt: Date.now(),
      pinned: false
    };
    
    // Add new note to the top (or after pinned ones ideally, but top is fine for now)
    updateNotes([newNote, ...currentNotes]);
  };

  const deleteNote = (id: string) => {
    updateNotes(notes.filter(n => n.id !== id));
  };

  const updateNoteTitle = (id: string, title: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, title } : n);
    updateNotes(newNotes);
  };

  const changeNoteColor = (id: string, color: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, color } : n);
    updateNotes(newNotes);
  };

  const togglePin = (id: string) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    updateNotes(newNotes);
  };

  const addTask = (noteId: string) => {
    const newNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          tasks: [...n.tasks, { id: Date.now().toString(), text: '', done: false }]
        };
      }
      return n;
    });
    updateNotes(newNotes);
  };

  const updateTask = (noteId: string, taskId: string, text: string) => {
    const newNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          tasks: n.tasks.map(task => task.id === taskId ? { ...task, text } : task)
        };
      }
      return n;
    });
    updateNotes(newNotes);
  };

  const toggleTask = (noteId: string, taskId: string) => {
    const newNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          tasks: n.tasks.map(task => task.id === taskId ? { ...task, done: !task.done } : task)
        };
      }
      return n;
    });
    updateNotes(newNotes);
  };

  const deleteTask = (noteId: string, taskId: string) => {
    const newNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          tasks: n.tasks.filter(t => t.id !== taskId)
        };
      }
      return n;
    });
    updateNotes(newNotes);
  };

  const exportNotes = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `neubox_notes_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedNotes = JSON.parse(json);
        if (Array.isArray(importedNotes)) {
          // Merge logic: Filter out notes with duplicate IDs that already exist
          const existingIds = new Set(notes.map(n => n.id));
          const newNotes = importedNotes.filter((n: any) => n.id && !existingIds.has(n.id));
          
          if (newNotes.length > 0) {
             updateNotes([...newNotes, ...notes]);
          }
        }
      } catch (err) {
        console.error("Failed to import notes", err);
        alert("Invalid backup file");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  // Sorting: Pinned first, then newest
  const sortedNotes = [...notes].sort((a, b) => {
      if (a.pinned === b.pinned) return b.createdAt - a.createdAt;
      return a.pinned ? -1 : 1;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.myNotes.title}</h2>
        <p className="text-neu-text/60">{t.tools.myNotes.subtitle}</p>
      </div>

      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <NeuButton onClick={addNote} variant="primary">
          <Plus size={20} /> {t.tools.myNotes.addNote}
        </NeuButton>
        <NeuButton onClick={exportNotes}>
          <Download size={20} /> {t.tools.myNotes.downloadBackup}
        </NeuButton>
        <NeuButton onClick={triggerImport}>
          <Upload size={20} /> {t.tools.myNotes.importBackup}
        </NeuButton>
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNotes.map(note => (
          <div 
            key={note.id} 
            className={`
                rounded-[24px] shadow-neu-flat p-6 transition-all duration-300 relative group flex flex-col gap-4 
                ${note.color}
                text-gray-900 border border-black/5
            `}
            style={{ minHeight: '300px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <input
                type="text"
                value={note.title}
                onChange={(e) => updateNoteTitle(note.id, e.target.value)}
                placeholder={t.tools.myNotes.titlePlaceholder}
                className="bg-transparent text-xl font-bold text-gray-900 placeholder-gray-500/50 outline-none w-full"
              />
              <div className="flex gap-1 items-start">
                {/* Pin Button */}
                <button 
                  onClick={() => togglePin(note.id)}
                  className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${note.pinned ? 'text-gray-900' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
                  title={t.tools.myNotes.pin}
                >
                  {note.pinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                </button>

                <div className="relative group/color opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-full hover:bg-black/10 text-gray-600">
                        <Palette size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white shadow-xl p-2 rounded-xl flex gap-1 z-20 hidden group-hover/color:flex border border-gray-100">
                        {colors.map(c => (
                            <button 
                                key={c} 
                                className={`w-6 h-6 rounded-full border border-black/10 ${c}`}
                                onClick={() => changeNoteColor(note.id, c)}
                            />
                        ))}
                    </div>
                </div>
                <button 
                  onClick={() => deleteNote(note.id)}
                  className="p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-600 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {note.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group/task">
                  <button 
                    onClick={() => toggleTask(note.id, task.id)}
                    className={`flex-shrink-0 transition-colors ${task.done ? 'text-gray-500' : 'text-gray-900'}`}
                  >
                    {task.done ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => updateTask(note.id, task.id, e.target.value)}
                    placeholder={t.tools.myNotes.placeholder}
                    className={`bg-transparent outline-none w-full text-sm font-medium h-full py-1 border-b border-transparent focus:border-black/10 transition-colors ${task.done ? 'line-through text-gray-500' : 'text-gray-900'}`}
                  />
                  <button 
                    onClick={() => deleteTask(note.id, task.id)}
                    className="opacity-0 group-hover/task:opacity-100 text-gray-400 hover:text-red-600 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-black/5 flex flex-col gap-2">
                <button 
                onClick={() => addTask(note.id)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                <Plus size={16} /> {t.tools.myNotes.addTask}
                </button>
                
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                        <CalendarClock size={10} />
                        {formatDate(note.createdAt)}
                    </span>
                    {note.pinned && <span className="text-gray-900 bg-white/50 px-2 py-0.5 rounded-full">PINNED</span>}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
