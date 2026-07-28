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
  // Supabase's transaction pooler (port 6543) caps concurrent connections -
  // without these, a query that can't get a slot right away just waits
  // forever instead of failing, which is what made some admin dashboard
  // requests (users/notifications/releases) hang as "pending" when several
  // fired at once on page load. The dashboard now loads each section lazily
  // (on tab visit, not all at once - see admin-dashboard-html.ts), which cut
  // peak demand from this app to well under 12. The pooler's own pool_size
  // was raised to 48 (Supabase dashboard -> Project Settings -> Database ->
  // Connection pooling), so 20 leaves plenty of headroom both above this
  // app's peak and below that cap, while not claiming so much of it that
  // real chat traffic (which shares this same pool) has nothing left.
  max: 20,
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
