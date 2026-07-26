import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SESSION_COOKIE = 'chatin_admin_session';

// Single-admin tool, one shared login - an in-memory set of valid session
// tokens is enough - restarting the server just signs everyone out.
const validSessions = new Set<string>();

function passwordsMatch(candidate: string, expected: string): boolean {
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws on mismatched lengths rather than just returning
  // false, and a length-dependent throw would itself leak timing info - pad
  // to a matching length first so every wrong-length guess takes the same
  // path as a same-length one.
  if (candidateBuf.length !== expectedBuf.length) {
    timingSafeEqual(candidateBuf, candidateBuf);
    return false;
  }
  return timingSafeEqual(candidateBuf, expectedBuf);
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key) cookies[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return cookies;
}

export function getSessionToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE];
}

export function verifyAdminPassword(candidate: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  return Boolean(adminPassword) && Boolean(candidate) && passwordsMatch(candidate, adminPassword!);
}

export function createAdminSession(res: Response): void {
  const token = randomBytes(32).toString('hex');
  validSessions.add(token);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function destroyAdminSession(req: Request, res: Response): void {
  const token = getSessionToken(req);
  if (token) validSessions.delete(token);
  res.clearCookie(SESSION_COOKIE);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server' });
    return;
  }

  const token = getSessionToken(req);
  if (token && validSessions.has(token)) {
    next();
    return;
  }

  if (req.path.startsWith('/admin/api/')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  res.redirect('/admin/login');
}
