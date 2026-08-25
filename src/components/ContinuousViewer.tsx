import React, { useEffect, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PageView } from './PageView';
import { PageColorFilter, DrawingPath, StickyNote } from '../types';

interface ContinuousViewerProps {
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

export const ContinuousViewer: React.FC<ContinuousViewerProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // IntersectionObserver to detect currently visible page during scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            onPageChange(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.1, 0.4, 0.8],
      }
    );

    const elements: HTMLElement[] = [];
    for (let i = 1; i <= totalPages; i++) {
      const el = pageRefs.current[i];
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [totalPages, onPageChange]);

  // Scroll to active page when changed externally (e.g. sidebar click or input)
  const isInitialOrExternalChange = useRef(true);
  useEffect(() => {
    const targetEl = pageRefs.current[currentPage];
    if (targetEl && containerRef.current) {
      // Check if not already in view
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      const isInView = elRect.top >= containerRect.top - 50 && elRect.bottom <= containerRect.bottom + 50;

      if (!isInView) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      id="continuous-viewer-scroll"
      className="w-full h-full overflow-auto flex flex-col items-center py-8 px-4 space-y-8 custom-scrollbar select-none"
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <div
          key={pageNum}
          ref={(el) => {
            pageRefs.current[pageNum] = el;
          }}
          data-page-number={pageNum}
          className="flex flex-col items-center"
        >
          <PageView
            pdfDoc={pdfDoc}
            pageNumber={pageNum}
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
          <div className="mt-2 text-[11px] font-medium text-zinc-400">
            Page {pageNum} of {totalPages}
          </div>
        </div>
      ))}
    </div>
  );
};
