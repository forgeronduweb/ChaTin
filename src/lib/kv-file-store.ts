import { File, Paths } from 'expo-file-system';

// Small key/value JSON persistence, one file per key, shared by
// conversations-store/theme-store/onboarding. Kept synchronous on purpose -
// it mirrors expo-file-system's sync API so callers don't need to change
// shape, and the web counterpart (kv-file-store.web.ts, using localStorage)
// is naturally synchronous too.
export function readJsonFile<T>(filename: string): T | null {
  const file = new File(Paths.document, filename);
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile<T>(filename: string, value: T): void {
  const file = new File(Paths.document, filename);
  if (!file.exists) file.create();
  file.write(JSON.stringify(value));
}
