import { Router } from 'express';
import { createFeedback } from '../admin-store.js';
import { asyncHandler } from '../async-handler.js';
import { getUserByToken } from '../users-store.js';

export const feedbackRouter = Router();

async function resolveUserId(req: { headers: { authorization?: string } }): Promise<string | undefined> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  const token = header.slice('Bearer '.length);
  try {
    const user = await getUserByToken(token);
    return user?.id;
  } catch {
    return undefined;
  }
}

feedbackRouter.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }
    const userId = await resolveUserId(req);
    const appVersion = typeof req.body?.appVersion === 'string' ? req.body.appVersion : undefined;
    await createFeedback({ userId, message, appVersion });
    res.status(201).json({ ok: true });
  }),
);
