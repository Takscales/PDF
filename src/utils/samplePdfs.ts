import { SamplePDF } from '../types';

/**
 * Clean lightweight pure-JS PDF generator that creates valid standard multi-page PDF files
 * with text streams, headings, paragraphs, bullet points, styling, and bookmarks.
 */
class MinimalPdfBuilder {
  private objects: string[] = [];
  private pageObjectIds: number[] = [];
  private fontObjectId: number = 0;
  private boldFontObjectId: number = 0;
  private monoFontObjectId: number = 0;
  private italicFontObjectId: number = 0;
  private outlinesObjectId: number = 0;
  private outlineItems: { title: string; pageIndex: number }[] = [];

  constructor() {
    // 1: Catalog placeholder
    this.objects.push('');
    // 2: Outlines placeholder
    this.objects.push('');
    // 3: Pages catalog placeholder
    this.objects.push('');

    // 4: Regular Font (Helvetica)
    this.fontObjectId = this.addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    // 5: Bold Font (Helvetica-Bold)
    this.boldFontObjectId = this.addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    // 6: Mono Font (Courier)
    this.monoFontObjectId = this.addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
    // 7: Italic Font (Helvetica-Oblique)
    this.italicFontObjectId = this.addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
  }

  private addObject(content: string): number {
    this.objects.push(content);
    return this.objects.length;
  }

  public addOutline(title: string, pageIndex: number) {
    this.outlineItems.push({ title, pageIndex });
  }

  public addPage(drawCommands: (ctx: PageContext) => void) {
    const pageCtx = new PageContext(
      this.fontObjectId,
      this.boldFontObjectId,
      this.monoFontObjectId,
      this.italicFontObjectId
    );
    drawCommands(pageCtx);
    const contentStream = pageCtx.toStream();

    const streamLength = contentStream.length;
    const contentObjId = this.addObject(`<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream`);

    const pageObjId = this.addObject(`<< /Type /Page /Parent 3 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${this.fontObjectId} 0 R /F2 ${this.boldFontObjectId} 0 R /F3 ${this.monoFontObjectId} 0 R /F4 ${this.italicFontObjectId} 0 R >> >> >>`);
    this.pageObjectIds.push(pageObjId);
  }

  public build(): Uint8Array {
    // 3: Pages object
    const kidsStr = this.pageObjectIds.map((id) => `${id} 0 R`).join(' ');
    this.objects[2] = `<< /Type /Pages /Kids [${kidsStr}] /Count ${this.pageObjectIds.length} >>`;

    // Outline items if any
    if (this.outlineItems.length > 0) {
      const outlineObjIds: number[] = [];
      for (let i = 0; i < this.outlineItems.length; i++) {
        const item = this.outlineItems[i];
        const pageRef = this.pageObjectIds[Math.min(item.pageIndex, this.pageObjectIds.length - 1)];
        // Add outline item object
        const itemObjId = this.addObject(
          `<< /Title (${escapePdfString(item.title)}) /Parent 2 0 R /Dest [${pageRef} 0 R /Fit] >>`
        );
        outlineObjIds.push(itemObjId);
      }

      this.objects[1] = `<< /Type /Outlines /First ${outlineObjIds[0]} 0 R /Last ${outlineObjIds[outlineObjIds.length - 1]} 0 R /Count ${outlineObjIds.length} >>`;
      this.objects[0] = `<< /Type /Catalog /Pages 3 0 R /Outlines 2 0 R >>`;
    } else {
      this.objects[1] = `<< /Type /Outlines /Count 0 >>`;
      this.objects[0] = `<< /Type /Catalog /Pages 3 0 R >>`;
    }

    // Build the final PDF binary string
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets: number[] = [];

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const xrefOffset = out.length;
    out += `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      out += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) {
      bytes[i] = out.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

class PageContext {
  private stream: string = '';
  public width = 595.28;
  public height = 841.89;

  constructor(
    private fRegular: number,
    private fBold: number,
    private fMono: number,
    private fItalic: number
  ) {}

  public setColor(r: number, g: number, b: number) {
    this.stream += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg\n`;
    this.stream += `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG\n`;
  }

  public fillRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
    this.setColor(r, g, b);
    // PDF coordinates origin is bottom-left
    const pdfY = this.height - y - h;
    this.stream += `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
  }

  public drawRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, lineWidth: number = 1) {
    this.setColor(r, g, b);
    const pdfY = this.height - y - h;
    this.stream += `${lineWidth.toFixed(2)} w\n`;
    this.stream += `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S\n`;
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lineWidth: number = 1) {
    this.setColor(r, g, b);
    const pdfY1 = this.height - y1;
    const pdfY2 = this.height - y2;
    this.stream += `${lineWidth.toFixed(2)} w\n`;
    this.stream += `${x1.toFixed(2)} ${pdfY1.toFixed(2)} m ${x2.toFixed(2)} ${pdfY2.toFixed(2)} l S\n`;
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    size: number,
    fontType: 'regular' | 'bold' | 'mono' | 'italic' = 'regular',
    r: number = 30,
    g: number = 30,
    b: number = 35
  ) {
    const fontCode = fontType === 'bold' ? '/F2' : fontType === 'mono' ? '/F3' : fontType === 'italic' ? '/F4' : '/F1';
    this.setColor(r, g, b);
    const pdfY = this.height - y;
    this.stream += `BT\n${fontCode} ${size.toFixed(2)} Tf\n1 0 0 1 ${x.toFixed(2)} ${pdfY.toFixed(2)} Tm\n(${escapePdfString(text)}) Tj\nET\n`;
  }

  public drawParagraph(
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    fontSize: number = 11,
    lineHeight: number = 16,
    fontType: 'regular' | 'bold' | 'mono' | 'italic' = 'regular',
    r: number = 55,
    g: number = 65,
    b: number = 81
  ): number {
    const words = text.split(' ');
    let currentLine = '';
    let currentY = startY;
    const approxCharWidth = fontSize * 0.52;
    const maxCharsPerLine = Math.floor(maxWidth / approxCharWidth);

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxCharsPerLine) {
        this.drawText(currentLine, x, currentY, fontSize, fontType, r, g, b);
        currentLine = word;
        currentY += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      this.drawText(currentLine, x, currentY, fontSize, fontType, r, g, b);
      currentY += lineHeight;
    }
    return currentY;
  }

  public toStream(): string {
    return this.stream;
  }
}

export const SAMPLE_PDFS: SamplePDF[] = [
  {
    id: 'ai-quantum-report',
    title: 'AI & Quantum Horizons Report 2026',
    subtitle: 'Research Briefing on Frontier Intelligence & Quantum Supremacy',
    category: 'Technology & Science',
    pages: 5,
    description: 'Comprehensive 5-page research document with executive overview, neural architectures, quantum algorithms, and ethics.',
    generate: async () => {
      const builder = new MinimalPdfBuilder();

      // Outline
      builder.addOutline('1. Executive Summary', 0);
      builder.addOutline('2. Autonomous Agentic Architectures', 1);
      builder.addOutline('3. Quantum Error Mitigation & Scalability', 2);
      builder.addOutline('4. Benchmark Metrics & Comparative Analysis', 3);
      builder.addOutline('5. Ethical Governance & Future Horizons', 4);

      // Page 1: Cover & Exec Summary
      builder.addPage((ctx) => {
        // Decorative top bar
        ctx.fillRect(0, 0, ctx.width, 12, 59, 130, 246);
        ctx.fillRect(48, 48, 6, 44, 37, 99, 235);

        ctx.drawText('FRONTIER RESEARCH INITIATIVE', 62, 58, 10, 'bold', 37, 99, 235);
        ctx.drawText('AI & Quantum Horizons Report', 62, 82, 22, 'bold', 17, 24, 39);
        ctx.drawText('Accelerating Cognitive Systems and Coherent Computation', 62, 102, 12, 'italic', 100, 116, 139);

        ctx.drawLine(48, 126, ctx.width - 48, 126, 226, 232, 240, 1.5);

        // Section 1
        ctx.drawText('1. Executive Summary', 48, 158, 15, 'bold', 15, 23, 42);
        let y = ctx.drawParagraph(
          'The intersection of deep agentic artificial intelligence and fault-tolerant quantum computing represents the most consequential technological frontier of the 21st century. Over the past twenty-four months, foundational machine intelligence architectures have transitioned from reactive probabilistic predictors to sovereign reasoning engines capable of autonomous scientific discovery, theorem verification, and dynamic cross-domain synthesis.',
          48,
          182,
          500,
          11,
          17
        );

        y = ctx.drawParagraph(
          'Simultaneously, quantum processors have crossed the pivotal threshold into fault-tolerant logical qubit operations. Topological stabilizer codes and real-time cryogenic feedback loops now maintain macroscopic coherence across thousands of quantum operations, reducing logical error rates below 10^-6.',
          48,
          y + 12,
          500,
          11,
          17
        );

        // Highlight Box
        ctx.fillRect(48, y + 20, 500, 70, 241, 245, 249);
        ctx.drawRect(48, y + 20, 500, 70, 203, 213, 225, 1);
        ctx.drawText('KEY STRATEGIC FINDING', 64, y + 38, 9, 'bold', 30, 58, 138);
        ctx.drawParagraph(
          'Hybrid quantum-classical neural networks achieve exponential polynomial speedups on combinatorial protein folding and catalyst discovery compared to classical tensor accelerators alone.',
          64,
          y + 54,
          470,
          10,
          14,
          'regular',
          51,
          65,
          85
        );

        // Metadata footer
        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Frontier Research Lab • Global Quantum Intelligence', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 1 of 5', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 2: Autonomous Agentic Architectures
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 59, 130, 246);
        ctx.drawText('2. Autonomous Agentic Architectures', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Hierarchical reasoning loops, tool orchestration, and neural memory graphs.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        let y = ctx.drawParagraph(
          'Modern cognitive agents diverge fundamentally from single-turn language models. By decoupling semantic memory from execution planning, modern multi-agent clusters employ tree-of-thought recursive reflection to synthesize proofs and debug multi-tiered software architectures.',
          48,
          112,
          500,
          11,
          17
        );

        // Architecture Table
        ctx.fillRect(48, y + 20, 500, 24, 224, 231, 255);
        ctx.drawText('ARCHITECTURE COMPONENT', 60, y + 36, 9, 'bold', 30, 64, 175);
        ctx.drawText('FUNCTIONAL ROLE', 240, y + 36, 9, 'bold', 30, 64, 175);
        ctx.drawText('LATENCY PROFILE', 430, y + 36, 9, 'bold', 30, 64, 175);

        const rows = [
          ['Episodic Memory Vault', 'Vector-compressed associative graph store', '12ms retrieval'],
          ['Reflective Meta-Controller', 'Multi-step Monte Carlo path verification', '140ms step'],
          ['Tool Protocol Dispatcher', 'Sandboxed RPC execution with safety gates', '25ms invoke'],
          ['Continuous Verifier', 'Formal symbolic theorem checking engine', '85ms proof'],
        ];

        let tableY = y + 44;
        rows.forEach(([comp, role, lat], i) => {
          const bg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
          ctx.fillRect(48, tableY, 500, 24, bg[0], bg[1], bg[2]);
          ctx.drawRect(48, tableY, 500, 24, 226, 232, 240, 0.5);
          ctx.drawText(comp, 60, tableY + 16, 9, 'bold', 30, 41, 59);
          ctx.drawText(role, 240, tableY + 16, 9, 'regular', 71, 85, 105);
          ctx.drawText(lat, 430, tableY + 16, 9, 'mono', 15, 118, 110);
          tableY += 24;
        });

        y = ctx.drawParagraph(
          'Experimental benchmarks demonstrate that agent architectures with structured reflection loops demonstrate a 41.8% reduction in hallucinations across high-dimensional causal reasoning tasks.',
          48,
          tableY + 28,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Frontier Research Lab • Global Quantum Intelligence', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 2 of 5', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 3: Quantum Error Mitigation
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 59, 130, 246);
        ctx.drawText('3. Quantum Error Mitigation & Scalability', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Surface code implementations and superconducting transmon fidelity.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        let y = ctx.drawParagraph(
          'Physical qubits suffer from environmental decoherence and thermal crosstalk. To achieve practical quantum advantage, scalable surface code lattices multiplex dozens of physical transmons into a single resilient logical qubit protected by parity check syndrome measurements.',
          48,
          112,
          500,
          11,
          17
        );

        // Technical Box
        ctx.fillRect(48, y + 20, 500, 140, 248, 250, 252);
        ctx.drawRect(48, y + 20, 500, 140, 203, 213, 225, 1);
        ctx.drawText('SURFACE CODE HAMILTONIAN FORMULATION', 64, y + 42, 10, 'bold', 15, 23, 42);
        ctx.drawText('H = - J_x ∑ A_s - J_z ∑ B_p', 64, y + 68, 13, 'mono', 37, 99, 235);
        ctx.drawParagraph(
          'Where A_s represents star vertex operators measuring X-basis parity and B_p represents plaquette operators measuring Z-basis phase flips. Real-time syndrome decoding running on sub-Kelvin FPGA co-processors corrects stabilizer drift in under 180 nanoseconds.',
          64,
          y + 88,
          470,
          10,
          14
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Frontier Research Lab • Global Quantum Intelligence', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 3 of 5', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 4: Benchmark Metrics
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 59, 130, 246);
        ctx.drawText('4. Benchmark Metrics & Comparative Analysis', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Empirical evaluation across synthetic and real-world workloads.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        let y = ctx.drawParagraph(
          'To quantify performance improvements, our consortium conducted standardized evaluations comparing classical supercomputing clusters against hybrid quantum neural co-processors.',
          48,
          112,
          500,
          11,
          17
        );

        // Chart / Visual Cards
        const cards = [
          { title: '98.4%', subtitle: 'Chemical Synthesis Accuracy', color: [16, 185, 129] },
          { title: '14.2x', subtitle: 'Energy Efficiency Multiplier', color: [59, 130, 246] },
          { title: '<0.01%', subtitle: 'Syndrome Parity Failure Rate', color: [139, 92, 246] },
        ];

        cards.forEach((c, idx) => {
          const cardX = 48 + idx * 172;
          ctx.fillRect(cardX, y + 20, 156, 80, 248, 250, 252);
          ctx.drawRect(cardX, y + 20, 156, 80, 226, 232, 240, 1);
          ctx.drawText(c.title, cardX + 16, y + 54, 20, 'bold', c.color[0], c.color[1], c.color[2]);
          ctx.drawParagraph(c.subtitle, cardX + 16, y + 74, 124, 9, 12, 'bold', 71, 85, 105);
        });

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Frontier Research Lab • Global Quantum Intelligence', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 4 of 5', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 5: Ethics & Future Horizons
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 59, 130, 246);
        ctx.drawText('5. Ethical Governance & Future Horizons', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Responsible scaling, cryptographic transitions, and 2030 roadmap.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        let y = ctx.drawParagraph(
          'As quantum-enhanced intelligence approaches autonomous scientific agency, robust verification protocols and post-quantum cryptographic standards (NIST ML-KEM and ML-DSA) must be integrated across every public infrastructure node.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawParagraph(
          'The roadmap for 2026-2030 prioritizes verifiable open-weights foundation models paired with room-temperature photonics interfaces, paving the way for ubiquitous quantum compute accessible via standardized cloud hypervisors.',
          48,
          y + 12,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Frontier Research Lab • Global Quantum Intelligence', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 5 of 5', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      return builder.build();
    },
  },
  {
    id: 'typography-design',
    title: 'The Art of Typography & Visual Rhythm',
    subtitle: 'A Handbook on Proportions, Grids, and Optical Balance',
    category: 'Design & Aesthetics',
    pages: 4,
    description: 'An inspiring 4-page guide detailing typographic scales, negative space mastery, baseline rhythm, and chromatic hierarchy.',
    generate: async () => {
      const builder = new MinimalPdfBuilder();
      builder.addOutline('1. The Golden Ratio in Typographic Scale', 0);
      builder.addOutline('2. Vertical Rhythm & Baseline Grids', 1);
      builder.addOutline('3. Micro-Typography & Optical Kerning', 2);
      builder.addOutline('4. Chromatic Contrast & Dark Mode Semantics', 3);

      // Page 1
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 10, 217, 119, 6);
        ctx.drawText('DESIGN ESSENTIALS VOL. IV', 48, 54, 10, 'bold', 217, 119, 6);
        ctx.drawText('The Art of Typography & Visual Rhythm', 48, 78, 20, 'bold', 24, 24, 27);
        ctx.drawText('Mastering Proportions, Optical Weight, and Spatial Harmony', 48, 98, 11, 'italic', 113, 113, 122);
        ctx.drawLine(48, 118, ctx.width - 48, 118, 228, 228, 231, 1);

        ctx.drawText('1. The Golden Ratio in Typographic Scale', 48, 148, 15, 'bold', 24, 24, 27);
        const y = ctx.drawParagraph(
          'Typography is the craft of endowing human language with a durable visual form. When designing reading experiences, arbitrary font sizes disrupt reading cadence. Using mathematical scales based on the Major Third (1.250) or the Golden Section (1.618) introduces an intuitive harmony that guides the reader’s eye effortlessly.',
          48,
          170,
          500,
          11,
          17
        );

        ctx.drawParagraph(
          'Good typography is invisible; great typography is resonant. By calibrating line-heights inversely to measure and keeping paragraph line lengths between 55 and 75 characters, reading fatigue drops precipitously.',
          48,
          y + 12,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 228, 228, 231, 1);
        ctx.drawText('Studio Atelier • Typography Guidelines', 48, 808, 9, 'regular', 161, 161, 170);
        ctx.drawText('Page 1 of 4', ctx.width - 98, 808, 9, 'bold', 113, 113, 122);
      });

      // Page 2
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 217, 119, 6);
        ctx.drawText('2. Vertical Rhythm & Baseline Grids', 48, 56, 16, 'bold', 24, 24, 27);
        ctx.drawText('Aligning modular elements to 4px and 8px foundational increments.', 48, 74, 10, 'italic', 113, 113, 122);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 228, 228, 231, 1);

        ctx.drawParagraph(
          'A strict baseline grid anchors text elements, ensuring that multi-column articles align across gutters and that interactive callouts respect natural reading lines. Container outer padding must always match or exceed the inner gap between its child nodes to prevent optical friction.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 228, 228, 231, 1);
        ctx.drawText('Studio Atelier • Typography Guidelines', 48, 808, 9, 'regular', 161, 161, 170);
        ctx.drawText('Page 2 of 4', ctx.width - 98, 808, 9, 'bold', 113, 113, 122);
      });

      // Page 3
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 217, 119, 6);
        ctx.drawText('3. Micro-Typography & Optical Kerning', 48, 56, 16, 'bold', 24, 24, 27);
        ctx.drawText('Refining tabular numerals, em-dashes, and optical margins.', 48, 74, 10, 'italic', 113, 113, 122);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 228, 228, 231, 1);

        ctx.drawParagraph(
          'Micro-typography handles the subtleties of punctuation hanging, tracking calibration at small font sizes, and font-feature settings. Enabling kerning pairs and proper lining vs tabular figures transforms raw text into a bespoke editorial masterwork.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 228, 228, 231, 1);
        ctx.drawText('Studio Atelier • Typography Guidelines', 48, 808, 9, 'regular', 161, 161, 170);
        ctx.drawText('Page 3 of 4', ctx.width - 98, 808, 9, 'bold', 113, 113, 122);
      });

      // Page 4
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 217, 119, 6);
        ctx.drawText('4. Chromatic Contrast & Dark Mode Semantics', 48, 56, 16, 'bold', 24, 24, 27);
        ctx.drawText('Preserving accessibility and reducing ocular glare across lighting environments.', 48, 74, 10, 'italic', 113, 113, 122);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 228, 228, 231, 1);

        ctx.drawParagraph(
          'Dark mode is not simply inverted light mode. Contrast ratios should maintain WCAG AA compliance (4.5:1 minimum) while avoiding harsh pure white on pure black (#000000) pairings that trigger visual haloing. Sophisticated zinc and slate surfaces with 5% warm undertones provide maximum legibility.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 228, 228, 231, 1);
        ctx.drawText('Studio Atelier • Typography Guidelines', 48, 808, 9, 'regular', 161, 161, 170);
        ctx.drawText('Page 4 of 4', ctx.width - 98, 808, 9, 'bold', 113, 113, 122);
      });

      return builder.build();
    },
  },
  {
    id: 'system-design-cheatsheet',
    title: 'Distributed Systems & Cloud Patterns',
    subtitle: 'Architectural Reference Sheet for High-Throughput Engineering',
    category: 'Software Engineering',
    pages: 3,
    description: 'Concise 3-page reference covering Raft consensus, write-ahead logs, sharding models, and eventual consistency.',
    generate: async () => {
      const builder = new MinimalPdfBuilder();
      builder.addOutline('1. Consensus Protocols: Raft & Paxos', 0);
      builder.addOutline('2. Storage Engines: LSM-Trees vs B-Trees', 1);
      builder.addOutline('3. Caching & Resilience Patterns', 2);

      // Page 1
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 10, 16, 185, 129);
        ctx.drawText('ENGINEERING CHEATSHEET', 48, 54, 10, 'bold', 16, 185, 129);
        ctx.drawText('Distributed Systems & Cloud Patterns', 48, 78, 20, 'bold', 15, 23, 42);
        ctx.drawText('High Availability, Consensus, and Scalable Data Topologies', 48, 98, 11, 'italic', 100, 116, 139);
        ctx.drawLine(48, 118, ctx.width - 48, 118, 226, 232, 240, 1);

        ctx.drawText('1. Consensus Protocols: Raft & Paxos', 48, 148, 15, 'bold', 15, 23, 42);
        ctx.drawParagraph(
          'Replicated state machines ensure consistent fault-tolerant computation across distributed clusters. Raft decomposes leader election, log replication, and safety constraints into distinct formal stages with deterministic heartbeat intervals.',
          48,
          170,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Cloud Architecture Guild', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 1 of 3', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 2
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 16, 185, 129);
        ctx.drawText('2. Storage Engines: LSM-Trees vs B-Trees', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Write amplification trade-offs for high-volume telemetry ingestion.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        ctx.drawParagraph(
          'Log-Structured Merge-trees (LSMs) optimize for sequential SSD writes using memory memtables and immutable SSTables with background compaction. In contrast, B+ Trees offer predictable single-point read latencies at the cost of random write page fragmentation.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Cloud Architecture Guild', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 2 of 3', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      // Page 3
      builder.addPage((ctx) => {
        ctx.fillRect(0, 0, ctx.width, 6, 16, 185, 129);
        ctx.drawText('3. Caching & Resilience Patterns', 48, 56, 16, 'bold', 15, 23, 42);
        ctx.drawText('Circuit breakers, rate limiters, and cache stamps mitigation.', 48, 74, 10, 'italic', 100, 116, 139);
        ctx.drawLine(48, 88, ctx.width - 48, 88, 226, 232, 240, 1);

        ctx.drawParagraph(
          'Resilient microservices isolate failures via adaptive circuit breakers (hystrix states), token bucket rate limiting, and distributed cache warming to avoid thundering herd database degradation.',
          48,
          112,
          500,
          11,
          17
        );

        ctx.drawLine(48, 790, ctx.width - 48, 790, 226, 232, 240, 1);
        ctx.drawText('Cloud Architecture Guild', 48, 808, 9, 'regular', 148, 163, 184);
        ctx.drawText('Page 3 of 3', ctx.width - 98, 808, 9, 'bold', 100, 116, 139);
      });

      return builder.build();
    },
  },
];
