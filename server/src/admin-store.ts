import { count, eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { conversations, messages, users } from './db/schema.js';

export async function getStats() {
  const [[{ userCount }], [{ conversationCount }], [{ messageCount }]] = await Promise.all([
    db.select({ userCount: count() }).from(users),
    db.select({ conversationCount: count() }).from(conversations),
    db.select({ messageCount: count() }).from(messages),
  ]);
  return { userCount, conversationCount, messageCount };
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function deleteUser(id: string): Promise<boolean> {
  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return deleted.length > 0;
}
