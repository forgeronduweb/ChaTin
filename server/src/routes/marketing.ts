import { Router } from 'express';
import { asyncHandler } from '../async-handler.js';
import { EMAIL_DESIGNS, type EmailDesign } from '../email.js';
import {
  createContact,
  deleteContact,
  importContacts,
  listCampaigns,
  listContacts,
  sendMarketingCampaign,
} from '../marketing-store.js';
import { resolveUserId } from '../request-auth.js';

export const marketingRouter = Router();

// Every route here needs a real signed-in user - unlike chat, a marketer's
// contact list and campaign history make no sense for a guest, there's
// nothing to scope them to.
async function requireUserId(req: { headers: { authorization?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }): Promise<string | undefined> {
  const userId = await resolveUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Sign in required' });
    return undefined;
  }
  return userId;
}

function parseEmailDesign(value: unknown): EmailDesign {
  return typeof value === 'string' && (EMAIL_DESIGNS as readonly string[]).includes(value) ? (value as EmailDesign) : 'announcement';
}

marketingRouter.get(
  '/marketing/contacts',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;
    res.json(await listContacts(userId));
  }),
);

marketingRouter.post(
  '/marketing/contacts',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    res.status(201).json(await createContact(userId, name, email));
  }),
);

// Bulk import: { contacts: [{name, email}, ...] } - one paste instead of
// re-submitting the single-contact form N times for an existing list.
marketingRouter.post(
  '/marketing/contacts/import',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const rawContacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
    const contacts = rawContacts
      .filter((entry: unknown): entry is { name?: unknown; email?: unknown } => typeof entry === 'object' && entry !== null)
      .map((entry: { name?: unknown; email?: unknown }) => ({
        name: typeof entry.name === 'string' ? entry.name.trim() : '',
        email: typeof entry.email === 'string' ? entry.email.trim() : '',
      }))
      .filter((entry: { name: string; email: string }) => entry.email.length > 0);

    if (contacts.length === 0) {
      res.status(400).json({ error: 'contacts must be a non-empty array of {email} objects' });
      return;
    }
    res.status(201).json(await importContacts(userId, contacts));
  }),
);

marketingRouter.delete(
  '/marketing/contacts/:id',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const deleted = await deleteContact(userId, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.status(204).end();
  }),
);

marketingRouter.get(
  '/marketing/campaigns',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;
    res.json(await listCampaigns(userId));
  }),
);

marketingRouter.post(
  '/marketing/campaigns/send',
  asyncHandler(async (req, res) => {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!subject || !body) {
      res.status(400).json({ error: 'subject and body are required' });
      return;
    }
    const design = parseEmailDesign(req.body?.design);
    const contactIds = Array.isArray(req.body?.contactIds) ? req.body.contactIds.filter((id: unknown) => typeof id === 'string') : undefined;
    const ctaLabel = typeof req.body?.ctaLabel === 'string' ? req.body.ctaLabel.trim() : '';
    const ctaUrl = typeof req.body?.ctaUrl === 'string' ? req.body.ctaUrl.trim() : '';
    const cta = ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined;

    const result = await sendMarketingCampaign(userId, design, subject, body, contactIds, cta);
    res.status(201).json(result);
  }),
);
