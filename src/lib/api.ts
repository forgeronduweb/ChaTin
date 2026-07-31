import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { getSession } from './auth';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // Android emulator can't reach the host machine via `localhost`.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

const BASE_URL = resolveBaseUrl();

export type ChatMessage = {
  id: string;
  from: 'me' | 'bot';
  text: string;
  attachmentName?: string | null;
  reaction?: 'like' | 'dislike' | null;
};

export type ConversationMode = 'chat' | 'marketing';

export type Conversation = {
  id: string;
  title: string;
  mode: ConversationMode;
  messages: ChatMessage[];
};

export type Prompt = {
  id: string;
  title: string;
  author: string;
  category: string;
  color: string;
  emoji: string | null;
  featured: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getSession();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function createConversation(
  title?: string,
  messages?: ChatMessage[],
  mode?: ConversationMode,
): Promise<Conversation> {
  return request<Conversation>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, messages, mode }),
  });
}

export function getPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>('/api/prompts');
}

export type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  type: 'update' | 'info' | 'tip' | 'prompt' | 'promo' | 'poll' | 'security';
  pinned: boolean;
  publishAt: string;
};

export function getAnnouncements(): Promise<Announcement[]> {
  return request<Announcement[]>('/api/announcements');
}

export type AppRelease = {
  version: string;
  versionCode: number;
  apkUrl: string;
  mandatory: boolean;
  notes: string | null;
};

export function getLatestRelease(): Promise<AppRelease> {
  return request<AppRelease>('/api/app-version/latest');
}

export async function transcribeAudio(uri: string): Promise<string> {
  const session = await getSession();
  const formData = new FormData();
  // RN 0.86's fetch/FormData no longer accepts the classic {uri, type, name}
  // object for a file part ("Unsupported FormDataPart implementation") - a
  // File instance (which implements Blob) is the current way to attach a
  // local file, uploaded here via expo/fetch rather than the global fetch.
  formData.append('audio', new File(uri), 'voice-message.m4a');

  const response = await expoFetch(`${BASE_URL}/api/transcribe`, {
    method: 'POST',
    headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Request to /api/transcribe failed with status ${response.status}`);
  }
  const data = (await response.json()) as { text: string };
  return data.text;
}

export function submitFeedback(message: string, appVersion?: string): Promise<void> {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ message, appVersion }),
  });
}

type StreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; reply: ChatMessage; messages: ChatMessage[] }
  | { type: 'error'; error: string };

// The reply endpoint streams newline-delimited JSON (one small object per
// line) instead of a single JSON body, so the bot's reply can render as it's
// generated instead of appearing all at once once the whole thing is done.
// onChunk fires once per text delta; the returned promise resolves with the
// same {reply, messages} shape the endpoint used to return in one shot,
// once the final "done" line arrives.
async function readNdjsonReply(
  response: Response,
  path: string,
  onChunk: (text: string) => void,
): Promise<{ reply: ChatMessage; messages: ChatMessage[] }> {
  if (!response.body) throw new Error(`Request to ${path} returned no streamable body`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');
      if (!line.trim()) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === 'chunk') onChunk(event.text);
      else if (event.type === 'done') return { reply: event.reply, messages: event.messages };
      else if (event.type === 'error') throw new Error(event.error);
    }
  }
  throw new Error(`Stream from ${path} ended without a final result`);
}

export async function sendMessage(
  conversationId: string,
  text: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ reply: ChatMessage; messages: ChatMessage[] }> {
  const session = await getSession();
  const path = `/api/conversations/${conversationId}/messages`;
  const response = await expoFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return readNdjsonReply(response, path, onChunk);
}

export function setMessageReaction(
  conversationId: string,
  messageId: string,
  reaction: 'like' | 'dislike' | null,
): Promise<ChatMessage> {
  return request(`/api/conversations/${conversationId}/messages/${messageId}/reaction`, {
    method: 'PATCH',
    body: JSON.stringify({ reaction }),
  });
}

export type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type Memory = {
  id: string;
  content: string;
  createdAt: number;
};

export function getMemories(): Promise<Memory[]> {
  return request<Memory[]>('/api/memories');
}

export function deleteMemory(id: string): Promise<void> {
  return request(`/api/memories/${id}`, { method: 'DELETE' });
}

export function deleteAllMemories(): Promise<void> {
  return request('/api/memories', { method: 'DELETE' });
}

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  city: string | null;
};

export function updateCity(city: string | null): Promise<ProfileUser> {
  return request('/api/me', {
    method: 'PATCH',
    body: JSON.stringify({ city }),
  });
}

export async function sendMessageWithFile(
  conversationId: string,
  text: string,
  file: PickedFile,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ reply: ChatMessage; messages: ChatMessage[] }> {
  const session = await getSession();
  const formData = new FormData();
  formData.append('text', text);
  formData.append('file', new File(file.uri), file.name);

  const path = `/api/conversations/${conversationId}/messages`;
  const response = await expoFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
    body: formData,
    signal,
  });
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return readNdjsonReply(response, path, onChunk);
}

// ---------- Marketing space: contacts & email campaigns ----------
// A ChaTin user's own customer list and campaign log, distinct from the
// admin dashboard's Communication module - same design/CTA/HTML rendering
// reused server-side (email.ts), scoped to whichever user is signed in.

export type EmailDesign = 'announcement' | 'promo' | 'newsletter' | 'welcome';

export type MarketingContact = { id: string; name: string; email: string; createdAt: number };

export type MarketingCampaign = {
  id: string;
  subject: string;
  body: string;
  design: EmailDesign;
  ctaLabel: string | null;
  ctaUrl: string | null;
  recipientCount: number;
  failureCount: number;
  createdAt: number;
};

export function getMarketingContacts(): Promise<MarketingContact[]> {
  return request<MarketingContact[]>('/api/marketing/contacts');
}

export function addMarketingContact(name: string, email: string): Promise<MarketingContact> {
  return request<MarketingContact>('/api/marketing/contacts', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

export function importMarketingContacts(
  contacts: { name: string; email: string }[],
): Promise<{ added: number; skipped: number }> {
  return request('/api/marketing/contacts/import', {
    method: 'POST',
    body: JSON.stringify({ contacts }),
  });
}

export function deleteMarketingContact(id: string): Promise<void> {
  return request(`/api/marketing/contacts/${id}`, { method: 'DELETE' });
}

export function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  return request<MarketingCampaign[]>('/api/marketing/campaigns');
}

export function sendMarketingCampaign(input: {
  subject: string;
  body: string;
  design: EmailDesign;
  contactIds?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<{ recipientCount: number; failureCount: number }> {
  return request('/api/marketing/campaigns/send', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
