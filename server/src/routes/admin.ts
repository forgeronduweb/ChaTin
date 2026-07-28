import express, { Router } from 'express';
import multer from 'multer';
import { createAdminSession, destroyAdminSession, requireAdmin, verifyAdminPassword } from '../admin-auth.js';
import { asyncHandler } from '../async-handler.js';
import {
  archiveAnnouncement,
  type AnnouncementInput,
  createAnnouncement,
  createEmailTemplate,
  createPrompt,
  createRelease,
  deleteAnnouncement,
  deleteEmailTemplate,
  deleteFeedback,
  deletePrompt,
  deleteRelease,
  deleteUser,
  duplicateAnnouncement,
  getAnalyticsReport,
  getAnnouncement,
  getNotificationCounts,
  getStats,
  isNotificationKey,
  listAnnouncements,
  listConversations,
  listEmailCampaigns,
  listEmailTemplates,
  listFeedback,
  listPrompts,
  listReleases,
  listUsers,
  markNotificationViewed,
  sendEmailCampaign,
  setUserStatus,
  updateAnnouncement,
  updateEmailTemplate,
  updatePrompt,
} from '../admin-store.js';
import { DASHBOARD_HTML, renderLoginHtml } from '../admin-dashboard-html.js';
import { EMAIL_DESIGNS, type EmailDesign, renderEmailHtml } from '../email.js';
import { publishGithubRelease } from '../github-releases.js';
import { adminLoginLimiter } from '../rate-limit.js';
import { uploadApk } from '../supabase-storage.js';

function parseEmailDesign(value: unknown): EmailDesign {
  return typeof value === 'string' && (EMAIL_DESIGNS as readonly string[]).includes(value) ? (value as EmailDesign) : 'announcement';
}

// Both fields or neither - a label with no URL (or vice versa) isn't a
// usable button, so it's treated the same as no CTA at all.
function parseCta(ctaLabel: unknown, ctaUrl: unknown): { label: string; url: string } | undefined {
  if (typeof ctaLabel === 'string' && ctaLabel.trim() && typeof ctaUrl === 'string' && ctaUrl.trim()) {
    return { label: ctaLabel.trim(), url: ctaUrl.trim() };
  }
  return undefined;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

export const adminRouter = Router();

// --- Login / logout (must stay ahead of the requireAdmin gate below) ---

adminRouter.get('/admin/login', (_req, res) => {
  res.type('html').send(renderLoginHtml(false));
});

adminRouter.post('/admin/login', adminLoginLimiter, express.urlencoded({ extended: false }), (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!verifyAdminPassword(password)) {
    res.status(401).type('html').send(renderLoginHtml(true));
    return;
  }
  createAdminSession(res);
  res.redirect('/admin');
});

adminRouter.post('/admin/logout', (req, res) => {
  destroyAdminSession(req, res);
  res.redirect('/admin/login');
});

adminRouter.use(requireAdmin);

// --- Stats ---

adminRouter.get(
  '/admin/api/stats',
  asyncHandler(async (_req, res) => {
    res.json(await getStats());
  }),
);

adminRouter.get(
  '/admin/api/report',
  asyncHandler(async (_req, res) => {
    res.json(await getAnalyticsReport());
  }),
);

// --- Notifications (Utilisateurs / Retours unread badges) ---

adminRouter.get(
  '/admin/api/notifications',
  asyncHandler(async (_req, res) => {
    res.json(await getNotificationCounts());
  }),
);

adminRouter.post(
  '/admin/api/notifications/:key/read',
  asyncHandler(async (req, res) => {
    if (!isNotificationKey(req.params.key)) {
      res.status(400).json({ error: 'Unknown notification key' });
      return;
    }
    await markNotificationViewed(req.params.key);
    res.status(204).end();
  }),
);

// --- Users ---

adminRouter.get(
  '/admin/api/users',
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await listUsers(search));
  }),
);

adminRouter.post(
  '/admin/api/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const ok = await setUserStatus(req.params.id, 'suspended');
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

adminRouter.post(
  '/admin/api/users/:id/reactivate',
  asyncHandler(async (req, res) => {
    const ok = await setUserStatus(req.params.id, 'active');
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

adminRouter.delete(
  '/admin/api/users/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Conversations ---

adminRouter.get(
  '/admin/api/conversations',
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(await listConversations(search));
  }),
);

// --- Prompts ---

adminRouter.get(
  '/admin/api/prompts',
  asyncHandler(async (_req, res) => {
    res.json(await listPrompts());
  }),
);

adminRouter.post(
  '/admin/api/prompts',
  asyncHandler(async (req, res) => {
    const { title, author, category, color, emoji, featured } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const prompt = await createPrompt({
      title: title.trim(),
      author: typeof author === 'string' ? author.trim() : '',
      category: typeof category === 'string' ? category.trim() : '',
      color: typeof color === 'string' && color ? color : '#F3A7C7',
      emoji: typeof emoji === 'string' && emoji ? emoji : null,
      featured: Boolean(featured),
    });
    res.status(201).json(prompt);
  }),
);

adminRouter.patch(
  '/admin/api/prompts/:id',
  asyncHandler(async (req, res) => {
    const { title, author, category, color, emoji, featured } = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if (typeof title === 'string') patch.title = title.trim();
    if (typeof author === 'string') patch.author = author.trim();
    if (typeof category === 'string') patch.category = category.trim();
    if (typeof color === 'string') patch.color = color;
    if (typeof emoji === 'string' || emoji === null) patch.emoji = emoji || null;
    if (typeof featured === 'boolean') patch.featured = featured;

    const prompt = await updatePrompt(req.params.id, patch);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.json(prompt);
  }),
);

adminRouter.delete(
  '/admin/api/prompts/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deletePrompt(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Feedback ---

adminRouter.get(
  '/admin/api/feedback',
  asyncHandler(async (_req, res) => {
    res.json(await listFeedback());
  }),
);

adminRouter.delete(
  '/admin/api/feedback/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteFeedback(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Feedback not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Releases (app updates) ---

adminRouter.get(
  '/admin/api/releases',
  asyncHandler(async (_req, res) => {
    res.json(await listReleases());
  }),
);

adminRouter.post(
  '/admin/api/releases',
  upload.single('apk'),
  asyncHandler(async (req, res) => {
    const { version, versionCode, mandatory, notes } = req.body ?? {};
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'apk file is required' });
      return;
    }
    if (typeof version !== 'string' || !version.trim()) {
      res.status(400).json({ error: 'version is required' });
      return;
    }
    const parsedVersionCode = Number(versionCode);
    if (!Number.isInteger(parsedVersionCode) || parsedVersionCode <= 0) {
      res.status(400).json({ error: 'versionCode must be a positive integer' });
      return;
    }

    const trimmedNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
    // GitHub Release is the required source of truth: it's what the in-app
    // updater downloads from and has no meaningful file size cap, unlike
    // Supabase Storage's free-tier 50MB limit.
    const apkUrl = await publishGithubRelease(file.buffer, version.trim(), trimmedNotes);
    const release = await createRelease({
      version: version.trim(),
      versionCode: parsedVersionCode,
      apkUrl,
      mandatory: mandatory === 'true' || mandatory === true,
      notes: trimmedNotes,
    });

    // Best-effort mirror only - nothing currently depends on the Supabase
    // copy, so a failure here shouldn't fail the whole request.
    let supabaseError: string | null = null;
    try {
      await uploadApk(file.buffer, file.originalname);
    } catch (error) {
      console.error('Supabase Storage mirror failed:', error);
      supabaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    res.status(201).json({ ...release, supabaseError });
  }),
);

adminRouter.delete(
  '/admin/api/releases/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteRelease(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Release not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Email templates ---

adminRouter.get(
  '/admin/api/email-templates',
  asyncHandler(async (_req, res) => {
    res.json(await listEmailTemplates());
  }),
);

adminRouter.post(
  '/admin/api/email-templates',
  asyncHandler(async (req, res) => {
    const { name, subject, body, design, ctaLabel, ctaUrl } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (typeof subject !== 'string' || !subject.trim()) {
      res.status(400).json({ error: 'subject is required' });
      return;
    }
    if (typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ error: 'body is required' });
      return;
    }
    const cta = parseCta(ctaLabel, ctaUrl);
    const template = await createEmailTemplate({
      name: name.trim(),
      subject: subject.trim(),
      body,
      design: parseEmailDesign(design),
      ctaLabel: cta?.label ?? null,
      ctaUrl: cta?.url ?? null,
    });
    res.status(201).json(template);
  }),
);

adminRouter.patch(
  '/admin/api/email-templates/:id',
  asyncHandler(async (req, res) => {
    const { name, subject, body, design, ctaLabel, ctaUrl } = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if (typeof name === 'string') patch.name = name.trim();
    if (typeof subject === 'string') patch.subject = subject.trim();
    if (typeof body === 'string') patch.body = body;
    if (typeof design === 'string') patch.design = parseEmailDesign(design);
    if ('ctaLabel' in (req.body ?? {}) || 'ctaUrl' in (req.body ?? {})) {
      const cta = parseCta(ctaLabel, ctaUrl);
      patch.ctaLabel = cta?.label ?? null;
      patch.ctaUrl = cta?.url ?? null;
    }

    const template = await updateEmailTemplate(req.params.id, patch);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  }),
);

adminRouter.delete(
  '/admin/api/email-templates/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteEmailTemplate(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Email campaigns (compose + send) ---

adminRouter.get(
  '/admin/api/email-campaigns',
  asyncHandler(async (_req, res) => {
    res.json(await listEmailCampaigns());
  }),
);

adminRouter.post(
  '/admin/api/email-campaigns/send',
  asyncHandler(async (req, res) => {
    const { subject, body, userIds, design, ctaLabel, ctaUrl } = req.body ?? {};
    if (typeof subject !== 'string' || !subject.trim()) {
      res.status(400).json({ error: 'subject is required' });
      return;
    }
    if (typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ error: 'body is required' });
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      res.status(500).json({ error: 'RESEND_API_KEY is not set on the server' });
      return;
    }
    const parsedUserIds = Array.isArray(userIds) ? userIds.filter((id): id is string => typeof id === 'string') : undefined;
    const result = await sendEmailCampaign(parseEmailDesign(design), subject.trim(), body, parsedUserIds, parseCta(ctaLabel, ctaUrl));
    res.json(result);
  }),
);

// Renders the same HTML that would actually be sent, without sending
// anything - lets the admin see what a design looks like before committing.
adminRouter.post(
  '/admin/api/email-preview',
  asyncHandler(async (req, res) => {
    const { subject, body, design, ctaLabel, ctaUrl } = req.body ?? {};
    const html = renderEmailHtml(
      parseEmailDesign(design),
      typeof subject === 'string' ? subject : '',
      typeof body === 'string' ? body : '',
      'Alex',
      parseCta(ctaLabel, ctaUrl),
    );
    res.type('html').send(html);
  }),
);

// --- Announcements (Communication module) ---

const ANNOUNCEMENT_TYPES = ['update', 'info', 'tip', 'prompt', 'promo', 'poll', 'security'];
const ANNOUNCEMENT_TARGETS = ['all', 'new', 'active', 'inactive'];

function parseAnnouncementInput(body: unknown): { input: AnnouncementInput; saveAsDraft: boolean } | { error: string } {
  const { title, content, imageUrl, type, target, pinned, sendEmail, publishAt, expiresAt, saveAsDraft } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof title !== 'string' || !title.trim()) return { error: 'title is required' };
  if (typeof content !== 'string' || !content.trim()) return { error: 'content is required' };
  if (typeof type !== 'string' || !ANNOUNCEMENT_TYPES.includes(type)) return { error: 'type is invalid' };
  if (typeof target !== 'string' || !ANNOUNCEMENT_TARGETS.includes(target)) return { error: 'target is invalid' };

  const parsedPublishAt = publishAt ? new Date(publishAt as string) : new Date();
  if (Number.isNaN(parsedPublishAt.getTime())) return { error: 'publishAt is invalid' };
  const parsedExpiresAt = expiresAt ? new Date(expiresAt as string) : null;
  if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) return { error: 'expiresAt is invalid' };

  return {
    input: {
      title: title.trim(),
      content,
      imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
      type: type as AnnouncementInput['type'],
      target: target as AnnouncementInput['target'],
      pinned: Boolean(pinned),
      sendEmail: Boolean(sendEmail),
      publishAt: parsedPublishAt,
      expiresAt: parsedExpiresAt,
    },
    saveAsDraft: Boolean(saveAsDraft),
  };
}

adminRouter.get(
  '/admin/api/announcements',
  asyncHandler(async (req, res) => {
    const { type, status, target, search } = req.query;
    res.json(
      await listAnnouncements({
        type: typeof type === 'string' ? type : undefined,
        status: typeof status === 'string' ? status : undefined,
        target: typeof target === 'string' ? target : undefined,
        search: typeof search === 'string' ? search : undefined,
      }),
    );
  }),
);

adminRouter.post(
  '/admin/api/announcements',
  asyncHandler(async (req, res) => {
    const parsed = parseAnnouncementInput(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    res.status(201).json(await createAnnouncement(parsed.input, parsed.saveAsDraft));
  }),
);

adminRouter.patch(
  '/admin/api/announcements/:id',
  asyncHandler(async (req, res) => {
    const parsed = parseAnnouncementInput(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const announcement = await updateAnnouncement(req.params.id, parsed.input, parsed.saveAsDraft);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(announcement);
  }),
);

adminRouter.post(
  '/admin/api/announcements/:id/duplicate',
  asyncHandler(async (req, res) => {
    const announcement = await duplicateAnnouncement(req.params.id);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.status(201).json(announcement);
  }),
);

adminRouter.post(
  '/admin/api/announcements/:id/archive',
  asyncHandler(async (req, res) => {
    const announcement = await archiveAnnouncement(req.params.id);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(announcement);
  }),
);

adminRouter.delete(
  '/admin/api/announcements/:id',
  asyncHandler(async (req, res) => {
    const deleted = await deleteAnnouncement(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.status(204).end();
  }),
);

// --- Dashboard page ---

adminRouter.get('/admin', (_req, res) => {
  res.type('html').send(DASHBOARD_HTML);
});
