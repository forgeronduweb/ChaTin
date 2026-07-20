import { count, desc, eq, gt, gte, ilike, max, sql } from 'drizzle-orm';
import { db } from './db/client.js';
import {
  adminNotificationState,
  appReleases,
  conversations,
  feedback,
  messages,
  prompts,
  sessions,
  users,
} from './db/schema.js';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function startOfMonth(): Date {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

function startOfYear(): Date {
  const d = startOfToday();
  d.setMonth(0, 1);
  return d;
}

// Each stat below groups every count against a single table into one query
// (via FILTER clauses) instead of one round trip per number - Supabase's
// pooler on the free tier struggles when this many queries fire in parallel
// (Promise.all was opening 15 connections at once here and would
// occasionally trip a statement timeout that took the whole process down).
export async function getStats() {
  const todayStart = startOfToday().toISOString();
  const weekStart = startOfWeek().toISOString();
  const monthStart = startOfMonth().toISOString();
  const yearStart = startOfYear().toISOString();

  const [[userStats], [sessionStats], [convStats], [messageStats], [{ totalFeedbackCount }], activityRows] =
    await Promise.all([
      db
        .select({
          totalUsers: count(),
          newUsersToday: sql<number>`count(*) filter (where ${users.createdAt} >= ${todayStart})`.mapWith(Number),
          newUsersWeek: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekStart})`.mapWith(Number),
          newUsersMonth: sql<number>`count(*) filter (where ${users.createdAt} >= ${monthStart})`.mapWith(Number),
          newUsersYear: sql<number>`count(*) filter (where ${users.createdAt} >= ${yearStart})`.mapWith(Number),
        })
        .from(users),
      db
        .select({
          activeUsersToday: sql<number>`count(distinct ${sessions.userId}) filter (where ${sessions.createdAt} >= ${todayStart})`.mapWith(Number),
          activeUsersWeek: sql<number>`count(distinct ${sessions.userId}) filter (where ${sessions.createdAt} >= ${weekStart})`.mapWith(Number),
        })
        .from(sessions),
      db
        .select({
          conversationCount: count(),
          registeredConversations: sql<number>`count(*) filter (where ${conversations.userId} is not null)`.mapWith(Number),
          usersWithActivity: sql<number>`count(distinct ${conversations.userId}) filter (where ${conversations.userId} is not null)`.mapWith(Number),
        })
        .from(conversations),
      db
        .select({
          messagesToday: sql<number>`count(*) filter (where ${messages.createdAt} >= ${todayStart})`.mapWith(Number),
          totalMessages: count(),
          totalPrompts: sql<number>`count(*) filter (where ${messages.from} = 'me')`.mapWith(Number),
        })
        .from(messages),
      db.select({ totalFeedbackCount: count() }).from(feedback),
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

  const guestConversations = convStats.conversationCount - convStats.registeredConversations;

  return {
    totalUsers: userStats.totalUsers,
    newUsersToday: userStats.newUsersToday,
    newUsersWeek: userStats.newUsersWeek,
    newUsersMonth: userStats.newUsersMonth,
    newUsersYear: userStats.newUsersYear,
    activeUsersToday: sessionStats.activeUsersToday,
    activeUsersWeek: sessionStats.activeUsersWeek,
    conversationCount: convStats.conversationCount,
    registeredConversations: convStats.registeredConversations,
    guestConversations,
    messagesToday: messageStats.messagesToday,
    totalMessages: messageStats.totalMessages,
    totalPrompts: messageStats.totalPrompts,
    usersWithActivity: convStats.usersWithActivity,
    totalFeedbackCount,
    activity: activityRows,
  };
}

// ---------- Notifications (unread badges for Utilisateurs / Retours) ----------

const NOTIFICATION_KEYS = ['users', 'feedback'] as const;
export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export function isNotificationKey(value: unknown): value is NotificationKey {
  return typeof value === 'string' && (NOTIFICATION_KEYS as readonly string[]).includes(value);
}

export async function getNotificationCounts(): Promise<Record<NotificationKey, number>> {
  const states = await db.select().from(adminNotificationState);
  const viewedAt = new Map(states.map((s) => [s.key, s.lastViewedAt]));
  const epoch = new Date(0);

  const [[{ newUsers }], [{ newFeedback }]] = await Promise.all([
    db.select({ newUsers: count() }).from(users).where(gt(users.createdAt, viewedAt.get('users') ?? epoch)),
    db.select({ newFeedback: count() }).from(feedback).where(gt(feedback.createdAt, viewedAt.get('feedback') ?? epoch)),
  ]);

  return { users: newUsers, feedback: newFeedback };
}

export async function markNotificationViewed(key: NotificationKey): Promise<void> {
  await db
    .insert(adminNotificationState)
    .values({ key, lastViewedAt: new Date() })
    .onConflictDoUpdate({ target: adminNotificationState.key, set: { lastViewedAt: new Date() } });
}

// ---------- Analytics report ----------

export async function getAnalyticsReport() {
  const weekStart = startOfWeek();

  const [[{ totalUsers }], [{ activeUsersWeek }], [convStats], [{ totalPrompts }], [{ totalFeedbackCount }], registrationTrend, usageTrend] =
    await Promise.all([
      db.select({ totalUsers: count() }).from(users),
      db
        .select({ activeUsersWeek: sql<number>`count(distinct ${sessions.userId})`.mapWith(Number) })
        .from(sessions)
        .where(gte(sessions.createdAt, weekStart)),
      db
        .select({
          conversationCount: count(),
          registeredConversations: sql<number>`count(*) filter (where ${conversations.userId} is not null)`.mapWith(Number),
        })
        .from(conversations),
      db.select({ totalPrompts: count() }).from(messages).where(eq(messages.from, 'me')),
      db.select({ totalFeedbackCount: count() }).from(feedback),
      db
        .select({ day: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`, count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`now() - interval '29 days'`))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db
        .select({ day: sql<string>`to_char(${messages.createdAt}, 'YYYY-MM-DD')`, count: count() })
        .from(messages)
        .where(gte(messages.createdAt, sql`now() - interval '29 days'`))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
    ]);

  const { conversationCount, registeredConversations } = convStats;
  const guestConversations = conversationCount - registeredConversations;
  const registrationRate = conversationCount > 0 ? (registeredConversations / conversationCount) * 100 : 0;
  const activityRate = totalUsers > 0 ? (Number(activeUsersWeek) / totalUsers) * 100 : 0;

  return {
    totalPrompts,
    totalFeedbackCount,
    registrationRate,
    activityRate,
    registeredVsGuest: { registered: registeredConversations, guest: guestConversations },
    registrationTrend,
    usageTrend,
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
