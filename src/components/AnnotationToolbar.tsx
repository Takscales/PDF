import React from 'react';
import { Pen, Highlighter, MessageSquare, Trash2, X } from 'lucide-react';
import { ThemeMode } from '../types';

interface AnnotationToolbarProps {
  theme: ThemeMode;
  activeTool: 'pen' | 'highlighter' | 'note' | 'eraser';
  onSelectTool: (tool: 'pen' | 'highlighter' | 'note' | 'eraser') => void;
  color: string;
  onSelectColor: (color: string) => void;
  size: number;
  onSelectSize: (size: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Amber Yellow', value: '#eab308' },
  { name: 'Indigo Blue', value: '#6366f1' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Rose Red', value: '#f43f5e' },
  { name: 'Cyan Sky', value: '#06b6d4' },
  { name: 'Purple', value: '#a855f7' },
];

const SIZE_PRESETS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Marker', value: 16 },
];

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  theme,
  activeTool,
  onSelectTool,
  color,
  onSelectColor,
  size,
  onSelectSize,
  onClearAll,
  onClose,
}) => {
  return (
    <div
      id="annotation-floating-toolbar"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-full shadow-2xl border flex items-center space-x-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 transition-colors ${
        theme === 'dark'
          ? 'bg-[#181716]/95 border-[#2E2C2A] text-[#F4F2EE]'
          : 'bg-[#FDFCFB]/95 border-[#E5E2DE] text-[#1A1A1A]'
      }`}
    >
      {/* Tool Selector */}
      <div className="flex items-center space-x-1 border-r pr-2.5 border-[#E5E2DE] dark:border-[#2E2C2A]">
        <button
          onClick={() => onSelectTool('pen')}
          title="Pen (Draw)"
          className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all ${
            activeTool === 'pen'
              ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <Pen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pen</span>
        </button>

        <button
          onClick={() => onSelectTool('highlighter')}
          title="Highlighter (Semi-transparent)"
          className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all ${
            activeTool === 'highlighter'
              ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Highlight</span>
        </button>

        <button
          onClick={() => onSelectTool('note')}
          title="Margin Annotation (Click on page to place)"
          className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all ${
            activeTool === 'note'
              ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Note</span>
        </button>
      </div>

      {/* Color Swatches */}
      <div className="flex items-center space-x-1.5 border-r pr-2.5 border-[#E5E2DE] dark:border-[#2E2C2A]">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.value}
            onClick={() => onSelectColor(c.value)}
            title={c.name}
            style={{ backgroundColor: c.value }}
            className={`w-5 h-5 rounded-full transition-transform ${
              color === c.value
                ? 'ring-2 ring-offset-2 ring-[#1A1A1A] dark:ring-[#F4F2EE] scale-110'
                : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
          />
        ))}
      </div>

      {/* Stroke Size */}
      <div className="hidden md:flex items-center space-x-1 border-r pr-2.5 border-[#E5E2DE] dark:border-[#2E2C2A]">
        {SIZE_PRESETS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelectSize(s.value)}
            title={`${s.label} stroke width`}
            className={`px-2 py-1 rounded-full text-xs font-sans transition-colors ${
              size === s.value
                ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] font-bold'
                : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Clear All & Close */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onClearAll}
          title="Clear all annotations"
          className="p-1.5 rounded-full text-[#A5A29E] hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          title="Close Annotation Toolbar"
          className="p-1.5 rounded-full text-[#A5A29E] hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
