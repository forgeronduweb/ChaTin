import { readJsonFile, writeJsonFile } from './kv-file-store';

import type { ChatMessage } from './api';

export type StoredConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const FILENAME = 'conversations.json';

function readAll(): StoredConversation[] {
  return readJsonFile<StoredConversation[]>(FILENAME) ?? [];
}

function writeAll(conversations: StoredConversation[]) {
  writeJsonFile(FILENAME, conversations);
}

export function listStoredConversations(): StoredConversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getStoredConversation(id: string): StoredConversation | undefined {
  return readAll().find((conversation) => conversation.id === id);
}

export function saveStoredConversation(conversation: StoredConversation) {
  const all = readAll();
  const index = all.findIndex((item) => item.id === conversation.id);
  if (index >= 0) {
    all[index] = conversation;
  } else {
    all.push(conversation);
  }
  writeAll(all);
}

export function clearStoredConversations() {
  writeAll([]);
}

export function createLocalConversationId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
