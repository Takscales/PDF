import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { ThemeMode, SearchMatch } from '../types';

interface SearchDialogProps {
  theme: ThemeMode;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
  matches: SearchMatch[];
  currentIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  theme,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  matches,
  currentIndex,
  onNextMatch,
  onPrevMatch,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        if (matches.length === 0) {
          onSearchSubmit();
        } else {
          onNextMatch();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      id="floating-search-bar"
      className={`fixed top-20 right-8 z-40 p-2.5 rounded-full shadow-2xl border flex items-center space-x-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3 transition-colors ${
        theme === 'dark'
          ? 'bg-[#181716]/95 border-[#2E2C2A] text-[#F4F2EE]'
          : 'bg-[#FDFCFB]/95 border-[#E5E2DE] text-[#1A1A1A]'
      }`}
    >
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3.5 text-[#A5A29E]" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search manuscript keywords..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-56 sm:w-72 pl-9 pr-3 py-1.5 text-xs rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F4F2EE] font-serif italic transition-colors ${
            theme === 'dark'
              ? 'bg-[#262422] border-[#383532] text-[#F4F2EE] placeholder-[#807C76]'
              : 'bg-white border-[#E5E2DE] text-[#1A1A1A] placeholder-[#A5A29E]'
          }`}
        />
      </div>

      <div className="text-[11px] font-sans font-bold text-[#A5A29E] px-1 min-w-[50px] text-center">
        {matches.length > 0
          ? `${currentIndex + 1} / ${matches.length}`
          : searchQuery
          ? '0 found'
          : ''}
      </div>

      <div className="flex items-center space-x-0.5 border-l pl-1 border-[#E5E2DE] dark:border-[#2E2C2A]">
        <button
          onClick={onPrevMatch}
          disabled={matches.length <= 1}
          title="Previous Citation (Shift+Enter)"
          className="p-1.5 rounded-full disabled:opacity-20 text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE] hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onNextMatch}
          disabled={matches.length <= 1}
          title="Next Citation (Enter)"
          className="p-1.5 rounded-full disabled:opacity-20 text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE] hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          title="Close search (Esc)"
          className="p-1.5 rounded-full text-[#A5A29E] hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
