import React, { useRef } from 'react';
import {
  Sun,
  Moon,
  PanelLeft,
  PanelLeftClose,
  FileUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  Search,
  Volume2,
  VolumeX,
  Printer,
  Download,
  Info,
  Highlighter,
  Square,
  Rows3,
  Columns2,
  Bookmark,
  Sparkles,
  Palette,
} from 'lucide-react';
import { ThemeMode, PageViewMode, PageColorFilter, SamplePDF } from '../types';
import { SAMPLE_PDFS } from '../utils/samplePdfs';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  viewMode: PageViewMode;
  onViewModeChange: (mode: PageViewMode) => void;
  colorFilter: PageColorFilter;
  onColorFilterChange: (filter: PageColorFilter) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRotate: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSearch: () => void;
  onOpenInfo: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onOpenFile: (file: File) => void;
  onLoadSample: (sample: SamplePDF) => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  annotationMode: boolean;
  onToggleAnnotationMode: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  hasDocument: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  documentTitle,
  currentPage,
  totalPages,
  onPageChange,
  scale,
  onScaleChange,
  viewMode,
  onViewModeChange,
  colorFilter,
  onColorFilterChange,
  sidebarOpen,
  onToggleSidebar,
  onRotate,
  isFullscreen,
  onToggleFullscreen,
  onOpenSearch,
  onOpenInfo,
  onPrint,
  onDownload,
  onOpenFile,
  onLoadSample,
  isSpeaking,
  onToggleSpeech,
  annotationMode,
  onToggleAnnotationMode,
  isBookmarked,
  onToggleBookmark,
  hasDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [samplesDropdownOpen, setSamplesDropdownOpen] = React.useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const [pageInput, setPageInput] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onOpenFile(files[0]);
    }
  };

  return (
    <header
      id="app-header"
      className={`h-16 border-b flex items-center justify-between px-4 sm:px-8 select-none transition-colors duration-200 z-30 ${
        theme === 'dark'
          ? 'bg-[#1C1B1A]/95 border-[#2E2C2A] text-[#F4F2EE]'
          : 'bg-white/95 border-[#E5E2DE] text-[#1A1A1A]'
      } backdrop-blur-md sticky top-0`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Left Section: Reader Badge, Title, Open/Samples */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        {hasDocument && (
          <button
            id="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Hide Contents & Navigation' : 'Show Contents & Navigation'}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#262422] text-[#C4C0BA] hover:text-[#F4F2EE]'
                : 'hover:bg-[#F3F2F0] text-[#4A4846] hover:text-[#1A1A1A]'
            }`}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        )}

        <div className="flex items-center space-x-3 min-w-0">
          <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#A5A29E] hidden lg:inline">
            Reader v.01
          </span>
          <div className="h-4 w-[1px] bg-[#E5E2DE] dark:bg-[#2E2C2A] hidden lg:block" />
          <h1
            className="text-sm sm:text-base md:text-lg font-medium text-[#1A1A1A] dark:text-[#F4F2EE] font-serif italic truncate max-w-[160px] sm:max-w-[240px] md:max-w-[320px]"
            title={documentTitle}
          >
            {documentTitle || 'Untitled_Document.pdf'}
          </h1>
        </div>

        {/* Quick Open & Samples */}
        <div className="flex items-center space-x-1.5 ml-2">
          <button
            id="open-file-btn"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
              theme === 'dark'
                ? 'bg-[#262422] hover:bg-[#302D2A] border-[#383532] text-[#F4F2EE]'
                : 'bg-[#F3F2F0] hover:bg-[#EBE9E6] border-[#E5E2DE] text-[#1A1A1A]'
            }`}
            title="Open local PDF"
          >
            <FileUp className="w-3.5 h-3.5 text-[#A5A29E]" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <div className="relative">
            <button
              id="samples-dropdown-btn"
              onClick={() => setSamplesDropdownOpen(!samplesDropdownOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
                theme === 'dark'
                  ? 'bg-[#262422] hover:bg-[#302D2A] border-[#383532] text-[#F4F2EE]'
                  : 'bg-[#F3F2F0] hover:bg-[#EBE9E6] border-[#E5E2DE] text-[#1A1A1A]'
              }`}
              title="Explore Curated Editorial Samples"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A5A29E]" />
              <span className="hidden sm:inline">Archives</span>
            </button>

            {samplesDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSamplesDropdownOpen(false)}
                />
                <div
                  className={`absolute left-0 mt-2 w-72 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border p-2 z-50 animate-in fade-in zoom-in-95 ${
                    theme === 'dark'
                      ? 'bg-[#1C1B1A] border-[#2E2C2A] text-[#F4F2EE]'
                      : 'bg-white border-[#E5E2DE] text-[#1A1A1A]'
                  }`}
                >
                  <div className="text-[10px] font-sans font-bold px-3 py-2 text-[#A5A29E] uppercase tracking-[0.2em]">
                    Curated Library Monograph
                  </div>
                  {SAMPLE_PDFS.map((sample, idx) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onLoadSample(sample);
                        setSamplesDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start space-x-3 ${
                        theme === 'dark'
                          ? 'hover:bg-[#262422] text-[#F4F2EE]'
                          : 'hover:bg-[#F9F8F6] text-[#1A1A1A]'
                      }`}
                    >
                      <span className="text-[11px] font-sans font-semibold text-[#A5A29E] mt-0.5">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-serif italic text-sm truncate">{sample.title}</div>
                        <div className="text-[11px] font-sans text-[#A5A29E] truncate">
                          {sample.pages} pages • {sample.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center Section: Page Navigation (Editorial Pill) */}
      {hasDocument && (
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center rounded-full px-3 py-1 gap-2 border font-sans ${
              theme === 'dark'
                ? 'bg-[#262422] border-[#383532]'
                : 'bg-[#F3F2F0] border-[#E5E2DE]'
            }`}
          >
            <button
              id="prev-page-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page (Left Arrow)"
              className="p-1 rounded-full text-[#1A1A1A] dark:text-[#F4F2EE] hover:text-[#A5A29E] disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1">
              <input
                id="page-number-input"
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                className={`w-7 text-center py-0.5 text-xs font-bold rounded-full bg-transparent focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F4F2EE] ${
                  theme === 'dark' ? 'text-[#F4F2EE]' : 'text-[#1A1A1A]'
                }`}
              />
              <span className="text-xs text-[#A5A29E] font-serif italic">
                of {totalPages}
              </span>
            </form>

            <button
              id="next-page-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="Next Page (Right Arrow)"
              className="p-1 rounded-full text-[#1A1A1A] dark:text-[#F4F2EE] hover:text-[#A5A29E] disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Bookmark button */}
          <button
            id="bookmark-page-btn"
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Page'}
            className={`p-2 rounded-full transition-colors ${
              isBookmarked
                ? 'text-amber-500 bg-amber-500/10'
                : theme === 'dark'
                ? 'hover:bg-[#262422] text-[#807C76]'
                : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      )}

      {/* Right Section: Zoom, View Modes, Tools & Editorial Export */}
      <div className="flex items-center space-x-2 font-sans">
        {hasDocument && (
          <>
            {/* Zoom Controls (Editorial Pill) */}
            <div
              className={`hidden lg:flex items-center rounded-full px-4 py-1.5 gap-3 border ${
                theme === 'dark'
                  ? 'bg-[#262422] border-[#383532]'
                  : 'bg-[#F3F2F0] border-[#E5E2DE]'
              }`}
            >
              <button
                id="zoom-out-btn"
                onClick={() => onScaleChange(Math.max(0.4, scale - 0.15))}
                title="Zoom Out (-)"
                className="text-sm font-semibold hover:text-[#A5A29E] text-[#1A1A1A] dark:text-[#F4F2EE] transition-colors"
              >
                -
              </button>

              <button
                id="zoom-reset-btn"
                onClick={() => onScaleChange(1.0)}
                title="Reset to 100%"
                className="text-xs font-bold w-9 text-center text-[#1A1A1A] dark:text-[#F4F2EE] hover:text-[#A5A29E] transition-colors"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                id="zoom-in-btn"
                onClick={() => onScaleChange(Math.min(3.0, scale + 0.15))}
                title="Zoom In (+)"
                className="text-sm font-semibold hover:text-[#A5A29E] text-[#1A1A1A] dark:text-[#F4F2EE] transition-colors"
              >
                +
              </button>
            </div>

            {/* View Mode Selector */}
            <div
              className={`hidden md:flex items-center rounded-full p-1 border gap-1 ${
                theme === 'dark'
                  ? 'bg-[#262422] border-[#383532]'
                  : 'bg-[#F3F2F0] border-[#E5E2DE]'
              }`}
            >
              <button
                id="view-single-btn"
                onClick={() => onViewModeChange('single')}
                title="Single Page Mode"
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'single'
                    ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
                    : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                id="view-continuous-btn"
                onClick={() => onViewModeChange('continuous')}
                title="Continuous Vertical Scroll Mode"
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'continuous'
                    ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
                    : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
              <button
                id="view-spread-btn"
                onClick={() => onViewModeChange('spread')}
                title="Two-Page Spread Mode"
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'spread'
                    ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
                    : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page Reading Color Filter */}
            <div className="relative">
              <button
                id="color-filter-btn"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                title="Reading Filter / Paper Tint"
                className={`p-2 rounded-full transition-colors ${
                  colorFilter !== 'default'
                    ? 'text-amber-600 bg-amber-500/10'
                    : theme === 'dark'
                    ? 'hover:bg-[#262422] text-[#807C76]'
                    : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
                }`}
              >
                <Palette className="w-4 h-4" />
              </button>

              {filterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFilterDropdownOpen(false)}
                  />
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border p-2 z-50 animate-in fade-in zoom-in-95 ${
                      theme === 'dark'
                        ? 'bg-[#1C1B1A] border-[#2E2C2A] text-[#F4F2EE]'
                        : 'bg-white border-[#E5E2DE] text-[#1A1A1A]'
                    }`}
                  >
                    <div className="text-[10px] font-sans font-bold px-3 py-1.5 text-[#A5A29E] uppercase tracking-[0.2em]">
                      Paper Tint
                    </div>
                    {[
                      { id: 'default', label: 'Crisp White', iconColor: 'bg-white border border-[#E5E2DE]' },
                      { id: 'inverted', label: 'Dark Charcoal', iconColor: 'bg-[#1C1B1A] border border-[#383532]' },
                      { id: 'sepia', label: 'Warm Sepia Paper', iconColor: 'bg-[#F4ECD8] border border-[#D6C7A1]' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onColorFilterChange(f.id as PageColorFilter);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                          colorFilter === f.id
                            ? theme === 'dark' ? 'bg-[#262422] text-[#F4F2EE]' : 'bg-[#F3F2F0] text-[#1A1A1A]'
                            : theme === 'dark'
                            ? 'hover:bg-[#262422] text-[#C4C0BA]'
                            : 'hover:bg-[#F9F8F6] text-[#4A4846]'
                        }`}
                      >
                        <span className="flex items-center space-x-2.5">
                          <span className={`w-3.5 h-3.5 rounded-full ${f.iconColor}`} />
                          <span className="font-serif">{f.label}</span>
                        </span>
                        {colorFilter === f.id && <span className="text-xs font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Annotation Mode Toggle */}
            <button
              id="annotation-mode-btn"
              onClick={onToggleAnnotationMode}
              title={annotationMode ? 'Disable Annotation Tools' : 'Enable Annotation & Drawing Tools'}
              className={`p-2 rounded-full transition-colors ${
                annotationMode
                  ? 'bg-[#1A1A1A] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] shadow-xs'
                  : theme === 'dark'
                  ? 'hover:bg-[#262422] text-[#807C76]'
                  : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {/* Rotate Clockwise */}
            <button
              id="rotate-btn"
              onClick={onRotate}
              title="Rotate 90° Clockwise"
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-[#262422] text-[#807C76]' : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Document Text Search */}
            <button
              id="search-btn"
              onClick={onOpenSearch}
              title="Search Text in Document (Ctrl+F)"
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-[#262422] text-[#807C76]' : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Text to Speech Read Aloud */}
            <button
              id="tts-btn"
              onClick={onToggleSpeech}
              title={isSpeaking ? 'Stop Reading Page' : 'Read Page Aloud (Text to Speech)'}
              className={`p-2 rounded-full transition-colors ${
                isSpeaking
                  ? 'text-amber-500 bg-amber-500/10 animate-pulse'
                  : theme === 'dark'
                  ? 'hover:bg-[#262422] text-[#807C76]'
                  : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Print & Document Info */}
            <button
              id="print-btn"
              onClick={onPrint}
              title="Print Document"
              className={`hidden sm:block p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-[#262422] text-[#807C76]' : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              id="doc-info-btn"
              onClick={onOpenInfo}
              title="Document Details & Metadata"
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-[#262422] text-[#807C76]' : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              id="fullscreen-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Reading Mode'}
              className={`hidden md:block p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-[#262422] text-[#807C76]' : 'hover:bg-[#F3F2F0] text-[#A5A29E]'
              }`}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-[#E5E2DE] dark:bg-[#2E2C2A] mx-1" />

        {/* Theme Toggle (Light & Dark mode) */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-[#262422] text-amber-400'
              : 'hover:bg-[#F3F2F0] text-[#1A1A1A]'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Editorial Primary Export / Download Pill Button */}
        {hasDocument && (
          <button
            id="download-btn"
            onClick={onDownload}
            title="Export Document"
            className="bg-[#1A1A1A] hover:bg-[#333333] text-white dark:bg-[#F4F2EE] dark:text-[#1A1A1A] dark:hover:bg-white px-5 py-2 rounded-full text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-xs ml-1"
          >
            Export
          </button>
        )}
      </div>
    </header>
  );
};
