import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'onboarding.json');

export function hasCompletedOnboarding(): boolean {
  if (!file.exists) return false;
  try {
    return (JSON.parse(file.textSync()) as { completed?: boolean }).completed === true;
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  if (!file.exists) file.create();
  file.write(JSON.stringify({ completed: true }));
}
