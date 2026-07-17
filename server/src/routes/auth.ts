import { Router } from 'express';
import { verifyGoogleIdToken } from '../google-auth.js';
import { createSession, upsertGoogleUser } from '../users-store.js';

export const authRouter = Router();

authRouter.post('/auth/google', async (req, res) => {
  const idToken = req.body?.idToken;
  if (typeof idToken !== 'string' || !idToken) {
    res.status(400).json({ error: 'Missing idToken' });
    return;
  }

  try {
    const profile = await verifyGoogleIdToken(idToken);
    const user = upsertGoogleUser(profile);
    const token = createSession(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (error) {
    console.error('Google sign-in failed:', error);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});
