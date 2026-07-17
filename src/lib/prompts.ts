import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { getPrompts, type Prompt } from '@/lib/api';
import { DEFAULT_PROMPTS } from '@/lib/content';

const POLL_INTERVAL_MS = 60_000;

export function usePrompts(): { prompts: Prompt[]; loading: boolean } {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const fetched = await getPrompts();
      if (fetched.length > 0) setPrompts(fetched);
    } catch (error) {
      console.error('Failed to load prompts, using defaults:', error);
    }
  }, []);

  // Re-fetches whenever this screen is focused, whenever the app comes back
  // to the foreground, and periodically in between — so prompt changes made
  // from the admin dashboard show up without the user restarting the app.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      refresh().finally(() => {
        if (!cancelled) setLoading(false);
      });

      const interval = setInterval(refresh, POLL_INTERVAL_MS);
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });

      return () => {
        cancelled = true;
        clearInterval(interval);
        subscription.remove();
      };
    }, [refresh]),
  );

  return { prompts, loading };
}
