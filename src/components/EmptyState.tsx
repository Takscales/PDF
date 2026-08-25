import React, { useState } from 'react';
import {
  FileUp,
  FileText,
  Sparkles,
  BookOpen,
  Highlighter,
  Search,
  Volume2,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { ThemeMode, SamplePDF } from '../types';
import { SAMPLE_PDFS } from '../utils/samplePdfs';

interface EmptyStateProps {
  theme: ThemeMode;
  onOpenFile: (file: File) => void;
  onLoadSample: (sample: SamplePDF) => void;
  isLoading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  theme,
  onOpenFile,
  onLoadSample,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type === 'application/pdf' || files[0].name.endsWith('.pdf')) {
        onOpenFile(files[0]);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onOpenFile(files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="w-full max-w-4xl space-y-8 my-auto py-8">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-[11px] font-sans font-bold uppercase tracking-[0.2em] bg-stone-200/50 dark:bg-stone-800/60 text-[#4A4846] dark:text-[#C4C0BA] border border-[#E5E2DE] dark:border-[#2E2C2A]">
            <Sparkles className="w-3 h-3" />
            <span>Digital Reading Monograph</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-normal tracking-tight leading-tight text-[#1A1A1A] dark:text-[#F4F2EE]">
            The Art of Distraction-Free Reading
          </h1>
          <p
            className={`text-base sm:text-lg font-serif italic max-w-xl mx-auto leading-relaxed ${
              theme === 'dark' ? 'text-[#A5A29E]' : 'text-[#666360]'
            }`}
          >
            Immerse yourself in PDF publications with tailored light &amp; dark palettes, high-fidelity canvas rendering, and focused editorial typography.
          </p>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-[#1A1A1A] dark:border-[#F4F2EE] bg-[#1A1A1A]/5 dark:bg-white/5 scale-[1.01]'
              : theme === 'dark'
              ? 'border-[#2E2C2A] bg-[#1C1B1A]/70 hover:bg-[#262422] hover:border-[#3D3A36]'
              : 'border-[#D6D2CC] bg-white/80 hover:bg-white hover:border-[#1A1A1A]'
          } shadow-xs backdrop-blur-xs group`}
        >
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] text-[#FDFCFB] dark:bg-[#F4F2EE] dark:text-[#1A1A1A] mx-auto flex items-center justify-center group-hover:scale-105 transition-transform mb-4 shadow-sm">
            <FileUp className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="text-base sm:text-lg font-serif">
              Drop your manuscript or PDF here, or{' '}
              <span className="underline underline-offset-4 decoration-1 font-sans font-semibold text-xs tracking-wider uppercase">
                Browse Files
              </span>
            </div>
            <p
              className={`text-xs font-sans ${
                theme === 'dark' ? 'text-[#807C76]' : 'text-[#A5A29E]'
              }`}
            >
              Supports all standard PDF documents &bull; Full local rendering in your browser
            </p>
          </div>
        </div>

        {/* Curated Sample Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E2DE] dark:border-[#2E2C2A] pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#A5A29E]" />
              <span className="text-xs uppercase tracking-[0.15em] font-sans font-bold text-[#1A1A1A] dark:text-[#F4F2EE]">
                Curated Reading Library
              </span>
            </div>
            <span
              className={`text-xs font-serif italic ${
                theme === 'dark' ? 'text-[#807C76]' : 'text-[#A5A29E]'
              }`}
            >
              Instant exploration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_PDFS.map((sample, idx) => {
              const paddedIndex = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
              return (
                <button
                  key={sample.id}
                  onClick={() => onLoadSample(sample)}
                  disabled={isLoading}
                  className={`text-left p-6 rounded-2xl border transition-all flex flex-col justify-between group ${
                    theme === 'dark'
                      ? 'bg-[#1C1B1A]/80 border-[#2E2C2A] hover:border-[#F4F2EE] hover:bg-[#262422]'
                      : 'bg-white border-[#E5E2DE] hover:border-[#1A1A1A] hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-sans font-bold text-[#A5A29E]">
                        VOL. {paddedIndex}
                      </span>
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-[#4A4846] dark:text-[#C4C0BA]">
                        {sample.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-semibold group-hover:underline underline-offset-4 decoration-1 leading-snug text-[#1A1A1A] dark:text-[#F4F2EE]">
                      {sample.title}
                    </h3>
                    <p
                      className={`text-xs font-sans mt-2 line-clamp-2 leading-relaxed ${
                        theme === 'dark' ? 'text-[#A5A29E]' : 'text-[#666360]'
                      }`}
                    >
                      {sample.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E5E2DE] dark:border-[#2E2C2A] flex items-center justify-between text-xs font-sans font-medium text-[#1A1A1A] dark:text-[#F4F2EE]">
                    <span>Read Monograph</span>
                    <span className="group-hover:translate-x-1 transition-transform font-serif">&rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights Bento */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t font-sans text-xs ${
            theme === 'dark' ? 'border-[#2E2C2A] text-[#807C76]' : 'border-[#E5E2DE] text-[#A5A29E]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-[#F4F2EE]" />
            <span>Dual Paper Themes</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-[#F4F2EE]" />
            <span>Annotations &amp; Notes</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-[#F4F2EE]" />
            <span>Index Search</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-[#F4F2EE]" />
            <span>Spoken Reading (TTS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
