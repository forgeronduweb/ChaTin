import type { Announcement } from '@/lib/api';
import { t, type TranslationKey } from '@/lib/i18n';

const TYPE_EMOJI: Record<Announcement['type'], string> = {
  update: '🚀',
  info: 'ℹ️',
  tip: '💡',
  prompt: '⭐',
  promo: '🎁',
  poll: '📊',
  security: '🔒',
};

const TYPE_LABEL_KEYS: Record<Announcement['type'], TranslationKey> = {
  update: 'announcementTypeUpdate',
  info: 'announcementTypeInfo',
  tip: 'announcementTypeTip',
  prompt: 'announcementTypePrompt',
  promo: 'announcementTypePromo',
  poll: 'announcementTypePoll',
  security: 'announcementTypeSecurity',
};

export function announcementTypeEmoji(type: Announcement['type']): string {
  return TYPE_EMOJI[type];
}

export function announcementTypeLabel(type: Announcement['type']): string {
  return t(TYPE_LABEL_KEYS[type]);
}
