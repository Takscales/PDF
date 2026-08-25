import React, { useState, useEffect, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import {
  Layers,
  ListTree,
  Search,
  Bookmark,
  Info,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ThemeMode, PDFOutlineItem, SearchMatch, Bookmark as BookmarkType, PDFMetadata } from '../types';
import { searchPdfDocument } from '../utils/pdfTextSearch';

interface SidebarProps {
  theme: ThemeMode;
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  outline: PDFOutlineItem[];
  bookmarks: BookmarkType[];
  onRemoveBookmark: (id: string) => void;
  onAddBookmark: (note?: string) => void;
  metadata: PDFMetadata | null;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: SearchMatch[];
  onSearchResultsChange: (results: SearchMatch[]) => void;
  selectedSearchMatchIndex: number;
  onSelectSearchMatch: (index: number) => void;
}

type SidebarTab = 'thumbnails' | 'outline' | 'search' | 'bookmarks' | 'info';

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  pdfDoc,
  currentPage,
  totalPages,
  onPageSelect,
  outline,
  bookmarks,
  onRemoveBookmark,
  onAddBookmark,
  metadata,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSearchResultsChange,
  selectedSearchMatchIndex,
  onSelectSearchMatch,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('thumbnails');
  const [isSearching, setIsSearching] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const thumbnailRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // Render thumbnail canvases when thumbnails tab is open and pdfDoc is available
  useEffect(() => {
    if (activeTab !== 'thumbnails' || !pdfDoc) return;

    let isMounted = true;

    const renderThumbnails = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!isMounted) break;
        const canvas = thumbnailRefs.current[pageNum];
        if (!canvas) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.25 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({
              canvasContext: ctx,
              viewport: viewport,
            }).promise;
          }
        } catch (err) {
          console.warn(`Thumbnail render failed for page ${pageNum}`, err);
        }
      }
    };

    renderThumbnails();

    return () => {
      isMounted = false;
    };
  }, [activeTab, pdfDoc, totalPages]);

  // Execute Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pdfDoc || !searchQuery.trim()) {
      onSearchResultsChange([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPdfDocument(pdfDoc, searchQuery);
      onSearchResultsChange(results);
      if (results.length > 0) {
        onSelectSearchMatch(0);
        onPageSelect(results[0].pageNumber);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <aside
      id="app-sidebar"
      className={`w-72 sm:w-80 h-full border-r flex flex-col transition-colors duration-200 z-20 flex-shrink-0 ${
        theme === 'dark'
          ? 'bg-[#181716] border-[#2E2C2A] text-[#F4F2EE]'
          : 'bg-[#F9F8F6] border-[#E5E2DE] text-[#1A1A1A]'
      }`}
    >
      {/* Sidebar Tabs Header */}
      <div
        className={`flex items-center border-b px-3 py-2 gap-1 ${
          theme === 'dark'
            ? 'border-[#2E2C2A] bg-[#1C1B1A]/60'
            : 'border-[#E5E2DE] bg-white/70'
        }`}
      >
        <button
          id="tab-outline"
          onClick={() => setActiveTab('outline')}
          title="Table of Contents"
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-full flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'outline'
              ? theme === 'dark'
                ? 'bg-[#F4F2EE] text-[#1A1A1A] shadow-xs'
                : 'bg-[#1A1A1A] text-white shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>Contents</span>
        </button>

        <button
          id="tab-thumbnails"
          onClick={() => setActiveTab('thumbnails')}
          title="Page Thumbnails"
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-full flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'thumbnails'
              ? theme === 'dark'
                ? 'bg-[#F4F2EE] text-[#1A1A1A] shadow-xs'
                : 'bg-[#1A1A1A] text-white shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pages</span>
        </button>

        <button
          id="tab-search"
          onClick={() => setActiveTab('search')}
          title="Search in Document"
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-full flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'search'
              ? theme === 'dark'
                ? 'bg-[#F4F2EE] text-[#1A1A1A] shadow-xs'
                : 'bg-[#1A1A1A] text-white shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>

        <button
          id="tab-bookmarks"
          onClick={() => setActiveTab('bookmarks')}
          title="Saved Bookmarks"
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-full flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'bookmarks'
              ? theme === 'dark'
                ? 'bg-[#F4F2EE] text-[#1A1A1A] shadow-xs'
                : 'bg-[#1A1A1A] text-white shadow-xs'
              : 'text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved</span>
        </button>
      </div>

      {/* Sidebar Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {/* Tab 1: Thumbnails Grid */}
        {activeTab === 'thumbnails' && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#A5A29E] mb-4">
              Page Plates ({totalPages})
            </h2>
            <div className="grid grid-cols-2 gap-3.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                const paddedNum = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageSelect(pageNum)}
                    className={`flex flex-col items-center group relative rounded-xl p-2 transition-all text-left border ${
                      isActive
                        ? theme === 'dark'
                          ? 'border-[#F4F2EE] bg-[#262422] shadow-xs'
                          : 'border-[#1A1A1A] bg-white shadow-sm'
                        : theme === 'dark'
                        ? 'border-[#2E2C2A] bg-[#1C1B1A]/50 hover:border-[#3D3A36]'
                        : 'border-[#E5E2DE] bg-white/70 hover:border-[#A5A29E]'
                    }`}
                  >
                    <div className="w-full aspect-[1/1.41] bg-white rounded-md shadow-xs overflow-hidden flex items-center justify-center border border-[#E5E2DE]/70">
                      <canvas
                        ref={(el) => {
                          thumbnailRefs.current[pageNum] = el;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between w-full px-1">
                      <span
                        className={`text-xs font-sans font-semibold ${
                          isActive
                            ? 'text-[#1A1A1A] dark:text-[#F4F2EE] font-bold'
                            : 'text-[#A5A29E]'
                        }`}
                      >
                        {paddedNum}
                      </span>
                      {bookmarks.some((b) => b.pageNumber === pageNum) && (
                        <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Document Outline / Table of Contents */}
        {activeTab === 'outline' && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#A5A29E] mb-6">
              Contents
            </h2>
            {outline.length > 0 ? (
              <ul className="space-y-4">
                {outline.map((item, idx) => {
                  const paddedIndex = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
                  return (
                    <li key={idx} className="group">
                      <OutlineNode
                        item={item}
                        itemIndex={paddedIndex}
                        pdfDoc={pdfDoc}
                        theme={theme}
                        currentPage={currentPage}
                        onPageSelect={onPageSelect}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-4">
                {/* Fallback structured editorial index across document pages */}
                <ul className="space-y-4">
                  {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((pageNum) => {
                    const paddedNum = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
                    const isActive = pageNum === currentPage;
                    return (
                      <li
                        key={pageNum}
                        onClick={() => onPageSelect(pageNum)}
                        className="group cursor-pointer"
                      >
                        <span className="text-xs text-[#A5A29E] font-sans block mb-0.5">
                          {paddedNum}
                        </span>
                        <span
                          className={`text-sm leading-tight transition-colors font-serif ${
                            isActive
                              ? 'text-[#1A1A1A] dark:text-[#F4F2EE] font-semibold border-b border-[#1A1A1A] dark:border-[#F4F2EE] pb-0.5'
                              : 'text-[#4A4846] dark:text-[#C4C0BA] group-hover:text-[#1A1A1A] dark:group-hover:text-white'
                          }`}
                        >
                          Section Monograph &bull; Page {pageNum}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Search */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#A5A29E]">
              Index Search
            </h2>
            <form onSubmit={handleSearchSubmit} className="space-y-2.5">
              <div className="relative">
                <input
                  id="sidebar-search-input"
                  type="text"
                  placeholder="Search index keywords..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F4F2EE] font-sans transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#262422] border-[#383532] text-[#F4F2EE] placeholder-[#807C76]'
                      : 'bg-white border-[#E5E2DE] text-[#1A1A1A] placeholder-[#A5A29E]'
                  }`}
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A5A29E]" />
              </div>

              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-[#A5A29E]">
                  {isSearching
                    ? 'Searching catalog...'
                    : searchResults.length > 0
                    ? `${searchResults.length} ${
                        searchResults.length === 1 ? 'citation' : 'citations'
                      }`
                    : searchQuery
                    ? 'No citations found'
                    : 'Press Enter to search'}
                </span>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#333333] dark:bg-[#F4F2EE] dark:text-[#1A1A1A] dark:hover:bg-white disabled:opacity-30 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Find
                </button>
              </div>
            </form>

            <div className="space-y-2 mt-3">
              {searchResults.map((match, idx) => {
                const isSelected = idx === selectedSearchMatchIndex;
                const paddedNum = match.pageNumber < 10 ? `0${match.pageNumber}` : `${match.pageNumber}`;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectSearchMatch(idx);
                      onPageSelect(match.pageNumber);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-[#262422] border-[#F4F2EE] text-[#F4F2EE]'
                          : 'bg-white border-[#1A1A1A] text-[#1A1A1A] shadow-xs'
                        : theme === 'dark'
                        ? 'bg-[#1C1B1A]/40 hover:bg-[#262422] border-[#2E2C2A] text-[#C4C0BA]'
                        : 'bg-white/70 hover:bg-white border-[#E5E2DE] text-[#4A4846]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-sans mb-1.5">
                      <span className="text-[11px] font-bold text-[#A5A29E] tracking-widest">
                        PAGE {paddedNum}
                      </span>
                      <span className="text-[10px] text-[#A5A29E] font-serif italic">
                        Citation #{idx + 1}
                      </span>
                    </div>
                    <p className="leading-relaxed font-serif italic text-xs">
                      &ldquo;{match.snippet}&rdquo;
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Bookmarks & Saved Notes */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-5">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#A5A29E]">
              Bookmarked Plates
            </h2>
            {/* Quick Add Bookmark for Current Page */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                theme === 'dark'
                  ? 'bg-[#1C1B1A] border-[#2E2C2A]'
                  : 'bg-white border-[#E5E2DE]'
              }`}
            >
              <div className="text-xs font-sans font-semibold flex items-center justify-between">
                <span>Save Current Plate (Page {currentPage})</span>
                <span className="text-[10px] uppercase tracking-wider text-[#A5A29E]">Active</span>
              </div>
              <input
                type="text"
                placeholder="Annotation / section label..."
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F4F2EE] font-serif italic ${
                  theme === 'dark'
                    ? 'bg-[#262422] border-[#383532] text-[#F4F2EE] placeholder-[#807C76]'
                    : 'bg-[#F9F8F6] border-[#E5E2DE] text-[#1A1A1A] placeholder-[#A5A29E]'
                }`}
              />
              <button
                onClick={() => {
                  onAddBookmark(newBookmarkNote);
                  setNewBookmarkNote('');
                }}
                className="w-full py-1.5 bg-[#1A1A1A] hover:bg-[#333333] dark:bg-[#F4F2EE] dark:text-[#1A1A1A] dark:hover:bg-white text-white rounded-full text-xs font-bold font-sans uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
              >
                <Bookmark className="w-3 h-3" />
                <span>Save Plate</span>
              </button>
            </div>

            {/* Saved Bookmarks List */}
            <div className="space-y-2.5">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-xs font-serif italic text-[#A5A29E]">
                  No archival bookmarks saved yet.
                </div>
              ) : (
                bookmarks.map((b) => {
                  const paddedNum = b.pageNumber < 10 ? `0${b.pageNumber}` : `${b.pageNumber}`;
                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border flex items-start justify-between space-x-2 transition-colors ${
                        b.pageNumber === currentPage
                          ? theme === 'dark'
                            ? 'bg-[#262422] border-[#F4F2EE]'
                            : 'bg-white border-[#1A1A1A] shadow-xs'
                          : theme === 'dark'
                          ? 'bg-[#1C1B1A]/40 border-[#2E2C2A] hover:bg-[#1C1B1A]'
                          : 'bg-white/70 border-[#E5E2DE] hover:bg-white'
                      }`}
                    >
                      <button
                        onClick={() => onPageSelect(b.pageNumber)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                          <span className="text-xs font-sans font-bold">Plate {paddedNum}</span>
                        </div>
                        {b.note && (
                          <p className="text-xs font-serif italic text-[#4A4846] dark:text-[#C4C0BA] mt-1 truncate">
                            &ldquo;{b.note}&rdquo;
                          </p>
                        )}
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(b.id)}
                        title="Delete bookmark"
                        className="p-1 rounded-full text-[#A5A29E] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Editorial Page Tracker */}
      <div
        className={`p-4 sm:p-5 border-t text-xs font-sans flex items-center justify-between ${
          theme === 'dark'
            ? 'border-[#2E2C2A] bg-[#1C1B1A]/60 text-[#807C76]'
            : 'border-[#E5E2DE] bg-white/70 text-[#A5A29E]'
        }`}
      >
        <span className="font-sans font-medium">Page {currentPage} of {totalPages}</span>
        <span className="font-serif italic text-[#1A1A1A] dark:text-[#F4F2EE]">Monograph edition</span>
      </div>
    </aside>
  );
};

interface OutlineNodeProps {
  item: PDFOutlineItem;
  itemIndex?: string;
  pdfDoc: PDFDocumentProxy | null;
  theme: ThemeMode;
  currentPage?: number;
  onPageSelect: (page: number) => void;
}

const OutlineNode: React.FC<OutlineNodeProps> = ({
  item,
  itemIndex,
  pdfDoc,
  theme,
  currentPage,
  onPageSelect,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = async () => {
    if (typeof item.pageIndex === 'number') {
      onPageSelect(item.pageIndex + 1);
      return;
    }

    if (pdfDoc && item.dest) {
      try {
        let dest = item.dest;
        if (typeof dest === 'string') {
          dest = await pdfDoc.getDestination(dest);
        }
        if (dest && dest[0]) {
          const pageIndex = await pdfDoc.getPageIndex(dest[0]);
          onPageSelect(pageIndex + 1);
        }
      } catch (err) {
        console.warn('Failed to resolve outline destination', err);
      }
    }
  };

  const hasChildren = item.items && item.items.length > 0;
  const isSelected = typeof item.pageIndex === 'number' && currentPage === item.pageIndex + 1;

  return (
    <div className="text-xs">
      <div
        className="flex items-baseline space-x-2 py-1 cursor-pointer transition-colors group"
      >
        {itemIndex && (
          <span className="text-[11px] text-[#A5A29E] font-sans font-medium select-none">
            {itemIndex}
          </span>
        )}
        <span
          onClick={handleClick}
          className={`flex-1 font-serif text-sm leading-snug transition-colors ${
            isSelected
              ? 'text-[#1A1A1A] dark:text-[#F4F2EE] font-semibold border-b border-[#1A1A1A] dark:border-[#F4F2EE] pb-0.5'
              : 'text-[#4A4846] dark:text-[#C4C0BA] group-hover:text-[#1A1A1A] dark:group-hover:text-white'
          }`}
        >
          {item.title}
        </span>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 rounded-sm text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="pl-4 border-l border-[#E5E2DE] dark:border-[#2E2C2A] ml-2 mt-1 space-y-1.5">
          {item.items!.map((child, i) => (
            <OutlineNode
              key={i}
              item={child}
              pdfDoc={pdfDoc}
              theme={theme}
              currentPage={currentPage}
              onPageSelect={onPageSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
