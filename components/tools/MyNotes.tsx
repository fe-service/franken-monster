import React, { useState } from 'react';
import { Plus, X, Trash2, CheckSquare, Square, Palette } from 'lucide-react';
import { NeuButton } from '../ui/NeuButton';
import { useAppStore } from '../../utils/store';
import { Note, NoteTask } from '../../types';

const colors = [
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-green-100 dark:bg-green-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
];

export const MyNotes: React.FC = () => {
  const { t, notes, updateNotes } = useAppStore();

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      color: colors[Math.floor(Math.random() * colors.length)],
      tasks: []
    };
    updateNotes([newNote, ...notes]);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.myNotes.title}</h2>
        <p className="text-neu-text/60">{t.tools.myNotes.subtitle}</p>
      </div>

      <div className="flex justify-center mb-8">
        <NeuButton onClick={addNote} variant="primary">
          <Plus size={20} /> {t.tools.myNotes.addNote}
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div 
            key={note.id} 
            className={`rounded-[24px] shadow-neu-flat p-6 transition-all duration-300 relative group flex flex-col gap-4 ${note.color}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <input
                type="text"
                value={note.title}
                onChange={(e) => updateNoteTitle(note.id, e.target.value)}
                placeholder={t.tools.myNotes.titlePlaceholder}
                className="bg-transparent text-xl font-bold text-neu-text placeholder-neu-text/40 outline-none w-full"
              />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative group/color">
                    <button className="p-1.5 rounded-full hover:bg-black/5 text-neu-text/60">
                        <Palette size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-neu-base shadow-neu-flat p-2 rounded-xl flex gap-1 z-20 hidden group-hover/color:flex">
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
                  className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 text-neu-text/60"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2 flex-1 min-h-[100px]">
              {note.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group/task">
                  <button 
                    onClick={() => toggleTask(note.id, task.id)}
                    className={`flex-shrink-0 ${task.done ? 'text-neu-accent' : 'text-neu-text/40'}`}
                  >
                    {task.done ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => updateTask(note.id, task.id, e.target.value)}
                    placeholder={t.tools.myNotes.placeholder}
                    className={`bg-transparent outline-none w-full text-sm font-medium h-full py-1 ${task.done ? 'line-through text-neu-text/40' : 'text-neu-text'}`}
                  />
                  <button 
                    onClick={() => deleteTask(note.id, task.id)}
                    className="opacity-0 group-hover/task:opacity-100 text-neu-text/30 hover:text-red-500 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <button 
              onClick={() => addTask(note.id)}
              className="flex items-center gap-2 text-sm font-bold text-neu-text/50 hover:text-neu-accent transition-colors mt-auto"
            >
              <Plus size={16} /> {t.tools.myNotes.addTask}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};