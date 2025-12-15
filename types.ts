export enum ToolId {
  DASHBOARD = 'DASHBOARD',
  
  // Categories (Navigation)
  CATEGORY_PRODUCTIVITY = 'CATEGORY_PRODUCTIVITY',
  CATEGORY_UTILITIES = 'CATEGORY_UTILITIES',
  CATEGORY_AI = 'CATEGORY_AI',

  // Tools
  PASSWORD_GEN = 'PASSWORD_GEN',
  POMODORO = 'POMODORO',
  COLOR_MIXER = 'COLOR_MIXER',
  AI_IDEA = 'AI_IDEA',
  UNIT_CONVERTER = 'UNIT_CONVERTER',
  TEXT_ANALYZER = 'TEXT_ANALYZER',
  BMI_CALCULATOR = 'BMI_CALCULATOR',
  
  // New Tools
  MY_NOTES = 'MY_NOTES',
  CRYPTO_TOOL = 'CRYPTO_TOOL',
  JSON_FORMATTER = 'JSON_FORMATTER',
  CURRENCY_CONVERTER = 'CURRENCY_CONVERTER',
  REGEX_TESTER = 'REGEX_TESTER',
  PALETTE_GENERATOR = 'PALETTE_GENERATOR'
}

export enum ToolCategory {
  PRODUCTIVITY = 'PRODUCTIVITY',
  UTILITIES = 'UTILITIES',
  AI = 'AI'
}

export interface ToolConfig {
  id: ToolId;
  nameKey: string;
  descKey: string;
  icon: any; // Using any for React Node to simplify types here
  category: ToolCategory;
}

export enum PomodoroStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface NoteTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  color: string; // Tailwind class or hex
  tasks: NoteTask[];
}

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';