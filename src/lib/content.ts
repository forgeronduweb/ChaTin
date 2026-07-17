import type { Prompt } from '@/lib/api';
import { Brand } from '@/constants/theme';
import { t } from '@/lib/i18n';

/** Used only if the app can't reach the server (offline, backend down). */
export const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'fallback-sushi',
    title: t('homePromptSushiTitle'),
    author: 'Kanny.low',
    category: '',
    color: Brand.pink,
    emoji: null,
    featured: true,
  },
  {
    id: 'fallback-resolution',
    title: t('homePromptResolutionTitle'),
    author: 'Jon jenny',
    category: '',
    color: Brand.green,
    emoji: null,
    featured: true,
  },
];
