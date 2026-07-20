import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  status: text('status', { enum: ['active', 'suspended'] }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  token: uuid('token').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  deviceModel: text('device_model'),
  osVersion: text('os_version'),
  appVersion: text('app_version'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  from: text('from', { enum: ['me', 'bot'] }).notNull(),
  text: text('text').notNull(),
  attachmentName: text('attachment_name'),
  reaction: text('reaction', { enum: ['like', 'dislike'] }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  category: text('category').notNull().default(''),
  color: text('color').notNull().default('#F3A7C7'),
  emoji: text('emoji'),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  appVersion: text('app_version'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tracks when the admin last opened each notified section ('users' |
// 'feedback'), so the sidebar badge can show a count of items created since
// then. One row per key - there's a single shared admin login (HTTP Basic,
// any username), not per-admin accounts, so this doesn't need a user column.
export const adminNotificationState = pgTable('admin_notification_state', {
  key: text('key').primaryKey(),
  lastViewedAt: timestamp('last_viewed_at').notNull().defaultNow(),
});

export const appReleases = pgTable('app_releases', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: text('version').notNull(),
  versionCode: integer('version_code').notNull(),
  apkUrl: text('apk_url').notNull(),
  mandatory: boolean('mandatory').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
