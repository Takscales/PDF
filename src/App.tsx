/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjsLib } from './utils/pdfSetup';
import {
  ThemeMode,
  PageViewMode,
  PageColorFilter,
  PDFMetadata,
  PDFOutlineItem,
  SearchMatch,
  Bookmark,
  DrawingPath,
  StickyNote,
  SamplePDF,
} from './types';
import { SAMPLE_PDFS } from './utils/samplePdfs';
import { extractPageText, searchPdfDocument } from './utils/pdfTextSearch';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PageView } from './components/PageView';
import { ContinuousViewer } from './components/ContinuousViewer';
import { SpreadViewer } from './components/SpreadViewer';
import { SearchDialog } from './components/SearchDialog';
import { AnnotationToolbar } from './components/AnnotationToolbar';
import { DocInfoModal } from './components/DocInfoModal';
import { EmptyState } from './components/EmptyState';

export default function App() {
  // Theme State: 'light' or 'dark'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('pdf_reader_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('pdf_reader_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Document State
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading document...');

  // Viewer Config
  const [viewMode, setViewMode] = useState<PageViewMode>('single');
  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [colorFilter, setColorFilter] = useState<PageColorFilter>('default');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [selectedSearchMatchIndex, setSelectedSearchMatchIndex] = useState<number>(0);

  // Annotations & Drawings State
  const [annotationMode, setAnnotationMode] = useState<boolean>(false);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<'pen' | 'highlighter' | 'note' | 'eraser'>('pen');
  const [annotationColor, setAnnotationColor] = useState<string>('#6366f1');
  const [annotationSize, setAnnotationSize] = useState<number>(4);
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Modals & TTS State
  const [isDocInfoOpen, setIsDocInfoOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Load PDF Data from buffer
  const loadPdfData = async (data: Uint8Array, fileName: string, fileSize?: number) => {
    setIsLoading(true);
    setLoadingMessage('Rendering document...');
    try {
      setRawPdfBytes(data);
      const loadingTask = pdfjsLib.getDocument({
        data: data.slice(0),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setDocumentTitle(fileName);

      // Extract metadata
      try {
        const meta = await doc.getMetadata();
        const info = (meta.info as any) || {};
        setMetadata({
          title: info.Title || fileName,
          author: info.Author,
          subject: info.Subject,
          keywords: info.Keywords,
          creator: info.Creator,
          producer: info.Producer,
          creationDate: info.CreationDate,
          modificationDate: info.ModDate,
          pdfFormatVersion: info.PDFFormatVersion,
          pageCount: doc.numPages,
          fileSize: fileSize || data.byteLength,
          fileName: fileName,
        });
      } catch {
        setMetadata({
          pageCount: doc.numPages,
          fileSize: fileSize || data.byteLength,
          fileName: fileName,
        });
      }

      // Extract Outline / Bookmarks
      try {
        const rawOutline = await doc.getOutline();
        setOutline(rawOutline || []);
      } catch {
        setOutline([]);
      }

      // Clear search & reset annotations for new doc
      setSearchResults([]);
      setSearchQuery('');
      setDrawings([]);
      setStickyNotes([]);
      setBookmarks([]);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local File upload
  const handleOpenFile = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage(`Reading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      await loadPdfData(new Uint8Array(buffer), file.name, file.size);
    } catch (err) {
      console.error('File load failed', err);
      setIsLoading(false);
    }
  };

  // Handle Curated Sample PDF Load
  const handleLoadSample = async (sample: SamplePDF) => {
    setIsLoading(true);
    setLoadingMessage(`Generating ${sample.title}...`);
    try {
      const bytes = await sample.generate();
      await loadPdfData(bytes, `${sample.title}.pdf`, bytes.byteLength);
    } catch (err) {
      console.error('Failed to load sample', err);
      setIsLoading(false);
    }
  };

  // Load first sample by default on initial mount so reader is instantly usable
  useEffect(() => {
    handleLoadSample(SAMPLE_PDFS[0]);
  }, []);

  // Text-to-Speech handler
  const handleToggleSpeech = async () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!pdfDoc) return;

    try {
      const pageText = await extractPageText(pdfDoc, currentPage);
      if (!pageText.trim()) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(pageText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  // Stop speech when page changes
  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentPage]);

  // Page Bookmark Handlers
  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  const handleToggleBookmark = (note?: string) => {
    if (isCurrentPageBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.pageNumber !== currentPage));
    } else {
      setBookmarks((prev) => [
        ...prev,
        {
          id: 'bm_' + Date.now(),
          pageNumber: currentPage,
          title: `Page ${currentPage}`,
          createdAt: Date.now(),
          note: typeof note === 'string' && note.trim() ? note : undefined,
        },
      ]);
    }
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // Drawings Handlers
  const handleAddDrawing = (drawing: DrawingPath) => {
    setDrawings((prev) => [...prev, drawing]);
  };

  const handleClearAllDrawings = () => {
    setDrawings([]);
    setStickyNotes([]);
  };

  // Sticky Notes Handlers
  const handleAddStickyNote = (note: StickyNote) => {
    setStickyNotes((prev) => [...prev, note]);
  };

  const handleUpdateStickyNote = (id: string, text: string) => {
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  const handleDeleteStickyNote = (id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Rotate Page
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Download Document
  const handleDownload = () => {
    if (!rawPdfBytes) return;
    const blob = new Blob([rawPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documentTitle || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Search Navigation
  const handleSearchSubmit = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    try {
      const results = await searchPdfDocument(pdfDoc, searchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedSearchMatchIndex(0);
        setCurrentPage(results[0].pageNumber);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextSearchMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (selectedSearchMatchIndex + 1) % searchResults.length;
    setSelectedSearchMatchIndex(nextIdx);
    setCurrentPage(searchResults[nextIdx].pageNumber);
  };

  const handlePrevSearchMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (selectedSearchMatchIndex - 1 + searchResults.length) % searchResults.length;
    setSelectedSearchMatchIndex(prevIdx);
    setCurrentPage(searchResults[prevIdx].pageNumber);
  };

  // Keyboard Shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Avoid intercepting inside inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(totalPages);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((prev) => Math.min(3.0, prev + 0.15));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale((prev) => Math.max(0.4, prev - 0.15));
      } else if (e.key === '0') {
        e.preventDefault();
        setScale(1.0);
      }
    },
    [totalPages]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      id="pdf-reader-root"
      className={`w-full h-screen flex flex-col overflow-hidden font-sans transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#151413] text-[#F4F2EE] dark'
          : 'bg-[#FDFCFB] text-[#1A1A1A]'
      }`}
    >
      {/* Header Toolbar */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        documentTitle={documentTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        scale={scale}
        onScaleChange={setScale}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        colorFilter={colorFilter}
        onColorFilterChange={setColorFilter}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRotate={handleRotate}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInfo={() => setIsDocInfoOpen(true)}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onOpenFile={handleOpenFile}
        onLoadSample={handleLoadSample}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        annotationMode={annotationMode}
        onToggleAnnotationMode={() => setAnnotationMode(!annotationMode)}
        isBookmarked={isCurrentPageBookmarked}
        onToggleBookmark={() => handleToggleBookmark()}
        hasDocument={!!pdfDoc}
      />

      {/* Main Reading Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        {sidebarOpen && pdfDoc && (
          <Sidebar
            theme={theme}
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageSelect={setCurrentPage}
            outline={outline}
            bookmarks={bookmarks}
            onRemoveBookmark={handleRemoveBookmark}
            onAddBookmark={handleToggleBookmark}
            metadata={metadata}
            onClose={() => setSidebarOpen(false)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            onSearchResultsChange={setSearchResults}
            selectedSearchMatchIndex={selectedSearchMatchIndex}
            onSelectSearchMatch={setSelectedSearchMatchIndex}
          />
        )}

        {/* Center Viewer Area */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-[#F3F2F0] dark:bg-[#151413]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-[#1A1A1A] dark:border-[#F4F2EE] border-t-transparent rounded-full animate-spin" />
              <p
                className={`text-xs font-serif italic ${
                  theme === 'dark' ? 'text-[#A5A29E]' : 'text-[#666360]'
                }`}
              >
                {loadingMessage}
              </p>
            </div>
          ) : !pdfDoc ? (
            <EmptyState
              theme={theme}
              onOpenFile={handleOpenFile}
              onLoadSample={handleLoadSample}
              isLoading={isLoading}
            />
          ) : (
            <div className="w-full h-full flex-1 overflow-hidden relative">
              {/* Single Page Mode */}
              {viewMode === 'single' && (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-6 custom-scrollbar">
                  <div className="my-auto shadow-2xl rounded-sm">
                    <PageView
                      pdfDoc={pdfDoc}
                      pageNumber={currentPage}
                      scale={scale}
                      rotation={rotation}
                      colorFilter={colorFilter}
                      annotationMode={annotationMode}
                      activeAnnotationTool={activeAnnotationTool}
                      annotationColor={annotationColor}
                      annotationSize={annotationSize}
                      drawings={drawings}
                      onAddDrawing={handleAddDrawing}
                      stickyNotes={stickyNotes}
                      onAddStickyNote={handleAddStickyNote}
                      onUpdateStickyNote={handleUpdateStickyNote}
                      onDeleteStickyNote={handleDeleteStickyNote}
                    />
                  </div>
                </div>
              )}

              {/* Continuous Scroll Mode */}
              {viewMode === 'continuous' && (
                <ContinuousViewer
                  pdfDoc={pdfDoc}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  scale={scale}
                  rotation={rotation}
                  colorFilter={colorFilter}
                  annotationMode={annotationMode}
                  activeAnnotationTool={activeAnnotationTool}
                  annotationColor={annotationColor}
                  annotationSize={annotationSize}
                  drawings={drawings}
                  onAddDrawing={handleAddDrawing}
                  stickyNotes={stickyNotes}
                  onAddStickyNote={handleAddStickyNote}
                  onUpdateStickyNote={handleUpdateStickyNote}
                  onDeleteStickyNote={handleDeleteStickyNote}
                />
              )}

              {/* Spread / 2-Page Book Mode */}
              {viewMode === 'spread' && (
                <SpreadViewer
                  pdfDoc={pdfDoc}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  scale={scale}
                  rotation={rotation}
                  colorFilter={colorFilter}
                  annotationMode={annotationMode}
                  activeAnnotationTool={activeAnnotationTool}
                  annotationColor={annotationColor}
                  annotationSize={annotationSize}
                  drawings={drawings}
                  onAddDrawing={handleAddDrawing}
                  stickyNotes={stickyNotes}
                  onAddStickyNote={handleAddStickyNote}
                  onUpdateStickyNote={handleUpdateStickyNote}
                  onDeleteStickyNote={handleDeleteStickyNote}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Annotation Toolbar */}
      {annotationMode && (
        <AnnotationToolbar
          theme={theme}
          activeTool={activeAnnotationTool}
          onSelectTool={setActiveAnnotationTool}
          color={annotationColor}
          onSelectColor={setAnnotationColor}
          size={annotationSize}
          onSelectSize={setAnnotationSize}
          onClearAll={handleClearAllDrawings}
          onClose={() => setAnnotationMode(false)}
        />
      )}

      {/* Floating Search Bar */}
      {isSearchOpen && (
        <SearchDialog
          theme={theme}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          matches={searchResults}
          currentIndex={selectedSearchMatchIndex}
          onNextMatch={handleNextSearchMatch}
          onPrevMatch={handlePrevSearchMatch}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {/* Document Properties Modal */}
      {isDocInfoOpen && (
        <DocInfoModal
          theme={theme}
          metadata={metadata}
          onClose={() => setIsDocInfoOpen(false)}
        />
      )}
    </div>
  );
}
