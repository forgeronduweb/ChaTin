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
  if (response.status === 204) return undefined as T;
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
  signal?: AbortSignal,
): Promise<{ reply: ChatMessage; messages: ChatMessage[] }> {
  const session = await getSession();
  const formData = new FormData();
  formData.append('text', text);
  formData.append('file', new File(file.uri), file.name);

  const response = await expoFetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
    body: formData,
    signal,
  });
  if (!response.ok) {
    throw new Error(`Request to /api/conversations/${conversationId}/messages failed with status ${response.status}`);
  }
  return response.json() as Promise<{ reply: ChatMessage; messages: ChatMessage[] }>;
}
