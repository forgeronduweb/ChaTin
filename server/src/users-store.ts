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
  city: string | null;
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

export type DeviceInfo = {
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
};

// A session token used to be valid forever - a leaked/stolen one (a
// compromised device, a log line, a backup) stayed usable indefinitely with
// no way for the legitimate user to invalidate it short of the account
// being deleted. Bounding it limits how long a leak actually matters.
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, device?: DeviceInfo): Promise<string> {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      deviceModel: device?.deviceModel,
      osVersion: device?.osVersion,
      appVersion: device?.appVersion,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    .returning();
  return session.token;
}

export async function getUserByToken(token: string): Promise<User | undefined> {
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));
  if (!row || row.user.status === 'suspended') return undefined;
  if (row.expiresAt.getTime() < Date.now()) return undefined;
  return row.user;
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

export async function setUserCity(userId: string, city: string | null): Promise<User | undefined> {
  const [user] = await db.update(users).set({ city }).where(eq(users.id, userId)).returning();
  return user;
}
