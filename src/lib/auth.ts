import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

const BASE_URL = resolveBaseUrl();
const SESSION_KEY = 'chatin.session';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type Session = {
  token: string;
  user: AuthUser;
};

export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function currentDeviceInfo() {
  return {
    deviceModel: Device.modelName ?? undefined,
    osVersion: Device.osVersion ?? undefined,
    appVersion: Application.nativeApplicationVersion ?? undefined,
  };
}

export async function signInWithGoogleIdToken(idToken: string): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, device: currentDeviceInfo() }),
  });
  if (!response.ok) {
    throw new Error(`Google sign-in failed with status ${response.status}`);
  }
  const session = (await response.json()) as Session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  return session;
}
