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
};

export type Conversation = {
  id: string;
  title: string;
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
  return response.json() as Promise<T>;
}

export function createConversation(title?: string, messages?: ChatMessage[]): Promise<Conversation> {
  return request<Conversation>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, messages }),
  });
}

export function getPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>('/api/prompts');
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

export function sendMessage(
  conversationId: string,
  text: string,
  signal?: AbortSignal,
): Promise<{ reply: ChatMessage; messages: ChatMessage[] }> {
  return request(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
    signal,
  });
}
