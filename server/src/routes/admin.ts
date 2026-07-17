import { Router } from 'express';
import { requireAdmin } from '../admin-auth.js';
import { asyncHandler } from '../async-handler.js';
import {
  createPrompt,
  deleteConversation,
  deletePrompt,
  deleteUser,
  getConversationDetail,
  getStats,
  listConversations,
  listPrompts,
  listUsers,
  setUserStatus,
  updatePrompt,
} from '../admin-store.js';
import { DASHBOARD_HTML } from '../admin-dashboard-html.js';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

// --- Stats ---

adminRouter.get(
  '/admin/api/stats',
  asyncHandler(async (_req, res) => {
    res.json(await getStats());
  }),
);

// --- Users ---

adminRouter.get(
  '/admin/api/users',
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await listUsers(search));
  }),
);

adminRouter.post(
  '/admin/api/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const ok = await setUserStatus(req.params.id, 'suspended');
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

adminRouter.post(
  '/admin/api/users/:id/reactivate',
  asyncHandler(async (req, res) => {
    const ok = await setUserStatus(req.params.id, 'active');
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

adminRouter.delete(
  '/admin/api/users/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Conversations ---

adminRouter.get(
  '/admin/api/conversations',
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await listConversations(search));
  }),
);

adminRouter.get(
  '/admin/api/conversations/:id',
  asyncHandler(async (req, res) => {
    const conversation = await getConversationDetail(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  }),
);

adminRouter.delete(
  '/admin/api/conversations/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteConversation(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Prompts ---

adminRouter.get(
  '/admin/api/prompts',
  asyncHandler(async (_req, res) => {
    res.json(await listPrompts());
  }),
);

adminRouter.post(
  '/admin/api/prompts',
  asyncHandler(async (req, res) => {
    const { title, author, category, color, emoji, featured } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const prompt = await createPrompt({
      title: title.trim(),
      author: typeof author === 'string' ? author.trim() : '',
      category: typeof category === 'string' ? category.trim() : '',
      color: typeof color === 'string' && color ? color : '#F3A7C7',
      emoji: typeof emoji === 'string' && emoji ? emoji : null,
      featured: Boolean(featured),
    });
    res.status(201).json(prompt);
  }),
);

adminRouter.patch(
  '/admin/api/prompts/:id',
  asyncHandler(async (req, res) => {
    const { title, author, category, color, emoji, featured } = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if (typeof title === 'string') patch.title = title.trim();
    if (typeof author === 'string') patch.author = author.trim();
    if (typeof category === 'string') patch.category = category.trim();
    if (typeof color === 'string') patch.color = color;
    if (typeof emoji === 'string' || emoji === null) patch.emoji = emoji || null;
    if (typeof featured === 'boolean') patch.featured = featured;

    const prompt = await updatePrompt(req.params.id, patch);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.json(prompt);
  }),
);

adminRouter.delete(
  '/admin/api/prompts/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deletePrompt(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Dashboard page ---

adminRouter.get('/admin', (_req, res) => {
  res.type('html').send(DASHBOARD_HTML);
});
