import { asc, eq, sql } from 'drizzle-orm';
import { db } from './db/client.js';
import { userMemories } from './db/schema.js';
import { extractMemoryFacts } from './groq.js';

const MAX_MEMORIES_PER_USER = 60;

export type Memory = {
  id: string;
  content: string;
  createdAt: number;
};

function toMemory(row: typeof userMemories.$inferSelect): Memory {
  return { id: row.id, content: row.content, createdAt: row.createdAt.getTime() };
}

export async function listMemories(userId: string): Promise<Memory[]> {
  const rows = await db
    .select()
    .from(userMemories)
    .where(eq(userMemories.userId, userId))
    .orderBy(asc(userMemories.createdAt));
  return rows.map(toMemory);
}

export async function deleteMemory(userId: string, memoryId: string): Promise<boolean> {
  const rows = await db
    .delete(userMemories)
    .where(sql`${userMemories.id} = ${memoryId} AND ${userMemories.userId} = ${userId}`)
    .returning({ id: userMemories.id });
  return rows.length > 0;
}

export async function deleteAllMemories(userId: string): Promise<void> {
  await db.delete(userMemories).where(eq(userMemories.userId, userId));
}

// Fire-and-forget after each reply: asks Groq what's worth remembering from
// this exchange, then applies the add/remove diff. Callers MUST .catch() this
// - there is no global unhandledRejection handler in index.ts.
export async function extractAndSaveMemories(
  userId: string,
  conversationId: string,
  userText: string,
  botText: string,
): Promise<void> {
  if (!process.env.GROQ_API_KEY || !userText.trim()) return;

  const existing = await listMemories(userId);
  const { add, remove } = await extractMemoryFacts(userText, botText, existing.map((memory) => memory.content));

  if (remove.length > 0) {
    const toRemove = existing.filter((memory) => remove.includes(memory.content));
    for (const memory of toRemove) {
      await db.delete(userMemories).where(eq(userMemories.id, memory.id));
    }
  }

  if (add.length > 0) {
    await db.insert(userMemories).values(
      add.map((content) => ({ userId, content, sourceConversationId: conversationId })),
    );
  }

  const remaining = await db
    .select({ id: userMemories.id })
    .from(userMemories)
    .where(eq(userMemories.userId, userId))
    .orderBy(asc(userMemories.createdAt));
  const overflow = remaining.length - MAX_MEMORIES_PER_USER;
  if (overflow > 0) {
    const oldestIds = remaining.slice(0, overflow).map((row) => row.id);
    for (const id of oldestIds) {
      await db.delete(userMemories).where(eq(userMemories.id, id));
    }
  }
}
