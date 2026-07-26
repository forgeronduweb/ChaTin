import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { scheduleAutoPromptGeneration } from './auto-prompts.js';
import { adminRouter } from './routes/admin.js';
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
app.use(cors());
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
