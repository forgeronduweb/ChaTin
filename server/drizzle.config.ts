import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to server/.env (see server/.env.example).');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Supabase's built-in `auth`/`storage`/`realtime` schemas have CHECK
  // constraints drizzle-kit's introspection can't parse and crashes on.
  // Our own tables all live in `public`, so scope introspection to that.
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
