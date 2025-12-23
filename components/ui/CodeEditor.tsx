
import React from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../utils/store';

// Configure CDN path for Monaco assets if needed, but @monaco-editor/react handles this well by default.

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language = 'plaintext',
  onChange,
  readOnly = false,
  height = '400px',
  className = ''
}) => {
  const { theme } = useAppStore();

  const handleBeforeMount = (monaco: any) => {
    // Define Light Theme
    monaco.editor.defineTheme('neu-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000', // Transparent
        'editor.lineHighlightBackground': '#00000008', // Very subtle dark overlay
        'editor.lineHighlightBorder': '#00000000', // No border
        'scrollbarSlider.background': '#4d5b7c20', // Neu text color low opacity
        'scrollbarSlider.hoverBackground': '#4d5b7c40',
        'scrollbarSlider.activeBackground': '#4d5b7c60',
        'editorCursor.foreground': '#6d5dfc', // Accent color cursor
      }
    });
    
    // Define Dark Theme
    monaco.editor.defineTheme('neu-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000', // Transparent
        'editor.lineHighlightBackground': '#ffffff08', // Very subtle light overlay
        'editor.lineHighlightBorder': '#00000000',
        'scrollbarSlider.background': '#e0e5ec20',
        'scrollbarSlider.hoverBackground': '#e0e5ec40',
        'scrollbarSlider.activeBackground': '#e0e5ec60',
        'editorCursor.foreground': '#8b7fff',
      }
    });
  };

  return (
    <div className={`w-full rounded-[20px] overflow-hidden shadow-neu-pressed bg-neu-base border-4 border-neu-base ${className} relative`}>
      {/* Inject custom styles for rounded scrollbars which Monaco API doesn't fully support directly */}
      <style>{`
        .monaco-editor .scrollbar .slider {
          border-radius: 10px !important;
        }
        .monaco-editor .decorationsOverviewRuler {
          display: none !important;
        }
      `}</style>
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme === 'dark' ? 'neu-dark' : 'neu-light'}
        beforeMount={handleBeforeMount}
        onChange={onChange}
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          roundedSelection: true,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          automaticLayout: true,
          // Hide standard scrollbars visual artifacts to use our custom colored ones
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false, // Remove the ugly shadow on scroll
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
};
