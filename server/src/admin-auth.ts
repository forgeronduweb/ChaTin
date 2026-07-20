import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

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

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server' });
    return;
  }

  const header = req.headers.authorization;
  const [scheme, encoded] = header?.split(' ') ?? [];
  if (scheme === 'Basic' && encoded) {
    const [, password] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (password && passwordsMatch(password, adminPassword)) {
      next();
      return;
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="ChaTin Admin"');
  res.status(401).send('Authentication required');
}
