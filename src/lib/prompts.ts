import { useEffect, useState } from 'react';

import { getPrompts, type Prompt } from '@/lib/api';
import { DEFAULT_PROMPTS } from '@/lib/content';

export function usePrompts(): { prompts: Prompt[]; loading: boolean } {
  const [prompts, setPrompts] = useState<Prompt[]>(DEFAULT_PROMPTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPrompts()
      .then((fetched) => {
        if (!cancelled && fetched.length > 0) setPrompts(fetched);
      })
      .catch((error) => {
        console.error('Failed to load prompts, using defaults:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { prompts, loading };
}
