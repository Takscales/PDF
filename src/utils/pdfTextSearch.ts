import { PDFDocumentProxy } from 'pdfjs-dist';
import { SearchMatch } from '../types';

export async function searchPdfDocument(
  pdfDoc: PDFDocumentProxy,
  query: string,
  onProgress?: (progress: number) => void
): Promise<SearchMatch[]> {
  if (!query || query.trim().length === 0) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchMatch[] = [];
  const totalPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      const normalizedPageText = pageString.toLowerCase();
      let startIndex = 0;
      let matchIdx = 0;

      while ((startIndex = normalizedPageText.indexOf(normalizedQuery, startIndex)) !== -1) {
        // Extract context snippet
        const snippetStart = Math.max(0, startIndex - 40);
        const snippetEnd = Math.min(pageString.length, startIndex + query.length + 40);
        let snippet = pageString.substring(snippetStart, snippetEnd);
        if (snippetStart > 0) snippet = '...' + snippet;
        if (snippetEnd < pageString.length) snippet = snippet + '...';

        results.push({
          pageNumber: pageNum,
          matchIndex: matchIdx++,
          snippet,
          textOffset: startIndex,
          matchLength: query.length,
        });

        startIndex += query.length;
      }
    } catch (err) {
      console.warn(`Could not extract text on page ${pageNum}`, err);
    }

    if (onProgress) {
      onProgress(pageNum / totalPages);
    }
  }

  return results;
}

export async function extractPageText(pdfDoc: PDFDocumentProxy, pageNumber: number): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str || '').join(' ');
  } catch {
    return '';
  }
}
