import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PageColorFilter, DrawingPath, StickyNote, DrawingPoint } from '../types';
import { MessageSquare, X, Trash2 } from 'lucide-react';

interface PageViewProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
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
  searchHighlights?: string[];
  onPageRendered?: (pageNumber: number, width: number, height: number) => void;
}

export const PageView: React.FC<PageViewProps> = ({
  pdfDoc,
  pageNumber,
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
  onPageRendered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [textLayerItems, setTextLayerItems] = useState<any[]>([]);

  // Render PDF Page to Canvas with High-DPI support
  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        setPageSize({ width: viewport.width, height: viewport.height });

        if (onPageRendered) {
          onPageRendered(pageNumber, viewport.width, viewport.height);
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);

        ctx.save();
        ctx.scale(dpr, dpr);

        renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });

        await renderTask.promise;
        ctx.restore();

        // Extract Text Layer for selection
        try {
          const textContent = await page.getTextContent();
          if (!isCancelled) {
            setTextLayerItems(textContent.items);
          }
        } catch {
          // ignore text layer error if any
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNumber}`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  // Render Drawings on the Drawing Overlay Canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(pageSize.width * dpr);
    canvas.height = Math.floor(pageSize.height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, pageSize.width, pageSize.height);

    const pageDrawings = drawings.filter((d) => d.pageNumber === pageNumber);

    pageDrawings.forEach((drawing) => {
      if (drawing.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = drawing.opacity || 1;

      ctx.moveTo(drawing.points[0].x * pageSize.width, drawing.points[0].y * pageSize.height);
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x * pageSize.width, drawing.points[i].y * pageSize.height);
      }
      ctx.stroke();
    });

    // Draw active path if currently drawing
    if (currentPath.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = annotationColor;
      ctx.lineWidth = annotationSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeAnnotationTool === 'highlighter' ? 0.4 : 1.0;

      ctx.moveTo(currentPath[0].x * pageSize.width, currentPath[0].y * pageSize.height);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x * pageSize.width, currentPath[i].y * pageSize.height);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [drawings, pageNumber, pageSize, currentPath, annotationColor, annotationSize, activeAnnotationTool]);

  // Drawing event handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>): DrawingPoint | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode) return;

    const pt = getCanvasCoordinates(e);
    if (!pt) return;

    if (activeAnnotationTool === 'note') {
      // Add sticky note
      onAddStickyNote({
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        pageNumber,
        x: pt.x * 100,
        y: pt.y * 100,
        text: '',
        color: annotationColor,
        createdAt: Date.now(),
        isExpanded: true,
      });
      return;
    }

    if (activeAnnotationTool === 'pen' || activeAnnotationTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentPath([pt]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !annotationMode) return;
    const pt = getCanvasCoordinates(e);
    if (!pt) return;
    setCurrentPath((prev) => [...prev, pt]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !annotationMode) return;
    setIsDrawing(false);

    if (currentPath.length >= 2) {
      onAddDrawing({
        id: 'draw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        pageNumber,
        points: currentPath,
        color: annotationColor,
        size: annotationSize,
        tool: activeAnnotationTool as 'pen' | 'highlighter',
        opacity: activeAnnotationTool === 'highlighter' ? 0.4 : 1.0,
      });
    }
    setCurrentPath([]);
  };

  // Color Filter CSS Styling
  const getFilterStyle = (): React.CSSProperties => {
    switch (colorFilter) {
      case 'inverted':
        return { filter: 'invert(0.92) hue-rotate(180deg) brightness(0.96) contrast(1.05)' };
      case 'sepia':
        return { filter: 'sepia(0.38) contrast(0.95) brightness(0.98)' };
      case 'high-contrast':
        return { filter: 'contrast(1.25) brightness(1.02)' };
      default:
        return {};
    }
  };

  const pageNotes = stickyNotes.filter((n) => n.pageNumber === pageNumber);

  return (
    <div
      ref={containerRef}
      id={`page-container-${pageNumber}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: `${pageSize.width}px`,
        height: `${pageSize.height}px`,
      }}
      className={`relative select-text transition-shadow duration-200 rounded-sm shadow-md bg-white ${
        annotationMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* PDF Rendering Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: `${pageSize.width}px`,
          height: `${pageSize.height}px`,
          ...getFilterStyle(),
        }}
        className="block absolute top-0 left-0 pointer-events-none rounded-sm transition-all"
      />

      {/* Drawings Canvas Overlay */}
      <canvas
        ref={drawingCanvasRef}
        style={{
          width: `${pageSize.width}px`,
          height: `${pageSize.height}px`,
        }}
        className="absolute top-0 left-0 pointer-events-none z-10"
      />

      {/* Sticky Notes on this Page */}
      {pageNotes.map((note) => (
        <StickyNoteItem
          key={note.id}
          note={note}
          onUpdate={(text) => onUpdateStickyNote(note.id, text)}
          onDelete={() => onDeleteStickyNote(note.id)}
        />
      ))}
    </div>
  );
};

interface StickyNoteItemProps {
  note: StickyNote;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

const StickyNoteItem: React.FC<StickyNoteItemProps> = ({ note, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(note.isExpanded ?? true);
  const [text, setText] = useState(note.text);

  return (
    <div
      style={{
        left: `${note.x}%`,
        top: `${note.y}%`,
      }}
      className="absolute z-20 -translate-x-3 -translate-y-3 cursor-default"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Sticky Note"
        className="w-7 h-7 rounded-full bg-amber-400 text-zinc-900 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
      >
        <MessageSquare className="w-4 h-4 fill-zinc-900" />
      </button>

      {isOpen && (
        <div className="absolute left-8 top-0 w-60 bg-amber-100 border border-amber-300 text-zinc-900 rounded-xl shadow-xl p-2.5 z-30 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 text-xs font-semibold text-amber-900">
            <span>Note</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={onDelete}
                className="p-1 hover:bg-amber-200 rounded text-amber-800"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-amber-200 rounded text-amber-800"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            autoFocus
            onChange={(e) => {
              setText(e.target.value);
              onUpdate(e.target.value);
            }}
            placeholder="Type your note here..."
            className="w-full h-24 bg-transparent text-xs p-1 mt-1.5 outline-none resize-none placeholder-amber-700/60 leading-relaxed font-sans"
          />
        </div>
      )}
    </div>
  );
};
