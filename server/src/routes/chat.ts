import { Router, type Response } from 'express';
import multer from 'multer';
import { generateReply } from '../ai.js';
import { asyncHandler } from '../async-handler.js';
import { extractFileText, SUPPORTED_ATTACHMENT_TYPES } from '../file-extraction.js';
import { extractAndSaveMemories } from '../memory-store.js';
import { aiUsageLimiter } from '../rate-limit.js';
import { resolveUserId } from '../request-auth.js';
import {
  addMessage,
  createConversation,
  getConversation,
  getConversationOwnerId,
  getMessageOwner,
  listConversations,
  setMessageReaction,
} from '../store.js';

export const chatRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// A guest (unowned, userId === null) conversation stays reachable by id
// alone - that already matches how the client treats guest history (kept
// only in local storage, with the server id as the sole "key"). Once a
// conversation belongs to a registered user, only that same user's token
// may read or write it. Without this, any conversation id (registered or
// not) was readable/writable by anyone who had it - see the security audit.
async function authorizeConversationAccess(
  res: Response,
  conversationId: string,
  requesterId: string | undefined,
): Promise<boolean> {
  const ownerId = await getConversationOwnerId(conversationId);
  if (ownerId === undefined) {
    res.status(404).json({ error: 'Conversation not found' });
    return false;
  }
  if (ownerId !== null && ownerId !== requesterId) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
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
    const userId = await resolveUserId(req);
    if (!(await authorizeConversationAccess(res, req.params.id, userId))) return;

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
  aiUsageLimiter,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    if (!(await authorizeConversationAccess(res, req.params.id, userId))) return;

    const conversation = await getConversation(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const file = req.file;
    if (!text && !file) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    if (file && !SUPPORTED_ATTACHMENT_TYPES.has(file.mimetype)) {
      res.status(400).json({ error: 'Unsupported file type. Use PDF, .docx, .xlsx or .xls.' });
      return;
    }

    let attachmentText: string | null = null;
    if (file) {
      try {
        attachmentText = await extractFileText(file.buffer, file.mimetype, file.originalname);
      } catch (error) {
        console.error('File extraction failed:', error);
        res.status(422).json({ error: 'Could not read the attached file' });
        return;
      }
    }

    const userMessage = await addMessage(conversation.id, {
      from: 'me',
      text,
      attachmentName: file?.originalname ?? null,
    });
    const history = [...conversation.messages, userMessage];

    // The stored/displayed message keeps just what the user typed - this
    // enriched copy (used for this AI call only) is what actually carries
    // the file's content, so ai.ts/gemini.ts/groq.ts need no changes.
    const historyForAI = attachmentText
      ? [
          ...history.slice(0, -1),
          { ...userMessage, text: `[Fichier joint: ${file?.originalname}]\n${attachmentText}\n\n${text}`.trim() },
        ]
      : history;

    try {
      const replyText = await generateReply(historyForAI, userId);
      const reply = await addMessage(conversation.id, { from: 'bot', text: replyText });
      res.status(201).json({ reply, messages: [...history, reply] });

      if (userId) {
        extractAndSaveMemories(userId, conversation.id, text, replyText).catch((error) => {
          console.error('Memory extraction failed:', error);
        });
      }
    } catch (error) {
      console.error('AI provider error:', error);
      res.status(502).json({ error: 'Failed to generate a reply' });
    }
  }),
);

chatRouter.patch(
  '/conversations/:conversationId/messages/:messageId/reaction',
  asyncHandler(async (req, res) => {
    const reaction = req.body?.reaction;
    if (reaction !== 'like' && reaction !== 'dislike' && reaction !== null) {
      res.status(400).json({ error: 'reaction must be "like", "dislike", or null' });
      return;
    }

    const owner = await getMessageOwner(req.params.messageId);
    if (!owner) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    const userId = await resolveUserId(req);
    if (owner.ownerId !== null && owner.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const message = await setMessageReaction(req.params.messageId, reaction);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(message);
  }),
);
