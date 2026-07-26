// expo-file-system's File/Paths API isn't implemented on web (it warns and
// throws on first write) - localStorage is the direct equivalent for this
// module's use case: small, synchronous, per-key JSON blobs.
export function readJsonFile<T>(filename: string): T | null {
  const raw = localStorage.getItem(filename);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile<T>(filename: string, value: T): void {
  localStorage.setItem(filename, JSON.stringify(value));
}
