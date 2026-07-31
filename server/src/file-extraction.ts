import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
// @e965/xlsx, not the 'xlsx' package on npm: SheetJS stopped publishing
// fixed releases to the npm registry after 0.18.5 (still vulnerable to
// prototype pollution / ReDoS during parsing - GHSA-4r6h-8v6p-xvw6,
// GHSA-5pgg-2g8v-p4x9), and this is exactly the codepath that parses a
// user-uploaded, untrusted .xlsx/.xls attachment. @e965/xlsx republishes
// SheetJS's own later, patched source to npm under a scoped name.
import * as XLSX from '@e965/xlsx';

const MAX_CHARS = 12_000;

const PDF_TYPES = new Set(['application/pdf']);
const DOCX_TYPES = new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const EXCEL_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

export const SUPPORTED_ATTACHMENT_TYPES = new Set([...PDF_TYPES, ...DOCX_TYPES, ...EXCEL_TYPES]);

// Sent straight to Gemini as inline image data (see gemini.ts) rather than
// through extractFileText - there's no text to extract, the model looks at
// the pixels directly.
export const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function truncate(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_CHARS)}\n[texte tronqué, document trop long]`;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
    return `--- ${name} ---\n${csv}`;
  }).join('\n\n');
}

export async function extractFileText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (PDF_TYPES.has(mimeType) || filename.toLowerCase().endsWith('.pdf')) {
    return truncate(await extractPdf(buffer));
  }
  if (DOCX_TYPES.has(mimeType) || filename.toLowerCase().endsWith('.docx')) {
    return truncate(await extractDocx(buffer));
  }
  if (EXCEL_TYPES.has(mimeType) || /\.(xlsx|xls)$/i.test(filename)) {
    return truncate(extractExcel(buffer));
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}
