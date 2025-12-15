import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { NeuCard } from '../ui/NeuCard';
import { NeuButton } from '../ui/NeuButton';
import { PomodoroStatus } from '../../types';
import { useAppStore } from '../../utils/store';

export const PomodoroTimer: React.FC = () => {
  const { t } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [status, setStatus] = useState<PomodoroStatus>(PomodoroStatus.IDLE);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (status === PomodoroStatus.RUNNING && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setStatus(PomodoroStatus.COMPLETED);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, timeLeft]);

  const toggleTimer = () => {
    if (status === PomodoroStatus.RUNNING) {
      setStatus(PomodoroStatus.PAUSED);
    } else {
      setStatus(PomodoroStatus.RUNNING);
    }
  };

  const resetTimer = useCallback(() => {
    setStatus(PomodoroStatus.IDLE);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  }, [mode]);

  const switchMode = (newMode: 'FOCUS' | 'BREAK') => {
    setMode(newMode);
    setStatus(PomodoroStatus.IDLE);
    setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch(status) {
      case PomodoroStatus.IDLE: return t.tools.pomodoro.ready;
      case PomodoroStatus.RUNNING: return t.tools.pomodoro.running;
      case PomodoroStatus.PAUSED: return t.tools.pomodoro.paused;
      case PomodoroStatus.COMPLETED: return t.tools.pomodoro.completed;
      default: return '';
    }
  };

  const progress = mode === 'FOCUS' 
    ? 100 - (timeLeft / (25 * 60)) * 100 
    : 100 - (timeLeft / (5 * 60)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-neu-text mb-2">{t.tools.pomodoro.title}</h2>
        <p className="text-neu-text/60">{t.tools.pomodoro.subtitle}</p>
      </div>

      <NeuCard className="flex flex-col items-center">
        {/* Toggle Mode */}
        <div className="flex p-1 bg-neu-base shadow-neu-pressed rounded-full mb-10 w-64">
          <button
            onClick={() => switchMode('FOCUS')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
              mode === 'FOCUS' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/50'
            }`}
          >
            {t.tools.pomodoro.focus}
          </button>
          <button
            onClick={() => switchMode('BREAK')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
              mode === 'BREAK' ? 'bg-neu-base shadow-neu-flat text-neu-accent' : 'text-neu-text/50'
            }`}
          >
            {t.tools.pomodoro.break}
          </button>
        </div>

        {/* Circular Progress Timer */}
        <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
          {/* Background Circle */}
          <div className="absolute w-full h-full rounded-full shadow-neu-flat"></div>
          <div className="absolute w-[90%] h-[90%] rounded-full shadow-neu-pressed"></div>
          
          {/* Time Display */}
          <div className="z-10 flex flex-col items-center">
            <span className="text-6xl font-black text-neu-text tracking-wider tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-neu-text/40 font-bold uppercase tracking-widest text-sm mt-2">
              {getStatusText()}
            </span>
          </div>

          {/* SVG Progress Ring */}
           <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none opacity-20">
             <circle
               cx="144"
               cy="144"
               r="130"
               fill="none"
               stroke="currentColor"
               strokeWidth="8"
               className="text-neu-accent"
               strokeDasharray="816" 
               strokeDashoffset={816 - (816 * progress) / 100}
               strokeLinecap="round"
             />
           </svg>
        </div>

        <div className="flex gap-6">
          <NeuButton onClick={toggleTimer} className="w-16 h-16 rounded-full !px-0 !py-0 flex items-center justify-center">
            {status === PomodoroStatus.RUNNING ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </NeuButton>

          <NeuButton onClick={resetTimer} className="w-16 h-16 rounded-full !px-0 !py-0 flex items-center justify-center text-neu-text/60">
            <RotateCcw size={24} />
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
};