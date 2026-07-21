import { Router } from 'express';
import { asyncHandler } from '../async-handler.js';
import { verifyGoogleIdToken } from '../google-auth.js';
import { resolveUserId } from '../request-auth.js';
import { createSession, setUserCity, upsertGoogleUser } from '../users-store.js';

export const authRouter = Router();

authRouter.post('/auth/google', async (req, res) => {
  const idToken = req.body?.idToken;
  if (typeof idToken !== 'string' || !idToken) {
    res.status(400).json({ error: 'Missing idToken' });
    return;
  }
  const device = req.body?.device;

  try {
    const profile = await verifyGoogleIdToken(idToken);
    const user = await upsertGoogleUser(profile);
    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended' });
      return;
    }
    const token = await createSession(user.id, {
      deviceModel: typeof device?.deviceModel === 'string' ? device.deviceModel : undefined,
      osVersion: typeof device?.osVersion === 'string' ? device.osVersion : undefined,
      appVersion: typeof device?.appVersion === 'string' ? device.appVersion : undefined,
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, city: user.city },
    });
  } catch (error) {
    console.error('Google sign-in failed:', error);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

authRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const userId = await resolveUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }
    if (!('city' in (req.body ?? {}))) {
      res.status(400).json({ error: 'city is required' });
      return;
    }
    const rawCity = req.body.city;
    const city = typeof rawCity === 'string' && rawCity.trim() ? rawCity.trim() : null;
    const user = await setUserCity(userId, city);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, city: user.city });
  }),
);
