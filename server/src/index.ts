import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { promptsRouter } from './routes/prompts.js';
import { releasesRouter } from './routes/releases.js';

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
