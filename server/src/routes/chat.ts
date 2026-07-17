import { Router } from 'express';
import { generateReply } from '../ai.js';
import { createConversation, getConversation, listConversations } from '../store.js';

export const chatRouter = Router();

chatRouter.get('/conversations', (_req, res) => {
  res.json(
    listConversations().map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
    })),
  );
});

chatRouter.post('/conversations', (req, res) => {
  const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'New chat';
  const initialMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const conversation = createConversation(title, initialMessages);
  res.status(201).json(conversation);
});

chatRouter.get('/conversations/:id', (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conversation);
});

chatRouter.post('/conversations/:id/messages', async (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  conversation.messages.push({ id: crypto.randomUUID(), from: 'me', text });

  try {
    const replyText = await generateReply(conversation.messages);
    const reply = { id: crypto.randomUUID(), from: 'bot' as const, text: replyText };
    conversation.messages.push(reply);
    res.status(201).json({ reply, messages: conversation.messages });
  } catch (error) {
    console.error('AI provider error:', error);
    res.status(502).json({ error: 'Failed to generate a reply' });
  }
});
