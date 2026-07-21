import { getUserByToken } from './users-store.js';

export async function resolveUserId(req: { headers: { authorization?: string } }): Promise<string | undefined> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  const token = header.slice('Bearer '.length);
  try {
    const user = await getUserByToken(token);
    return user?.id;
  } catch {
    return undefined;
  }
}
