import { Router } from 'express';
import { listAnnouncementsForUser } from '../admin-store.js';
import { asyncHandler } from '../async-handler.js';
import { resolveUserId } from '../request-auth.js';

export const announcementsRouter = Router();

// Guests (no Bearer token) still see 'all'-targeted announcements - there's
// just no persistent identity to compute a 'new'/'active'/'inactive'
// segment for, so those never match for them.
announcementsRouter.get(
  '/announcements',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    res.json(await listAnnouncementsForUser(userId));
  }),
);
