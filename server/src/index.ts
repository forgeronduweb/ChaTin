import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';

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

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
