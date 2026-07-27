import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { scheduleAnnouncementSync } from './announcements-scheduler.js';
import { scheduleAutoPromptGeneration } from './auto-prompts.js';
import { adminRouter } from './routes/admin.js';
import { announcementsRouter } from './routes/announcements.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { exportRouter } from './routes/export.js';
import { feedbackRouter } from './routes/feedback.js';
import { memoriesRouter } from './routes/memories.js';
import { promptsRouter } from './routes/prompts.js';
import { releasesRouter } from './routes/releases.js';
import { transcribeRouter } from './routes/transcribe.js';

// Without these, an error that doesn't go through asyncHandler - e.g. a
// query whose *other* Promise.all sibling gets cancelled server-side after
// this one already settled, or a driver-level socket error - crashes the
// whole process by Node's default. That's what took the server down under
// load once statement_timeout started actually cancelling stuck queries
// (see db/client.ts): log it and keep serving everyone else instead.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();
// Dokploy puts exactly one reverse proxy (Traefik) in front of this
// container, which sets X-Forwarded-For to the real client IP. Without this,
// Express ignores that header and express-rate-limit falls back to the
// socket's remote address - which is the proxy itself for every single
// request, so every user behind it shared one rate-limit bucket instead of
// getting their own. Trusting exactly 1 hop fixes both that and the
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR warnings this was logging.
app.set('trust proxy', 1);
// No cors() middleware on purpose: the mobile app's fetch calls aren't
// browser requests, so CORS never applied to them either way, and the admin
// dashboard is served same-origin by this same server. A blanket cors()
// with no origin restriction just meant any website could make the
// browser attach a visitor's cookies/credentials to a request here - with
// nothing left that actually needs cross-origin browser access, not
// sending permissive CORS headers is strictly safer with no functional
// loss. Add a scoped origin allowlist here if a browser client is ever
// (re)introduced.
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', chatRouter);
app.use('/api', authRouter);
app.use('/api', promptsRouter);
app.use('/api', releasesRouter);
app.use('/api', feedbackRouter);
app.use('/api', transcribeRouter);
app.use('/api', memoriesRouter);
app.use('/api', exportRouter);
app.use('/api', announcementsRouter);
app.use(adminRouter);

// Catch-all error handler: anything asyncHandler passes to next(err) lands
// here instead of crashing the process (e.g. a malformed UUID in a route
// param throwing a Postgres error).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

scheduleAutoPromptGeneration();
scheduleAnnouncementSync();
