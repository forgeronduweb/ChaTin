import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
