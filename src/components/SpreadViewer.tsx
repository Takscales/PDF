import React from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PageView } from './PageView';
import { PageColorFilter, DrawingPath, StickyNote } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SpreadViewerProps {
  pdfDoc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale: number;
  rotation: number;
  colorFilter: PageColorFilter;
  annotationMode: boolean;
  activeAnnotationTool: 'pen' | 'highlighter' | 'note' | 'eraser';
  annotationColor: string;
  annotationSize: number;
  drawings: DrawingPath[];
  onAddDrawing: (drawing: DrawingPath) => void;
  stickyNotes: StickyNote[];
  onAddStickyNote: (note: StickyNote) => void;
  onUpdateStickyNote: (id: string, text: string) => void;
  onDeleteStickyNote: (id: string) => void;
}

export const SpreadViewer: React.FC<SpreadViewerProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  onPageChange,
  scale,
  rotation,
  colorFilter,
  annotationMode,
  activeAnnotationTool,
  annotationColor,
  annotationSize,
  drawings,
  onAddDrawing,
  stickyNotes,
  onAddStickyNote,
  onUpdateStickyNote,
  onDeleteStickyNote,
}) => {
  // In spread view, show pair: e.g. [1, 2], [3, 4], etc. (or page 1 standalone if desired)
  const leftPage = currentPage % 2 === 1 ? currentPage : currentPage - 1;
  const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null;

  return (
    <div
      id="spread-viewer-container"
      className="w-full h-full overflow-auto flex items-center justify-center p-6 custom-scrollbar"
    >
      <div className="flex items-center space-x-4">
        {/* Left Page Turn Button */}
        <button
          onClick={() => onPageChange(Math.max(1, leftPage - 2))}
          disabled={leftPage <= 1}
          className="p-3 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-20 transition-all text-zinc-700 dark:text-zinc-200"
          title="Previous 2 Pages"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* 2-Page Book Spread Display */}
        <div className="flex items-start shadow-2xl rounded-md overflow-hidden bg-zinc-200 dark:bg-zinc-800 p-1 gap-1">
          {/* Left Page */}
          <div className="flex flex-col items-center">
            <PageView
              pdfDoc={pdfDoc}
              pageNumber={leftPage}
              scale={scale}
              rotation={rotation}
              colorFilter={colorFilter}
              annotationMode={annotationMode}
              activeAnnotationTool={activeAnnotationTool}
              annotationColor={annotationColor}
              annotationSize={annotationSize}
              drawings={drawings}
              onAddDrawing={onAddDrawing}
              stickyNotes={stickyNotes}
              onAddStickyNote={onAddStickyNote}
              onUpdateStickyNote={onUpdateStickyNote}
              onDeleteStickyNote={onDeleteStickyNote}
            />
            <div className="mt-2 text-xs font-semibold text-zinc-500">
              Page {leftPage}
            </div>
          </div>

          {/* Right Page if exists */}
          {rightPage && (
            <div className="flex flex-col items-center">
              <PageView
                pdfDoc={pdfDoc}
                pageNumber={rightPage}
                scale={scale}
                rotation={rotation}
                colorFilter={colorFilter}
                annotationMode={annotationMode}
                activeAnnotationTool={activeAnnotationTool}
                annotationColor={annotationColor}
                annotationSize={annotationSize}
                drawings={drawings}
                onAddDrawing={onAddDrawing}
                stickyNotes={stickyNotes}
                onAddStickyNote={onAddStickyNote}
                onUpdateStickyNote={onUpdateStickyNote}
                onDeleteStickyNote={onDeleteStickyNote}
              />
              <div className="mt-2 text-xs font-semibold text-zinc-500">
                Page {rightPage}
              </div>
            </div>
          )}
        </div>

        {/* Right Page Turn Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, leftPage + 2))}
          disabled={!rightPage || rightPage >= totalPages}
          className="p-3 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-20 transition-all text-zinc-700 dark:text-zinc-200"
          title="Next 2 Pages"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
