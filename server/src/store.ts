import { asc, desc, eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { conversations, messages } from './db/schema.js';

export type ChatMessage = {
  id: string;
  from: 'me' | 'bot';
  text: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
};

function toChatMessage(row: typeof messages.$inferSelect): ChatMessage {
  return { id: row.id, from: row.from as 'me' | 'bot', text: row.text };
}

export async function createConversation(
  title: string,
  initialMessages: ChatMessage[] = [],
  userId?: string,
): Promise<Conversation> {
  const [conversation] = await db.insert(conversations).values({ title, userId }).returning();

  let savedMessages: ChatMessage[] = [];
  if (initialMessages.length > 0) {
    const rows = await db
      .insert(messages)
      .values(initialMessages.map((message) => ({ conversationId: conversation.id, from: message.from, text: message.text })))
      .returning();
    savedMessages = rows.map(toChatMessage);
  }

  return {
    id: conversation.id,
    title: conversation.title,
    messages: savedMessages,
    createdAt: conversation.createdAt.getTime(),
  };
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conversation) return undefined;

  const rows = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  return {
    id: conversation.id,
    title: conversation.title,
    messages: rows.map(toChatMessage),
    createdAt: conversation.createdAt.getTime(),
  };
}

export async function addMessage(conversationId: string, message: { from: 'me' | 'bot'; text: string }): Promise<ChatMessage> {
  const [row] = await db.insert(messages).values({ conversationId, from: message.from, text: message.text }).returning();
  return toChatMessage(row);
}

export async function listConversations(userId?: string): Promise<Pick<Conversation, 'id' | 'title'>[]> {
  return db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(userId ? eq(conversations.userId, userId) : undefined)
    .orderBy(desc(conversations.createdAt));
}
