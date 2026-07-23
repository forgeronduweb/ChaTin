import { Router } from 'express';
import { asyncHandler } from '../async-handler.js';
import { generateExcelBuffer, generatePdfBuffer } from '../export.js';

export const exportRouter = Router();

function safeFilename(title: string | undefined, fallback: string, ext: string): string {
  const base =
    (title ?? fallback)
      .trim()
      .replace(/[^\p{L}\p{N}\- _]/gu, '')
      .slice(0, 60) || fallback;
  return `${base}.${ext}`;
}

exportRouter.post(
  '/export/excel',
  asyncHandler(async (req, res) => {
    const headers = Array.isArray(req.body?.headers) ? req.body.headers : null;
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    if (!headers || !rows) {
      res.status(400).json({ error: 'headers and rows are required' });
      return;
    }
    const buffer = generateExcelBuffer(headers, rows);
    const filename = safeFilename(req.body?.title, 'tableau', 'xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

exportRouter.post(
  '/export/pdf',
  asyncHandler(async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'ChaTin';
    const buffer = await generatePdfBuffer(title, text);
    const filename = safeFilename(req.body?.title, 'reponse', 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);
