import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildStoryPdf(input: { title: string; content: string; childName: string }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const pageWidth = 595; // A4-ish, points
  const pageHeight = 842;
  const margin = 60;
  const maxCharsPerLine = 78;
  const lineHeight = 16;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(input.title, {
    x: margin,
    y,
    size: 20,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.2),
  });
  y -= lineHeight * 2;

  page.drawText(`A story for ${input.childName}`, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= lineHeight * 2;

  const paragraphs = input.content.split(/\n+/);
  for (const paragraph of paragraphs) {
    const lines = wrapText(paragraph, maxCharsPerLine);
    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
    y -= lineHeight * 0.5;
  }

  return pdfDoc.save();
}
