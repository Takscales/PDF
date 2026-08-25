export type ThemeMode = 'light' | 'dark';

export type PageViewMode = 'single' | 'continuous' | 'spread';

export type PageColorFilter = 'default' | 'inverted' | 'sepia' | 'high-contrast';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date | string;
  modificationDate?: Date | string;
  pdfFormatVersion?: string;
  pageCount: number;
  fileSize?: number;
  fileName: string;
}

export interface PDFOutlineItem {
  title: string;
  dest?: any;
  items?: PDFOutlineItem[];
  pageIndex?: number;
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
  textOffset: number;
  matchLength: number;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  createdAt: number;
  note?: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  pageNumber: number;
  points: DrawingPoint[];
  color: string;
  size: number;
  tool: 'pen' | 'highlighter';
  opacity: number;
}

export interface StickyNote {
  id: string;
  pageNumber: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  text: string;
  color: string;
  author?: string;
  createdAt: number;
  isExpanded?: boolean;
}

export interface HighlightRect {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
}

export interface SamplePDF {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  pages: number;
  description: string;
  generate: () => Promise<Uint8Array>;
}
