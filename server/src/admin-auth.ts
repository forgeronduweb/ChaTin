import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SESSION_COOKIE = 'chatin_admin_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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

// Sessions are a signed "expiry.signature" cookie instead of a server-side
// store, on purpose - an in-memory Set of valid tokens got wiped every time
// the server process restarted (a redeploy, a container health-check
// restart, or just running more than one instance behind a load balancer),
// silently signing everyone out. Signing with ADMIN_PASSWORD as the key
// means no server-side state to lose, and rotating the password
// conveniently invalidates every outstanding session as a side effect.
function sign(payload: string): string {
  return createHmac('sha256', process.env.ADMIN_PASSWORD ?? '').update(payload).digest('hex');
}

function isValidSessionToken(token: string): boolean {
  const separator = token.lastIndexOf('.');
  if (separator === -1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedBuf = Buffer.from(sign(payload));
  const signatureBuf = Buffer.from(signature);
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export function createAdminSession(res: Response): void {
  const payload = String(Date.now() + SESSION_MAX_AGE_MS);
  const token = `${payload}.${sign(payload)}`;
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_MAX_AGE_MS });
}

export function destroyAdminSession(_req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server' });
    return;
  }

  const token = getSessionToken(req);
  if (token && isValidSessionToken(token)) {
    next();
    return;
  }

  if (req.path.startsWith('/admin/api/')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  res.redirect('/admin/login');
}
