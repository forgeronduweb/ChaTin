import { readJsonFile, writeJsonFile } from './kv-file-store';

export type ThemeMode = 'light' | 'dark' | 'auto';

const FILENAME = 'theme.json';

export function getStoredThemeMode(): ThemeMode {
  const mode = readJsonFile<{ mode?: string }>(FILENAME)?.mode;
  return mode === 'light' || mode === 'dark' ? mode : 'auto';
}

export function setStoredThemeMode(mode: ThemeMode): void {
  writeJsonFile(FILENAME, { mode });
}
