// db/schema.js
import { pgTable, serial, text, timestamp, jsonb, varchar, boolean } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  remoteJid: varchar('remote_jid').notNull(),
  messageId: varchar('message_id').notNull(),
  fromMe: boolean('from_me').notNull(),
  pushName: varchar('push_name'),
  message: jsonb('message'),
  messageType: varchar('message_type'),
  messageTimestamp: timestamp('message_timestamp'),
  owner: varchar('owner'),
  source: varchar('source'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  jid: varchar('jid').notNull().unique(),
  pushName: varchar('push_name'),
  lastMessageAt: timestamp('last_message_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const connections = pgTable('connections', {
  id: serial('id').primaryKey(),
  instance: varchar('instance').notNull(),
  status: varchar('status').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
});