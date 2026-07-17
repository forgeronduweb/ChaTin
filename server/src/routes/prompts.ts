import { Router } from 'express';
import { listPrompts } from '../admin-store.js';
import { asyncHandler } from '../async-handler.js';

export const promptsRouter = Router();

promptsRouter.get(
  '/prompts',
  asyncHandler(async (_req, res) => {
    res.json(await listPrompts());
  }),
);
