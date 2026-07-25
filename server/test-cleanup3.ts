import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './src/db/client.js';
import { conversations, sessions, users } from './src/db/schema.js';

for (const googleId of ['test-weather-multi-e2e']) {
  const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
  if (user) {
    await db.delete(conversations).where(eq(conversations.userId, user.id));
    await db.delete(sessions).where(eq(sessions.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
    console.log('cleaned up', googleId, user.id);
  }
}
