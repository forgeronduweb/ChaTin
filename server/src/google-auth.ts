import { OAuth2Client } from 'google-auth-library';

const CLIENT_IDS = [
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_ID,
].filter((id): id is string => Boolean(id));

const client = new OAuth2Client();

export type GoogleProfile = {
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (CLIENT_IDS.length === 0) {
    throw new Error(
      'No Google client IDs configured. Set GOOGLE_ANDROID_CLIENT_ID / GOOGLE_IOS_CLIENT_ID / GOOGLE_WEB_CLIENT_ID in server/.env',
    );
  }

  const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_IDS });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google ID token payload');
  }

  return {
    googleId: payload.sub,
    name: payload.name ?? payload.email,
    email: payload.email,
    avatarUrl: payload.picture,
  };
}
