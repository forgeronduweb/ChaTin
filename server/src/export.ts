import { fileURLToPath } from 'node:url';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Baloo2-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Baloo2-Bold.ttf');

export function generateExcelBuffer(headers: string[], rows: string[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Feuille1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Chart blocks are raw JSON meant for the app's chart renderer, not readable
// prose - drop them from the PDF. Code fences are kept as plain text since
// there's no code layout in a text report.
function stripForPdf(text: string): string {
  return text
    .replace(/```chart[\s\S]*?```/g, '')
    .replace(/```\w*\n([\s\S]*?)```/g, '$1')
    .trim();
}

export function generatePdfBuffer(title: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Body', FONT_REGULAR);
    doc.registerFont('Heading', FONT_BOLD);

    doc.font('Heading').fontSize(16).text(title);
    doc.moveDown();
    doc.font('Body').fontSize(11).text(stripForPdf(text), { align: 'left' });
    doc.end();
  });
}
