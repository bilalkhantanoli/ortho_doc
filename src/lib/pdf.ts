export interface PdfField {
  label: string;
  value: string;
}

export interface PdfSection {
  title: string;
  fields?: PdfField[];
  paragraphs?: string[];
}

export interface PdfDocumentInput {
  title: string;
  subtitle?: string;
  meta?: PdfField[];
  sections: PdfSection[];
  footer?: string;
}

interface PdfLine {
  text: string;
  font: "regular" | "bold";
  size: number;
}

const sanitizeText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapePdfText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const wrapText = (value: string, maxChars: number) => {
  const text = sanitizeText(value);
  if (!text) {
    return [""];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [text];
};

const buildPdfLines = (input: PdfDocumentInput): PdfLine[] => {
  const lines: PdfLine[] = [
    { text: input.title, font: "bold", size: 18 },
  ];

  if (input.subtitle) {
    lines.push({ text: input.subtitle, font: "regular", size: 11 });
  }

  if (input.meta?.length) {
    lines.push({ text: "", font: "regular", size: 10 });
    for (const item of input.meta) {
      wrapText(`${item.label}: ${item.value}`, 88).forEach((line) => {
        lines.push({ text: line, font: "regular", size: 10 });
      });
    }
  }

  input.sections.forEach((section) => {
    lines.push({ text: "", font: "regular", size: 10 });
    lines.push({ text: section.title, font: "bold", size: 13 });

    section.fields?.forEach((field) => {
      const wrapped = wrapText(`${field.label}: ${field.value}`, 88);
      wrapped.forEach((line) => {
        lines.push({ text: line, font: "regular", size: 10 });
      });
    });

    section.paragraphs?.forEach((paragraph) => {
      wrapText(paragraph, 92).forEach((line) => {
        lines.push({ text: line, font: "regular", size: 10 });
      });
    });
  });

  if (input.footer) {
    lines.push({ text: "", font: "regular", size: 10 });
    lines.push({ text: input.footer, font: "regular", size: 9 });
  }

  return lines;
};

const buildPdfStream = (lines: PdfLine[]) => {
  const pageTop = 760;
  const pageBottom = 72;
  const leftMargin = 72;
  const maxHeight = pageTop - pageBottom;
  const pages: string[] = [];

  let currentPage: string[] = [];
  let usedHeight = 0;

  const flushPage = () => {
    if (currentPage.length) {
      pages.push(currentPage.join("\n"));
      currentPage = [];
      usedHeight = 0;
    }
  };

  for (const line of lines) {
    const height = line.size + 5;
    if (usedHeight + height > maxHeight) {
      flushPage();
    }

    const y = pageTop - usedHeight;
    if (line.text) {
      const font = line.font === "bold" ? "F2" : "F1";
      currentPage.push(`BT /${font} ${line.size} Tf ${leftMargin} ${y} Td (${escapePdfText(line.text)}) Tj ET`);
    }

    usedHeight += height;
  }

  flushPage();
  return pages;
};

const createPdfDocument = (input: PdfDocumentInput) => {
  const lines = buildPdfLines(input);
  const pages = buildPdfStream(lines);
  const pageObjectIds = pages.map((_page, index) => 5 + index * 2);
  const contentObjectIds = pages.map((_page, index) => 6 + index * 2);

  const objects: string[] = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push(`2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >> endobj`);
  objects.push("3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj");
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj");

  pages.forEach((page, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    objects.push(`${contentObjectId} 0 obj << /Length ${page.length} >> stream\n${page}\nendstream endobj`);
    objects.push(
      `${pageObjectId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >> endobj`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

export const buildPdfBlob = (input: PdfDocumentInput) => {
  const pdf = createPdfDocument(input);
  return new Blob([pdf], { type: "application/pdf" });
};

export const downloadPdf = (input: PdfDocumentInput, fileName: string) => {
  const blob = buildPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
