import { and, count, desc, eq, gte, ilike, max, sql } from 'drizzle-orm';
import { db } from './db/client.js';
import { appReleases, conversations, feedback, messages, prompts, sessions, users } from './db/schema.js';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getStats() {
  const todayStart = startOfToday();

  const [
    [{ totalUsers }],
    [{ newUsersToday }],
    [{ activeUsersToday }],
    [{ conversationCount }],
    [{ messagesToday }],
    activityRows,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ newUsersToday: count() }).from(users).where(gte(users.createdAt, todayStart)),
    db
      .select({ activeUsersToday: sql<number>`count(distinct ${sessions.userId})` })
      .from(sessions)
      .where(gte(sessions.createdAt, todayStart)),
    db.select({ conversationCount: count() }).from(conversations),
    db.select({ messagesToday: count() }).from(messages).where(gte(messages.createdAt, todayStart)),
    db
      .select({
        day: sql<string>`to_char(${messages.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(messages)
      .where(gte(messages.createdAt, sql`now() - interval '6 days'`))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);

  return {
    totalUsers,
    newUsersToday,
    activeUsersToday: Number(activeUsersToday),
    conversationCount,
    messagesToday,
    activity: activityRows,
  };
}

export async function listUsers(search?: string) {
  const condition = search ? ilike(users.name, `%${search}%`) : undefined;

  const [rows, lastSessions] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: max(sessions.createdAt),
        conversationCount: sql<number>`count(distinct ${conversations.id})`,
        messageCount: sql<number>`count(distinct ${messages.id})`,
      })
      .from(users)
      .where(condition)
      .leftJoin(sessions, eq(sessions.userId, users.id))
      .leftJoin(conversations, eq(conversations.userId, users.id))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt)),
    db
      .selectDistinctOn([sessions.userId], {
        userId: sessions.userId,
        deviceModel: sessions.deviceModel,
        osVersion: sessions.osVersion,
      })
      .from(sessions)
      .orderBy(sessions.userId, desc(sessions.createdAt)),
  ]);

  const deviceByUser = new Map(lastSessions.map((s) => [s.userId, s]));

  return rows.map((row) => ({
    ...row,
    conversationCount: Number(row.conversationCount),
    messageCount: Number(row.messageCount),
    deviceModel: deviceByUser.get(row.id)?.deviceModel ?? null,
    osVersion: deviceByUser.get(row.id)?.osVersion ?? null,
  }));
}

export async function setUserStatus(id: string, status: 'active' | 'suspended'): Promise<boolean> {
  const updated = await db.update(users).set({ status }).where(eq(users.id, id)).returning({ id: users.id });
  return updated.length > 0;
}

export async function deleteUser(id: string): Promise<boolean> {
  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return deleted.length > 0;
}

export async function listConversations(search?: string) {
  const condition = search ? ilike(conversations.title, `%${search}%`) : undefined;

  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      userName: users.name,
      messageCount: sql<number>`count(${messages.id})`,
    })
    .from(conversations)
    .where(condition)
    .leftJoin(users, eq(users.id, conversations.userId))
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .groupBy(conversations.id, users.name)
    .orderBy(desc(conversations.createdAt));

  return rows.map((row) => ({ ...row, messageCount: Number(row.messageCount) }));
}

export async function getConversationDetail(id: string) {
  const [conversation] = await db
    .select({ id: conversations.id, title: conversations.title, createdAt: conversations.createdAt })
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conversation) return undefined;

  const rows = await db
    .select({
      id: messages.id,
      from: messages.from,
      text: messages.text,
      attachmentName: messages.attachmentName,
      reaction: messages.reaction,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  return { ...conversation, messages: rows };
}

export async function deleteConversation(id: string): Promise<boolean> {
  const deleted = await db.delete(conversations).where(eq(conversations.id, id)).returning({ id: conversations.id });
  return deleted.length > 0;
}

export async function listPrompts() {
  return db.select().from(prompts).orderBy(desc(prompts.featured), desc(prompts.createdAt));
}

export type PromptInput = {
  title: string;
  author: string;
  category: string;
  color: string;
  emoji?: string | null;
  featured: boolean;
};

export async function createPrompt(input: PromptInput) {
  const [row] = await db.insert(prompts).values(input).returning();
  return row;
}

export async function updatePrompt(id: string, input: Partial<PromptInput>) {
  const [row] = await db.update(prompts).set(input).where(eq(prompts.id, id)).returning();
  return row;
}

export async function deletePrompt(id: string): Promise<boolean> {
  const deleted = await db.delete(prompts).where(eq(prompts.id, id)).returning({ id: prompts.id });
  return deleted.length > 0;
}

export async function listFeedback() {
  const rows = await db
    .select({
      id: feedback.id,
      message: feedback.message,
      appVersion: feedback.appVersion,
      createdAt: feedback.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(users.id, feedback.userId))
    .orderBy(desc(feedback.createdAt));
  return rows;
}

export type FeedbackInput = {
  userId?: string;
  message: string;
  appVersion?: string;
};

export async function createFeedback(input: FeedbackInput) {
  const [row] = await db.insert(feedback).values(input).returning();
  return row;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const deleted = await db.delete(feedback).where(eq(feedback.id, id)).returning({ id: feedback.id });
  return deleted.length > 0;
}

export async function listReleases() {
  return db.select().from(appReleases).orderBy(desc(appReleases.versionCode));
}

export async function getLatestRelease() {
  const [row] = await db.select().from(appReleases).orderBy(desc(appReleases.versionCode)).limit(1);
  return row;
}

export type ReleaseInput = {
  version: string;
  versionCode: number;
  apkUrl: string;
  mandatory: boolean;
  notes?: string | null;
};

export async function createRelease(input: ReleaseInput) {
  const [row] = await db.insert(appReleases).values(input).returning();
  return row;
}

export async function deleteRelease(id: string): Promise<boolean> {
  const deleted = await db.delete(appReleases).where(eq(appReleases.id, id)).returning({ id: appReleases.id });
  return deleted.length > 0;
}
