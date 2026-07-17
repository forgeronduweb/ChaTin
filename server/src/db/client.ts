import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to server/.env (see server/.env.example).');
}

const client = postgres(connectionString, { prepare: false, ssl: 'require' });
export const db = drizzle(client, { schema });
