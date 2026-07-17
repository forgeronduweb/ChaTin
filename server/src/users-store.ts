export type User = {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

const usersByGoogleId = new Map<string, User>();
const sessions = new Map<string, string>();

export function upsertGoogleUser(profile: {
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}): User {
  const existing = usersByGoogleId.get(profile.googleId);
  const user: User = existing
    ? { ...existing, ...profile }
    : { id: crypto.randomUUID(), ...profile };
  usersByGoogleId.set(profile.googleId, user);
  return user;
}

export function createSession(userId: string): string {
  const token = crypto.randomUUID();
  sessions.set(token, userId);
  return token;
}

export function getUserByToken(token: string): User | undefined {
  const userId = sessions.get(token);
  if (!userId) return undefined;
  return [...usersByGoogleId.values()].find((user) => user.id === userId);
}
