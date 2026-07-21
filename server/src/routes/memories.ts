import { Router } from 'express';
import { asyncHandler } from '../async-handler.js';
import { deleteAllMemories, deleteMemory, listMemories } from '../memory-store.js';
import { resolveUserId } from '../request-auth.js';

export const memoriesRouter = Router();

memoriesRouter.get(
  '/memories',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }
    res.json(await listMemories(userId));
  }),
);

memoriesRouter.delete(
  '/memories/:id',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }
    const deleted = await deleteMemory(userId, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }
    res.status(204).end();
  }),
);

memoriesRouter.delete(
  '/memories',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }
    await deleteAllMemories(userId);
    res.status(204).end();
  }),
);
