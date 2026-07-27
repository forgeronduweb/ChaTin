import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../async-handler.js';
import { transcribeAudio } from '../groq.js';
import { aiUsageLimiter } from '../rate-limit.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const transcribeRouter = Router();

transcribeRouter.post(
  '/transcribe',
  aiUsageLimiter,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'audio file is required' });
      return;
    }
    try {
      const text = await transcribeAudio(file.buffer, file.originalname || 'audio.m4a', file.mimetype);
      res.json({ text });
    } catch (error) {
      console.error('Transcription failed:', error);
      res.status(502).json({ error: 'Failed to transcribe audio' });
    }
  }),
);
