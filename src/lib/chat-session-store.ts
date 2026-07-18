import { useSyncExternalStore } from 'react';

import type { ChatMessage } from '@/lib/api';

type ChatSession = {
  messages: ChatMessage[];
  title: string | null;
  sending: boolean;
  serverConversationId: string | null;
  abortController: AbortController | null;
};

const sessions = new Map<string, ChatSession>();
const listeners = new Map<string, Set<() => void>>();

function notify(localId: string) {
  listeners.get(localId)?.forEach((callback) => callback());
}

function subscribe(localId: string, callback: () => void) {
  const set = listeners.get(localId) ?? new Set();
  set.add(callback);
  listeners.set(localId, set);
  return () => {
    set.delete(callback);
  };
}

// Keeps a chat's live messages/sending state in memory, independent of the
// screen's mount lifecycle, so a reply keeps arriving (and gets saved) after
// the user navigates away, and reopening the same conversation (e.g. from
// Historique) picks the in-progress state back up instead of a stale snapshot.
export function ensureChatSession(
  localId: string,
  initial: { messages: ChatMessage[]; title: string | null },
): ChatSession {
  let session = sessions.get(localId);
  if (!session) {
    session = {
      messages: initial.messages,
      title: initial.title,
      sending: false,
      serverConversationId: null,
      abortController: null,
    };
    sessions.set(localId, session);
  }
  return session;
}

export function getChatSession(localId: string): ChatSession | undefined {
  return sessions.get(localId);
}

export function updateChatSession(localId: string, patch: Partial<ChatSession>) {
  const session = sessions.get(localId);
  if (!session) return;
  sessions.set(localId, { ...session, ...patch });
  notify(localId);
}

export function useChatSession(
  localId: string,
  initial: { messages: ChatMessage[]; title: string | null },
): ChatSession {
  ensureChatSession(localId, initial);
  return useSyncExternalStore(
    (callback) => subscribe(localId, callback),
    () => sessions.get(localId)!,
  );
}
