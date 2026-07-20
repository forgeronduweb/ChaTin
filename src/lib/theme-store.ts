import { File, Paths } from 'expo-file-system';

export type ThemeMode = 'light' | 'dark' | 'auto';

const file = new File(Paths.document, 'theme.json');

export function getStoredThemeMode(): ThemeMode {
  if (!file.exists) return 'auto';
  try {
    const mode = (JSON.parse(file.textSync()) as { mode?: string }).mode;
    return mode === 'light' || mode === 'dark' ? mode : 'auto';
  } catch {
    return 'auto';
  }
}

export function setStoredThemeMode(mode: ThemeMode): void {
  if (!file.exists) file.create();
  file.write(JSON.stringify({ mode }));
}
