import { Router } from 'express';
import { getLatestRelease } from '../admin-store.js';
import { asyncHandler } from '../async-handler.js';

export const releasesRouter = Router();

releasesRouter.get(
  '/app-version/latest',
  asyncHandler(async (_req, res) => {
    const release = await getLatestRelease();
    if (!release) {
      res.status(404).json({ error: 'No release published yet' });
      return;
    }
    res.json({
      version: release.version,
      versionCode: release.versionCode,
      apkUrl: release.apkUrl,
      mandatory: release.mandatory,
      notes: release.notes,
    });
  }),
);
