import { eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { sessions, users } from './db/schema.js';

export type User = {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: 'active' | 'suspended';
};

export async function upsertGoogleUser(profile: {
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(profile)
    .onConflictDoUpdate({
      target: users.googleId,
      set: { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl },
    })
    .returning();
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const [session] = await db.insert(sessions).values({ userId }).returning();
  return session.token;
}

export async function getUserByToken(token: string): Promise<User | undefined> {
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));
  if (!row || row.user.status === 'suspended') return undefined;
  return row.user;
}
