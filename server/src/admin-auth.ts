import type { NextFunction, Request, Response } from 'express';

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
    if (password === adminPassword) {
      next();
      return;
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="ChaTin Admin"');
  res.status(401).send('Authentication required');
}
