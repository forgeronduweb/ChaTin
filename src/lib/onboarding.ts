import { readJsonFile, writeJsonFile } from './kv-file-store';

const FILENAME = 'onboarding.json';

export function hasCompletedOnboarding(): boolean {
  return readJsonFile<{ completed?: boolean }>(FILENAME)?.completed === true;
}

export function markOnboardingComplete(): void {
  writeJsonFile(FILENAME, { completed: true });
}
