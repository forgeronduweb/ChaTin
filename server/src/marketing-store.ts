import { and, desc, eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { marketingCampaigns, marketingContacts } from './db/schema.js';
import { type EmailCta, type EmailDesign, renderEmailHtml, sendEmail } from './email.js';

export type MarketingContact = { id: string; name: string; email: string; createdAt: number };

function toContact(row: typeof marketingContacts.$inferSelect): MarketingContact {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.createdAt.getTime() };
}

export async function listContacts(userId: string): Promise<MarketingContact[]> {
  const rows = await db
    .select()
    .from(marketingContacts)
    .where(eq(marketingContacts.userId, userId))
    .orderBy(desc(marketingContacts.createdAt));
  return rows.map(toContact);
}

export async function createContact(userId: string, name: string, email: string): Promise<MarketingContact> {
  const [row] = await db.insert(marketingContacts).values({ userId, name, email }).returning();
  return toContact(row);
}

// Skips duplicates (same email already owned by this user) instead of
// erroring the whole import - a pasted list is very likely to include
// contacts already added one at a time before.
export async function importContacts(
  userId: string,
  contacts: { name: string; email: string }[],
): Promise<{ added: number; skipped: number }> {
  const existing = await db
    .select({ email: marketingContacts.email })
    .from(marketingContacts)
    .where(eq(marketingContacts.userId, userId));
  const existingEmails = new Set(existing.map((row) => row.email.toLowerCase()));

  const seen = new Set<string>();
  const toInsert = contacts.filter((contact) => {
    const key = contact.email.toLowerCase();
    if (existingEmails.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (toInsert.length > 0) {
    await db.insert(marketingContacts).values(toInsert.map((contact) => ({ userId, ...contact })));
  }
  return { added: toInsert.length, skipped: contacts.length - toInsert.length };
}

export async function deleteContact(userId: string, id: string): Promise<boolean> {
  const deleted = await db
    .delete(marketingContacts)
    .where(and(eq(marketingContacts.id, id), eq(marketingContacts.userId, userId)))
    .returning({ id: marketingContacts.id });
  return deleted.length > 0;
}

export type MarketingCampaign = {
  id: string;
  subject: string;
  body: string;
  design: EmailDesign;
  ctaLabel: string | null;
  ctaUrl: string | null;
  recipientCount: number;
  failureCount: number;
  createdAt: number;
};

function toCampaign(row: typeof marketingCampaigns.$inferSelect): MarketingCampaign {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    design: row.design as EmailDesign,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    recipientCount: row.recipientCount,
    failureCount: row.failureCount,
    createdAt: row.createdAt.getTime(),
  };
}

export async function listCampaigns(userId: string): Promise<MarketingCampaign[]> {
  const rows = await db
    .select()
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.userId, userId))
    .orderBy(desc(marketingCampaigns.createdAt));
  return rows.map(toCampaign);
}

export type SendCampaignResult = { recipientCount: number; failureCount: number };

// Same shape as the admin dashboard's own sendToRecipients (admin-store.ts):
// sequential with a small delay between sends (Resend's own rate limit, not
// ours), one failure doesn't abort the rest, and the attempt is always
// logged - including recipientCount 0, so an empty contact list still shows
// up in history instead of silently no-opping.
export async function sendMarketingCampaign(
  userId: string,
  design: EmailDesign,
  subject: string,
  body: string,
  contactIds?: string[],
  cta?: EmailCta,
): Promise<SendCampaignResult> {
  const allContacts = await db.select().from(marketingContacts).where(eq(marketingContacts.userId, userId));
  const recipients =
    contactIds && contactIds.length > 0
      ? allContacts.filter((contact) => contactIds.includes(contact.id))
      : allContacts;

  let failureCount = 0;
  for (const [index, recipient] of recipients.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await sendEmail(recipient.email, subject, renderEmailHtml(design, subject, body, recipient.name, cta));
    } catch (error) {
      failureCount += 1;
      console.error(`Failed to send marketing campaign email to ${recipient.email}:`, error);
    }
  }

  await db.insert(marketingCampaigns).values({
    userId,
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
