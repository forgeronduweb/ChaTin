import { Router } from 'express';
import { generateReply } from '../ai.js';
import { asyncHandler } from '../async-handler.js';
import { addMessage, createConversation, getConversation, listConversations } from '../store.js';
import { getUserByToken } from '../users-store.js';

export const chatRouter = Router();

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

chatRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    res.json(await listConversations(userId));
  }),
);

chatRouter.post(
  '/conversations',
  asyncHandler(async (req, res) => {
    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'New chat';
    const initialMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const userId = await resolveUserId(req);
    const conversation = await createConversation(title, initialMessages, userId);
    res.status(201).json(conversation);
  }),
);

chatRouter.get(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conversation = await getConversation(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  }),
);

chatRouter.post(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const conversation = await getConversation(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const userMessage = await addMessage(conversation.id, { from: 'me', text });
    const history = [...conversation.messages, userMessage];

    try {
      const replyText = await generateReply(history);
      const reply = await addMessage(conversation.id, { from: 'bot', text: replyText });
      res.status(201).json({ reply, messages: [...history, reply] });
    } catch (error) {
      console.error('AI provider error:', error);
      res.status(502).json({ error: 'Failed to generate a reply' });
    }
  }),
);
