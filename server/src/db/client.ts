import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to server/.env (see server/.env.example).');
}

const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  // Supabase's transaction pooler (port 6543) caps concurrent connections
  // fairly low - without these, a query that can't get a slot right away
  // just waits forever instead of failing, which is what made some admin
  // dashboard requests (users/notifications/releases) hang as "pending"
  // when several fired at once on page load. 8 (not the default 10) because
  // getStats()/getAnalyticsReport() alone already fan out to 6 queries via
  // Promise.all - lower than that and a single dashboard request queues
  // against itself before any other endpoint even gets a look in.
  max: 8,
  idle_timeout: 20,
  connect_timeout: 10,
  // Belt-and-suspenders for the same problem, but server-side: we found
  // report/stats queries stuck for 90+ seconds in Postgres itself (state
  // 'active', wait_event 'ClientRead' - the query had finished and was just
  // waiting for a client that had already given up to read the result). A
  // stuck query like that permanently occupies one of the 5 pool slots
  // above until something kills it - these timeouts make Postgres do that
  // itself instead of the connection leaking forever.
  connection: {
    statement_timeout: 15000,
    idle_in_transaction_session_timeout: 10000,
  },
});
export const db = drizzle(client, { schema });
