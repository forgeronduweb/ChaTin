import { Brand } from '@/constants/theme';
import { t } from '@/lib/i18n';

export const POPULAR_PROMPTS = [
  {
    key: 'sushi',
    color: Brand.pink,
    title: t('homePromptSushiTitle'),
    author: 'Kanny.low',
  },
  {
    key: 'resolution',
    color: Brand.green,
    title: t('homePromptResolutionTitle'),
    author: 'Jon jenny',
  },
] as const;
