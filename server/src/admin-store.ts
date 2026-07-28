import { and, count, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lte, max, or, sql } from 'drizzle-orm';
import { db } from './db/client.js';
import {
  adminNotificationState,
  announcements,
  appReleases,
  conversations,
  emailCampaigns,
  emailTemplates,
  feedback,
  messages,
  prompts,
  sessions,
  users,
} from './db/schema.js';
import { type EmailCta, type EmailDesign, renderEmailHtml, sendEmail } from './email.js';

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

  // Sequential, not Promise.all - this pair kept hanging under Supabase's
  // transaction pooler with the query done but its result never read back
  // (pg_stat_activity showed it 'active'/ClientRead for 50+ seconds). Two
  // tiny counts running one after another costs nothing worth avoiding that.
  const [{ newUsers }] = await db
    .select({ newUsers: count() })
    .from(users)
    .where(gt(users.createdAt, viewedAt.get('users') ?? epoch));
  const [{ newFeedback }] = await db
    .select({ newFeedback: count() })
    .from(feedback)
    .where(gt(feedback.createdAt, viewedAt.get('feedback') ?? epoch));

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

  // Sequential, not folded into the Promise.all above - that batch is
  // already sized to the connection pool (see db/client.ts), and growing it
  // further per new module is exactly what caused the admin dashboard hangs
  // fixed earlier. Two more round trips here cost a little latency, not a
  // pool slot fight.
  const announcementsTrend = await db
    .select({ day: sql<string>`to_char(${announcements.publishAt}, 'YYYY-MM-DD')`, count: count() })
    .from(announcements)
    .where(gte(announcements.publishAt, sql`now() - interval '29 days'`))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const emailsTrend = await db
    .select({
      day: sql<string>`to_char(${emailCampaigns.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`coalesce(sum(${emailCampaigns.recipientCount}), 0)`.mapWith(Number),
    })
    .from(emailCampaigns)
    .where(gte(emailCampaigns.createdAt, sql`now() - interval '29 days'`))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return {
    totalPrompts,
    totalFeedbackCount,
    registrationRate,
    activityRate,
    registeredVsGuest: { registered: registeredConversations, guest: guestConversations },
    registrationTrend,
    usageTrend,
    announcementsTrend,
    emailsTrend,
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

// Sampled for the auto-generated prompts job (see auto-prompts.ts) to ground
// suggestions in what people actually ask, alongside fresh web trends.
export async function getRecentUserMessageTexts(limit: number): Promise<string[]> {
  const rows = await db
    .select({ text: messages.text })
    .from(messages)
    .where(eq(messages.from, 'me'))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.map((row) => row.text);
}

// Wholesale-replaces every 'auto' prompt with a fresh batch, leaving
// admin-curated ('admin') rows untouched.
export async function replaceAutoPrompts(inputs: PromptInput[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(prompts).where(eq(prompts.source, 'auto'));
    if (inputs.length > 0) {
      await tx.insert(prompts).values(inputs.map((input) => ({ ...input, source: 'auto' as const })));
    }
  });
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

// ---------- Email templates ----------

export async function listEmailTemplates() {
  return db.select().from(emailTemplates).orderBy(desc(emailTemplates.updatedAt));
}

export type EmailTemplateInput = {
  name: string;
  subject: string;
  body: string;
  design: EmailDesign;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export async function createEmailTemplate(input: EmailTemplateInput) {
  const [row] = await db.insert(emailTemplates).values(input).returning();
  return row;
}

export async function updateEmailTemplate(id: string, input: Partial<EmailTemplateInput>) {
  const [row] = await db
    .update(emailTemplates)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id))
    .returning();
  return row;
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const deleted = await db.delete(emailTemplates).where(eq(emailTemplates.id, id)).returning({ id: emailTemplates.id });
  return deleted.length > 0;
}

// ---------- Email campaigns (compose + send) ----------

export async function listEmailCampaigns() {
  return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
}

const ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Shared by the manual "compose an email" flow and announcements' "send by
// email" option - a target segment resolves to the same recipient set
// either way. Suspended accounts stay reachable on purpose for 'all' (a
// campaign is exactly the kind of thing that might need to reach someone
// about why their account was suspended).
async function listUsersInSegment(target: 'all' | 'new' | 'active' | 'inactive'): Promise<{ name: string; email: string }[]> {
  const since = new Date(Date.now() - ACTIVITY_WINDOW_MS);

  if (target === 'all') {
    const rows = await db.select({ name: users.name, email: users.email }).from(users);
    return rows.filter((row) => row.email);
  }
  if (target === 'new') {
    const rows = await db.select({ name: users.name, email: users.email }).from(users).where(gte(users.createdAt, since));
    return rows.filter((row) => row.email);
  }

  const recentSessions = await db.selectDistinct({ userId: sessions.userId }).from(sessions).where(gte(sessions.createdAt, since));
  const activeIds = new Set(recentSessions.map((row) => row.userId));
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  const inSegment = target === 'active' ? allUsers.filter((u) => activeIds.has(u.id)) : allUsers.filter((u) => !activeIds.has(u.id));
  return inSegment.filter((u) => u.email).map((u) => ({ name: u.name, email: u.email }));
}

export type SendCampaignResult = { recipientCount: number; failureCount: number };

// Sends synchronously within the request - fine at this user count (tens,
// not thousands). A ~500ms gap between sends stays comfortably under
// Resend's free-tier rate limit (2 req/s) without needing a queue.
async function sendToRecipients(
  design: EmailDesign,
  subject: string,
  body: string,
  recipients: { name: string; email: string }[],
  cta?: EmailCta,
): Promise<SendCampaignResult> {
  let failureCount = 0;

  for (const [index, recipient] of recipients.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await sendEmail(recipient.email, subject, renderEmailHtml(design, subject, body, recipient.name, cta));
    } catch (error) {
      failureCount += 1;
      console.error(`Failed to send campaign email to ${recipient.email}:`, error);
    }
  }

  await db.insert(emailCampaigns).values({
    subject,
    body,
    design,
    ctaLabel: cta?.label ?? null,
    ctaUrl: cta?.url ?? null,
    recipientCount: recipients.length,
    failureCount,
  });
  return { recipientCount: recipients.length, failureCount };
}

export async function sendEmailCampaign(
  design: EmailDesign,
  subject: string,
  body: string,
  userIds?: string[],
  cta?: EmailCta,
): Promise<SendCampaignResult> {
  if (userIds && userIds.length > 0) {
    const rows = await db.select({ name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds));
    return sendToRecipients(design, subject, body, rows.filter((row) => row.email), cta);
  }
  return sendToRecipients(design, subject, body, await listUsersInSegment('all'), cta);
}

// ---------- Announcements (Communication module) ----------

export type AnnouncementType = 'update' | 'info' | 'tip' | 'prompt' | 'promo' | 'poll' | 'security';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
export type AnnouncementTarget = 'all' | 'new' | 'active' | 'inactive';

export type AnnouncementInput = {
  title: string;
  content: string;
  imageUrl?: string | null;
  type: AnnouncementType;
  target: AnnouncementTarget;
  pinned: boolean;
  sendEmail: boolean;
  publishAt: Date;
  expiresAt?: Date | null;
};

function deriveStatus(publishAt: Date, saveAsDraft: boolean): AnnouncementStatus {
  if (saveAsDraft) return 'draft';
  return publishAt.getTime() > Date.now() ? 'scheduled' : 'published';
}

export async function listAnnouncements(
  filters: { type?: string; status?: string; target?: string; search?: string } = {},
) {
  const conditions = [];
  if (filters.type) conditions.push(eq(announcements.type, filters.type as AnnouncementType));
  if (filters.status) conditions.push(eq(announcements.status, filters.status as AnnouncementStatus));
  if (filters.target) conditions.push(eq(announcements.target, filters.target as AnnouncementTarget));
  if (filters.search) conditions.push(ilike(announcements.title, `%${filters.search}%`));

  const base = db.select().from(announcements);
  const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
  return filtered.orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

export async function getAnnouncement(id: string) {
  const [row] = await db.select().from(announcements).where(eq(announcements.id, id));
  return row;
}

export async function createAnnouncement(input: AnnouncementInput, saveAsDraft: boolean) {
  const status = deriveStatus(input.publishAt, saveAsDraft);
  const [row] = await db.insert(announcements).values({ ...input, status }).returning();
  if (status === 'published') await sendAnnouncementEmailIfNeeded(row.id);
  return row;
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>, saveAsDraft: boolean) {
  const patch: Record<string, unknown> = { ...input, updatedAt: new Date() };
  if (input.publishAt) patch.status = deriveStatus(input.publishAt, saveAsDraft);
  else if (saveAsDraft) patch.status = 'draft';

  const [row] = await db.update(announcements).set(patch).where(eq(announcements.id, id)).returning();
  if (row && row.status === 'published') await sendAnnouncementEmailIfNeeded(row.id);
  return row;
}

export async function archiveAnnouncement(id: string) {
  const [row] = await db
    .update(announcements)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();
  return row;
}

export async function duplicateAnnouncement(id: string) {
  const original = await getAnnouncement(id);
  if (!original) return undefined;
  const [row] = await db
    .insert(announcements)
    .values({
      title: `${original.title} (copie)`,
      content: original.content,
      imageUrl: original.imageUrl,
      type: original.type,
      target: original.target,
      pinned: false,
      sendEmail: false,
      status: 'draft',
      publishAt: new Date(),
      expiresAt: original.expiresAt,
    })
    .returning();
  return row;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const deleted = await db.delete(announcements).where(eq(announcements.id, id)).returning({ id: announcements.id });
  return deleted.length > 0;
}

// Fires when an announcement first becomes 'published' (on creation, on
// edit, or from the scheduler flipping a scheduled one live) - emailSentAt
// makes it idempotent so the same announcement never gets mailed twice.
export async function sendAnnouncementEmailIfNeeded(id: string): Promise<void> {
  const announcement = await getAnnouncement(id);
  if (!announcement || !announcement.sendEmail || announcement.emailSentAt) return;
  if (!process.env.RESEND_API_KEY) return;

  try {
    // Always the sober 'announcement' design, regardless of what an admin
    // might pick for a manual send - an announcement's email should look
    // like the announcement, not a promo, no matter which design happens
    // to be selected in the (unrelated) compose form at the time.
    await sendToRecipients('announcement', announcement.title, announcement.content, await listUsersInSegment(announcement.target));
    await db.update(announcements).set({ emailSentAt: new Date() }).where(eq(announcements.id, id));
  } catch (error) {
    console.error(`Failed to send announcement email for ${id}:`, error);
  }
}

// Run on a timer (see announcements-scheduler.ts) - lets "programmer la
// publication" / "date d'expiration" actually take effect without the admin
// needing to come back and flip a status by hand.
export async function syncAnnouncementStatuses(): Promise<void> {
  const now = new Date();

  const newlyPublished = await db
    .update(announcements)
    .set({ status: 'published', updatedAt: now })
    .where(and(eq(announcements.status, 'scheduled'), lte(announcements.publishAt, now)))
    .returning({ id: announcements.id });
  for (const row of newlyPublished) {
    await sendAnnouncementEmailIfNeeded(row.id);
  }

  await db
    .update(announcements)
    .set({ status: 'expired', updatedAt: now })
    .where(and(eq(announcements.status, 'published'), isNotNull(announcements.expiresAt), lte(announcements.expiresAt, now)));
}

// App-facing: only what's actually live right now for this user (guests -
// no userId - only ever see 'all'-targeted announcements, since there's no
// persistent identity to compute a segment for).
export async function listAnnouncementsForUser(userId?: string) {
  const now = new Date();
  const targets: AnnouncementTarget[] = ['all'];

  if (userId) {
    const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
    if (user) {
      const since = new Date(Date.now() - ACTIVITY_WINDOW_MS);
      if (user.createdAt >= since) {
        targets.push('new');
      } else {
        const [recentSession] = await db
          .select({ userId: sessions.userId })
          .from(sessions)
          .where(and(eq(sessions.userId, userId), gte(sessions.createdAt, since)))
          .limit(1);
        targets.push(recentSession ? 'active' : 'inactive');
      }
    }
  }

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      imageUrl: announcements.imageUrl,
      type: announcements.type,
      pinned: announcements.pinned,
      publishAt: announcements.publishAt,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.status, 'published'),
        inArray(announcements.target, targets),
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt));
}
