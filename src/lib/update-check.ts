import * as Application from 'expo-application';
import { useEffect, useState } from 'react';

import { type AppRelease, getLatestRelease } from '@/lib/api';

export type PendingUpdate = AppRelease;

export function usePendingUpdate(): PendingUpdate | null {
  const [update, setUpdate] = useState<PendingUpdate | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLatestRelease()
      .then((release) => {
        if (cancelled) return;
        const installedCode = Number(Application.nativeBuildVersion ?? '0');
        if (release.versionCode > installedCode) {
          setUpdate(release);
        }
      })
      .catch(() => {
        // No release published yet, or offline — silently skip the check.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return update;
}
