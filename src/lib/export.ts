import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

const BASE_URL = resolveBaseUrl();

function sanitizeFilename(title: string | undefined, fallback: string): string {
  const base = (title ?? '').trim().replace(/[^\p{L}\p{N}\- _]/gu, '');
  return base.slice(0, 60) || fallback;
}

async function downloadAndShare(path: string, body: unknown, filename: string): Promise<void> {
  const response = await expoFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.write(bytes);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}

export function exportTableAsExcel(headers: string[], rows: string[][], title?: string): Promise<void> {
  const filename = `${sanitizeFilename(title, 'tableau')}.xlsx`;
  return downloadAndShare('/api/export/excel', { headers, rows, title }, filename);
}

export function exportTextAsPdf(text: string, title?: string): Promise<void> {
  const filename = `${sanitizeFilename(title, 'reponse')}.pdf`;
  return downloadAndShare('/api/export/pdf', { text, title }, filename);
}
